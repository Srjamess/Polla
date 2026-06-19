const Match = require('../models/Match');
const { recalculateAllScores } = require('./scoring');

const LIVE_FEED_URL = 'https://worldcup26.ir/get/games';
const LIVE_FEED_TIMEOUT_MS = 8000;
const LIVE_FEED_RETRIES = 2;
const LIVE_WINDOW_MS = 6 * 60 * 60 * 1000;
const LIVE_FUTURE_GRACE_MS = 2 * 60 * 60 * 1000;

const LIVE_TEAM_NAME_MAP = {
  Algeria: 'Argelia',
  Argentina: 'Argentina',
  Australia: 'Australia',
  Austria: 'Austria',
  Belgium: 'Belgica',
  Bolivia: 'Bolivia',
  Brazil: 'Brasil',
  Canada: 'Canada',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  Chile: 'Chile',
  Colombia: 'Colombia',
  Croatia: 'Croacia',
  Curacao: 'Curazao',
  'Curaçao': 'Curazao',
  'Cote dIvoire': 'Costa de Marfil',
  'Costa de Marfil': 'Costa de Marfil',
  'Czech Republic': 'Chequia',
  Denmark: 'Dinamarca',
  Ecuador: 'Ecuador',
  Egypt: 'Egipto',
  England: 'Inglaterra',
  France: 'Francia',
  Germany: 'Alemania',
  Haiti: 'Haiti',
  Ghana: 'Ghana',
  Iraq: 'Irak',
  Iran: 'Iran',
  Japan: 'Japon',
  Jordan: 'Jordania',
  Mexico: 'Mexico',
  Morocco: 'Marruecos',
  Netherlands: 'Paises Bajos',
  Norway: 'Noruega',
  Panama: 'Panama',
  Paraguay: 'Paraguay',
  Portugal: 'Portugal',
  Qatar: 'Catar',
  'Cape Verde': 'Islas de Cabo Verde',
  'Cape Verde Islands': 'Islas de Cabo Verde',
  Senegal: 'Senegal',
  Scotland: 'Escocia',
  Spain: 'Espana',
  Sweden: 'Suecia',
  Switzerland: 'Suiza',
  Tunisia: 'Tunez',
  Turkey: 'Turquia',
  'New Zealand': 'Nueva Zelanda',
  'South Africa': 'Sudafrica',
  'United States': 'EE. UU.',
  'United States of America': 'EE. UU.',
  Uruguay: 'Uruguay',
  Uzbekistan: 'Uzbekistan',
  'Bosnia y Herzegovina': 'Bosnia y Herzegovina',
  'Republic of Korea': 'Republica de Corea',
  'Korea Republic': 'Republica de Corea',
  'South Korea': 'Republica de Corea',
  Korea: 'Republica de Corea',
  'Democratic Republic of the Congo': 'RD Congo',
  'Ivory Coast': 'Costa de Marfil',
  'Saudi Arabia': 'Arabia Saudi',
  'Saudi Arabia ': 'Arabia Saudi',
  'Cabo Verde': 'Islas de Cabo Verde',
  'Cabo Verde Islands': 'Islas de Cabo Verde',
  'Islas de Cabo Verde': 'Islas de Cabo Verde',
  'Paises Bajos': 'Paises Bajos',
  'Sudafrica': 'Sudafrica',
  'Republica de Corea': 'Republica de Corea',
  'Nueva Zelanda': 'Nueva Zelanda'
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9. ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function toIntegerScore(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getNestedValue(source, path) {
  if (!source || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
}

function parseScorePair(value) {
  if (value == null || value === '') return [null, null];

  if (Array.isArray(value) && value.length >= 2) {
    return [toIntegerScore(value[0]), toIntegerScore(value[1])];
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (match) {
      return [toIntegerScore(match[1]), toIntegerScore(match[2])];
    }
  }

  if (typeof value === 'object') {
    const left = value.home ?? value.local ?? value.a ?? value.scoreA ?? value.teamA ?? value.first;
    const right = value.away ?? value.visitor ?? value.b ?? value.scoreB ?? value.teamB ?? value.second;
    return [toIntegerScore(left), toIntegerScore(right)];
  }

  return [null, null];
}

function collectObjectCandidates(node, seen = new Set(), output = []) {
  if (!node || typeof node !== 'object') return output;
  if (seen.has(node)) return output;
  seen.add(node);

  if (Array.isArray(node)) {
    node.forEach((item) => collectObjectCandidates(item, seen, output));
    return output;
  }

  output.push(node);
  Object.values(node).forEach((value) => {
    if (value && typeof value === 'object') {
      collectObjectCandidates(value, seen, output);
    }
  });

  return output;
}

function extractGameScores(game) {
  const scorePairs = [
    [game?.home_score, game?.away_score],
    [game?.homeScore, game?.awayScore],
    [game?.score_home, game?.score_away],
    [game?.local_score, game?.visitor_score],
    [game?.teamA_score, game?.teamB_score],
    [game?.scoreA, game?.scoreB]
  ];

  for (const [left, right] of scorePairs) {
    const scoreA = toIntegerScore(left);
    const scoreB = toIntegerScore(right);
    if (scoreA !== null && scoreB !== null) {
      return { scoreA, scoreB };
    }
  }

  const scoreCandidates = [
    game?.score,
    game?.result,
    game?.scores,
    game?.live_score,
    game?.current_score
  ];

  for (const candidate of scoreCandidates) {
    const [scoreA, scoreB] = parseScorePair(candidate);
    if (scoreA !== null && scoreB !== null) {
      return { scoreA, scoreB };
    }
  }

  const nestedCandidates = [
    ['home_score.full', 'away_score.full'],
    ['home_score.total', 'away_score.total'],
    ['homeScore.full', 'awayScore.full'],
    ['homeScore.total', 'awayScore.total'],
    ['score.home', 'score.away'],
    ['score.a', 'score.b']
  ];

  for (const [leftPath, rightPath] of nestedCandidates) {
    const scoreA = toIntegerScore(getNestedValue(game, leftPath));
    const scoreB = toIntegerScore(getNestedValue(game, rightPath));
    if (scoreA !== null && scoreB !== null) {
      return { scoreA, scoreB };
    }
  }

  return { scoreA: null, scoreB: null };
}

function collectFeedGameCandidates(payload) {
  const rawCandidates = collectObjectCandidates(payload);
  const unique = [];
  const seen = new Set();

  rawCandidates.forEach((candidate) => {
    const minute = getGameMinute(candidate);
    const status = getGameStatus(candidate);
    const { scoreA, scoreB } = extractGameScores(candidate);
    const hasLiveSignal = Boolean(
      /^\d+/.test(String(minute || '').trim()) ||
      Number.isInteger(scoreA) ||
      Number.isInteger(scoreB) ||
      isLiveishGame(candidate) ||
      isLiveGameStatus(status) ||
      isFinishedGameStatus(status)
    );

    if (!hasLiveSignal) return;

    const signature = JSON.stringify([
      String(candidate?.id || candidate?.match_id || candidate?.game_id || candidate?.slug || ''),
      String(candidate?.home_team_name_en || candidate?.home_team_label || candidate?.home_name || candidate?.home || candidate?.teamA_name || candidate?.teamA || ''),
      String(candidate?.away_team_name_en || candidate?.away_team_label || candidate?.away_name || candidate?.away || candidate?.teamB_name || candidate?.teamB || ''),
      String(minute || ''),
      String(scoreA ?? ''),
      String(scoreB ?? ''),
      String(status || '')
    ]);

    if (seen.has(signature)) return;
    seen.add(signature);
    unique.push(candidate);
  });

  return unique;
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function getGameStatus(game) {
  const candidates = [
    game?.time_elapsed,
    game?.status,
    game?.status_name,
    game?.status_short,
    game?.match_status,
    game?.matchStatus,
    game?.game_status,
    game?.gameStatus,
    game?.state,
    game?.live_status,
    game?.liveStatus
  ];

  for (const value of candidates) {
    if (value == null || value === '') continue;
    const text = String(value).trim();
    if (text) return text.toLowerCase();
  }

  return '';
}

function getGameMinute(game) {
  const candidates = [
    game?.minute,
    game?.live_minute,
    game?.elapsed_minute,
    game?.elapsed_minutes,
    game?.minutes,
    game?.current_minute,
    game?.time_elapsed_minute
  ];

  for (const value of candidates) {
    if (value == null || value === '') continue;
    const text = String(value).trim();
    if (!text) continue;
    const minuteMatch = text.match(/\d{1,3}/);
    if (minuteMatch) return text;
  }

  return '';
}

function isFinishedGameStatus(status) {
  const normalized = normalizeStatus(status);
  return (
    normalized === 'finished' ||
    normalized === 'final' ||
    normalized === 'ft' ||
    normalized === 'aet' ||
    normalized === 'ended' ||
    normalized === 'complete' ||
    normalized === 'completed' ||
    normalized === 'fulltime' ||
    normalized === 'full-time' ||
    normalized === 'closed' ||
    normalized.includes('full time') ||
    normalized.includes('finished')
  );
}

function isLiveGameStatus(status) {
  const normalized = normalizeStatus(status);

  if (!normalized) return false;
  if (isFinishedGameStatus(normalized)) return false;

  if (
    normalized === 'notstarted' ||
    normalized === 'postponed' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'ns'
  ) {
    return false;
  }

  return (
    normalized.includes('live') ||
    normalized.includes('in play') ||
    normalized.includes('inplay') ||
    normalized.includes('ongoing') ||
    normalized.includes('half') ||
    normalized.includes('progress')
  );
}

function getGameLiveFlag(game) {
  const candidates = [
    game?.live,
    game?.is_live,
    game?.in_play,
    game?.inplay,
    game?.playing,
    game?.started
  ];

  for (const value of candidates) {
    if (value === true) return true;
    if (String(value || '').trim().toLowerCase() === 'true') return true;
  }

  return false;
}

function getFeedTeamName(game, side) {
  const candidates = side === 'away'
    ? [
        game?.away_team_name_en,
        game?.away_team_label,
        game?.away_team_name_es,
        game?.away_team_name_fa,
        game?.away_team_name,
        game?.away_name,
        game?.away,
        game?.visitor_name,
        game?.teamB_name
      ]
    : [
        game?.home_team_name_en,
        game?.home_team_label,
        game?.home_team_name_es,
        game?.home_team_name_fa,
        game?.home_team_name,
        game?.home_name,
        game?.home,
        game?.local_name,
        game?.teamA_name
      ];

  for (const candidate of candidates) {
    const text = String(candidate || '').trim();
    if (!text) continue;
    return LIVE_TEAM_NAME_MAP[text] || text;
  }

  return '';
}

function parseGameDate(game) {
  const candidates = [
    game?.local_date,
    game?.date,
    game?.match_date,
    game?.datetime,
    game?.start_time,
    game?.utc_date
  ];

  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function shouldPollLiveFeed(matches, now = new Date()) {
  const currentTime = now.getTime();

  return matches.some((match) => {
    const liveStatus = String(match.liveStatus || '').toLowerCase();
    if (liveStatus === 'live') return true;

    const matchDate = match.matchDate ? new Date(match.matchDate) : null;
    if (!matchDate || Number.isNaN(matchDate.getTime())) return false;

    const matchTime = matchDate.getTime();
    if (matchTime < currentTime - LIVE_WINDOW_MS) return false;
    if (matchTime > currentTime + LIVE_FUTURE_GRACE_MS) return false;

    return !match.resultSet;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLiveFeedPayload({ retries = LIVE_FEED_RETRIES, timeoutMs = LIVE_FEED_TIMEOUT_MS } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(LIVE_FEED_URL, {
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Live feed error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError || new Error('Live feed unavailable.');
}

function collectMatchNames(match) {
  return [
    match?.teamA,
    match?.teamB,
    match?.actualResolvedTeamA,
    match?.actualResolvedTeamB,
    match?.predictedResolvedTeamA,
    match?.predictedResolvedTeamB
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function matchGameToMatch(game, matches) {
  const homeName = normalizeText(getFeedTeamName(game, 'home'));
  const awayName = normalizeText(getFeedTeamName(game, 'away'));
  const gameDate = parseGameDate(game);

  let bestMatch = null;
  let bestScore = 0;

  matches.forEach((match) => {
    const localNames = collectMatchNames(match);
    const teamMatch =
      (localNames.includes(homeName) && localNames.includes(awayName)) ||
      (localNames.includes(awayName) && localNames.includes(homeName));

    if (!teamMatch) return;

    let score = 100;
    if (gameDate && match.matchDate) {
      const diffHours = Math.abs(new Date(match.matchDate).getTime() - gameDate.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 12) {
        score += 20;
      } else if (diffHours <= 36) {
        score += 10;
      }
    }

    const gameGroup = String(game?.group || game?.stage || '').toUpperCase();
    const matchGroup = String(match.group || '').toUpperCase();
    if (gameGroup && matchGroup && gameGroup === matchGroup) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = match;
    }
  });

  return bestMatch;
}

function isLiveishGame(game) {
  const status = getGameStatus(game);
  return Boolean(isLiveGameStatus(status));
}

function buildFeedGamePayload(game) {
  const homeTeam = getFeedTeamName(game, 'home');
  const awayTeam = getFeedTeamName(game, 'away');
  const { scoreA, scoreB } = extractGameScores(game);
  const status = getGameStatus(game);
  const minute = getGameMinute(game);
  const liveStatus = isFinishedGameStatus(status)
    ? 'finished'
    : (isLiveGameStatus(status)
      ? 'live'
      : '');

  return {
    teamA: homeTeam,
    teamB: awayTeam,
    home_team_name_en: homeTeam,
    home_team_label: homeTeam,
    away_team_name_en: awayTeam,
    away_team_label: awayTeam,
    home_team_name_es: homeTeam,
    away_team_name_es: awayTeam,
    scoreA,
    scoreB,
    liveScoreA: scoreA,
    liveScoreB: scoreB,
    liveMinute: minute,
    liveStatus,
    liveUpdatedAt: new Date(),
    resultSource: 'live',
    matchDate: parseGameDate(game) || null
  };
}

function buildLiveMatchUpdate(match, game) {
  const status = getGameStatus(game);
  const { scoreA: homeScore, scoreB: awayScore } = extractGameScores(game);
  const matchDate = match?.matchDate ? new Date(match.matchDate) : null;
  const hasStarted = Boolean(matchDate && !Number.isNaN(matchDate.getTime()) && matchDate <= new Date());
  const hasLiveScore = homeScore !== null && awayScore !== null;
  const liveish = isLiveGameStatus(status);

  if (!hasStarted && !isFinishedGameStatus(status) && !liveish) {
    return null;
  }

  if (liveish && hasStarted && hasLiveScore && !isFinishedGameStatus(status)) {
    return {
      scoreA: homeScore,
      scoreB: awayScore,
      resultSet: true,
      liveMinute: getGameMinute(game),
      liveStatus: 'live',
      liveUpdatedAt: new Date(),
      resultSource: 'live',
      liveQualifiedTeam: homeScore === awayScore ? '' : (homeScore > awayScore ? 'teamA' : 'teamB')
    };
  }

  if (isFinishedGameStatus(status) && hasLiveScore) {
    const update = {
      scoreA: homeScore,
      scoreB: awayScore,
      resultSet: true,
      liveMinute: '',
      liveStatus: 'finished',
      liveUpdatedAt: new Date(),
      resultSource: 'live'
    };

    if (match.stage !== 'group') {
      if (homeScore === awayScore) {
        update.qualifiedTeam = ['teamA', 'teamB'].includes(match.qualifiedTeam) ? match.qualifiedTeam : '';
      } else {
        update.qualifiedTeam = homeScore > awayScore ? 'teamA' : 'teamB';
      }
    } else {
      update.qualifiedTeam = '';
    }

    return update;
  }

  return null;
}

async function syncLiveScores({ silent = true } = {}) {
  const payload = await fetchLiveFeedPayload();
  const games = Array.isArray(payload?.games) ? payload.games : [];
  const matches = await Match.find();
  const updates = [];

  games.forEach((game) => {
    const match = matchGameToMatch(game, matches);
    if (!match) return;

    if (match.resultSet && String(match.resultSource || '') !== 'live') {
      return;
    }

    const update = buildLiveMatchUpdate(match, game);
    if (!update) return;

    const hasChanges = Object.entries(update).some(([key, value]) => {
      if (value === null) return match[key] !== null && match[key] !== undefined;
      if (value instanceof Date) {
        const current = match[key] ? new Date(match[key]).getTime() : null;
        return current !== value.getTime();
      }
      return String(match[key] ?? '') !== String(value);
    });

    if (!hasChanges) return;

    Object.assign(match, update);
    updates.push(match.save());
  });

  if (updates.length) {
    await Promise.all(updates);
    await recalculateAllScores();
  }

  if (!silent && updates.length) {
    console.log(`Live sync updated ${updates.length} match${updates.length === 1 ? '' : 'es'}.`);
  }

  return { updated: updates.length };
}

module.exports = {
  buildLiveMatchUpdate,
  buildFeedGamePayload,
  extractGameScores,
  fetchLiveFeedPayload,
  getGameStatus,
  isFinishedGameStatus,
  isLiveGameStatus,
  getGameMinute,
  getGameLiveFlag,
  isLiveishGame,
  collectFeedGameCandidates,
  matchGameToMatch,
  shouldPollLiveFeed,
  syncLiveScores,
};
