const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const { authenticate } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');

const router = express.Router();

router.use(authenticate);

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
