const API_BASE = '/api';
function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const state = {
  user: safeParse(localStorage.getItem('pm_user'), null),
  token: localStorage.getItem('pm_token'),
  activeView: 'standings',
  matches: [],
  myPredictions: [],
  predictionDrafts: {},
  pendingPredictionStage: null,
  savingPredictionStage: null,
  invalidPredictionMatchIds: []
};

const teamFlags = {
  Alemania: 'de',
  'Arabia Saudí': 'sa',
  Arabia: 'sa',
  Argelia: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Bélgica: 'be',
  Belgica: 'be',
  Bosnia: 'ba',
  Brasil: 'br',
  Canadá: 'ca',
  Canada: 'ca',
  'Cabo Verde': 'cv',
  Catar: 'qa',
  Chequia: 'cz',
  Colombia: 'co',
  Corea: 'kr',
  'Corea del Sur': 'kr',
  Croacia: 'hr',
  Curazao: 'cw',
  'Costa de Marfil': 'ci',
  'EE. UU.': 'us',
  Ecuador: 'ec',
  Egipto: 'eg',
  Escocia: 'gb-sct',
  España: 'es',
  Espana: 'es',
  Estados: 'us',
  'Estados Unidos': 'us',
  Francia: 'fr',
  Ghana: 'gh',
  Haití: 'ht',
  Haiti: 'ht',
  Inglaterra: 'gb-eng',
  Irak: 'iq',
  Iran: 'ir',
  'RI de Irán': 'ir',
  'Islas de Cabo Verde': 'cv',
  Japón: 'jp',
  Japon: 'jp',
  Jordania: 'jo',
  Marruecos: 'ma',
  México: 'mx',
  Mexico: 'mx',
  Noruega: 'no',
  Nueva: 'nz',
  'Nueva Zelanda': 'nz',
  'Países Bajos': 'nl',
  Paises: 'nl',
  Panamá: 'pa',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  'RD Congo': 'cd',
  Senegal: 'sn',
  Sudáfrica: 'za',
  Sudafrica: 'za',
  Suecia: 'se',
  Suiza: 'ch',
  Túnez: 'tn',
  Tunez: 'tn',
  Turquía: 'tr',
  Turquia: 'tr',
  Uruguay: 'uy',
  'Uzbekistán': 'uz',
  Uzbekistan: 'uz'
};

