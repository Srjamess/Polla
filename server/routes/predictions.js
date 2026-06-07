const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const { authenticate } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const { getAppSettings } = require('../utils/appSettings');

const router = express.Router();

router.use(authenticate);

function getUniqueTeams(matches) {
  return [...new Set(
    matches
      .flatMap((match) => [match.teamA, match.teamB])
      .map((team) => String(team || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'es'));
}

function parsePredictionPayload(payload) {
  const predictedScoreA = Number(payload?.predictedScoreA);
  const predictedScoreB = Number(payload?.predictedScoreB);
  const predictedQualifiedTeam = String(payload?.predictedQualifiedTeam || '').trim();

  if (
    !Number.isInteger(predictedScoreA) ||
    !Number.isInteger(predictedScoreB) ||
    predictedScoreA < 0 ||
    predictedScoreB < 0
  ) {
    return null;
  }

  return {
    predictedScoreA,
    predictedScoreB,
    predictedQualifiedTeam
  };
}

function buildPredictionUpdate(match, payload) {
  const parsed = parsePredictionPayload(payload);
  if (!parsed) return { error: 'Predictions must be non-negative integers.' };

  let qualifiedSide = '';
  if (match.stage !== 'group') {
    if (parsed.predictedScoreA === parsed.predictedScoreB) {
      if (!['teamA', 'teamB'].includes(parsed.predictedQualifiedTeam)) {
        return { error: 'A qualified team is required for knockout draws.' };
      }
      qualifiedSide = parsed.predictedQualifiedTeam;
    } else {
      qualifiedSide = parsed.predictedScoreA > parsed.predictedScoreB ? 'teamA' : 'teamB';
    }
  }

  return {
    update: {
      predictedScoreA: parsed.predictedScoreA,
      predictedScoreB: parsed.predictedScoreB,
      predictedQualifiedTeam: qualifiedSide
    }
  };
}

async function ensureMatchCanBePredicted(match, settings) {
  if (!match) {
    return 'Match not found.';
  }

  if (settings.predictionsLocked || match.matchDate <= new Date() || match.resultSet) {
    return 'Predictions are locked for this match.';
  }

  return null;
}

router.get('/me', async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user._id })
      .populate('match')
      .sort({ createdAt: -1 });

    const data = predictions
      .filter((prediction) => prediction.match)
      .map((prediction) => {
        const match = prediction.match;

        return {
          id: prediction._id,
          matchId: match._id,
          code: match.code || '',
          stage: match.stage || '',
          group: match.group || '',
          matchDate: match.matchDate,
          teamA: match.teamA,
          teamB: match.teamB,
          sourceA: match.sourceA || '',
          sourceB: match.sourceB || '',
          venue: match.venue || '',
          resultSet: Boolean(match.resultSet),
          scoreA: match.resultSet ? match.scoreA : null,
          scoreB: match.resultSet ? match.scoreB : null,
          predictedScoreA: prediction.predictedScoreA,
          predictedScoreB: prediction.predictedScoreB,
          predictedQualifiedTeam: prediction.predictedQualifiedTeam || '',
          points: prediction.points || 0,
          scored: Boolean(prediction.scored)
        };
      });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch predictions.' });
  }
});

router.get('/worst-team', async (req, res) => {
  try {
    const settings = await getAppSettings();
    const matches = await Match.find().select('teamA teamB');
    const teams = getUniqueTeams(matches);
    const locked = Boolean(settings.predictionsLocked);

    res.json({
      predictedWorstTeam: req.user.predictedWorstTeam || '',
      teams,
      locked
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch worst team prediction.' });
  }
});

router.put('/worst-team', async (req, res) => {
  try {
    const settings = await getAppSettings();
    if (settings.predictionsLocked) {
      return res.status(403).json({ message: 'Worst team prediction is locked.' });
    }

    const matches = await Match.find().select('teamA teamB');
    const teams = getUniqueTeams(matches);
    const predictedWorstTeam = String(req.body?.predictedWorstTeam || '').trim();

    if (predictedWorstTeam && !teams.includes(predictedWorstTeam)) {
      return res.status(400).json({ message: 'Select a valid team.' });
    }

    req.user.predictedWorstTeam = predictedWorstTeam;
    await req.user.save();

    res.json({
      predictedWorstTeam: req.user.predictedWorstTeam || '',
      teams,
      locked: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not save worst team prediction.' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const settings = await getAppSettings();
    const inputPredictions = Array.isArray(req.body?.predictions) ? req.body.predictions : [];

    if (!inputPredictions.length) {
      return res.status(400).json({ message: 'No predictions provided.' });
    }

    const matchIds = inputPredictions.map((item) => String(item?.matchId || '').trim()).filter(Boolean);
    const uniqueMatchIds = [...new Set(matchIds)];
    if (uniqueMatchIds.length !== inputPredictions.length) {
      return res.status(400).json({ message: 'Duplicate match predictions are not allowed.' });
    }

    const matches = await Match.find({ _id: { $in: uniqueMatchIds } });
    const matchById = new Map(matches.map((match) => [String(match._id), match]));

    for (const matchId of uniqueMatchIds) {
      const blockedReason = await ensureMatchCanBePredicted(matchById.get(matchId), settings);
      if (blockedReason) {
        return res.status(blockedReason === 'Match not found.' ? 404 : 403).json({ message: blockedReason });
      }
    }

    const bulkOperations = [];
    for (const item of inputPredictions) {
      const matchId = String(item?.matchId || '').trim();
      const match = matchById.get(matchId);
      const build = buildPredictionUpdate(match, item);

      if (build.error) {
        return res.status(400).json({ message: build.error });
      }

      bulkOperations.push({
        updateOne: {
          filter: { user: req.user._id, match: match._id },
          update: {
            $set: {
              ...build.update,
              points: 0,
              scored: false
            },
            $setOnInsert: {
              user: req.user._id,
              match: match._id
            }
          },
          upsert: true
        }
      });
    }

    await Prediction.bulkWrite(bulkOperations, { ordered: true });
    await recalculateAllScores();
    res.json({ saved: bulkOperations.length });
  } catch (error) {
    res.status(500).json({ message: 'Could not save prediction.' });
  }
});

router.post('/:matchId', async (req, res) => {
  try {
    const settings = await getAppSettings();
    const match = await Match.findById(req.params.matchId);
    const blockedReason = await ensureMatchCanBePredicted(match, settings);
    if (blockedReason) {
      return res.status(blockedReason === 'Match not found.' ? 404 : 403).json({ message: blockedReason });
    }

    const build = buildPredictionUpdate(match, req.body);
    if (build.error) {
      return res.status(400).json({ message: build.error });
    }

    const prediction = await Prediction.findOneAndUpdate(
      { user: req.user._id, match: match._id },
      {
        $set: {
          ...build.update,
          points: 0,
          scored: false
        },
        $setOnInsert: {
          user: req.user._id,
          match: match._id
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await recalculateAllScores();
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Could not save prediction.' });
  }
});

module.exports = router;
