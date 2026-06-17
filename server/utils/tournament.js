const { getMatchScoreState, getMatchQualifiedSide } = require('./matchResolution');

const BONUS_STAGE_POINTS = {
  roundOf16: 2,
  quarterfinal: 3,
  semifinal: 5,
  final: 8,
  thirdPlace: 2
};

const CHAMPION_BONUS = 12;

function normalizeTeamName(name) {
  return String(name || '').trim();
}

function buildGroupSeed(matches) {
  const groups = {};

  matches
    .filter((match) => match.stage === 'group')
    .forEach((match) => {
      const group = String(match.group || '').toUpperCase();
      if (!group) return;
      if (!groups[group]) groups[group] = new Map();
      groups[group].set(normalizeTeamName(match.teamA), createRow(match.teamA, group));
      groups[group].set(normalizeTeamName(match.teamB), createRow(match.teamB, group));
    });

  return groups;
}

function createRow(team, group) {
  return {
    team: normalizeTeamName(team),
    group,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    diff: 0,
    points: 0
  };
}

function compareRows(a, b) {
  return (
    b.points - a.points ||
    b.diff - a.diff ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team)
  );
}

function buildGroupTables(matches, getScore) {
  const seed = buildGroupSeed(matches);
  const groupStatus = {};

  Object.keys(seed).forEach((group) => {
    groupStatus[group] = { total: 0, completed: 0 };
  });

  matches
    .filter((match) => match.stage === 'group')
    .forEach((match) => {
      const group = String(match.group || '').toUpperCase();
      if (!groupStatus[group]) groupStatus[group] = { total: 0, completed: 0 };
      groupStatus[group].total += 1;

      const score = getScore(match);
      if (!score || !score.played) return;
      groupStatus[group].completed += 1;

      const rows = seed[group];
      if (!rows) return;

      const teamA = rows.get(normalizeTeamName(match.teamA));
      const teamB = rows.get(normalizeTeamName(match.teamB));
      if (!teamA || !teamB) return;

      applyScore(teamA, teamB, score.scoreA, score.scoreB);
    });

  const tables = {};
  Object.entries(seed).forEach(([group, rows]) => {
    tables[group] = [...rows.values()].sort(compareRows);
  });

  return { tables, groupStatus };
}

function applyScore(teamA, teamB, scoreA, scoreB) {
  teamA.played += 1;
  teamB.played += 1;
  teamA.goalsFor += scoreA;
  teamA.goalsAgainst += scoreB;
  teamB.goalsFor += scoreB;
  teamB.goalsAgainst += scoreA;

  if (scoreA > scoreB) {
    teamA.wins += 1;
    teamB.losses += 1;
    teamA.points += 3;
  } else if (scoreB > scoreA) {
    teamB.wins += 1;
    teamA.losses += 1;
    teamB.points += 3;
  } else {
    teamA.draws += 1;
    teamB.draws += 1;
    teamA.points += 1;
    teamB.points += 1;
  }

  teamA.diff = teamA.goalsFor - teamA.goalsAgainst;
  teamB.diff = teamB.goalsFor - teamB.goalsAgainst;
}

function getActualScore(match, options = {}) {
  const scoreState = getMatchScoreState(match, options);
  if (!scoreState.played) return { played: false };
  return {
    played: true,
    scoreA: Number(scoreState.scoreA),
    scoreB: Number(scoreState.scoreB)
  };
}

function getPredictedScore(match, predictionByMatchId) {
  const prediction = predictionByMatchId.get(String(match._id));
  if (!prediction) return { played: false };
  return {
    played: true,
    scoreA: Number(prediction.predictedScoreA),
    scoreB: Number(prediction.predictedScoreB)
  };
}

function getActualQualifiedSide(match, options = {}) {
  const result = getMatchQualifiedSide(match, options);
  return result.played ? result.qualifiedSide : null;
}

function getPredictedQualifiedSide(match, predictionByMatchId) {
  const prediction = predictionByMatchId.get(String(match._id));
  if (!prediction) return null;
  if (Number(prediction.predictedScoreA) === Number(prediction.predictedScoreB)) {
    return prediction.predictedQualifiedTeam || null;
  }
  return Number(prediction.predictedScoreA) > Number(prediction.predictedScoreB) ? 'teamA' : 'teamB';
}

function sortMatchesForResolution(matches) {
  const order = {
    group: 1,
    roundOf32: 2,
    roundOf16: 3,
    quarterfinal: 4,
    semifinal: 5,
    thirdPlace: 6,
    final: 7
  };

  return [...matches].sort((a, b) => {
    const rankDiff = (order[a.stage] || 99) - (order[b.stage] || 99);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.matchDate) - new Date(b.matchDate) || String(a.code || '').localeCompare(String(b.code || ''));
  });
}

function buildResolutionContext(matches, predictionByMatchId, options = {}) {
  const actualMode = predictionByMatchId == null;
  const predictionMap = actualMode ? null : predictionByMatchId;
  const scoreGetter = actualMode
    ? (match) => getActualScore(match, options)
    : (match) => getPredictedScore(match, predictionMap);
  const { tables, groupStatus } = buildGroupTables(matches, scoreGetter);
  const matchesByCode = new Map(
    matches
      .filter((match) => match.code)
      .map((match) => [String(match.code).toUpperCase(), match])
  );

  const thirdPlaceRows = Object.entries(tables)
    .filter(([group]) => (actualMode ? groupStatus[group]?.completed === groupStatus[group]?.total : true))
    .map(([group, rows]) => ({ ...rows[2], group }))
    .filter((row) => row.team)
    .sort(compareRows);

  const thirdAssignments = new Map();
  const usedThirdGroups = new Set();

  const getQualifiedSide = actualMode
    ? (match) => getActualQualifiedSide(match, options)
    : (match) => getPredictedQualifiedSide(match, predictionMap);

  return {
    actualMode,
    tables,
    groupStatus,
    matchesByCode,
    thirdPlaceRows,
    thirdAssignments,
    usedThirdGroups,
    getQualifiedSide
  };
}

