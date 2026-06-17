const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const { getAppSettings } = require('../utils/appSettings');
const { ensureUserEntries } = require('../utils/entries');
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
    const liveMatch = matches.find((match) => String(match.liveStatus || '').toLowerCase() === 'live');

    if (!liveMatch) {
      return res.json(null);
    }

    const actualContext = buildResolutionContext(matches);
    const actualTeams = resolveMatchTeams(liveMatch, actualContext);

    res.json({
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

    await recalculateAllScores();
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Could not update result.' });
  }
});

module.exports = router;