const groupTeams = {
  A: ['México', 'Sudáfrica', 'República de Corea', 'Chequia'],
  B: ['Canadá', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['EE. UU.', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'RI de Irán', 'Nueva Zelanda'],
  H: ['España', 'Islas de Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá']
};

function normalizeTeamName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const groupTeamOrder = Object.fromEntries(
  Object.entries(groupTeams).map(([group, teams]) => [
    group,
    new Map(
      teams.flatMap((team, index) => [
        [team, index],
        [normalizeTeamName(team), index]
      ])
    )
  ])
);

function compareGroupTeamsByFifaOrder(group, teamA, teamB) {
  const orderMap = groupTeamOrder[group] || null;
  const orderA = orderMap?.get(teamA);
  const orderB = orderMap?.get(teamB);
  const normalizedA = orderMap?.get(normalizeTeamName(teamA));
  const normalizedB = orderMap?.get(normalizeTeamName(teamB));
  const seedA = orderA ?? normalizedA;
  const seedB = orderB ?? normalizedB;

  if (seedA != null && seedB != null && seedA !== seedB) {
    return seedA - seedB;
  }
  if (seedA != null) return -1;
  if (seedB != null) return 1;
  return String(teamA || '').localeCompare(String(teamB || ''));
}

function demoFixture(id, teamA, teamB, group, date, venue) {
  return {
    _id: id,
    teamA,
    teamB,
    group,
    venue,
    stage: 'group',
    matchDate: date,
    scoreA: null,
    scoreB: null,
    resultSet: false,
    locked: false,
    prediction: null
  };
}

function demoKnockout(id, code, stage, date, sourceA, sourceB, venue = '') {
  return {
    _id: id,
    code,
    teamA: 'Por definir',
    teamB: 'Por definir',
    stage,
    matchDate: date,
    sourceA,
    sourceB,
    venue,
    resultSet: false,
    locked: false,
    prediction: null
  };
}

const demoGroupMatches = [
  demoFixture('d1', 'MÃ©xico', 'SudÃ¡frica', 'A', '2026-06-11T15:00:00-04:00', 'Estadio Ciudad de MÃ©xico (Ciudad de MÃ©xico)'),
  demoFixture('d2', 'RepÃºblica de Corea', 'Chequia', 'A', '2026-06-11T22:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  demoFixture('d3', 'CanadÃ¡', 'Bosnia y Herzegovina', 'B', '2026-06-12T15:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  demoFixture('d4', 'EE. UU.', 'Paraguay', 'D', '2026-06-12T21:00:00-04:00', 'Estadio Los Angeles (Los Ãngeles)'),
  demoFixture('d5', 'Catar', 'Suiza', 'B', '2026-06-13T15:00:00-04:00', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoFixture('d6', 'Brasil', 'Marruecos', 'C', '2026-06-13T18:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoFixture('d7', 'HaitÃ­', 'Escocia', 'C', '2026-06-13T21:00:00-04:00', 'Estadio Boston (Boston)'),
  demoFixture('d8', 'Australia', 'TurquÃ­a', 'D', '2026-06-14T00:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  demoFixture('d9', 'Alemania', 'Curazao', 'E', '2026-06-14T13:00:00-04:00', 'Estadio Houston (Houston)'),
  demoFixture('d10', 'PaÃ­ses Bajos', 'JapÃ³n', 'F', '2026-06-14T16:00:00-04:00', 'Estadio Dallas (Dallas)'),
  demoFixture('d11', 'Costa de Marfil', 'Ecuador', 'E', '2026-06-14T19:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  demoFixture('d12', 'Suecia', 'TÃºnez', 'F', '2026-06-14T22:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  demoFixture('d13', 'EspaÃ±a', 'Islas de Cabo Verde', 'H', '2026-06-15T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  demoFixture('d14', 'BÃ©lgica', 'Egipto', 'G', '2026-06-15T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  demoFixture('d15', 'Arabia SaudÃ­', 'Uruguay', 'H', '2026-06-15T18:00:00-04:00', 'Estadio Miami (Miami)'),
  demoFixture('d16', 'RI de IrÃ¡n', 'Nueva Zelanda', 'G', '2026-06-15T21:00:00-04:00', 'Estadio Los Angeles (Los Ãngeles)'),
  demoFixture('d17', 'Francia', 'Senegal', 'I', '2026-06-16T15:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoFixture('d18', 'Irak', 'Noruega', 'I', '2026-06-16T18:00:00-04:00', 'Estadio Boston (Boston)'),
  demoFixture('d19', 'Argentina', 'Argelia', 'J', '2026-06-16T21:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  demoFixture('d20', 'Austria', 'Jordania', 'J', '2026-06-17T00:00:00-04:00', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoFixture('d21', 'Portugal', 'RD Congo', 'K', '2026-06-17T13:00:00-04:00', 'Estadio Houston (Houston)'),
  demoFixture('d22', 'Inglaterra', 'Croacia', 'L', '2026-06-17T16:00:00-04:00', 'Estadio Dallas (Dallas)'),
  demoFixture('d23', 'Ghana', 'PanamÃ¡', 'L', '2026-06-17T19:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  demoFixture('d24', 'UzbekistÃ¡n', 'Colombia', 'K', '2026-06-17T22:00:00-04:00', 'Estadio Ciudad de MÃ©xico (Ciudad de MÃ©xico)'),
  demoFixture('d25', 'Chequia', 'SudÃ¡frica', 'A', '2026-06-18T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  demoFixture('d26', 'Suiza', 'Bosnia y Herzegovina', 'B', '2026-06-18T15:00:00-04:00', 'Estadio Los Angeles (Los Ãngeles)'),
  demoFixture('d27', 'CanadÃ¡', 'Catar', 'B', '2026-06-18T18:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  demoFixture('d28', 'MÃ©xico', 'RepÃºblica de Corea', 'A', '2026-06-18T21:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  demoFixture('d29', 'EE. UU.', 'Australia', 'D', '2026-06-19T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  demoFixture('d30', 'Escocia', 'Marruecos', 'C', '2026-06-19T18:00:00-04:00', 'Estadio Boston (Boston)'),
  demoFixture('d31', 'Brasil', 'HaitÃ­', 'C', '2026-06-19T20:30:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  demoFixture('d32', 'TurquÃ­a', 'Paraguay', 'D', '2026-06-20T00:00:00-04:00', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoFixture('d33', 'PaÃ­ses Bajos', 'Suecia', 'F', '2026-06-20T13:00:00-04:00', 'Estadio Houston (Houston)'),
  demoFixture('d34', 'Alemania', 'Costa de Marfil', 'E', '2026-06-20T16:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  demoFixture('d35', 'Ecuador', 'Curazao', 'E', '2026-06-20T20:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  demoFixture('d36', 'TÃºnez', 'JapÃ³n', 'F', '2026-06-21T00:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  demoFixture('d37', 'EspaÃ±a', 'Arabia SaudÃ­', 'H', '2026-06-21T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  demoFixture('d38', 'BÃ©lgica', 'RI de IrÃ¡n', 'G', '2026-06-21T15:00:00-04:00', 'Estadio Los Angeles (Los Ãngeles)'),
  demoFixture('d39', 'Uruguay', 'Islas de Cabo Verde', 'H', '2026-06-21T18:00:00-04:00', 'Estadio Miami (Miami)'),
  demoFixture('d40', 'Nueva Zelanda', 'Egipto', 'G', '2026-06-21T21:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  demoFixture('d41', 'Argentina', 'Austria', 'J', '2026-06-22T13:00:00-04:00', 'Estadio Dallas (Dallas)'),
  demoFixture('d42', 'Francia', 'Irak', 'I', '2026-06-22T17:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  demoFixture('d43', 'Noruega', 'Senegal', 'I', '2026-06-22T20:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoFixture('d44', 'Jordania', 'Argelia', 'J', '2026-06-23T00:00:00-04:00', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoFixture('d45', 'Portugal', 'UzbekistÃ¡n', 'K', '2026-06-23T13:00:00-04:00', 'Estadio Houston (Houston)'),
  demoFixture('d46', 'Inglaterra', 'Ghana', 'L', '2026-06-23T16:00:00-04:00', 'Estadio Boston (Boston)'),
  demoFixture('d47', 'PanamÃ¡', 'Croacia', 'L', '2026-06-23T19:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  demoFixture('d48', 'Colombia', 'RD Congo', 'K', '2026-06-23T22:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  demoFixture('d49', 'Suiza', 'CanadÃ¡', 'B', '2026-06-24T15:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  demoFixture('d50', 'Bosnia y Herzegovina', 'Catar', 'B', '2026-06-24T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  demoFixture('d51', 'Escocia', 'Brasil', 'C', '2026-06-24T18:00:00-04:00', 'Estadio Miami (Miami)'),
  demoFixture('d52', 'Marruecos', 'HaitÃ­', 'C', '2026-06-24T18:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  demoFixture('d53', 'Chequia', 'MÃ©xico', 'A', '2026-06-24T21:00:00-04:00', 'Estadio Ciudad de MÃ©xico (Ciudad de MÃ©xico)'),
  demoFixture('d54', 'SudÃ¡frica', 'RepÃºblica de Corea', 'A', '2026-06-24T21:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  demoFixture('d55', 'Curazao', 'Costa de Marfil', 'E', '2026-06-25T16:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  demoFixture('d56', 'Ecuador', 'Alemania', 'E', '2026-06-25T16:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoFixture('d57', 'JapÃ³n', 'Suecia', 'F', '2026-06-25T19:00:00-04:00', 'Estadio Dallas (Dallas)'),
  demoFixture('d58', 'TÃºnez', 'PaÃ­ses Bajos', 'F', '2026-06-25T19:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  demoFixture('d59', 'TurquÃ­a', 'EE. UU.', 'D', '2026-06-25T22:00:00-04:00', 'Estadio Los Angeles (Los Ãngeles)'),
  demoFixture('d60', 'Paraguay', 'Australia', 'D', '2026-06-25T22:00:00-04:00', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoFixture('d61', 'Noruega', 'Francia', 'I', '2026-06-26T15:00:00-04:00', 'Estadio Boston (Boston)'),
  demoFixture('d62', 'Senegal', 'Irak', 'I', '2026-06-26T15:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  demoFixture('d63', 'Islas de Cabo Verde', 'Arabia SaudÃ­', 'H', '2026-06-26T20:00:00-04:00', 'Estadio Houston (Houston)'),
  demoFixture('d64', 'Uruguay', 'EspaÃ±a', 'H', '2026-06-26T20:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  demoFixture('d65', 'Egipto', 'RI de IrÃ¡n', 'G', '2026-06-26T23:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  demoFixture('d66', 'Nueva Zelanda', 'BÃ©lgica', 'G', '2026-06-26T23:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  demoFixture('d67', 'PanamÃ¡', 'Inglaterra', 'L', '2026-06-27T17:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoFixture('d68', 'Croacia', 'Ghana', 'L', '2026-06-27T17:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  demoFixture('d69', 'Colombia', 'Portugal', 'K', '2026-06-27T19:30:00-04:00', 'Estadio Miami (Miami)'),
  demoFixture('d70', 'RD Congo', 'UzbekistÃ¡n', 'K', '2026-06-27T19:30:00-04:00', 'Estadio Atlanta (Atlanta)'),
  demoFixture('d71', 'Argelia', 'Austria', 'J', '2026-06-27T22:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  demoFixture('d72', 'Jordania', 'Argentina', 'J', '2026-06-27T22:00:00-04:00', 'Estadio Dallas (Dallas)')
];

const demoKnockoutMatches = [
  demoKnockout('k1',  'R32-1',  'roundOf32',   '2026-06-28T15:00:00-04:00', '2A', '2B', 'Estadio Los Angeles (Los Ãngeles)'),
  demoKnockout('k2',  'R32-9',  'roundOf32',   '2026-06-29T13:00:00-04:00', '1C', '2F', 'Estadio Houston (Houston)'),
  demoKnockout('k3',  'R32-3',  'roundOf32',   '2026-06-29T16:30:00-04:00', '1E', '3ABCDF', 'Estadio Boston (Boston)'),
  demoKnockout('k4',  'R32-2',  'roundOf32',   '2026-06-29T21:00:00-04:00', '1F', '2C', 'Estadio Monterrey (Monterrey)'),
  demoKnockout('k5',  'R32-10', 'roundOf32',   '2026-06-30T13:00:00-04:00', '2E', '2I', 'Estadio Dallas (Dallas)'),
  demoKnockout('k6',  'R32-4',  'roundOf32',   '2026-06-30T17:00:00-04:00', '1I', '3CDFGH', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoKnockout('k7',  'R32-11', 'roundOf32',   '2026-06-30T21:00:00-04:00', '1A', '3CEFHI', 'Estadio Ciudad de MÃ©xico (Ciudad de MÃ©xico)'),
  demoKnockout('k8',  'R32-12', 'roundOf32',   '2026-07-01T12:00:00-04:00', '1L', '3EHIJK', 'Estadio Atlanta (Atlanta)'),
  demoKnockout('k9',  'R32-8',  'roundOf32',   '2026-07-01T16:00:00-04:00', '1G', '3AEHIJ', 'Estadio de Seattle (Seattle)'),
  demoKnockout('k10', 'R32-7',  'roundOf32',   '2026-07-01T20:00:00-04:00', '1D', '3BEFIJ', 'Estadio de la BahÃ­a de San Francisco (Ãrea de la BahÃ­a de San Francisco)'),
  demoKnockout('k11', 'R32-6',  'roundOf32',   '2026-07-02T15:00:00-04:00', '1H', '2J', 'Estadio Los Angeles (Los Ãngeles)'),
  demoKnockout('k12', 'R32-5',  'roundOf32',   '2026-07-02T19:00:00-04:00', '2K', '2L', 'Estadio de Toronto (Toronto)'),
  demoKnockout('k13', 'R32-15', 'roundOf32',   '2026-07-02T23:00:00-04:00', '1B', '3EFGIJ', 'Estadio BC Place Vancouver (Vancouver)'),
  demoKnockout('k14', 'R32-14', 'roundOf32',   '2026-07-03T14:00:00-04:00', '2D', '2G', 'Estadio Dallas (Dallas)'),
  demoKnockout('k15', 'R32-13', 'roundOf32',   '2026-07-03T18:00:00-04:00', '1J', '2H', 'Estadio Miami (Miami)'),
  demoKnockout('k16', 'R32-16', 'roundOf32',   '2026-07-03T21:30:00-04:00', '1K', '3DEIJL', 'Estadio Kansas City (Kansas City)'),
  demoKnockout('k17', 'R16-1',  'roundOf16',   '2026-07-04T13:00:00-04:00', 'winner:R32-3',  'winner:R32-4', 'Estadio Houston (Houston)'),
  demoKnockout('k18', 'R16-2',  'roundOf16',   '2026-07-04T17:00:00-04:00', 'winner:R32-1',  'winner:R32-2', 'Estadio Filadelfia (Filadelfia)'),
  demoKnockout('k19', 'R16-3',  'roundOf16',   '2026-07-05T16:00:00-04:00', 'winner:R32-9',  'winner:R32-10', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  demoKnockout('k20', 'R16-4',  'roundOf16',   '2026-07-05T20:00:00-04:00', 'winner:R32-11', 'winner:R32-12', 'Estadio Ciudad de MÃ©xico (Ciudad de MÃ©xico)'),
  demoKnockout('k21', 'R16-5',  'roundOf16',   '2026-07-06T15:00:00-04:00', 'winner:R32-5',  'winner:R32-6', 'Estadio Dallas (Dallas)'),
  demoKnockout('k22', 'R16-6',  'roundOf16',   '2026-07-06T20:00:00-04:00', 'winner:R32-7',  'winner:R32-8', 'Estadio de Seattle (Seattle)'),
  demoKnockout('k23', 'R16-7',  'roundOf16',   '2026-07-07T12:00:00-04:00', 'winner:R32-13', 'winner:R32-14', 'Estadio Atlanta (Atlanta)'),
  demoKnockout('k24', 'R16-8',  'roundOf16',   '2026-07-07T16:00:00-04:00', 'winner:R32-15', 'winner:R32-16', 'Estadio BC Place Vancouver (Vancouver)'),
  demoKnockout('k25', 'QF-1',   'quarterfinal','2026-07-09T16:00:00-04:00', 'winner:R16-1',  'winner:R16-2', 'Estadio Boston (Boston)'),
  demoKnockout('k26', 'QF-2',   'quarterfinal','2026-07-10T15:00:00-04:00', 'winner:R16-5',  'winner:R16-6', 'Estadio Los Angeles (Los Ãngeles)'),
  demoKnockout('k27', 'QF-3',   'quarterfinal','2026-07-11T17:00:00-04:00', 'winner:R16-3',  'winner:R16-4', 'Estadio Miami (Miami)'),
  demoKnockout('k28', 'QF-4',   'quarterfinal','2026-07-11T21:00:00-04:00', 'winner:R16-7',  'winner:R16-8', 'Estadio Kansas City (Kansas City)'),
  demoKnockout('k29', 'SF-1',   'semifinal',   '2026-07-14T15:00:00-04:00', 'winner:QF-1',   'winner:QF-2', 'Estadio Dallas (Dallas)'),
  demoKnockout('k30', 'SF-2',   'semifinal',   '2026-07-15T15:00:00-04:00', 'winner:QF-3',   'winner:QF-4', 'Estadio Atlanta (Atlanta)'),
  demoKnockout('k31', 'TP-1',   'thirdPlace',  '2026-07-18T17:00:00-04:00', 'loser:SF-1',    'loser:SF-2', 'Estadio Miami (Miami)'),
  demoKnockout('k32', 'F-1',    'final',       '2026-07-19T15:00:00-04:00', 'winner:SF-1',   'winner:SF-2', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)')
];

const demoMatches = [...demoGroupMatches, ...demoKnockoutMatches];

function clearSession() {
  localStorage.removeItem('pm_token');
  localStorage.removeItem('pm_user');
  state.token = null;
  state.user = null;
}

function toast(message, type = 'success') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  root.appendChild(node);
  window.setTimeout(() => node.remove(), 3200);
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Ocurrio un error.');
    error.status = response.status;
    throw error;
  }

  return data;
}

function setSession(payload) {
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem('pm_token', payload.token);
  localStorage.setItem('pm_user', JSON.stringify(payload.user));
}

function requireAuth() {
  if (!state.token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const specialFlagEmoji = {
  'Bosnia y Herzegovina': '🇧🇦',
  'Republica de Corea': '🇰🇷',
  'República de Corea': '🇰🇷',
  'RI de Iran': '🇮🇷',
  'RI de Irán': '🇮🇷',
  Inglaterra: '🏴',
  Escocia: '🏴'
};

function flagCode(teamName) {
  const key = Object.keys(teamFlags).find((item) => String(teamName).includes(item));
  return key ? teamFlags[key] : '';
}

function flagEmoji(teamName) {
  const specialKey = Object.keys(specialFlagEmoji).find((item) => String(teamName).includes(item));
  if (specialKey) return specialFlagEmoji[specialKey];

  const code = flagCode(teamName);
  if (!code || code.length !== 2) return '⚽';

  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

const reliableSpecialFlagEmoji = {
  'Bosnia y Herzegovina': '\u{1F1E7}\u{1F1E6}',
  'Republica de Corea': '\u{1F1F0}\u{1F1F7}',
  'República de Corea': '\u{1F1F0}\u{1F1F7}',
  'RI de Iran': '\u{1F1EE}\u{1F1F7}',
  'RI de Irán': '\u{1F1EE}\u{1F1F7}',
  Inglaterra: '\u{1F3F4}',
  Escocia: '\u{1F3F4}'
};

function reliableFlagEmoji(teamName) {
  const specialKey = Object.keys(reliableSpecialFlagEmoji).find((item) => String(teamName).includes(item));
  if (specialKey) return reliableSpecialFlagEmoji[specialKey];

  const code = flagCode(teamName);
  if (!code || code.length !== 2) return '\u26BD';

  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function renderFlag(teamName) {
  const code = flagCode(teamName);
  if (code && code.length === 2) {
    return `
      <span class="flag-mark" aria-hidden="true">
        <img
          class="flag-img"
          src="https://flagcdn.com/w40/${code.toLowerCase()}.png"
          alt=""
          loading="lazy"
          onerror="this.style.display='none'; this.parentElement.querySelector('.flag-emoji-fallback').style.display='inline';"
        />
        <span class="flag-emoji-fallback" style="display:none;">${reliableFlagEmoji(teamName)}</span>
      </span>
    `;
  }

  return `<span class="flag-mark" aria-hidden="true"><span class="flag-emoji-fallback">${reliableFlagEmoji(teamName)}</span></span>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatFixtureDay(value) {
  const parts = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).formatToParts(new Date(value));

  const values = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.weekday} ${values.day} ${values.month} ${values.year}`;
}

function formatFixtureTime(value) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

function computeGroupTables(matches) {
  const tables = {};
  const groupStatus = {};

  matches
    .filter((match) => match.stage === 'group')
    .forEach((match) => {
      const group = String(match.group || '').toUpperCase();
      if (!group) return;

      if (!tables[group]) tables[group] = [];
      if (!groupStatus[group]) groupStatus[group] = { total: 0, completed: 0 };

      if (!tables[group].some((row) => row.team === match.teamA)) {
        tables[group].push({
          team: match.teamA,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          diff: 0,
          points: 0
        });
      }

      if (!tables[group].some((row) => row.team === match.teamB)) {
        tables[group].push({
          team: match.teamB,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          diff: 0,
          points: 0
        });
      }

      groupStatus[group].total += 1;
      if (match.resultSet) groupStatus[group].completed += 1;
    });

  matches.filter((match) => match.stage === 'group' && match.resultSet).forEach((match) => {
    const group = String(match.group || '').toUpperCase();
    const rows = tables[group] || [];
    const a = rows.find((row) => row.team === match.teamA);
    const b = rows.find((row) => row.team === match.teamB);
    if (!a || !b) return;

    a.played += 1;
    b.played += 1;
    a.goalsFor += match.scoreA;
    a.goalsAgainst += match.scoreB;
    b.goalsFor += match.scoreB;
    b.goalsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      a.wins += 1;
      b.losses += 1;
      a.points += 3;
    } else if (match.scoreA < match.scoreB) {
      b.wins += 1;
      a.losses += 1;
      b.points += 3;
    } else {
      a.draws += 1;
      b.draws += 1;
      a.points += 1;
      b.points += 1;
    }

    a.diff = a.goalsFor - a.goalsAgainst;
    b.diff = b.goalsFor - b.goalsAgainst;
  });

  Object.entries(tables).forEach(([group, rows]) => {
    rows.sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || compareGroupTeamsByFifaOrder(group, a.team, b.team));
  });

  const orderedTables = Object.fromEntries(
    Object.entries(tables).sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
  );
  const orderedStatus = Object.fromEntries(
    Object.entries(groupStatus).sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
  );

  return { tables: orderedTables, groupStatus: orderedStatus };
}

function computePredictedGroupTables(matches) {
  const tables = {};
  const groupStatus = {};

  matches.filter((match) => match.stage === 'group').forEach((match) => {
    const group = String(match.group || '').toUpperCase();
    if (!group) return;
    if (!tables[group]) tables[group] = [];
    if (!groupStatus[group]) groupStatus[group] = { total: 0, completed: 0 };

    if (!tables[group].some((row) => row.team === match.teamA)) {
      tables[group].push({ team: match.teamA, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, points: 0 });
    }
    if (!tables[group].some((row) => row.team === match.teamB)) {
      tables[group].push({ team: match.teamB, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, points: 0 });
    }

    groupStatus[group].total += 1;

    const prediction = match.prediction;
    if (!prediction) return;
    groupStatus[group].completed += 1;

    const a = tables[group].find((row) => row.team === match.teamA);
    const b = tables[group].find((row) => row.team === match.teamB);
    if (!a || !b) return;

    const scoreA = Number(prediction.predictedScoreA);
    const scoreB = Number(prediction.predictedScoreB);

    a.played += 1;
    b.played += 1;
    a.goalsFor += scoreA;
    a.goalsAgainst += scoreB;
    b.goalsFor += scoreB;
    b.goalsAgainst += scoreA;

    if (scoreA > scoreB) {
      a.wins += 1;
      b.losses += 1;
      a.points += 3;
    } else if (scoreA < scoreB) {
      b.wins += 1;
      a.losses += 1;
      b.points += 3;
    } else {
      a.draws += 1;
      b.draws += 1;
      a.points += 1;
      b.points += 1;
    }

    a.diff = a.goalsFor - a.goalsAgainst;
    b.diff = b.goalsFor - b.goalsAgainst;
  });

  Object.entries(tables).forEach(([group, rows]) => {
    rows.sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || compareGroupTeamsByFifaOrder(group, a.team, b.team));
  });

  return { tables, groupStatus };
}

function buildClientPredictionResolution(matches) {
  const { tables, groupStatus } = computePredictedGroupTables(matches);
  const matchesByCode = new Map(matches.filter((match) => match.code).map((match) => [String(match.code).toUpperCase(), match]));
  const thirdPlaceRows = Object.entries(tables)
    .map(([group, rows]) => ({ ...(rows[2] || {}), group }))
    .filter((row) => row.team)
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team));
  const thirdAssignments = new Map();
  const usedThirdGroups = new Set();

  function resolve(source) {
    const text = String(source || '');
    if (!text) return '';

    const groupMatch = text.match(/^([123])([A-L])$/i);
    if (groupMatch) {
      const index = Number(groupMatch[1]) - 1;
      const group = groupMatch[2].toUpperCase();
      const status = groupStatus[group];
      if (!status || status.total === 0 || status.completed < status.total) return '';
      return tables[group]?.[index]?.team || '';
    }

    const bestThirdMatch = text.match(/^3([A-L]+)$/i);
    if (bestThirdMatch) {
      if (thirdAssignments.has(text)) return thirdAssignments.get(text) || '';
      const allowedGroups = new Set(bestThirdMatch[1].toUpperCase().split(''));
      const candidate = thirdPlaceRows.find((row) => {
        const status = groupStatus[row.group];
        return allowedGroups.has(row.group) && !usedThirdGroups.has(row.group) && status && status.total > 0 && status.completed === status.total;
      });
      if (!candidate) return '';
      usedThirdGroups.add(candidate.group);
      thirdAssignments.set(text, candidate.team);
      return candidate.team;
    }

    const winnerMatch = text.match(/^winner:(.+)$/i);
    if (winnerMatch) {
      const match = matchesByCode.get(winnerMatch[1].toUpperCase());
      if (!match || !match.prediction) return '';
      const side = Number(match.prediction.predictedScoreA) === Number(match.prediction.predictedScoreB)
        ? match.prediction.predictedQualifiedTeam
        : (Number(match.prediction.predictedScoreA) > Number(match.prediction.predictedScoreB) ? 'teamA' : 'teamB');
      if (!side) return '';
      const teamA = match.clientPredictedResolvedTeamA || resolve(match.sourceA) || (match.teamA !== 'Por definir' ? match.teamA : '');
      const teamB = match.clientPredictedResolvedTeamB || resolve(match.sourceB) || (match.teamB !== 'Por definir' ? match.teamB : '');
      return side === 'teamA' ? teamA : teamB;
    }

    const loserMatch = text.match(/^loser:(.+)$/i);
    if (loserMatch) {
      const match = matchesByCode.get(loserMatch[1].toUpperCase());
      if (!match || !match.prediction) return '';
      const side = Number(match.prediction.predictedScoreA) === Number(match.prediction.predictedScoreB)
        ? match.prediction.predictedQualifiedTeam
        : (Number(match.prediction.predictedScoreA) > Number(match.prediction.predictedScoreB) ? 'teamA' : 'teamB');
      if (!side) return '';
      const teamA = match.clientPredictedResolvedTeamA || resolve(match.sourceA) || (match.teamA !== 'Por definir' ? match.teamA : '');
      const teamB = match.clientPredictedResolvedTeamB || resolve(match.sourceB) || (match.teamB !== 'Por definir' ? match.teamB : '');
      return side === 'teamA' ? teamB : teamA;
    }

    return text;
  }

  matches.forEach((match) => {
    match.clientPredictedResolvedTeamA = match.sourceA ? resolve(match.sourceA) : (match.teamA !== 'Por definir' ? match.teamA : '');
    match.clientPredictedResolvedTeamB = match.sourceB ? resolve(match.sourceB) : (match.teamB !== 'Por definir' ? match.teamB : '');
  });

  return { tables, groupStatus };
}

function resolveSource(source, groupTables, groupStatus, matchesByCode) {
  const sourceText = String(source || '');
  const groupMatch = sourceText.match(/^([123])([A-L])$/i);

  if (groupMatch) {
    const index = Number(groupMatch[1]) - 1;
    const group = groupMatch[2].toUpperCase();
    const status = groupStatus[group];
    if (!status || status.total === 0 || status.completed < status.total) return null;
    return groupTables[group]?.[index]?.team || sourceText;
  }

  const winnerMatch = sourceText.match(/^winner:(.+)$/i);
  if (winnerMatch) {
    const code = winnerMatch[1].toUpperCase();
    const match = matchesByCode.get(code);
    if (!match || !match.resultSet || match.scoreA === match.scoreB) return null;
    return match.scoreA > match.scoreB ? match.teamA : match.teamB;
  }

  const loserMatch = sourceText.match(/^loser:(.+)$/i);
  if (loserMatch) {
    const code = loserMatch[1].toUpperCase();
    const match = matchesByCode.get(code);
    if (!match || !match.resultSet || match.scoreA === match.scoreB) return null;
    return match.scoreA > match.scoreB ? match.teamB : match.teamA;
  }

  return sourceText;
}

function renderTeam(teamName, source, groupTables, groupStatus, matchesByCode) {
  const displayName = source ? resolveSource(source, groupTables, groupStatus, matchesByCode) : teamName;
  const unresolvedLabel = source ? prettySourceLabel(source) : teamName || 'Por definir';
  return `
    <div class="team-lockup ${displayName ? '' : 'pending-team'}">
      ${displayName ? renderFlag(displayName) : '<span class="flag-placeholder empty"></span>'}
      <span class="team-name">${escapeHtml(displayName || 'Por definir')}</span>
      ${source ? `<small>${escapeHtml(displayName ? prettySourceLabel(source) : unresolvedLabel)}</small>` : ''}
    </div>
  `;
}

function getPersonalResolvedTeam(match, side) {
  return side === 'A'
    ? (match.predictedResolvedTeamA || match.clientPredictedResolvedTeamA || match.teamA || '')
    : (match.predictedResolvedTeamB || match.clientPredictedResolvedTeamB || match.teamB || '');
}

function renderPersonalTeam(match, side, showSource = true) {
  const source = side === 'A' ? match.sourceA : match.sourceB;
  const resolvedName = getPersonalResolvedTeam(match, side);
  const label = resolvedName || (source ? prettySourceLabel(source) : 'Por definir');
  const isRightSide = side === 'B';

  return `
    <div class="team-lockup ${resolvedName ? '' : 'pending-team'} ${isRightSide ? 'team-lockup-right' : ''}">
      ${isRightSide ? '' : (resolvedName ? renderFlag(resolvedName) : '<span class="flag-placeholder empty"></span>')}
      <span class="team-name">${escapeHtml(label || 'Por definir')}</span>
      ${isRightSide ? (resolvedName ? renderFlag(resolvedName) : '<span class="flag-placeholder empty"></span>') : ''}
      ${showSource && source ? `<small>${escapeHtml(prettySourceLabel(source))}</small>` : ''}
    </div>
  `;
}

function renderAdminResultForm(match) {
  if (!state.user?.isAdmin) return '';

  const labelA = match.actualResolvedTeamA || match.teamA || 'Equipo A';
  const labelB = match.actualResolvedTeamB || match.teamB || 'Equipo B';
  const qualifiedValue = match.qualifiedTeam || '';

  return `
    <div class="admin-result-box">
      <div class="admin-result-head">
        <strong>Resultado real</strong>
        <span>${match.resultSet ? 'Actualizable' : 'Pendiente'}</span>
      </div>
      <form class="result-form" data-result-form>
        <input name="scoreA" type="number" min="0" step="1" placeholder="Gol A" value="${match.resultSet && Number.isInteger(match.scoreA) ? match.scoreA : ''}" required />
        <input name="scoreB" type="number" min="0" step="1" placeholder="Gol B" value="${match.resultSet && Number.isInteger(match.scoreB) ? match.scoreB : ''}" required />
        ${match.stage === 'group' ? '' : `
          <select name="qualifiedTeam">
            <option value="">Clasificado si hay empate</option>
            <option value="teamA" ${qualifiedValue === 'teamA' ? 'selected' : ''}>${escapeHtml(labelA)}</option>
            <option value="teamB" ${qualifiedValue === 'teamB' ? 'selected' : ''}>${escapeHtml(labelB)}</option>
          </select>
        `}
        <button class="secondary-button" type="submit">Guardar resultado</button>
      </form>
    </div>
  `;
}

function stageLabel(stage) {
  return {
    group:        'Fase de grupos',
    roundOf32:    'Dieciseisavos',
    roundOf16:    'Octavos de final',
    quarterfinal: 'Cuartos de final',
    semifinal:    'Semifinales',
    thirdPlace:   'Tercer puesto',
    final:        'Final'
  }[stage] || stage;
}

function fixtureStageLabel(stage) {
  return {
    group:        'Primera fase',
    roundOf32:    'Dieciseisavos de final',
    roundOf16:    'Octavos de final',
    quarterfinal: 'Cuartos de final',
    semifinal:    'Semifinal',
    thirdPlace:   'Tercer puesto',
    final:        'Final'
  }[stage] || stageLabel(stage);
}

function stageNavLabel(stage) {
  return {
    group: 'Grupos',
    roundOf32: '16avos',
    roundOf16: '8avos',
    quarterfinal: 'Cuartos',
    semifinal: 'Semi',
    thirdPlace: '3ro',
    final: 'Fin'
  }[stage] || stageLabel(stage);
}

function prettySourceLabel(source) {
  const text = String(source || '');
  const groupMatch = text.match(/^([123])([A-L])$/i);
  if (groupMatch) return `${groupMatch[1]}.º Grupo ${groupMatch[2].toUpperCase()}`;
  const winnerMatch = text.match(/^winner:(.+)$/i);
  if (winnerMatch) return `Ganador de ${winnerMatch[1].toUpperCase()}`;
  const loserMatch = text.match(/^loser:(.+)$/i);
  if (loserMatch) return `Perdedor de ${loserMatch[1].toUpperCase()}`;
  return text;
}

function getPredictionDraft(match) {
  return state.predictionDrafts[match._id] || {
    predictedScoreA: '',
    predictedScoreB: '',
    predictedQualifiedTeam: ''
  };
}

function isPredictionTie(match, draft = getPredictionDraft(match)) {
  if (match.stage === 'group') return false;
  if (!isFilledScore(draft.predictedScoreA) || !isFilledScore(draft.predictedScoreB)) return false;

  return Number(draft.predictedScoreA) === Number(draft.predictedScoreB);
}

function syncPredictionQualifiedField(matchId) {
  const match = state.matches.find((item) => String(item._id) === String(matchId));
  if (!match || match.stage === 'group') return;

  const card = document.querySelector(`[data-match-id="${String(matchId)}"]`);
  if (!card) return;

  const wrapper = card.querySelector('[data-prediction-qualified-wrap]');
  const select = card.querySelector('[data-prediction-qualified-select]');
  const draft = getPredictionDraft(match);
  const isTie = isPredictionTie(match, draft);

  if (wrapper) wrapper.classList.toggle('hidden', !isTie);
  if (select) {
    select.disabled = !isTie || match.locked;
    if (!isTie) {
      select.value = '';
    } else if (draft.predictedQualifiedTeam) {
      select.value = draft.predictedQualifiedTeam;
    }
  }
}

function getPredictionMatchLabel(match) {
  const labelA = getPersonalResolvedTeam(match, 'A') || prettySourceLabel(match.sourceA) || match.teamA || 'Por definir';
  const labelB = getPersonalResolvedTeam(match, 'B') || prettySourceLabel(match.sourceB) || match.teamB || 'Por definir';
  return `${labelA} vs ${labelB}`;
}

function getPredictionDisplayTeamLabel(match, side) {
  const resolved = getPersonalResolvedTeam(match, side);
  if (resolved) return resolved;

  const source = side === 'A' ? match.sourceA : match.sourceB;
  const sourceLabel = prettySourceLabel(source);
  if (sourceLabel && sourceLabel !== String(source || '')) return sourceLabel;

  return side === 'A'
    ? (match.teamA || 'Por definir')
    : (match.teamB || 'Por definir');
}

function syncPredictionDrafts(matches) {
  const nextDrafts = {};

  matches
    .filter((match) => !match.locked)
    .forEach((match) => {
      const currentDraft = state.predictionDrafts[match._id] || {};
      const savedPrediction = match.prediction || {};

      nextDrafts[match._id] = {
        predictedScoreA: currentDraft.predictedScoreA ?? savedPrediction.predictedScoreA ?? '',
        predictedScoreB: currentDraft.predictedScoreB ?? savedPrediction.predictedScoreB ?? '',
        predictedQualifiedTeam: currentDraft.predictedQualifiedTeam ?? savedPrediction.predictedQualifiedTeam ?? ''
      };
    });

  state.predictionDrafts = nextDrafts;
}

function isFilledScore(value) {
  return value !== '' && value !== null && value !== undefined;
}

function normalizeDraftPayload(match, draft) {
  const scoreA = Number(draft.predictedScoreA);
  const scoreB = Number(draft.predictedScoreB);

  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
    return null;
  }

  let predictedQualifiedTeam = '';
  if (match.stage !== 'group') {
    if (scoreA === scoreB) {
      if (!['teamA', 'teamB'].includes(draft.predictedQualifiedTeam)) return null;
      predictedQualifiedTeam = draft.predictedQualifiedTeam;
    } else {
      predictedQualifiedTeam = scoreA > scoreB ? 'teamA' : 'teamB';
    }
  }

  return {
    predictedScoreA: scoreA,
    predictedScoreB: scoreB,
    predictedQualifiedTeam
  };
}

function isPredictionDraftComplete(match, draft = getPredictionDraft(match)) {
  if (!isFilledScore(draft.predictedScoreA) || !isFilledScore(draft.predictedScoreB)) return false;
  return Boolean(normalizeDraftPayload(match, draft));
}

function isPredictionDraftSaved(match, draft = getPredictionDraft(match)) {
  const normalized = normalizeDraftPayload(match, draft);
  if (!normalized || !match.prediction) return false;

  return (
    Number(match.prediction.predictedScoreA) === normalized.predictedScoreA &&
    Number(match.prediction.predictedScoreB) === normalized.predictedScoreB &&
    String(match.prediction.predictedQualifiedTeam || '') === normalized.predictedQualifiedTeam
  );
}

function getStagePredictionState(stageMatches) {
  const total = stageMatches.length;
  const completed = stageMatches.filter((match) => isPredictionDraftComplete(match)).length;
  const missing = total - completed;
  const saved = total > 0 && missing === 0 && stageMatches.every((match) => isPredictionDraftSaved(match));
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, missing, saved, progress };
}

function getIncompletePredictionReason(match, draft = getPredictionDraft(match)) {
  if (!isFilledScore(draft.predictedScoreA) || !isFilledScore(draft.predictedScoreB)) {
    return 'Falta completar el marcador.';
  }

  if (match.stage !== 'group' && Number(draft.predictedScoreA) === Number(draft.predictedScoreB) && !draft.predictedQualifiedTeam) {
    return 'Falta seleccionar el equipo que clasifica.';
  }

  if (!normalizeDraftPayload(match, draft)) {
    return 'La prediccion esta incompleta.';
  }

  return '';
}

function renderPredictionProgress(stageMatches) {
  const summary = getStagePredictionState(stageMatches);

  return `
    <div class="prediction-progress" data-prediction-progress>
      <div class="prediction-progress-copy">
        <strong>${summary.completed}/${summary.total}</strong>
        <span>predicciones completas</span>
      </div>
      <div class="prediction-progress-track" aria-hidden="true">
        <span style="width:${summary.progress}%"></span>
      </div>
    </div>
  `;
}

function renderPredictionReviewRows(stageMatches) {
  return stageMatches.map((match) => {
    const draft = getPredictionDraft(match);
    const normalized = normalizeDraftPayload(match, draft) || draft;
    const score = `${normalized.predictedScoreA}-${normalized.predictedScoreB}`;
    const qualifier =
      match.stage !== 'group' && Number(normalized.predictedScoreA) === Number(normalized.predictedScoreB)
        ? ` · Clasifica ${normalized.predictedQualifiedTeam === 'teamA' ? escapeHtml(getPersonalResolvedTeam(match, 'A') || match.teamA) : escapeHtml(getPersonalResolvedTeam(match, 'B') || match.teamB)}`
        : '';

    return `
      <div class="prediction-review-row">
        <div class="prediction-review-match">
          <strong>${escapeHtml(getPredictionMatchLabel(match))}</strong>
          <span>${escapeHtml(stageLabel(match.stage))}</span>
        </div>
        <div class="prediction-review-score">${escapeHtml(score)}${qualifier}</div>
      </div>
    `;
  }).join('');
}

function renderPredictionReviewCards(stageMatches) {
  return stageMatches.map((match) => {
    const draft = getPredictionDraft(match);
    const normalized = normalizeDraftPayload(match, draft) || draft;
    const score = `${normalized.predictedScoreA}-${normalized.predictedScoreB}`;
    const teamALabel = match.actualResolvedTeamA || match.predictedResolvedTeamA || getPredictionDisplayTeamLabel(match, 'A');
    const teamBLabel = match.actualResolvedTeamB || match.predictedResolvedTeamB || getPredictionDisplayTeamLabel(match, 'B');
    const qualifier =
      match.stage !== 'group' && Number(normalized.predictedScoreA) === Number(normalized.predictedScoreB) && normalized.predictedQualifiedTeam
        ? `Clasifica ${normalized.predictedQualifiedTeam === 'teamA' ? escapeHtml(teamALabel) : escapeHtml(teamBLabel)}`
        : '';

    return `
      <article class="fixture-fifa-card prediction-review-card">
        <div class="match-meta prediction-review-meta">
          <span>${escapeHtml(stageLabel(match.stage))}</span>
          <span>${match.code ? escapeHtml(match.code) : ''}</span>
        </div>
        <div class="fixture-fifa-inner prediction-review-inner">
          <div class="fixture-fifa-team fixture-fifa-team-left">
            ${renderFlag(teamALabel)}
            <span class="fixture-fifa-team-name">${escapeHtml(teamALabel)}</span>
          </div>
          <div class="fixture-fifa-kickoff prediction-review-score">${escapeHtml(score)}</div>
          <div class="fixture-fifa-team fixture-fifa-team-right">
            <span class="fixture-fifa-team-name">${escapeHtml(teamBLabel)}</span>
            ${renderFlag(teamBLabel)}
          </div>
          <div class="fixture-fifa-meta prediction-review-foot">
            <span>${escapeHtml(getPredictionMatchLabel(match))}</span>
            ${qualifier ? `<span class="fixture-fifa-dot">·</span><span>${qualifier}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderPredictionReviewSheet(matches) {
  const stage = state.pendingPredictionStage;
  const stageMatches = stage ? matches.filter((match) => match.stage === stage && !match.locked) : [];
  const hidden = stage ? '' : 'hidden';
  const saving = state.savingPredictionStage === stage;

  return `
    <div class="sheet-shell ${hidden}" id="predictionReviewSheet" aria-hidden="${stage ? 'false' : 'true'}">
      <div class="sheet-overlay" data-close-prediction-review></div>
      <div class="sheet-card predictions-sheet-card">
        <div class="sheet-head">
          <div>
            <p class="eyebrow">Revision final</p>
            <h2>${stage ? escapeHtml(stageLabel(stage)) : 'Predicciones'}</h2>
          </div>
          <button class="sheet-close" type="button" aria-label="Cerrar" data-close-prediction-review>&times;</button>
        </div>
        <div class="sheet-scroll predictions-sheet-body">
          <div class="prediction-review-list">
            ${stageMatches.length ? renderPredictionReviewCards(stageMatches) : '<p class="empty-state">No hay predicciones listas para revisar.</p>'}
          </div>
          <div class="prediction-review-actions">
            <button class="secondary-button" type="button" data-close-prediction-review ${saving ? 'disabled' : ''}>Revisar</button>
            <button class="primary-button" type="button" data-confirm-stage-save="${escapeHtml(stage || '')}" ${saving || !stageMatches.length ? 'disabled' : ''}>${saving ? 'Guardando...' : 'Confirmar y guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMatch(match, groupTables, groupStatus, matchesByCode, compact, hideStageLabel = false, personalMode = false) {
  const prediction = personalMode ? getPredictionDraft(match) : match.prediction;
  const minimalPredictionCard = personalMode && !compact;
  const isInvalidPrediction = personalMode && state.invalidPredictionMatchIds.includes(String(match._id));
  const invalidReason = isInvalidPrediction ? getIncompletePredictionReason(match, prediction) : '';
  const metaStage = hideStageLabel
    ? ''
    : match.stage === 'group'
      ? `Grupo ${escapeHtml(match.group || '')}`
      : stageLabel(match.stage);
  const teamAContent = personalMode
    ? renderPersonalTeam(match, 'A', !minimalPredictionCard)
    : renderTeam(match.teamA, match.sourceA, groupTables, groupStatus, matchesByCode);
  const teamBContent = personalMode
    ? renderPersonalTeam(match, 'B', !minimalPredictionCard)
    : renderTeam(match.teamB, match.sourceB, groupTables, groupStatus, matchesByCode);
  const qualifierA = getPersonalResolvedTeam(match, 'A') || 'Equipo A';
  const qualifierB = getPersonalResolvedTeam(match, 'B') || 'Equipo B';
  const dateLabel = minimalPredictionCard
    ? new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(match.matchDate))
    : formatDate(match.matchDate);

  return `
    <article class="match-card ${compact ? 'match-row-card' : 'glass-card'} ${minimalPredictionCard ? 'prediction-minimal-card' : ''} ${isInvalidPrediction ? 'prediction-card-incomplete' : ''}" data-match-id="${escapeHtml(match._id)}">
      <div class="match-meta ${minimalPredictionCard ? 'prediction-minimal-meta' : ''}">
        ${metaStage ? `<span>${metaStage}</span>` : ''}
        <span>${dateLabel}</span>
      </div>
      <div class="teams-row">
        ${teamAContent}
        <div class="score-chip">${match.resultSet ? `${match.scoreA}<span>-</span>${match.scoreB}` : 'VS'}</div>
        ${teamBContent}
      </div>
      ${minimalPredictionCard ? '' : `<p class="venue">${escapeHtml(match.venue || '')}</p>`}
      ${compact ? '' : `
      <div class="prediction-form ${minimalPredictionCard ? 'prediction-form-minimal' : ''} ${minimalPredictionCard && match.stage !== 'group' ? 'prediction-form-with-qualifier' : ''}">
          <input name="predictedScoreA" data-prediction-input data-stage="${escapeHtml(match.stage)}" data-match-id="${escapeHtml(match._id)}" data-field="predictedScoreA" type="number" min="0" step="1" placeholder="A" value="${prediction?.predictedScoreA ?? ''}" ${match.locked ? 'disabled' : ''} />
          <input name="predictedScoreB" data-prediction-input data-stage="${escapeHtml(match.stage)}" data-match-id="${escapeHtml(match._id)}" data-field="predictedScoreB" type="number" min="0" step="1" placeholder="B" value="${prediction?.predictedScoreB ?? ''}" ${match.locked ? 'disabled' : ''} />
          ${match.stage === 'group' ? '' : `
            <div class="prediction-qualified-wrap ${isPredictionTie(match, prediction) ? '' : 'hidden'}" data-prediction-qualified-wrap>
              <select name="predictedQualifiedTeam" data-prediction-input data-prediction-qualified-select data-stage="${escapeHtml(match.stage)}" data-match-id="${escapeHtml(match._id)}" data-field="predictedQualifiedTeam" ${match.locked ? 'disabled' : ''}>
              <option value="" ${!prediction?.predictedQualifiedTeam ? 'selected' : ''}>Seleccione el equipo que clasifica</option>
              <option value="teamA" ${prediction?.predictedQualifiedTeam === 'teamA' ? 'selected' : ''}>${escapeHtml(qualifierA)}</option>
              <option value="teamB" ${prediction?.predictedQualifiedTeam === 'teamB' ? 'selected' : ''}>${escapeHtml(qualifierB)}</option>
              </select>
            </div>
          `}
        </div>
        ${isInvalidPrediction ? `<p class="prediction-inline-warning">${escapeHtml(invalidReason)}</p>` : ''}
        ${personalMode ? '' : renderAdminResultForm(match)}
      `}
    </article>
  `;
}

function renderFixtureTeamsRow(match) {
  const centerValue = match.resultSet ? `${match.scoreA}-${match.scoreB}` : formatFixtureTime(match.matchDate);
  const teamALabel = match.actualResolvedTeamA || (match.sourceA ? prettySourceLabel(match.sourceA) : match.teamA);
  const teamBLabel = match.actualResolvedTeamB || (match.sourceB ? prettySourceLabel(match.sourceB) : match.teamB);
  const metaParts = [
    fixtureStageLabel(match.stage),
    match.stage === 'group' && match.group ? `Grupo ${escapeHtml(match.group)}` : '',
    escapeHtml(match.venue || '')
  ].filter(Boolean);

  return `
    <div class="fixture-fifa-inner">
      <div class="fixture-fifa-team fixture-fifa-team-left">
        ${renderFlag(teamALabel)}
        <span class="fixture-fifa-team-name">${escapeHtml(teamALabel)}</span>
      </div>
      <div class="fixture-fifa-kickoff">${escapeHtml(centerValue)}</div>
      <div class="fixture-fifa-team fixture-fifa-team-right">
        <span class="fixture-fifa-team-name">${escapeHtml(teamBLabel)}</span>
        ${renderFlag(teamBLabel)}
      </div>
      <div class="fixture-fifa-meta">
        ${metaParts.join(' <span class="fixture-fifa-dot">·</span> ')}
      </div>
    </div>
  `;
}

function renderFixtureDaySection(dateKey, dayMatches) {
  return `
    <section class="fixture-day-group" data-date-key="${escapeHtml(dateKey)}">
      <header class="fixture-day-header">
        <h3>${escapeHtml(formatFixtureDay(dayMatches[0].matchDate))}</h3>
        <button class="fixture-day-link" type="button" data-switch-view="standings">Ver grupos</button>
      </header>
      <div class="fixture-day-list">
        ${dayMatches.map((match) => `
          <article class="fixture-fifa-card" data-match-id="${escapeHtml(match._id)}">
            ${renderFixtureTeamsRow(match)}
            ${renderAdminResultForm(match)}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMatchesSchedule(matches) {
  const sortedMatches = [...matches].sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
  const groupedMatches = new Map();

  sortedMatches.forEach((match) => {
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(match.matchDate));
    if (!groupedMatches.has(dateKey)) groupedMatches.set(dateKey, []);
    groupedMatches.get(dateKey).push(match);
  });

  if (!sortedMatches.length) {
    return '<p class="empty-state fixture-empty-state">No hay partidos cargados.</p>';
  }

  return `
    <div class="fixture-schedule">
      ${Array.from(groupedMatches.entries()).map(([dateKey, dayMatches]) => renderFixtureDaySection(dateKey, dayMatches)).join('')}
    </div>
  `;
}

function renderStandings(groupTables) {
  return Object.entries(groupTables).map(([group, rows]) => `
    <section class="standings-group">
      <div class="standings-header">
        <div class="standings-group-title">Grupo ${escapeHtml(group)}</div>
        <div class="standings-columns">
          <span>PJ</span><span>G</span><span>E</span><span>P</span><span>GF</span><span>GC</span><span>DG</span><strong>Pts</strong>
        </div>
      </div>
      ${rows.map((row, index) => `
        <div class="standings-row ${index < 2 ? 'qualified' : ''}">
          <div class="standings-team">
            <span class="rank">${index + 1}</span>
            <span class="standings-indicator"></span>
            ${renderFlag(row.team)}
            <span>${escapeHtml(row.team)}</span>
          </div>
          <div class="standings-columns">
            <span>${row.played}</span>
            <span>${row.wins}</span>
            <span>${row.draws}</span>
            <span>${row.losses}</span>
            <span>${row.goalsFor}</span>
            <span>${row.goalsAgainst}</span>
            <span>${row.diff}</span>
            <strong>${row.points}</strong>
          </div>
        </div>
      `).join('')}
    </section>
  `).join('');
}

// ── BRACKET FIFA STYLE ──────────────────────────────────────────────────────

function renderPredictionsSections(matches, groupTables, groupStatus, matchesByCode) {
  const stageOrder = ['group', 'roundOf32', 'roundOf16', 'quarterfinal', 'semifinal', 'thirdPlace', 'final'];
  const grouped = new Map();

  matches.forEach((match) => {
    const stage = match.stage || 'other';
    if (!grouped.has(stage)) grouped.set(stage, []);
    grouped.get(stage).push(match);
  });

  const availableStages = stageOrder.filter((stage) => grouped.has(stage));

  return `
    ${availableStages.map((stage) => {
      const stageMatches = grouped.get(stage) || [];
      const summary = getStagePredictionState(stageMatches);

      return `
        <section class="prediction-stage" data-stage-section="${escapeHtml(stage)}">
          <header class="prediction-stage-header">
            <h3>${escapeHtml(stageLabel(stage))}</h3>
            <span>${stageMatches.length} partido${stageMatches.length === 1 ? '' : 's'}</span>
          </header>
          ${renderPredictionProgress(stageMatches)}
          <div class="prediction-grid">
            ${stageMatches.map((match) => renderMatch(match, groupTables, groupStatus, matchesByCode, false, false, true)).join('')}
          </div>
          <div class="prediction-stage-actions">
            <button class="primary-button prediction-stage-save" type="button" data-stage-save-trigger="${escapeHtml(stage)}" ${summary.saved ? 'disabled' : ''}>
              ${summary.saved ? 'Predicciones guardadas' : 'Guardar predicciones de esta fase'}
            </button>
          </div>
        </section>
      `;
    }).join('')}
  `;
}

function renderPredictionStageNav(matches) {
  const stageOrder = ['group', 'roundOf32', 'roundOf16', 'quarterfinal', 'semifinal', 'thirdPlace', 'final'];
  const availableStages = stageOrder.filter((stage) => matches.some((match) => (match.stage || 'other') === stage));
  const activeStage = state.activePredictionStage || availableStages[0] || '';

  return `
    <div class="prediction-stage-nav" aria-label="Acceso rapido a fases">
      ${availableStages.map((stage) => `
        <button class="prediction-stage-chip ${stage === activeStage ? 'is-active' : ''}" type="button" data-jump-stage="${escapeHtml(stage)}">${escapeHtml(stageNavLabel(stage))}</button>
      `).join('')}
    </div>
  `;
}

function renderMyPredictionsTable(predictions) {
  if (!predictions.length) {
    return '<p class="empty-state">Aun no tienes predicciones guardadas.</p>';
  }

  const stageOrder = {
    group: 1,
    roundOf32: 2,
    roundOf16: 3,
    quarterfinal: 4,
    semifinal: 5,
    thirdPlace: 6,
    final: 7
  };

  const sorted = [...predictions].sort((a, b) => {
    const rankDiff = (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.matchDate) - new Date(b.matchDate);
  });

  return `
    <div class="my-predictions-table">
      <div class="my-predictions-head">
        <span>Partido</span>
        <span>Mi pronostico</span>
        <span>Pts</span>
        <span>Estado</span>
      </div>
      ${sorted.map((item) => {
        const label = item.code ? `${item.code} · ${stageLabel(item.stage)}` : stageLabel(item.stage);
        const score = `${item.predictedScoreA}-${item.predictedScoreB}`;
        const status = item.scored ? 'Calificada' : 'Pendiente';

        return `
          <div class="my-predictions-row">
            <div class="my-predictions-match">
              <strong>${escapeHtml(item.teamA)} vs ${escapeHtml(item.teamB)}</strong>
              <span>${escapeHtml(label)}</span>
            </div>
            <div class="my-predictions-score">${escapeHtml(score)}</div>
            <div class="my-predictions-points">${Number(item.points || 0)}</div>
            <div class="my-predictions-status">${escapeHtml(status)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMyPredictionsCards(predictions) {
  if (!predictions.length) {
    return '<p class="empty-state">Aun no tienes predicciones guardadas.</p>';
  }

  const stageOrder = {
    group: 1,
    roundOf32: 2,
    roundOf16: 3,
    quarterfinal: 4,
    semifinal: 5,
    thirdPlace: 6,
    final: 7
  };

  const sorted = [...predictions].sort((a, b) => {
    const rankDiff = (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.matchDate) - new Date(b.matchDate);
  });

  return `
    <div class="my-predictions-cards">
      ${sorted.map((item) => {
        const label = item.code ? `${item.code} · ${stageLabel(item.stage)}` : stageLabel(item.stage);
        const score = `${item.predictedScoreA}-${item.predictedScoreB}`;
        const status = item.scored ? 'Calificada' : 'Pendiente';
        const match = state.matches.find((entry) => String(entry._id) === String(item.matchId));
        const teamALabel = match
          ? (match.actualResolvedTeamA || match.predictedResolvedTeamA || getPredictionDisplayTeamLabel(match, 'A'))
          : (item.teamA && item.teamA !== 'Por definir' ? item.teamA : getPredictionDisplayTeamLabel(item, 'A'));
        const teamBLabel = match
          ? (match.actualResolvedTeamB || match.predictedResolvedTeamB || getPredictionDisplayTeamLabel(match, 'B'))
          : (item.teamB && item.teamB !== 'Por definir' ? item.teamB : getPredictionDisplayTeamLabel(item, 'B'));
        const qualifier =
          item.stage !== 'group' && Number(item.predictedScoreA) === Number(item.predictedScoreB) && item.predictedQualifiedTeam
            ? `Clasifica ${item.predictedQualifiedTeam === 'teamA' ? teamALabel : teamBLabel}`
            : '';

        return `
          <article class="fixture-fifa-card my-prediction-card">
            <div class="match-meta my-prediction-meta">
              <span>${escapeHtml(label)}</span>
              <span>${escapeHtml(status)}</span>
            </div>
            <div class="fixture-fifa-inner my-prediction-inner">
              <div class="fixture-fifa-team fixture-fifa-team-left">
                ${renderFlag(teamALabel)}
                <span class="fixture-fifa-team-name">${escapeHtml(teamALabel)}</span>
              </div>
              <div class="fixture-fifa-kickoff my-prediction-score">${escapeHtml(score)}</div>
              <div class="fixture-fifa-team fixture-fifa-team-right">
                <span class="fixture-fifa-team-name">${escapeHtml(teamBLabel)}</span>
                ${renderFlag(teamBLabel)}
              </div>
              <div class="fixture-fifa-meta my-prediction-foot">
                <span>Pts ${Number(item.points || 0)}</span>
                ${qualifier ? `<span class="fixture-fifa-dot">·</span><span>${escapeHtml(qualifier)}</span>` : ''}
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderMyPredictionsSummary(predictions) {
  const total = predictions.length;
  const scored = predictions.filter((item) => item.scored).length;
  const pending = total - scored;
  const totalPoints = predictions.reduce((sum, item) => sum + Number(item.points || 0), 0);
  const lastPrediction = total
    ? [...predictions].sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))[0]
    : null;

  return `
    <button class="my-predictions-summary" type="button" data-open-my-predictions aria-haspopup="dialog">
      <div class="my-predictions-summary-main">
        <strong>Mis predicciones</strong>
        <span>${total ? `${total} guardada${total === 1 ? '' : 's'}` : 'Aun no has guardado predicciones'}</span>
      </div>
      <div class="my-predictions-summary-stats">
        <span><strong>${total}</strong> partidos</span>
        <span><strong>${pending}</strong> pendientes</span>
        <span><strong>${totalPoints}</strong> pts</span>
      </div>
      <div class="my-predictions-summary-foot">
        <span>${lastPrediction ? `Ultima: ${escapeHtml(lastPrediction.teamA)} vs ${escapeHtml(lastPrediction.teamB)}` : 'Toca aqui para ver el detalle cuando quieras'}</span>
        <span class="my-predictions-summary-link">Ver detalle</span>
      </div>
    </button>
  `;
}

function renderMyPredictionsModal(predictions) {
  return `
    <div class="sheet-shell hidden" id="myPredictionsModal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="myPredictionsTitle">
      <div class="sheet-overlay" data-close-my-predictions></div>
      <div class="sheet-card predictions-sheet-card">
        <div class="sheet-head">
          <div>
            <p class="eyebrow">Predicciones guardadas</p>
            <h3 id="myPredictionsTitle">Mis predicciones</h3>
          </div>
          <button class="sheet-close" type="button" aria-label="Cerrar" data-close-my-predictions>&times;</button>
        </div>
        <div class="sheet-scroll predictions-sheet-body">
          ${renderMyPredictionsCards(predictions)}
        </div>
      </div>
    </div>
  `;
}

const bracketMatchLabels = {
  'R32-1': 'P73',
  'R32-2': 'P75',
  'R32-3': 'P74',
  'R32-4': 'P77',
  'R32-5': 'P83',
  'R32-6': 'P84',
  'R32-7': 'P81',
  'R32-8': 'P82',

  'R32-9': 'P76',
  'R32-10': 'P78',
  'R32-11': 'P79',
  'R32-12': 'P80',
  'R32-13': 'P86',
  'R32-14': 'P88',
  'R32-15': 'P85',
  'R32-16': 'P87',

  'R16-1': 'P89',
  'R16-2': 'P90',
  'R16-3': 'P91',
  'R16-4': 'P92',
  'R16-5': 'P93',
  'R16-6': 'P94',
  'R16-7': 'P95',
  'R16-8': 'P96',

  'QF-1': 'P97',
  'QF-2': 'P98',
  'QF-3': 'P99',
  'QF-4': 'P100',

  'SF-1': 'P101',
  'SF-2': 'P102',

  'TP-1': 'P103',
  'F-1': 'P104'
};

function getBracketLabel(match) {
  return bracketMatchLabels[match.code] || match.code || '';
}

function formatBracketDate(value) {
  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatBracketTime(value) {
  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function bracketStageType(stage) {
  if (stage.startsWith('roundOf32')) return 'roundOf32';
  if (stage.startsWith('roundOf16')) return 'roundOf16';
  if (stage.startsWith('quarterfinal')) return 'quarterfinal';
  if (stage.startsWith('semifinal')) return 'semifinal';
  if (stage === 'center') return 'center';

  return stage;
}

function bracketSlot(stage, index) {
  const type = bracketStageType(stage);

  const slots = {
    roundOf32: {
      positions: [1, 3, 5, 7, 9, 11, 13, 15],
      span: 2
    },
    roundOf16: {
      positions: [2, 6, 10, 14],
      span: 2
    },
    quarterfinal: {
      positions: [4, 12],
      span: 2
    },
    semifinal: {
      positions: [9],
      span: 3
    },
    center: {
      positions: [6, 12],
      span: 3
    }
  };

  const cfg = slots[type] || { positions: [1], span: 2 };

  return {
    row: cfg.positions[Math.min(index, cfg.positions.length - 1)],
    span: cfg.span
  };
}

function renderBracketCard(match, groupTables, groupStatus, matchesByCode) {
  const teamA = match.actualResolvedTeamA || (
    match.sourceA
      ? resolveSource(match.sourceA, groupTables, groupStatus, matchesByCode)
      : match.teamA
  );

  const teamB = match.actualResolvedTeamB || (
    match.sourceB
      ? resolveSource(match.sourceB, groupTables, groupStatus, matchesByCode)
      : match.teamB
  );

  const labelA = teamA || prettySourceLabel(match.sourceA || '') || 'Por definir';
  const labelB = teamB || prettySourceLabel(match.sourceB || '') || 'Por definir';

  const winnerA = match.resultSet && Number(match.scoreA) > Number(match.scoreB);
  const winnerB = match.resultSet && Number(match.scoreB) > Number(match.scoreA);

  return `
    <article class="bracket-card" data-match-id="${escapeHtml(match._id)}">
      <a class="bracket-match-label" href="javascript:void(0)">
        ${escapeHtml(getBracketLabel(match))}
      </a>

      <div class="bracket-match-box">
        <div class="bracket-date-row">
          <span>${formatBracketDate(match.matchDate)}</span>
          <span>${formatBracketTime(match.matchDate)}</span>
        </div>

        <div class="bracket-team-row ${winnerA ? 'winner' : ''}">
          ${teamA ? renderFlag(teamA) : '<span class="bracket-flag-placeholder"></span>'}
          <span class="bracket-team-name">${escapeHtml(labelA)}</span>
          ${match.resultSet ? `<strong class="bracket-score">${match.scoreA}</strong>` : ''}
        </div>

        <div class="bracket-team-row ${winnerB ? 'winner' : ''}">
          ${teamB ? renderFlag(teamB) : '<span class="bracket-flag-placeholder"></span>'}
          <span class="bracket-team-name">${escapeHtml(labelB)}</span>
          ${match.resultSet ? `<strong class="bracket-score">${match.scoreB}</strong>` : ''}
        </div>
      </div>
    </article>
  `;
}

function renderBracketColumn(title, stage, stageMatches, groupTables, groupStatus, matchesByCode) {
  if (!stageMatches.length) return '';

  return `
    <section class="bracket-column" data-stage="${stage}">
      <div class="bracket-column-body">
        ${stageMatches.map((match, index) => {
          const slot = bracketSlot(stage, index);

          return `
            <div
              class="bracket-node"
              style="grid-row: ${slot.row} / span ${slot.span};"
            >
              ${renderBracketCard(match, groupTables, groupStatus, matchesByCode)}
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderBracketCenterColumn(semifinals, centerMatches, groupTables, groupStatus, matchesByCode) {
  const leftSemi = orderByCode(semifinals, ['SF-1'])[0];
  const rightSemi = orderByCode(semifinals, ['SF-2'])[0];
  const finalMatch = centerMatches[0] || null;
  const thirdPlaceMatch = centerMatches[1] || null;

  return `
    <section class="bracket-column bracket-center-column" data-stage="center-cluster">
      <div class="bracket-center-body">
        ${finalMatch ? `
          <div class="bracket-center-node final-node">
            ${renderBracketCard(finalMatch, groupTables, groupStatus, matchesByCode)}
          </div>
        ` : ''}
        ${leftSemi ? `
          <div class="bracket-center-node semifinal-node left-semi">
            ${renderBracketCard(leftSemi, groupTables, groupStatus, matchesByCode)}
          </div>
        ` : ''}
        ${rightSemi ? `
          <div class="bracket-center-node semifinal-node right-semi">
            ${renderBracketCard(rightSemi, groupTables, groupStatus, matchesByCode)}
          </div>
        ` : ''}
        ${thirdPlaceMatch ? `
          <div class="bracket-center-node third-place-node">
            ${renderBracketCard(thirdPlaceMatch, groupTables, groupStatus, matchesByCode)}
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

function renderBracketLines() {
  return `
    <svg class="bracket-lines" viewBox="0 0 1064 704" preserveAspectRatio="none" aria-hidden="true">
      <g class="bracket-line-group">
        <path d="M97 44 H124 V88 H151" />
        <path d="M97 132 H124 V88 H151" />
        <path d="M97 220 H124 V264 H151" />
        <path d="M97 308 H124 V264 H151" />
        <path d="M97 396 H124 V440 H151" />
        <path d="M97 484 H124 V440 H151" />
        <path d="M97 572 H124 V616 H151" />
        <path d="M97 660 H124 V616 H151" />

        <path d="M235 88 H262 V176 H273" />
        <path d="M235 264 H262 V176 H273" />
        <path d="M235 440 H262 V528 H273" />
        <path d="M235 616 H262 V528 H273" />

        <path d="M357 176 H374 V396 H390" />
        <path d="M357 528 H374 V396 H390" />
        <path d="M482 396 H494 V286 H506" />
        <path d="M482 396 H494 V550 H506" />

        <path d="M964 44 H937 V88 H910" />
        <path d="M964 132 H937 V88 H910" />
        <path d="M964 220 H937 V264 H910" />
        <path d="M964 308 H937 V264 H910" />
        <path d="M964 396 H937 V440 H910" />
        <path d="M964 484 H937 V440 H910" />
        <path d="M964 572 H937 V616 H910" />
        <path d="M964 660 H937 V616 H910" />

        <path d="M826 88 H799 V176 H788" />
        <path d="M826 264 H799 V176 H788" />
        <path d="M826 440 H799 V528 H788" />
        <path d="M826 616 H799 V528 H788" />

        <path d="M704 176 H687 V396 H674" />
        <path d="M704 528 H687 V396 H674" />
        <path d="M562 396 H548 V286 H570" />
        <path d="M562 396 H548 V550 H570" />
      </g>
    </svg>
  `;
}

function renderDashboardStats(matches, myPredictions) {
  const totalMatches = matches.length;
  const openPredictions = matches.filter((match) => !match.locked).length;
  const savedPredictions = myPredictions.length;

  return `
    <article class="stat-card">
      <span>${totalMatches}</span>
      <p>Partidos</p>
    </article>
    <article class="stat-card">
      <span>${openPredictions}</span>
      <p>Por predecir</p>
    </article>
    <article class="stat-card">
      <span>${savedPredictions}</span>
      <p>Mis picks</p>
    </article>
  `;
}

function renderNextMatchCard(matches) {
  const nextMatch = [...matches]
    .filter((match) => new Date(match.matchDate) > new Date())
    .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))[0];

  if (!nextMatch) return '';

  const kickoff = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(nextMatch.matchDate));

  const dateMeta = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(nextMatch.matchDate));

  const groupMeta = nextMatch.stage === 'group'
    ? `Grupo ${nextMatch.group || ''}`
    : stageLabel(nextMatch.stage);

  return `
    <section class="next-match-card">
      <div class="next-match-badge">
        <span class="next-match-pulse"></span>
        Proximo partido
      </div>
      <div class="next-match-layout">
        <div class="next-match-team">
          ${renderFlag(nextMatch.teamA)}
          <span>${escapeHtml(nextMatch.teamA)}</span>
        </div>
        <div class="next-match-center">
          <strong>${escapeHtml(kickoff)}</strong>
          <span>${escapeHtml(dateMeta)} · ${escapeHtml(groupMeta)}</span>
        </div>
        <div class="next-match-team">
          ${renderFlag(nextMatch.teamB)}
          <span>${escapeHtml(nextMatch.teamB)}</span>
        </div>
      </div>
    </section>
  `;
}

function orderByCode(matches, codes) {
  const map = new Map(matches.map((match) => [match.code, match]));

  return codes
    .map((code) => map.get(code))
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────

function renderFixture(matches, myPredictions = []) {
  const dashboardNextMatch = document.getElementById('dashboardNextMatch');
  const groupsBoard      = document.getElementById('groupsBoard');
  const matchesBoard     = document.getElementById('matchesBoard');
  const predictionsBoard = document.getElementById('predictionsBoard');
  const knockoutBoard    = document.getElementById('knockoutBoard');
  if (!groupsBoard || !matchesBoard || !predictionsBoard || !knockoutBoard) return;

  const { tables: groupTables, groupStatus } = computeGroupTables(matches);
  buildClientPredictionResolution(matches);
  const matchesByCode = new Map(
    matches
      .filter((match) => match.code)
      .map((match) => [String(match.code).toUpperCase(), match])
  );

  const predictionMatches = matches.filter((m) => !m.locked);
  const knockoutMatches = matches.filter((m) => m.stage !== 'group');
  const roundOf32       = knockoutMatches.filter((m) => m.stage === 'roundOf32');
  const roundOf16       = knockoutMatches.filter((m) => m.stage === 'roundOf16');
  const quarterfinals   = knockoutMatches.filter((m) => m.stage === 'quarterfinal');
  const semifinals      = knockoutMatches.filter((m) => m.stage === 'semifinal');
  const thirdPlace      = knockoutMatches.filter((m) => m.stage === 'thirdPlace');
  const finals          = knockoutMatches.filter((m) => m.stage === 'final');

  if (dashboardNextMatch) {
    dashboardNextMatch.innerHTML = renderNextMatchCard(matches);
  }

  groupsBoard.innerHTML = `
    <div class="standings-grid">${renderStandings(groupTables)}</div>
  `;

  matchesBoard.innerHTML = `
    <section class="screen-section">
      ${renderMatchesSchedule(matches)}
    </section>
  `;

  predictionsBoard.innerHTML = `
    <section class="screen-section">
      <section class="my-predictions-stage">
        ${renderMyPredictionsSummary(myPredictions)}
      </section>
      ${renderPredictionStageNav(predictionMatches)}
      <div class="prediction-sections">
        ${predictionMatches.length
          ? renderPredictionsSections(predictionMatches, groupTables, groupStatus, matchesByCode)
          : '<p class="empty-state">No hay predicciones abiertas.</p>'}
      </div>
      ${renderMyPredictionsModal(myPredictions)}
      ${renderPredictionReviewSheet(predictionMatches)}
    </section>
  `;

  const leftRoundOf32 = orderByCode(roundOf32, [
    'R32-3',
    'R32-4',
    'R32-1',
    'R32-2',
    'R32-5',
    'R32-6',
    'R32-7',
    'R32-8'
  ]);

  const rightRoundOf32 = orderByCode(roundOf32, [
    'R32-9',
    'R32-10',
    'R32-11',
    'R32-12',
    'R32-13',
    'R32-14',
    'R32-15',
    'R32-16'
  ]);

  const leftRoundOf16 = orderByCode(roundOf16, [
    'R16-1',
    'R16-2',
    'R16-5',
    'R16-6'
  ]);

  const rightRoundOf16 = orderByCode(roundOf16, [
    'R16-3',
    'R16-4',
    'R16-7',
    'R16-8'
  ]);

  const leftQuarterfinals = orderByCode(quarterfinals, [
    'QF-1',
    'QF-2'
  ]);

  const rightQuarterfinals = orderByCode(quarterfinals, [
    'QF-3',
    'QF-4'
  ]);

  const centerMatches = [
    ...orderByCode(finals, ['F-1']),
    ...orderByCode(thirdPlace, ['TP-1'])
  ];

  knockoutBoard.innerHTML = `
    <section class="screen-section bracket-panel">
      <div class="bracket-canvas">
        <div class="bracket-title-row">
          <span>Dieciseisavos de final</span>
          <span>Octavos de final</span>
          <span>Cuartos de final</span>
          <span class="bracket-center-title">Semifinal · Final · Semifinal</span>
          <span>Cuartos de final</span>
          <span>Octavos de final</span>
          <span>Dieciseisavos de final</span>
        </div>

        <div class="bracket-tree">
          ${renderBracketLines()}

          ${renderBracketColumn('Dieciseisavos', 'roundOf32-left', leftRoundOf32, groupTables, groupStatus, matchesByCode)}
          ${renderBracketColumn('Octavos', 'roundOf16-left', leftRoundOf16, groupTables, groupStatus, matchesByCode)}
          ${renderBracketColumn('Cuartos', 'quarterfinal-left', leftQuarterfinals, groupTables, groupStatus, matchesByCode)}
          ${renderBracketCenterColumn(semifinals, centerMatches, groupTables, groupStatus, matchesByCode)}
          ${renderBracketColumn('Cuartos', 'quarterfinal-right', rightQuarterfinals, groupTables, groupStatus, matchesByCode)}
          ${renderBracketColumn('Octavos', 'roundOf16-right', rightRoundOf16, groupTables, groupStatus, matchesByCode)}
          ${renderBracketColumn('Dieciseisavos', 'roundOf32-right', rightRoundOf32, groupTables, groupStatus, matchesByCode)}
        </div>
      </div>
    </section>
  `;

  groupsBoard.classList.toggle('hidden',      state.activeView !== 'standings');
  matchesBoard.classList.toggle('hidden',     state.activeView !== 'matches');
  predictionsBoard.classList.toggle('hidden', state.activeView !== 'predictions');
  knockoutBoard.classList.toggle('hidden',    state.activeView !== 'bracket');
}

function setupSharedLayout() {
  const userLabel = document.getElementById('currentUser');
  const userAvatar = document.getElementById('userAvatar');
  if (userLabel) userLabel.textContent = state.user?.username || '';
  if (userAvatar) userAvatar.textContent = getUserInitials(state.user?.username || '');
  updateAdminResetVisibility();
  ensureScoringModal();
  ensurePredictionsHelpModal();
  initSharedShell();
}

function updateAdminResetVisibility() {
  document.querySelectorAll('[data-admin-reset-pruebas]').forEach((button) => {
    button.classList.toggle('hidden', !state.user?.isAdmin);
  });
}

function getUserInitials(username) {
  return String(username || 'PM')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || 'PM';
}

function openMoreSheet() {
  const sheet = document.getElementById('moreSheet');
  if (!sheet) return;
  sheet.classList.remove('hidden');
  sheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeMoreSheet() {
  const sheet = document.getElementById('moreSheet');
  if (!sheet) return;
  sheet.classList.add('hidden');
  sheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function updateBottomNavState() {
  document.querySelectorAll('[data-bottom-nav]').forEach((item) => item.classList.remove('is-active'));

  const navKey = document.getElementById('leaderboardList')
    ? 'leaderboard'
    : 'more';

  const activeItem = document.querySelector(`[data-bottom-nav="${navKey}"]`);
  if (activeItem) activeItem.classList.add('is-active');
}

function initSharedShell() {
  if (document.body.dataset.sharedShellReady === 'true') return;
  document.body.dataset.sharedShellReady = 'true';

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-scoring]')) {
      closeMoreSheet();
      openScoringModal();
      return;
    }

    if (event.target.closest('[data-open-predictions-help]')) {
      closeMoreSheet();
      openPredictionsHelpModal();
      return;
    }

    if (event.target.closest('[data-close-scoring]')) {
      closeScoringModal();
      return;
    }

    if (event.target.closest('[data-close-predictions-help]')) {
      closePredictionsHelpModal();
      return;
    }

    if (event.target.closest('[data-open-more]')) {
      openMoreSheet();
      return;
    }

    if (event.target.closest('[data-close-more]')) {
      closeMoreSheet();
      return;
    }

    if (event.target.closest('[data-logout]')) {
      clearSession();
      window.location.href = 'index.html';
      return;
    }

    if (event.target.closest('[data-admin-reset-pruebas]')) {
      if (!state.user?.isAdmin) return;
      const confirmed = window.confirm('Esto borrara resultados reales, predicciones y puntos. El fixture se mantendra. Continuar?');
      if (!confirmed) return;
      closeMoreSheet();
      apiFetch('/admin/reset-pruebas', { method: 'POST' })
        .then(async () => {
          toast('Datos de prueba reiniciados.');
          await loadMatches();
          if (document.getElementById('leaderboardList')) {
            const list = document.getElementById('leaderboardList');
            const emptyState = document.getElementById('emptyLeaderboard');
            if (list && emptyState) await loadLeaderboard(list, emptyState, { silent: true });
          }
        })
        .catch((error) => {
          toast(error.message || 'No se pudo reiniciar la informacion.', 'error');
        });
      return;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeScoringModal();
      closePredictionsHelpModal();
      closeMoreSheet();
    }
  });
}

function renderScoringModal() {
  return `
    <div class="modal-shell hidden" id="scoringModal" role="dialog" aria-modal="true" aria-labelledby="scoringModalTitle">
      <div class="modal-backdrop" data-close-scoring></div>
      <div class="modal-card scoring-modal-card">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Sistema de calificacion</p>
            <h3 id="scoringModalTitle">Como se calculan tus puntos</h3>
          </div>
          <button class="modal-close" type="button" aria-label="Cerrar" data-close-scoring>&times;</button>
        </div>
        <div class="modal-body scoring-modal-body">
          <section class="scoring-block">
            <h4>Puntos por partido</h4>
            <ul class="scoring-list">
              <li><strong>3 puntos</strong> por acertar el marcador exacto.</li>
              <li><strong>1 punto</strong> por acertar ganador o empate sin clavar el marcador.</li>
              <li><strong>0 puntos</strong> si el resultado no coincide.</li>
            </ul>
          </section>
          <section class="scoring-block">
            <h4>Bonos del torneo</h4>
            <ul class="scoring-list">
              <li><strong>Grupos:</strong> 2 puntos por cada clasificado correcto a octavos y 1 punto extra si tambien aciertas su posicion exacta.</li>
              <li><strong>Cruces:</strong> se suman bonos por ubicar equipos correctos en rondas avanzadas.</li>
              <li><strong>Campeon:</strong> acertar el ganador final suma un bono extra.</li>
            </ul>
            <div class="scoring-chip-row">
              <span class="scoring-chip">Octavos: 2</span>
              <span class="scoring-chip">Cuartos: 3</span>
              <span class="scoring-chip">Semifinal: 5</span>
              <span class="scoring-chip">Final: 8</span>
              <span class="scoring-chip">Tercer puesto: 2</span>
              <span class="scoring-chip">Campeon: 12</span>
            </div>
          </section>
          <section class="scoring-block">
            <h4>Cuando se actualiza</h4>
            <p>Tu puntaje se recalcula cuando el admin carga resultados oficiales. La tabla general acumula partidos mas bonos.</p>
          </section>
        </div>
      </div>
    </div>
  `;
}

function renderPredictionsHelpModal() {
  return `
    <div class="modal-shell hidden" id="predictionsHelpModal" role="dialog" aria-modal="true" aria-labelledby="predictionsHelpTitle">
      <div class="modal-backdrop" data-close-predictions-help></div>
      <div class="modal-card scoring-modal-card">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Guia rapida</p>
            <h3 id="predictionsHelpTitle">Como llenar tus predicciones</h3>
          </div>
          <button class="modal-close" type="button" aria-label="Cerrar" data-close-predictions-help>&times;</button>
        </div>
        <div class="modal-body scoring-modal-body">
          <section class="help-step">
            <div class="help-step-head">
              <h4>1. Fase de grupos</h4>
              <p>Empieza por los partidos de grupos y escribe tu marcador normal.</p>
            </div>
            <img class="help-step-image" src="assets/help/step-1-group.png" alt="Ejemplo de prediccion en fase de grupos" loading="lazy" />
          </section>
          <section class="help-step">
            <div class="help-step-head">
              <h4>2. Cruces de eliminatoria</h4>
              <p>En 16avos y fases siguientes, si empatan, selecciona el equipo que clasifica.</p>
            </div>
            <img class="help-step-image" src="assets/help/step-2-round-of-16.png" alt="Ejemplo de prediccion en dieciseisavos de final" loading="lazy" />
          </section>
          <section class="help-step">
            <div class="help-step-head">
              <h4>3. Revisa antes de guardar</h4>
              <p>Antes de confirmar, revisa el resumen final con todos tus cruces y marcadores.</p>
            </div>
            <img class="help-step-image" src="assets/help/step-3-review.png" alt="Ejemplo de revison final antes de guardar" loading="lazy" />
          </section>
        </div>
      </div>
    </div>
  `;
}

function ensureScoringModal() {
  if (document.getElementById('scoringModal')) return;
  document.body.insertAdjacentHTML('beforeend', renderScoringModal());
}

function ensurePredictionsHelpModal() {
  if (document.getElementById('predictionsHelpModal')) return;
  document.body.insertAdjacentHTML('beforeend', renderPredictionsHelpModal());
}

function openScoringModal() {
  const modal = document.getElementById('scoringModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeScoringModal() {
  const modal = document.getElementById('scoringModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function openPredictionsHelpModal() {
  const modal = document.getElementById('predictionsHelpModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closePredictionsHelpModal() {
  const modal = document.getElementById('predictionsHelpModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function openMyPredictionsModal() {
  const modal = document.getElementById('myPredictionsModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeMyPredictionsModal() {
  const modal = document.getElementById('myPredictionsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function closePredictionReviewSheet() {
  state.pendingPredictionStage = null;
  state.savingPredictionStage = null;
  document.body.classList.remove('modal-open');
  renderFixture(state.matches, state.myPredictions);
}

function openPredictionReviewSheet(stage) {
  state.pendingPredictionStage = stage;
  document.body.classList.add('modal-open');
  renderFixture(state.matches, state.myPredictions);
}

function refreshPredictionStageSection(stage) {
  const section = document.querySelector(`[data-stage-section="${stage}"]`);
  if (!section) return;

  const stageMatches = state.matches.filter((match) => match.stage === stage && !match.locked);
  const summary = getStagePredictionState(stageMatches);
  const progress = section.querySelector('[data-prediction-progress]');
  const actionButton = section.querySelector('[data-stage-save-trigger]');

  if (progress) {
    progress.outerHTML = renderPredictionProgress(stageMatches);
  }

  if (actionButton) {
    actionButton.disabled = summary.saved;
    actionButton.textContent = summary.saved ? 'Predicciones guardadas' : 'Guardar predicciones de esta fase';
  }
}

function updatePredictionDraftInput(target, { commit = false } = {}) {
  const matchId = target.dataset.matchId;
  const field = target.dataset.field;
  const stage = target.dataset.stage;
  if (!matchId || !field || !stage) return;

  const currentDraft = state.predictionDrafts[matchId] || {
    predictedScoreA: '',
    predictedScoreB: '',
    predictedQualifiedTeam: ''
  };

  state.predictionDrafts[matchId] = {
    ...currentDraft,
    [field]: target.value
  };

  const match = state.matches.find((item) => String(item._id) === String(matchId));
  const updatedDraft = state.predictionDrafts[matchId];
  if (match && match.stage !== 'group') {
    if (field === 'predictedScoreA' || field === 'predictedScoreB') {
      const scoreA = Number(updatedDraft.predictedScoreA);
      const scoreB = Number(updatedDraft.predictedScoreB);
      if (Number.isInteger(scoreA) && Number.isInteger(scoreB) && scoreA !== scoreB) {
        updatedDraft.predictedQualifiedTeam = '';
      }
    }
  }

  state.invalidPredictionMatchIds = state.invalidPredictionMatchIds.filter((id) => id !== String(matchId));
  syncPredictionQualifiedField(matchId);

  if (state.pendingPredictionStage === stage) {
    state.pendingPredictionStage = null;
    document.body.classList.remove('modal-open');
  }

  if (commit) {
    renderFixture(state.matches, state.myPredictions);
  }
}

function handlePredictionStageSaveRequest(stage) {
  const stageMatches = state.matches.filter((match) => match.stage === stage && !match.locked);
  const summary = getStagePredictionState(stageMatches);

  if (summary.missing > 0) {
    const incompleteMatches = stageMatches.filter((match) => !isPredictionDraftComplete(match));
    state.invalidPredictionMatchIds = incompleteMatches.map((match) => String(match._id));
    renderFixture(state.matches, state.myPredictions);

    const firstMissing = incompleteMatches[0];
    if (firstMissing) {
      window.setTimeout(() => {
        const firstMissingCard = document.querySelector(`[data-match-id="${String(firstMissing._id)}"]`);
        firstMissingCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }

    const previewNames = incompleteMatches
      .slice(0, 2)
      .map((match) => `${getPredictionMatchLabel(match)} (${getIncompletePredictionReason(match)})`)
      .join(', ');

    toast(
      summary.missing === 1
        ? `Falta completar ${previewNames}.`
        : `Faltan ${summary.missing} partidos por completar: ${previewNames}${incompleteMatches.length > 2 ? '...' : ''}.`,
      'error'
    );
    return;
  }

  openPredictionReviewSheet(stage);
}

async function confirmPredictionStageSave(stage) {
  const stageMatches = state.matches.filter((match) => match.stage === stage && !match.locked);
  if (!stageMatches.length) return;

  state.savingPredictionStage = stage;
  renderFixture(state.matches, state.myPredictions);

  try {
    for (const match of stageMatches) {
      const payload = normalizeDraftPayload(match, getPredictionDraft(match));
      if (!payload) {
        throw new Error('Hay predicciones incompletas en esta fase.');
      }

      await apiFetch(`/predictions/${match._id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    toast('Predicciones guardadas.');
    state.invalidPredictionMatchIds = [];
    state.pendingPredictionStage = null;
    state.savingPredictionStage = null;
    document.body.classList.remove('modal-open');
    await loadMatches();
  } catch (error) {
    state.savingPredictionStage = null;
    renderFixture(state.matches, state.myPredictions);
    toast(error.message || 'No se pudieron guardar las predicciones.', 'error');
  }
}

async function loadMatches() {
  try {
    const [matches, myPredictions] = await Promise.all([
      apiFetch('/matches'),
      apiFetch('/predictions/me')
    ]);
    state.matches = matches;
    state.myPredictions = myPredictions;
    syncPredictionDrafts(matches);
    renderFixture(state.matches, state.myPredictions);
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      toast('Sesion vencida. Vuelve a ingresar.', 'error');
      window.setTimeout(() => { window.location.href = 'index.html'; }, 800);
      return;
    }
    state.matches = [];
    state.myPredictions = [];
    state.predictionDrafts = {};
    renderFixture(state.matches, state.myPredictions);
    toast(error.message || 'No se pudo cargar el API.', 'error');
  }
}

function initDashboardPage() {
  if (!document.getElementById('groupsBoard')) return;
  if (!requireAuth()) return;

  const requestedView = new URLSearchParams(window.location.search).get('view');
  if (['standings', 'matches', 'predictions', 'bracket'].includes(requestedView)) {
    state.activeView = requestedView;
  }

  setupSharedLayout();

  const adminPanel   = document.getElementById('adminPanel');
  const matchesBoard = document.getElementById('matchesBoard');
  const tabs         = document.querySelectorAll('[data-view]');

  const syncActiveViewControls = () => {
    tabs.forEach((item) => item.classList.toggle('active', item.dataset.view === state.activeView));
    updateBottomNavState();
  };

  if (state.user?.isAdmin && adminPanel) adminPanel.classList.remove('hidden');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeView = tab.dataset.view;
      syncActiveViewControls();
      renderFixture(state.matches, state.myPredictions);
    });
  });

  if (matchesBoard) {
    matchesBoard.addEventListener('click', (event) => {
      const switchButton = event.target.closest('[data-switch-view]');
      if (!switchButton) return;

      const targetView = switchButton.dataset.switchView;
      if (!['standings', 'matches', 'predictions', 'bracket'].includes(targetView)) return;

      state.activeView = targetView;
      syncActiveViewControls();
      renderFixture(state.matches, state.myPredictions);
    });
  }

  document.querySelectorAll('[data-nav-view]').forEach((control) => {
    control.addEventListener('click', () => {
      const targetView = control.dataset.navView;
      if (!['standings', 'matches', 'predictions', 'bracket'].includes(targetView)) return;
      state.activeView = targetView;
      syncActiveViewControls();
      closeMoreSheet();
      renderFixture(state.matches, state.myPredictions);
    });
  });

  document.addEventListener('input', (event) => {
    const input = event.target.closest('[data-prediction-input]');
    if (!input) return;
    updatePredictionDraftInput(input, { commit: false });
  });

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-prediction-input]');
    if (!input) return;
    updatePredictionDraftInput(input, { commit: true });
  });

  document.addEventListener('click', (event) => {
    const jumpButton = event.target.closest('[data-jump-stage]');
    if (!jumpButton) return;

    const stage = jumpButton.dataset.jumpStage;
    const section = document.querySelector(`[data-stage-section="${stage}"]`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-my-predictions]')) {
      openMyPredictionsModal();
      return;
    }

    if (event.target.closest('[data-close-my-predictions]')) {
      closeMyPredictionsModal();
      return;
    }

    const stageSaveButton = event.target.closest('[data-stage-save-trigger]');
    if (stageSaveButton) {
      handlePredictionStageSaveRequest(stageSaveButton.dataset.stageSaveTrigger);
      return;
    }

    if (event.target.closest('[data-close-prediction-review]')) {
      closePredictionReviewSheet();
      return;
    }

    const confirmStageButton = event.target.closest('[data-confirm-stage-save]');
    if (confirmStageButton) {
      confirmPredictionStageSave(confirmStageButton.dataset.confirmStageSave);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeScoringModal();
      closeMyPredictionsModal();
      closePredictionReviewSheet();
    }
  });

  document.addEventListener('submit', async (event) => {
    const resultForm = event.target.closest('[data-result-form]');
    if (!resultForm) return;
    event.preventDefault();
    const card = event.target.closest('[data-match-id]');
    if (!card) return;

    try {
      await apiFetch(`/matches/${card.dataset.matchId}/result`, {
        method: 'PATCH',
        body: JSON.stringify(Object.fromEntries(new FormData(resultForm)))
      });
      toast('Resultado guardado.');
      await loadMatches();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  syncActiveViewControls();
  loadMatches();
}

function initAuthPage() {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm || !registerForm) return;

  const authCard      = document.querySelector('.auth-card');
  const toggleButtons = document.querySelectorAll('[data-auth-mode]');

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isRegister = button.dataset.authMode === 'register';
      authCard.classList.toggle('register-mode', isRegister);
      loginForm.classList.toggle('active', !isRegister);
      registerForm.classList.toggle('active', isRegister);
      toggleButtons.forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
      });
      setSession(payload);
      window.location.href = 'dashboard.html';
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(registerForm)))
      });
      setSession(payload);
      window.location.href = 'dashboard.html';
    } catch (error) {
      toast(error.message, 'error');
    }
  });

}

async function loadLeaderboard(list, emptyState, { silent = false } = {}) {
  if (!list || !emptyState) return;

  try {
    const leaderboard = await apiFetch('/leaderboard');
    const maxPoints   = Math.max(...leaderboard.map((row) => row.points), 1);
    list.innerHTML = leaderboard.map((row, index) => {
      const percent = Math.max((row.points / maxPoints) * 100, 6);
      return `
        <div class="leaderboard-row ${row.isCurrentUser ? 'current' : ''} ${row.rank <= 3 ? 'podium' : ''}" style="animation-delay:${index * 45}ms">
          <div class="rank-number">${row.rank}</div>
          <div class="leaderboard-user">
            <div class="leaderboard-name">${escapeHtml(row.username)}${row.isCurrentUser ? ' Â· tu' : ''}</div>
            <div class="points-track"><span style="width:${percent}%"></span></div>
          </div>
          <div class="leaderboard-points">${row.points} pts</div>
        </div>
      `;
    }).join('');
    emptyState.classList.toggle('hidden', leaderboard.length > 0);
  } catch (error) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    if (!silent) {
      toast(error.message || 'No se pudo cargar la tabla.', 'error');
    }
  }
}

async function initLeaderboardPage() {
  const list       = document.getElementById('leaderboardList');
  const emptyState = document.getElementById('emptyLeaderboard');
  if (!list) return;
  if (!requireAuth()) return;

  setupSharedLayout();
  updateBottomNavState();

  await loadLeaderboard(list, emptyState);

  const refreshLeaderboard = () => loadLeaderboard(list, emptyState, { silent: true });
  const refreshInterval = window.setInterval(() => {
    if (document.hidden) return;
    refreshLeaderboard();
  }, 15000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshLeaderboard();
  });
  window.addEventListener('focus', refreshLeaderboard);
  window.addEventListener('beforeunload', () => window.clearInterval(refreshInterval), { once: true });
  return;

  try {
    const leaderboard = await apiFetch('/leaderboard');
    const maxPoints   = Math.max(...leaderboard.map((row) => row.points), 1);
    list.innerHTML = leaderboard.map((row, index) => {
      const percent = Math.max((row.points / maxPoints) * 100, 6);
      return `
        <div class="leaderboard-row ${row.isCurrentUser ? 'current' : ''} ${row.rank <= 3 ? 'podium' : ''}" style="animation-delay:${index * 45}ms">
          <div class="rank-number">${row.rank}</div>
          <div class="leaderboard-user">
            <div class="leaderboard-name">${escapeHtml(row.username)}${row.isCurrentUser ? ' · tu' : ''}</div>
            <div class="points-track"><span style="width:${percent}%"></span></div>
          </div>
          <div class="leaderboard-points">${row.points} pts</div>
        </div>
      `;
    }).join('');
    emptyState.classList.toggle('hidden', leaderboard.length > 0);
  } catch (error) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    toast(error.message || 'No se pudo cargar la tabla.', 'error');
  }
}

initAuthPage();
initDashboardPage();
initLeaderboardPage();