function resolveSource(source, context) {
  const text = String(source || '');
  if (!text) return null;

  const groupMatch = text.match(/^([123])([A-L])$/i);
  if (groupMatch) {
    const index = Number(groupMatch[1]) - 1;
    const group = groupMatch[2].toUpperCase();
    const status = context.groupStatus[group];
    if (!status || status.total === 0 || status.completed < status.total) {
      return null;
    }
    return context.tables[group]?.[index]?.team || null;
  }

  const bestThirdMatch = text.match(/^3([A-L]+)$/i);
  if (bestThirdMatch) {
    if (context.thirdAssignments.has(text)) {
      return context.thirdAssignments.get(text);
    }

    const allowedGroups = new Set(bestThirdMatch[1].toUpperCase().split(''));
    const candidate = context.thirdPlaceRows.find(
      (row) => {
        const status = context.groupStatus[row.group];
        return allowedGroups.has(row.group) && !context.usedThirdGroups.has(row.group) && status && status.total > 0 && status.completed === status.total;
      }
    );

    if (!candidate) return null;

    context.usedThirdGroups.add(candidate.group);
    context.thirdAssignments.set(text, candidate.team);
    return candidate.team;
  }

  const winnerMatch = text.match(/^winner:(.+)$/i);
  if (winnerMatch) {
    const code = winnerMatch[1].toUpperCase();
    const match = context.matchesByCode.get(code);
    if (!match) return null;
    const side = context.getQualifiedSide(match);
    if (!side) return null;
    const resolvedTeams = resolveMatchTeams(match, context);
    return side === 'teamA' ? resolvedTeams.teamA : resolvedTeams.teamB;
  }

  const loserMatch = text.match(/^loser:(.+)$/i);
  if (loserMatch) {
    const code = loserMatch[1].toUpperCase();
    const match = context.matchesByCode.get(code);
    if (!match) return null;
    const side = context.getQualifiedSide(match);
    if (!side) return null;
    const resolvedTeams = resolveMatchTeams(match, context);
    return side === 'teamA' ? resolvedTeams.teamB : resolvedTeams.teamA;
  }

  return text;
}

function resolveMatchTeams(match, context) {
  return {
    teamA: match.sourceA ? resolveSource(match.sourceA, context) : match.teamA,
    teamB: match.sourceB ? resolveSource(match.sourceB, context) : match.teamB
  };
}

function calculateGroupBonus(actualContext, predictedContext) {
  let points = 0;

  Object.keys(actualContext.tables).forEach((group) => {
    const actualStatus = actualContext.groupStatus[group];
    if (!actualStatus || actualStatus.completed < actualStatus.total) return;
    const predictedStatus = predictedContext.groupStatus[group];
    if (!predictedStatus || predictedStatus.total === 0 || predictedStatus.completed < predictedStatus.total) return;

    const actualRows = actualContext.tables[group] || [];
    const predictedRows = predictedContext.tables[group] || [];

    const actualTop = actualRows.slice(0, 2);
    const predictedTop = predictedRows.slice(0, 2);
    const predictedTeams = new Set(predictedTop.map((row) => row.team));

    actualTop.forEach((row, index) => {
      if (predictedTeams.has(row.team)) points += 2;
      if (predictedTop[index]?.team === row.team) points += 1;
    });
  });

  return points;
}

function calculateKnockoutBonus(matches, actualContext, predictedContext) {
  let points = 0;

  sortMatchesForResolution(matches)
    .filter((match) => BONUS_STAGE_POINTS[match.stage])
    .forEach((match) => {
      const actualTeams = resolveMatchTeams(match, actualContext);
      if (!actualTeams.teamA || !actualTeams.teamB) return;

      const predictedTeams = resolveMatchTeams(match, predictedContext);
      const stagePoints = BONUS_STAGE_POINTS[match.stage];

      if (predictedTeams.teamA && predictedTeams.teamA === actualTeams.teamA) points += stagePoints;
      if (predictedTeams.teamB && predictedTeams.teamB === actualTeams.teamB) points += stagePoints;
    });

  const finalMatch = matches.find((match) => match.stage === 'final');
  if (finalMatch && finalMatch.resultSet) {
    const actualWinnerSide = actualContext.getQualifiedSide(finalMatch);
    const predictedWinnerSide = predictedContext.getQualifiedSide(finalMatch);

    if (actualWinnerSide && predictedWinnerSide && actualWinnerSide === predictedWinnerSide) {
      points += CHAMPION_BONUS;
    }
  }

  return points;
}

function buildPredictionMap(predictions) {
  return new Map(predictions.map((prediction) => [String(prediction.match), prediction]));
}

module.exports = {
  BONUS_STAGE_POINTS,
  CHAMPION_BONUS,
  buildGroupTables,
  buildPredictionMap,
  buildResolutionContext,
  calculateGroupBonus,
  calculateKnockoutBonus,
  getActualScore,
  getPredictedScore,
  resolveMatchTeams,
  resolveSource,
  sortMatchesForResolution
};
