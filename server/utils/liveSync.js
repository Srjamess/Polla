const Match = require('../models/Match');
const { recalculateAllScores } = require('./scoring');

const LIVE_TEAM_NAME_MAP = {
  Algeria: 'Argelia',
  Argentina: 'Argentina',
  Australia: 'Australia',
  Austria: 'Austria',
  Belgium: 'Belgica',
  Bolivia: 'Bolivia',
  Brazil: 'Brasil',
  Canada: 'Canada',
  Chile: 'Chile',
  Colombia: 'Colombia',
  Croatia: 'Croacia',
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
  Senegal: 'Senegal',
  Scotland: 'Escocia',
  Spain: 'Espana',
  Sweden: 'Suecia',
  Switzerland: 'Suiza',
  Tunisia: 'Tunez',
  Turkey: 'Turquia',
  'United States': 'EE. UU.',
  'United States of America': 'EE. UU.',
  Uruguay: 'Uruguay',
  Uzbekistan: 'Uzbekistan',
  'Republic of Korea': 'Republica de Corea',
  'Korea Republic': 'Republica de Corea',
  'Democratic Republic of the Congo': 'RD Congo',
  'Ivory Coast': 'Costa de Marfil',
  'Saudi Arabia': 'Arabia Saudi'
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

function getGameStatus(game) {
  return String(game?.time_elapsed || game?.status || '').toLowerCase();
}

function getGameMinute(game) {
  const candidates = [
    game?.minute,
    game?.live_minute,
    game?.elapsed_minute,
    game?.elapsed_minutes,
    game?.minutes,
    game?.current_minute,
    game?.time_elapsed_minute,
    game?.time
  ];

  for (const value of candidates) {
    if (value == null || value === '') continue;
    const text = String(value).trim();
    if (!text) continue;
    if (/^\d+$/.test(text)) return `${text}'`;
    if (/^\d+'$/.test(text)) return text;
  }

  return '';
}

function getFeedTeamName(game, side) {
  const englishName = side === 'away'
    ? String(game?.away_team_name_en || game?.away_team_label || '').trim()
    : String(game?.home_team_name_en || game?.home_team_label || '').trim();

  const fallback = side === 'away'
    ? String(game?.away_team_name_es || game?.away_team_name_fa || '').trim()
    : String(game?.home_team_name_es || game?.home_team_name_fa || '').trim();

  return LIVE_TEAM_NAME_MAP[englishName] || fallback || englishName;
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

function buildLiveMatchUpdate(match, game) {
  const status = getGameStatus(game);
  const homeScore = toIntegerScore(game?.home_score);
  const awayScore = toIntegerScore(game?.away_score);
  const matchDate = match?.matchDate ? new Date(match.matchDate) : null;
  const hasStarted = Boolean(matchDate && !Number.isNaN(matchDate.getTime()) && matchDate <= new Date());

  if (!hasStarted && status !== 'finished') {
    return null;
  }

  if (status === 'live' && homeScore !== null && awayScore !== null) {
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

  if (status === 'finished' && homeScore !== null && awayScore !== null) {
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
  const response = await fetch('https://worldcup26.ir/get/games', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Live feed error ${response.status}`);
  }

  const payload = await response.json();
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
  syncLiveScores
};
