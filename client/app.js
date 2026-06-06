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
  matches: []
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

function flagUrl(teamName) {
  const key = Object.keys(teamFlags).find((item) => String(teamName).includes(item));
  return key ? `https://flagcdn.com/${teamFlags[key]}.svg` : '';
}

function renderFlag(teamName) {
  const url = flagUrl(teamName);
  return url
    ? `<img class="flag-img" src="${url}" alt="Bandera de ${escapeHtml(teamName)}" loading="lazy" />`
    : '<span class="flag-placeholder"></span>';
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

  Object.entries(groupTeams).forEach(([group, teams]) => {
    tables[group] = teams.map((team) => ({
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      diff: 0,
      points: 0
    }));
    groupStatus[group] = { total: 0, completed: 0 };
  });

  matches.filter((match) => match.stage === 'group').forEach((match) => {
    if (!groupStatus[match.group]) {
      groupStatus[match.group] = { total: 0, completed: 0 };
    }
    groupStatus[match.group].total += 1;
    if (match.resultSet) groupStatus[match.group].completed += 1;
  });

  matches.filter((match) => match.stage === 'group' && match.resultSet).forEach((match) => {
    const rows = tables[match.group] || [];
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

  Object.values(tables).forEach((rows) => {
    rows.sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor);
  });

  return { tables, groupStatus };
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

  Object.values(tables).forEach((rows) => {
    rows.sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team));
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
      return tables[group]?.[index]?.team || '';
    }

    const bestThirdMatch = text.match(/^3([A-L]+)$/i);
    if (bestThirdMatch) {
      if (thirdAssignments.has(text)) return thirdAssignments.get(text) || '';
      const allowedGroups = new Set(bestThirdMatch[1].toUpperCase().split(''));
      const candidate = thirdPlaceRows.find((row) => allowedGroups.has(row.group) && !usedThirdGroups.has(row.group));
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

function renderPersonalTeam(match, side) {
  const source = side === 'A' ? match.sourceA : match.sourceB;
  const resolvedName = getPersonalResolvedTeam(match, side);
  const label = resolvedName || (source ? prettySourceLabel(source) : 'Por definir');

  return `
    <div class="team-lockup ${resolvedName ? '' : 'pending-team'}">
      ${resolvedName ? renderFlag(resolvedName) : '<span class="flag-placeholder empty"></span>'}
      <span class="team-name">${escapeHtml(label || 'Por definir')}</span>
      ${source ? `<small>${escapeHtml(prettySourceLabel(source))}</small>` : ''}
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

function renderMatch(match, groupTables, groupStatus, matchesByCode, compact, hideStageLabel = false, personalMode = false) {
  const prediction = match.prediction;
  const metaStage = hideStageLabel
    ? ''
    : match.stage === 'group'
      ? `Grupo ${escapeHtml(match.group || '')}`
      : stageLabel(match.stage);
  const teamAContent = personalMode
    ? renderPersonalTeam(match, 'A')
    : renderTeam(match.teamA, match.sourceA, groupTables, groupStatus, matchesByCode);
  const teamBContent = personalMode
    ? renderPersonalTeam(match, 'B')
    : renderTeam(match.teamB, match.sourceB, groupTables, groupStatus, matchesByCode);
  const qualifierA = getPersonalResolvedTeam(match, 'A') || 'Equipo A';
  const qualifierB = getPersonalResolvedTeam(match, 'B') || 'Equipo B';

  return `
    <article class="match-card ${compact ? 'match-row-card' : 'glass-card'}" data-match-id="${escapeHtml(match._id)}">
      <div class="match-meta">
        ${metaStage ? `<span>${metaStage}</span>` : ''}
        <span>${formatDate(match.matchDate)}</span>
      </div>
      <div class="teams-row">
        ${teamAContent}
        <div class="score-chip">${match.resultSet ? `${match.scoreA}<span>-</span>${match.scoreB}` : 'VS'}</div>
        ${teamBContent}
      </div>
      <p class="venue">${escapeHtml(match.venue || '')}</p>
      ${compact ? '' : `
        <form class="prediction-form" data-prediction-form>
          <input name="predictedScoreA" type="number" min="0" step="1" placeholder="A" value="${prediction?.predictedScoreA ?? ''}" ${match.locked ? 'disabled' : ''} required />
          <input name="predictedScoreB" type="number" min="0" step="1" placeholder="B" value="${prediction?.predictedScoreB ?? ''}" ${match.locked ? 'disabled' : ''} required />
          ${match.stage === 'group' ? '' : `
            <select name="predictedQualifiedTeam" ${match.locked ? 'disabled' : ''}>
              <option value="">Clasifica si hay empate</option>
              <option value="teamA" ${prediction?.predictedQualifiedTeam === 'teamA' ? 'selected' : ''}>${escapeHtml(qualifierA)}</option>
              <option value="teamB" ${prediction?.predictedQualifiedTeam === 'teamB' ? 'selected' : ''}>${escapeHtml(qualifierB)}</option>
            </select>
          `}
          <button class="primary-button" type="submit" ${match.locked ? 'disabled' : ''}>${match.locked ? 'Bloqueado' : 'Guardar prediccion'}</button>
        </form>
        ${renderAdminResultForm(match)}
      `}
    </article>
  `;
}

function renderFixtureTeamsRow(match) {
  const centerValue = match.resultSet ? `${match.scoreA}-${match.scoreB}` : formatFixtureTime(match.matchDate);
  const metaParts = [
    fixtureStageLabel(match.stage),
    match.stage === 'group' && match.group ? `Grupo ${escapeHtml(match.group)}` : '',
    escapeHtml(match.venue || '')
  ].filter(Boolean);

  return `
    <div class="fixture-fifa-inner">
      <div class="fixture-fifa-team fixture-fifa-team-left">
        <span class="fixture-fifa-team-name">${escapeHtml(match.teamA)}</span>
        ${renderFlag(match.teamA)}
      </div>
      <div class="fixture-fifa-kickoff">${escapeHtml(centerValue)}</div>
      <div class="fixture-fifa-team fixture-fifa-team-right">
        ${renderFlag(match.teamB)}
        <span class="fixture-fifa-team-name">${escapeHtml(match.teamB)}</span>
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
      <h3>Grupo ${escapeHtml(group)}</h3>
      <div class="standings-header">
        <span>Equipo</span><span>PJ</span><span>G</span><span>E</span><span>P</span><span>GF</span><span>GC</span><span>DG</span><strong>Pts</strong>
      </div>
      ${rows.map((row, index) => `
        <div class="standings-row ${index < 2 ? 'qualified' : ''}">
          <div class="standings-team">
            <span class="rank">${index + 1}</span>
            ${renderFlag(row.team)}
            <span>${escapeHtml(row.team)}</span>
          </div>
          <span>${row.played}</span>
          <span>${row.wins}</span>
          <span>${row.draws}</span>
          <span>${row.losses}</span>
          <span>${row.goalsFor}</span>
          <span>${row.goalsAgainst}</span>
          <span>${row.diff}</span>
          <strong>${row.points}</strong>
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

  return stageOrder
    .filter((stage) => grouped.has(stage))
    .map((stage) => {
      const stageMatches = grouped.get(stage) || [];

      return `
        <section class="prediction-stage">
          <header class="prediction-stage-header">
            <h3>${escapeHtml(stageLabel(stage))}</h3>
            <span>${stageMatches.length} partido${stageMatches.length === 1 ? '' : 's'}</span>
          </header>
          <div class="prediction-grid">
            ${stageMatches.map((match) => renderMatch(match, groupTables, groupStatus, matchesByCode, false, false, true)).join('')}
          </div>
        </section>
      `;
    })
    .join('');
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
  const teamA = match.predictedResolvedTeamA || match.clientPredictedResolvedTeamA || (
    match.sourceA
      ? resolveSource(match.sourceA, groupTables, groupStatus, matchesByCode)
      : match.teamA
  );

  const teamB = match.predictedResolvedTeamB || match.clientPredictedResolvedTeamB || (
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
          <span class="bracket-flag-placeholder"></span>
          <span class="bracket-team-name">${escapeHtml(labelA)}</span>
          ${match.resultSet ? `<strong class="bracket-score">${match.scoreA}</strong>` : ''}
        </div>

        <div class="bracket-team-row ${winnerB ? 'winner' : ''}">
          <span class="bracket-flag-placeholder"></span>
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

function orderByCode(matches, codes) {
  const map = new Map(matches.map((match) => [match.code, match]));

  return codes
    .map((code) => map.get(code))
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────

function renderFixture(matches) {
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

  groupsBoard.innerHTML = `
    <section class="fifa-panel">
      <div class="panel-title">
        <div>
          <h2>Posiciones</h2>
          <p>Temporada <strong>2026</strong></p>
        </div>
      </div>
      <div class="standings-grid">${renderStandings(groupTables)}</div>
    </section>
  `;

  matchesBoard.innerHTML = `
    <section class="fifa-panel fixture-panel">
      <div class="panel-title">
        <div>
          <h2>Partidos</h2>
          <p>Calendario completo del torneo</p>
        </div>
      </div>
      ${renderMatchesSchedule(matches)}
    </section>
  `;

  predictionsBoard.innerHTML = `
    <section class="fifa-panel">
      <div class="panel-title">
        <div>
          <h2>Predicciones</h2>
          <p>Partidos abiertos para guardar marcador</p>
        </div>
      </div>
      <div class="prediction-sections">
        ${predictionMatches.length
          ? renderPredictionsSections(predictionMatches, groupTables, groupStatus, matchesByCode)
          : '<p class="empty-state">No hay predicciones abiertas.</p>'}
      </div>
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
    <section class="fifa-panel bracket-panel">
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
  const userLabel    = document.getElementById('currentUser');
  const logoutButton = document.getElementById('logoutButton');
  if (userLabel)    userLabel.textContent = state.user?.username || '';
  if (logoutButton) logoutButton.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

async function loadMatches() {
  try {
    state.matches = await apiFetch('/matches');
    renderFixture(state.matches);
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      toast('Sesion vencida. Vuelve a ingresar.', 'error');
      window.setTimeout(() => { window.location.href = 'index.html'; }, 800);
      return;
    }
    state.matches = [];
    renderFixture(state.matches);
    toast(error.message || 'No se pudo cargar el API.', 'error');
  }
}

function initDashboardPage() {
  if (!document.getElementById('groupsBoard')) return;
  if (!requireAuth()) return;

  setupSharedLayout();

  const adminPanel   = document.getElementById('adminPanel');
  const matchesBoard = document.getElementById('matchesBoard');
  const tabs         = document.querySelectorAll('[data-view]');

  if (state.user?.isAdmin && adminPanel) adminPanel.classList.remove('hidden');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeView = tab.dataset.view;
      tabs.forEach((item) => item.classList.toggle('active', item === tab));
      renderFixture(state.matches);
    });
  });

  if (matchesBoard) {
    matchesBoard.addEventListener('click', (event) => {
      const switchButton = event.target.closest('[data-switch-view]');
      if (!switchButton) return;

      const targetView = switchButton.dataset.switchView;
      const targetTab = Array.from(tabs).find((tab) => tab.dataset.view === targetView);
      if (!targetTab) return;

      state.activeView = targetView;
      tabs.forEach((item) => item.classList.toggle('active', item === targetTab));
      renderFixture(state.matches);
    });
  }

  document.addEventListener('submit', async (event) => {
    const predictionForm = event.target.closest('[data-prediction-form]');
    if (!predictionForm) return;
    event.preventDefault();
    const card = event.target.closest('[data-match-id]');
    if (!card) return;
    try {
      await apiFetch(`/predictions/${card.dataset.matchId}`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(predictionForm)))
      });
      toast('Prediccion guardada.');
      loadMatches();
    } catch (error) {
      toast(error.message, 'error');
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
      loadMatches();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

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

async function initLeaderboardPage() {
  const list       = document.getElementById('leaderboardList');
  const emptyState = document.getElementById('emptyLeaderboard');
  if (!list) return;
  if (!requireAuth()) return;

  setupSharedLayout();

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
