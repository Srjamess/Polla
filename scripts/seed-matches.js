require('dotenv').config();

const mongoose = require('mongoose');
const Match = require('../server/models/Match');

function groupMatch(code, teamA, teamB, group, matchDate, venue) {
  return {
    code,
    teamA,
    teamB,
    group,
    venue,
    stage: 'group',
    matchDate: new Date(matchDate)
  };
}

function knockoutMatch(code, stage, matchDate, sourceA, sourceB, venue = '') {
  return {
    code,
    teamA: 'Por definir',
    teamB: 'Por definir',
    stage,
    sourceA,
    sourceB,
    venue,
    matchDate: new Date(matchDate)
  };
}

const groupStage = [
  groupMatch('GA1', 'Mexico', 'Sudafrica', 'A', '2026-06-11T15:00:00-04:00', 'Estadio Ciudad de Mexico (Ciudad de Mexico)'),
  groupMatch('GA2', 'Republica de Corea', 'Chequia', 'A', '2026-06-11T22:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  groupMatch('GB1', 'Canada', 'Bosnia y Herzegovina', 'B', '2026-06-12T15:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  groupMatch('GD1', 'EE. UU.', 'Paraguay', 'D', '2026-06-12T21:00:00-04:00', 'Estadio Los Angeles (Los Angeles)'),
  groupMatch('GB2', 'Catar', 'Suiza', 'B', '2026-06-13T15:00:00-04:00', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  groupMatch('GC1', 'Brasil', 'Marruecos', 'C', '2026-06-13T18:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  groupMatch('GC2', 'Haiti', 'Escocia', 'C', '2026-06-13T21:00:00-04:00', 'Estadio Boston (Boston)'),
  groupMatch('GD2', 'Australia', 'Turquia', 'D', '2026-06-14T00:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  groupMatch('GE1', 'Alemania', 'Curazao', 'E', '2026-06-14T13:00:00-04:00', 'Estadio Houston (Houston)'),
  groupMatch('GF1', 'Paises Bajos', 'Japon', 'F', '2026-06-14T16:00:00-04:00', 'Estadio Dallas (Dallas)'),
  groupMatch('GE2', 'Costa de Marfil', 'Ecuador', 'E', '2026-06-14T19:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  groupMatch('GF2', 'Suecia', 'Tunez', 'F', '2026-06-14T22:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  groupMatch('GH1', 'Espana', 'Islas de Cabo Verde', 'H', '2026-06-15T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  groupMatch('GG1', 'Belgica', 'Egipto', 'G', '2026-06-15T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  groupMatch('GH2', 'Arabia Saudi', 'Uruguay', 'H', '2026-06-15T18:00:00-04:00', 'Estadio Miami (Miami)'),
  groupMatch('GG2', 'RI de Iran', 'Nueva Zelanda', 'G', '2026-06-15T21:00:00-04:00', 'Estadio Los Angeles (Los Angeles)'),
  groupMatch('GI1', 'Francia', 'Senegal', 'I', '2026-06-16T15:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  groupMatch('GI2', 'Irak', 'Noruega', 'I', '2026-06-16T18:00:00-04:00', 'Estadio Boston (Boston)'),
  groupMatch('GJ1', 'Argentina', 'Argelia', 'J', '2026-06-16T21:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  groupMatch('GJ2', 'Austria', 'Jordania', 'J', '2026-06-17T00:00:00-04:00', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  groupMatch('GK1', 'Portugal', 'RD Congo', 'K', '2026-06-17T13:00:00-04:00', 'Estadio Houston (Houston)'),
  groupMatch('GL1', 'Inglaterra', 'Croacia', 'L', '2026-06-17T16:00:00-04:00', 'Estadio Dallas (Dallas)'),
  groupMatch('GL2', 'Ghana', 'Panama', 'L', '2026-06-17T19:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  groupMatch('GK2', 'Uzbekistan', 'Colombia', 'K', '2026-06-17T22:00:00-04:00', 'Estadio Ciudad de Mexico (Ciudad de Mexico)'),
  groupMatch('GA3', 'Chequia', 'Sudafrica', 'A', '2026-06-18T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  groupMatch('GB3', 'Suiza', 'Bosnia y Herzegovina', 'B', '2026-06-18T15:00:00-04:00', 'Estadio Los Angeles (Los Angeles)'),
  groupMatch('GB4', 'Canada', 'Catar', 'B', '2026-06-18T18:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  groupMatch('GA4', 'Mexico', 'Republica de Corea', 'A', '2026-06-18T21:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  groupMatch('GD3', 'EE. UU.', 'Australia', 'D', '2026-06-19T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  groupMatch('GC3', 'Escocia', 'Marruecos', 'C', '2026-06-19T18:00:00-04:00', 'Estadio Boston (Boston)'),
  groupMatch('GC4', 'Brasil', 'Haiti', 'C', '2026-06-19T20:30:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  groupMatch('GD4', 'Turquia', 'Paraguay', 'D', '2026-06-20T00:00:00-04:00', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  groupMatch('GF3', 'Paises Bajos', 'Suecia', 'F', '2026-06-20T13:00:00-04:00', 'Estadio Houston (Houston)'),
  groupMatch('GE3', 'Alemania', 'Costa de Marfil', 'E', '2026-06-20T16:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  groupMatch('GE4', 'Ecuador', 'Curazao', 'E', '2026-06-20T20:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  groupMatch('GF4', 'Tunez', 'Japon', 'F', '2026-06-21T00:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  groupMatch('GH3', 'Espana', 'Arabia Saudi', 'H', '2026-06-21T12:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  groupMatch('GG3', 'Belgica', 'RI de Iran', 'G', '2026-06-21T15:00:00-04:00', 'Estadio Los Angeles (Los Angeles)'),
  groupMatch('GH4', 'Uruguay', 'Islas de Cabo Verde', 'H', '2026-06-21T18:00:00-04:00', 'Estadio Miami (Miami)'),
  groupMatch('GG4', 'Nueva Zelanda', 'Egipto', 'G', '2026-06-21T21:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  groupMatch('GJ3', 'Argentina', 'Austria', 'J', '2026-06-22T13:00:00-04:00', 'Estadio Dallas (Dallas)'),
  groupMatch('GI3', 'Francia', 'Irak', 'I', '2026-06-22T17:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  groupMatch('GI4', 'Noruega', 'Senegal', 'I', '2026-06-22T20:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  groupMatch('GJ4', 'Jordania', 'Argelia', 'J', '2026-06-23T00:00:00-04:00', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  groupMatch('GK3', 'Portugal', 'Uzbekistan', 'K', '2026-06-23T13:00:00-04:00', 'Estadio Houston (Houston)'),
  groupMatch('GL3', 'Inglaterra', 'Ghana', 'L', '2026-06-23T16:00:00-04:00', 'Estadio Boston (Boston)'),
  groupMatch('GL4', 'Panama', 'Croacia', 'L', '2026-06-23T19:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  groupMatch('GK4', 'Colombia', 'RD Congo', 'K', '2026-06-23T22:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  groupMatch('GB5', 'Suiza', 'Canada', 'B', '2026-06-24T15:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  groupMatch('GB6', 'Bosnia y Herzegovina', 'Catar', 'B', '2026-06-24T15:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  groupMatch('GC5', 'Escocia', 'Brasil', 'C', '2026-06-24T18:00:00-04:00', 'Estadio Miami (Miami)'),
  groupMatch('GC6', 'Marruecos', 'Haiti', 'C', '2026-06-24T18:00:00-04:00', 'Estadio Atlanta (Atlanta)'),
  groupMatch('GA5', 'Chequia', 'Mexico', 'A', '2026-06-24T21:00:00-04:00', 'Estadio Ciudad de Mexico (Ciudad de Mexico)'),
  groupMatch('GA6', 'Sudafrica', 'Republica de Corea', 'A', '2026-06-24T21:00:00-04:00', 'Estadio Monterrey (Monterrey)'),
  groupMatch('GE5', 'Curazao', 'Costa de Marfil', 'E', '2026-06-25T16:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  groupMatch('GE6', 'Ecuador', 'Alemania', 'E', '2026-06-25T16:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  groupMatch('GF5', 'Japon', 'Suecia', 'F', '2026-06-25T19:00:00-04:00', 'Estadio Dallas (Dallas)'),
  groupMatch('GF6', 'Tunez', 'Paises Bajos', 'F', '2026-06-25T19:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  groupMatch('GD5', 'Turquia', 'EE. UU.', 'D', '2026-06-25T22:00:00-04:00', 'Estadio Los Angeles (Los Angeles)'),
  groupMatch('GD6', 'Paraguay', 'Australia', 'D', '2026-06-25T22:00:00-04:00', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  groupMatch('GI5', 'Noruega', 'Francia', 'I', '2026-06-26T15:00:00-04:00', 'Estadio Boston (Boston)'),
  groupMatch('GI6', 'Senegal', 'Irak', 'I', '2026-06-26T15:00:00-04:00', 'Estadio de Toronto (Toronto)'),
  groupMatch('GH5', 'Islas de Cabo Verde', 'Arabia Saudi', 'H', '2026-06-26T20:00:00-04:00', 'Estadio Houston (Houston)'),
  groupMatch('GH6', 'Uruguay', 'Espana', 'H', '2026-06-26T20:00:00-04:00', 'Estadio Guadalajara (Guadalajara)'),
  groupMatch('GG5', 'Egipto', 'RI de Iran', 'G', '2026-06-26T23:00:00-04:00', 'Estadio de Seattle (Seattle)'),
  groupMatch('GG6', 'Nueva Zelanda', 'Belgica', 'G', '2026-06-26T23:00:00-04:00', 'Estadio BC Place Vancouver (Vancouver)'),
  groupMatch('GL5', 'Panama', 'Inglaterra', 'L', '2026-06-27T17:00:00-04:00', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  groupMatch('GL6', 'Croacia', 'Ghana', 'L', '2026-06-27T17:00:00-04:00', 'Estadio Filadelfia (Filadelfia)'),
  groupMatch('GK5', 'Colombia', 'Portugal', 'K', '2026-06-27T19:30:00-04:00', 'Estadio Miami (Miami)'),
  groupMatch('GK6', 'RD Congo', 'Uzbekistan', 'K', '2026-06-27T19:30:00-04:00', 'Estadio Atlanta (Atlanta)'),
  groupMatch('GJ5', 'Argelia', 'Austria', 'J', '2026-06-27T22:00:00-04:00', 'Estadio Kansas City (Kansas City)'),
  groupMatch('GJ6', 'Jordania', 'Argentina', 'J', '2026-06-27T22:00:00-04:00', 'Estadio Dallas (Dallas)')
];

const knockoutStage = [
  knockoutMatch('R32-1', 'roundOf32', '2026-06-28T15:00:00-04:00', '2A', '2B', 'Estadio Los Angeles (Los Angeles)'),
  knockoutMatch('R32-9', 'roundOf32', '2026-06-29T13:00:00-04:00', '1C', '2F', 'Estadio Houston (Houston)'),
  knockoutMatch('R32-3', 'roundOf32', '2026-06-29T16:30:00-04:00', '1E', '3ABCDF', 'Estadio Boston (Boston)'),
  knockoutMatch('R32-2', 'roundOf32', '2026-06-29T21:00:00-04:00', '1F', '2C', 'Estadio Monterrey (Monterrey)'),
  knockoutMatch('R32-10', 'roundOf32', '2026-06-30T13:00:00-04:00', '2E', '2I', 'Estadio Dallas (Dallas)'),
  knockoutMatch('R32-4', 'roundOf32', '2026-06-30T17:00:00-04:00', '1I', '3CDFGH', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  knockoutMatch('R32-11', 'roundOf32', '2026-06-30T21:00:00-04:00', '1A', '3CEFHI', 'Estadio Ciudad de Mexico (Ciudad de Mexico)'),
  knockoutMatch('R32-12', 'roundOf32', '2026-07-01T12:00:00-04:00', '1L', '3EHIJK', 'Estadio Atlanta (Atlanta)'),
  knockoutMatch('R32-8', 'roundOf32', '2026-07-01T16:00:00-04:00', '1G', '3AEHIJ', 'Estadio de Seattle (Seattle)'),
  knockoutMatch('R32-7', 'roundOf32', '2026-07-01T20:00:00-04:00', '1D', '3BEFIJ', 'Estadio de la Bahia de San Francisco (Area de la Bahia de San Francisco)'),
  knockoutMatch('R32-6', 'roundOf32', '2026-07-02T15:00:00-04:00', '1H', '2J', 'Estadio Los Angeles (Los Angeles)'),
  knockoutMatch('R32-5', 'roundOf32', '2026-07-02T19:00:00-04:00', '2K', '2L', 'Estadio de Toronto (Toronto)'),
  knockoutMatch('R32-15', 'roundOf32', '2026-07-02T23:00:00-04:00', '1B', '3EFGIJ', 'Estadio BC Place Vancouver (Vancouver)'),
  knockoutMatch('R32-14', 'roundOf32', '2026-07-03T14:00:00-04:00', '2D', '2G', 'Estadio Dallas (Dallas)'),
  knockoutMatch('R32-13', 'roundOf32', '2026-07-03T18:00:00-04:00', '1J', '2H', 'Estadio Miami (Miami)'),
  knockoutMatch('R32-16', 'roundOf32', '2026-07-03T21:30:00-04:00', '1K', '3DEIJL', 'Estadio Kansas City (Kansas City)'),
  knockoutMatch('R16-1', 'roundOf16', '2026-07-04T13:00:00-04:00', 'winner:R32-3', 'winner:R32-4', 'Estadio Houston (Houston)'),
  knockoutMatch('R16-2', 'roundOf16', '2026-07-04T17:00:00-04:00', 'winner:R32-1', 'winner:R32-2', 'Estadio Filadelfia (Filadelfia)'),
  knockoutMatch('R16-3', 'roundOf16', '2026-07-05T16:00:00-04:00', 'winner:R32-9', 'winner:R32-10', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)'),
  knockoutMatch('R16-4', 'roundOf16', '2026-07-05T20:00:00-04:00', 'winner:R32-11', 'winner:R32-12', 'Estadio Ciudad de Mexico (Ciudad de Mexico)'),
  knockoutMatch('R16-5', 'roundOf16', '2026-07-06T15:00:00-04:00', 'winner:R32-5', 'winner:R32-6', 'Estadio Dallas (Dallas)'),
  knockoutMatch('R16-6', 'roundOf16', '2026-07-06T20:00:00-04:00', 'winner:R32-7', 'winner:R32-8', 'Estadio de Seattle (Seattle)'),
  knockoutMatch('R16-7', 'roundOf16', '2026-07-07T12:00:00-04:00', 'winner:R32-13', 'winner:R32-14', 'Estadio Atlanta (Atlanta)'),
  knockoutMatch('R16-8', 'roundOf16', '2026-07-07T16:00:00-04:00', 'winner:R32-15', 'winner:R32-16', 'Estadio BC Place Vancouver (Vancouver)'),
  knockoutMatch('QF-1', 'quarterfinal', '2026-07-09T16:00:00-04:00', 'winner:R16-1', 'winner:R16-2', 'Estadio Boston (Boston)'),
  knockoutMatch('QF-2', 'quarterfinal', '2026-07-10T15:00:00-04:00', 'winner:R16-5', 'winner:R16-6', 'Estadio Los Angeles (Los Angeles)'),
  knockoutMatch('QF-3', 'quarterfinal', '2026-07-11T17:00:00-04:00', 'winner:R16-3', 'winner:R16-4', 'Estadio Miami (Miami)'),
  knockoutMatch('QF-4', 'quarterfinal', '2026-07-11T21:00:00-04:00', 'winner:R16-7', 'winner:R16-8', 'Estadio Kansas City (Kansas City)'),
  knockoutMatch('SF-1', 'semifinal', '2026-07-14T15:00:00-04:00', 'winner:QF-1', 'winner:QF-2', 'Estadio Dallas (Dallas)'),
  knockoutMatch('SF-2', 'semifinal', '2026-07-15T15:00:00-04:00', 'winner:QF-3', 'winner:QF-4', 'Estadio Atlanta (Atlanta)'),
  knockoutMatch('TP-1', 'thirdPlace', '2026-07-18T17:00:00-04:00', 'loser:SF-1', 'loser:SF-2', 'Estadio Miami (Miami)'),
  knockoutMatch('F-1', 'final', '2026-07-19T15:00:00-04:00', 'winner:SF-1', 'winner:SF-2', 'Estadio Nueva York/Nueva Jersey (Nueva Jersey)')
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  await Match.deleteMany({});
  await Match.insertMany([...groupStage, ...knockoutStage]);
  await mongoose.disconnect();
  console.log(`Seeded ${groupStage.length + knockoutStage.length} matches.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
