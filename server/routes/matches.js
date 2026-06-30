const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const { getAppSettings } = require('../utils/appSettings');
const { ensureUserEntries } = require('../utils/entries');
const {
  buildLiveMatchUpdate,
  buildFeedGamePayload,
  fetchLiveFeedPayload,
  getGameMinute,
  isLiveGameStatus,
  matchGameToMatch
} = require('../utils/liveSync');
const {
  buildPredictionMap,
  buildResolutionContext,
  resolveMatchTeams,
  sortMatchesForResolution
} = require('../utils/tournament');

const router = express.Router();
const stageRank = {
  group: 1,
  roundOf32: 2,
  roundOf16: 3,
  quarterfinal: 4,
  semifinal: 5,
  thirdPlace: 6,
  final: 7
};

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const settings = await getAppSettings();
    const matches = await Match.find();
    const { activeEntry } = await ensureUserEntries(req.user, req.header('x-entry-id'));
    const predictions = await Prediction.find({ entry: activeEntry?._id || null });
    const predictionByMatch = new Map(
      predictions.map((prediction) => [prediction.match.toString(), prediction])
    );
    const predictedContext = buildResolutionContext(matches, buildPredictionMap(predictions));
    const actualContext = buildResolutionContext(matches);

    const data = sortMatchesForResolution(matches)
      .map((match) => {
      const prediction = predictionByMatch.get(match._id.toString());
      const actualTeams = resolveMatchTeams(match, actualContext);
      const predictedTeams = resolveMatchTeams(match, predictedContext);
      const lockedBySchedule = match.matchDate <= new Date();
      const lockedByResult = Boolean(match.resultSet);
      const locked = Boolean(settings.predictionsLocked || lockedBySchedule || lockedByResult);

      return {
        ...match.toObject(),
        locked,
        lockedByAdmin: Boolean(settings.predictionsLocked),
        actualResolvedTeamA: actualTeams.teamA || '',
        actualResolvedTeamB: actualTeams.teamB || '',
        predictedResolvedTeamA: predictedTeams.teamA || '',
        predictedResolvedTeamB: predictedTeams.teamB || '',
        prediction: prediction
          ? {
              predictedScoreA: prediction.predictedScoreA,
              predictedScoreB: prediction.predictedScoreB,
              predictedQualifiedTeam: prediction.predictedQualifiedTeam,
              points: prediction.points,
              scored: prediction.scored
            }
          : null
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch matches.' });
  }
});

