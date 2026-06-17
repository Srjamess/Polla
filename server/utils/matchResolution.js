function toIntegerScore(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getMatchScoreState(match, { includeLive = false } = {}) {
  if (!match) {
    return { played: false, scoreA: null, scoreB: null, live: false };
  }

  if (match.resultSet) {
    return {
      played: true,
      scoreA: Number(match.scoreA),
      scoreB: Number(match.scoreB),
      live: false
    };
  }

  if (includeLive) {
    const liveStatus = String(match.liveStatus || '').toLowerCase();

    if (liveStatus === 'live') {
      const liveScoreA = toIntegerScore(match.scoreA);
      const liveScoreB = toIntegerScore(match.scoreB);
      if (liveScoreA !== null && liveScoreB !== null) {
        return {
          played: true,
          scoreA: liveScoreA,
          scoreB: liveScoreB,
          live: true
        };
      }
    }

    if (match.resultSet || liveStatus === 'finished') {
      const scoreA = toIntegerScore(match.scoreA);
      const scoreB = toIntegerScore(match.scoreB);
      if (scoreA !== null && scoreB !== null) {
        return {
          played: true,
          scoreA,
          scoreB,
          live: false
        };
      }
    }
  }

  return { played: false, scoreA: null, scoreB: null, live: false };
}

function getMatchQualifiedSide(match, { includeLive = false } = {}) {
  if (!match) return { qualifiedSide: null, live: false, played: false };

  if (match.resultSet) {
    if (Number(match.scoreA) === Number(match.scoreB)) {
      return {
        qualifiedSide: match.qualifiedTeam || null,
        live: false,
        played: true
      };
    }

    return {
      qualifiedSide: Number(match.scoreA) > Number(match.scoreB) ? 'teamA' : 'teamB',
      live: false,
      played: true
    };
  }

  const scoreState = getMatchScoreState(match, { includeLive });
  if (!scoreState.played) {
    return { qualifiedSide: null, live: false, played: false };
  }

  if (scoreState.scoreA === scoreState.scoreB) {
    return {
      qualifiedSide: ['teamA', 'teamB'].includes(match.liveQualifiedTeam) ? match.liveQualifiedTeam : null,
      live: true,
      played: true
    };
  }

  return {
    qualifiedSide: scoreState.scoreA > scoreState.scoreB ? 'teamA' : 'teamB',
    live: true,
    played: true
  };
}

module.exports = {
  getMatchQualifiedSide,
  getMatchScoreState
};
