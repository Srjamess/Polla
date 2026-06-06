const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const { authenticate } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');

const router = express.Router();

router.use(authenticate);

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

router.post('/:matchId', async (req, res) => {
  try {
    const { predictedScoreA, predictedScoreB, predictedQualifiedTeam } = req.body;
    const parsedScoreA = Number(predictedScoreA);
    const parsedScoreB = Number(predictedScoreB);

    if (
      !Number.isInteger(parsedScoreA) ||
      !Number.isInteger(parsedScoreB) ||
      parsedScoreA < 0 ||
      parsedScoreB < 0
    ) {
      return res.status(400).json({ message: 'Predictions must be non-negative integers.' });
    }

    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    if (match.matchDate <= new Date() || match.resultSet) {
      return res.status(403).json({ message: 'Predictions are locked for this match.' });
    }

    let qualifiedSide = '';
    if (match.stage !== 'group') {
      if (parsedScoreA === parsedScoreB) {
        if (!['teamA', 'teamB'].includes(predictedQualifiedTeam)) {
          return res.status(400).json({ message: 'A qualified team is required for knockout draws.' });
        }
        qualifiedSide = predictedQualifiedTeam;
      } else {
        qualifiedSide = parsedScoreA > parsedScoreB ? 'teamA' : 'teamB';
      }
    }

    const prediction = await Prediction.findOneAndUpdate(
      { user: req.user._id, match: match._id },
      {
        $set: {
          predictedScoreA: parsedScoreA,
          predictedScoreB: parsedScoreB,
          predictedQualifiedTeam: qualifiedSide,
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
