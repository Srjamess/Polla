# AGENTS.md

## Context

Esta es la app real del proyecto. La raiz del workspace tambien tiene prototipos y archivos sueltos; no mezclar ambos sin confirmar.

## Lo importante

- Mantener la relacion entre `matches`, `predictions`, `users.totalPoints` y `leaderboard`.
- No romper autenticacion, fixture, predicciones, scoring ni bracket.
- Si cambias una regla de negocio, actualiza backend, frontend y documentacion juntos.
- Si agregas fases nuevas, ajusta el orden del torneo y las validaciones.

## Flujo de trabajo

- Usa `apply_patch` para editar.
- No reviertas cambios ajenos.
- Valida cambios JS con `node --check`.
- Si el cambio es visual, revisa desktop y movil.

## Stack

- Backend: Node.js + Express
- DB: MongoDB + Mongoose
- Auth: JWT + bcrypt
- Frontend: HTML, CSS y JS vanilla

## Archivos clave

- `client/app.js`
- `client/styles.css`
- `client/dashboard.html`
- `client/leaderboard.html`
- `server/index.js`
- `server/routes/*.js`
- `server/models/*.js`
- `server/utils/scoring.js`

## Comandos utiles

Desde `polla-mundialista/`:

- `npm run dev`
- `npm start`
- `npm run preview`
- `npm run seed:matches`