router.get('/live', async (req, res) => {
  try {
    const matches = await Match.find();
    const actualContext = buildResolutionContext(matches);
    const payload = await fetchLiveFeedPayload({ retries: 0, timeoutMs: 3000 }).catch(() => null);
    if (payload) {
      const persistLiveUpdate = async (match, game, liveGamePayload, feedMatch) => {
        const update = buildLiveMatchUpdate(match, game);
        if (!update) return { ...match.toObject(), ...feedMatch };

        const hasChanges = Object.entries(update).some(([key, value]) => {
          if (value === null) return match[key] !== null && match[key] !== undefined;
          if (value instanceof Date) {
            const current = match[key] ? new Date(match[key]).getTime() : null;
            return current !== value.getTime();
          }
          return String(match[key] ?? '') !== String(value);
        });

        if (hasChanges) {
          Object.assign(match, update);
          await match.save();
          await recalculateAllScores();
        }

        return {
          ...match.toObject(),
          ...feedMatch,
          scoreA: Number.isInteger(liveGamePayload.scoreA) ? liveGamePayload.scoreA : match.scoreA,
          scoreB: Number.isInteger(liveGamePayload.scoreB) ? liveGamePayload.scoreB : match.scoreB,
          liveScoreA: Number.isInteger(liveGamePayload.scoreA) ? liveGamePayload.scoreA : match.liveScoreA,
          liveScoreB: Number.isInteger(liveGamePayload.scoreB) ? liveGamePayload.scoreB : match.liveScoreB
        };
      };

      const games = Array.isArray(payload?.games) ? payload.games : [];
      const liveCandidates = (await Promise.all(games.map(async (game) => {
          const status = String(game?.time_elapsed || game?.status || '').trim().toLowerCase();
          const isLiveGame = isLiveGameStatus(status);
          if (!isLiveGame) return null;

          const match = matchGameToMatch(game, matches, actualContext);
          const liveGamePayload = buildFeedGamePayload(game);
          const feedMatch = {
            ...liveGamePayload,
            liveMinute: liveGamePayload.liveMinute || getGameMinute(game) || '',
            liveStatus: liveGamePayload.liveStatus || 'live',
            liveUpdatedAt: new Date()
          };

          let liveMatch = feedMatch;
          if (match) {
            liveMatch = await persistLiveUpdate(match, game, liveGamePayload, feedMatch);
          }

          return {
            liveMatch,
            minuteValue: Number.parseInt(liveGamePayload.liveMinute, 10) || 999,
            updatedAt: game?.updated_at || game?.updatedAt || game?.last_update || game?.datetime || game?.utc_date || game?.date || game?.time || new Date().toISOString()
          };
        })))
        .filter(Boolean)
        .sort((a, b) => {
          if (b.minuteValue !== a.minuteValue) return b.minuteValue - a.minuteValue;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

      if (liveCandidates.length) {
        const actualTeams = resolveMatchTeams(liveCandidates[0].liveMatch, actualContext);

        return res.json({
          ...liveCandidates[0].liveMatch,
          actualResolvedTeamA: actualTeams.teamA || '',
          actualResolvedTeamB: actualTeams.teamB || ''
        });
      }
    }

    const now = new Date();
    const liveWindowMs = 12 * 60 * 1000;
    const liveMatchWindowMs = 6 * 60 * 60 * 1000;
    const futureGraceMs = 2 * 60 * 60 * 1000;
    const liveMatches = matches.filter((match) => {
      const liveStatus = String(match.liveStatus || '').toLowerCase();
      const matchDate = match.matchDate ? new Date(match.matchDate) : null;
      const hasValidDate = Boolean(matchDate && !Number.isNaN(matchDate.getTime()));
      const hasStarted = Boolean(hasValidDate && matchDate <= now);
      const liveScoreA = Number(match.liveScoreA ?? match.scoreA);
      const liveScoreB = Number(match.liveScoreB ?? match.scoreB);
      const hasLiveScore = Number.isInteger(liveScoreA) && Number.isInteger(liveScoreB);

      if (!hasValidDate) return false;
      if (matchDate.getTime() < now.getTime() - liveMatchWindowMs) return false;
      if (matchDate.getTime() > now.getTime() + futureGraceMs) return false;
      if (liveStatus !== 'live' && !(hasStarted && !match.resultSet && hasLiveScore)) return false;

      const updatedAt = match.liveUpdatedAt || match.updatedAt || match.createdAt;
      const updatedTime = updatedAt ? new Date(updatedAt).getTime() : null;
      if (!updatedTime || Number.isNaN(updatedTime)) return false;

      return now.getTime() - updatedTime <= liveWindowMs;
    });
    const liveMatch = liveMatches.sort((a, b) => {
      const aTime = new Date(a.liveUpdatedAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.liveUpdatedAt || b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    })[0] || null;

    if (!liveMatch) {
      const provisionalWindowMs = 6 * 60 * 60 * 1000;
      const provisionalLiveMatch = [...matches]
        .filter((match) => {
          if (!match || match.resultSet) return false;

          const matchDate = match.matchDate ? new Date(match.matchDate) : null;
          if (!matchDate || Number.isNaN(matchDate.getTime())) return false;
          if (matchDate > now) return false;
          if (now.getTime() - matchDate.getTime() > provisionalWindowMs) return false;

          return true;
        })
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0] || null;

      if (provisionalLiveMatch) {
        const actualContext = buildResolutionContext(matches);
        const actualTeams = resolveMatchTeams(provisionalLiveMatch, actualContext);
        const base = provisionalLiveMatch.toObject();

        return res.json({
          ...base,
          scoreA: Number.isInteger(Number(base.liveScoreA ?? base.scoreA)) ? Number(base.liveScoreA ?? base.scoreA) : 0,
          scoreB: Number.isInteger(Number(base.liveScoreB ?? base.scoreB)) ? Number(base.liveScoreB ?? base.scoreB) : 0,
          liveScoreA: Number.isInteger(Number(base.liveScoreA ?? base.scoreA)) ? Number(base.liveScoreA ?? base.scoreA) : 0,
          liveScoreB: Number.isInteger(Number(base.liveScoreB ?? base.scoreB)) ? Number(base.liveScoreB ?? base.scoreB) : 0,
          liveMinute: base.liveMinute || 'LIVE',
          liveStatus: 'live',
          liveUpdatedAt: new Date(),
          resultSource: base.resultSource || 'provisional',
          actualResolvedTeamA: actualTeams.teamA || '',
          actualResolvedTeamB: actualTeams.teamB || ''
        });
      }

      return res.json(null);
    }

    const actualTeams = resolveMatchTeams(liveMatch, actualContext);

    return res.json({
      ...liveMatch.toObject(),
      actualResolvedTeamA: actualTeams.teamA || '',
      actualResolvedTeamB: actualTeams.teamB || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch live match.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, teamA, teamB, matchDate, stage, group, sourceA, sourceB, venue } = req.body;

    if (!teamA || !teamB || !matchDate || !stage) {
      return res.status(400).json({ message: 'teamA, teamB, matchDate and stage are required.' });
    }

    const match = await Match.create({
      code,
      teamA,
      teamB,
      matchDate,
      stage,
      group,
      sourceA,
      sourceB,
      venue
    });
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: 'Could not create match.' });
  }
});

router.patch('/:id/result', requireAdmin, async (req, res) => {
  try {
    const { scoreA, scoreB, qualifiedTeam } = req.body;
    const parsedScoreA = Number(scoreA);
    const parsedScoreB = Number(scoreB);

    if (
      !Number.isInteger(parsedScoreA) ||
      !Number.isInteger(parsedScoreB) ||
      parsedScoreA < 0 ||
      parsedScoreB < 0
    ) {
      return res.status(400).json({ message: 'Scores must be non-negative integers.' });
    }

    const currentMatch = await Match.findById(req.params.id);

    if (!currentMatch) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    let qualifiedSide = '';
    if (currentMatch.stage !== 'group') {
      if (parsedScoreA === parsedScoreB) {
        if (!['teamA', 'teamB'].includes(qualifiedTeam)) {
          return res.status(400).json({ message: 'A qualified team is required for knockout draws.' });
        }
        qualifiedSide = qualifiedTeam;
      } else {
        qualifiedSide = parsedScoreA > parsedScoreB ? 'teamA' : 'teamB';
      }
    }

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        scoreA: parsedScoreA,
        scoreB: parsedScoreB,
        resultSet: true,
        qualifiedTeam: qualifiedSide,
        liveScoreA: null,
        liveScoreB: null,
        liveMinute: '',
        liveStatus: 'finished',
        liveUpdatedAt: new Date(),
        liveQualifiedTeam: '',
        resultSource: 'manual'
      },
      { new: true, runValidators: true }
    );

    res.json(match);
    setImmediate(() => {
      void recalculateAllScores().catch((error) => {
        console.warn(`Score recalculation skipped after manual result save: ${error.message}`);
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update result.' });
  }
});

module.exports = router;
