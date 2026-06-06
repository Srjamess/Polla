# AGENTS.md

## Proyecto

Este workspace contiene una aplicacion llamada `polla-mundialista`, enfocada en una polla del Mundial de futbol. La experiencia principal permite:

- Ver la tabla de posiciones general de usuarios.
- Ver tablas de clasificacion por grupos.
- Consultar los partidos programados y sus resultados.
- Navegar el arbol de eliminacion directa.
- Registrar y editar predicciones para los partidos.
- Calcular puntajes automaticamente cuando existan resultados reales.

## Ubicacion principal del codigo

El proyecto activo vive en:

`C:\Users\jamsa\OneDrive\Escritorio\Polla\polla-mundialista`

Tambien existen archivos visuales y prototipos en la raiz del workspace (`app.js`, `styles.css`, `.png`). Antes de modificar algo, validar si el cambio corresponde al prototipo de raiz o a la aplicacion real dentro de `polla-mundialista/`.

## Stack actual

- Backend: Node.js + Express
- Base de datos: MongoDB con Mongoose
- Auth: JWT + bcrypt
- Frontend: HTML, CSS y JavaScript vanilla

## Estructura relevante

```txt
polla-mundialista/
|-- client/
|   |-- index.html
|   |-- dashboard.html
|   |-- leaderboard.html
|   |-- app.js
|   `-- styles.css
|-- server/
|   |-- index.js
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   `-- utils/
|-- scripts/
|-- package.json
`-- README.md
```

## Modulos funcionales que se deben preservar

### 1. Autenticacion

- Registro e inicio de sesion.
- Persistencia de sesion con JWT.
- Distincion basica entre usuario normal y administrador mediante `isAdmin`.

### 2. Partidos

- CRUD parcial de partidos.
- Campos actuales del modelo: codigo, equipos, fecha, fase, grupo, origen de clasificacion, sede y resultado.
- Bloqueo de predicciones cuando la fecha del partido ya paso.

### 3. Predicciones

- Una prediccion por usuario por partido.
- Edicion por upsert mientras el partido no este bloqueado.
- Soporte para cualquier marcador que el usuario quiera registrar antes del cierre.

### 4. Puntuacion y tabla general

- 3 puntos por marcador exacto.
- 1 punto por acertar ganador o empate.
- 0 puntos por resultado incorrecto.
- La tabla general debe ordenar a los usuarios por puntaje acumulado.

### 5. Visualizacion del torneo

- Tablas de posiciones por grupo.
- Listado de partidos.
- Vista de predicciones del usuario.
- Arbol de eliminatoria.

## Intencion del producto

La aplicacion debe sentirse como un centro de seguimiento del Mundial y no solo como un formulario de apuestas. Las vistas clave del producto son:

- `Posiciones`: clasificacion por grupos y/o ranking general.
- `Partidos`: fixture completo con fechas, equipos y resultados.
- `Eliminatoria`: cuadro desde fases directas hasta la final.
- `Predicciones`: espacio donde el usuario define los marcadores que quiera para cada partido.

## Convenciones para futuros cambios

- Mantener el idioma de la interfaz en espanol.
- Preservar una experiencia clara para escritorio y movil.
- No romper la relacion entre partidos, predicciones y leaderboard.
- Si se agregan nuevas fases del torneo, actualizar validaciones del modelo `Match`, orden de fases y render del bracket.
- Si se modifica la logica de puntos, actualizar backend, frontend y documentacion en conjunto.
- Evitar duplicar logica de negocio en cliente y servidor cuando pueda centralizarse en el backend.

## Archivos clave

- `polla-mundialista/server/models/Match.js`
- `polla-mundialista/server/models/Prediction.js`
- `polla-mundialista/server/routes/matches.js`
- `polla-mundialista/server/routes/predictions.js`
- `polla-mundialista/server/routes/leaderboard.js`
- `polla-mundialista/server/utils/scoring.js`
- `polla-mundialista/client/dashboard.html`
- `polla-mundialista/client/leaderboard.html`
- `polla-mundialista/client/app.js`

## Scripts utiles

Desde `polla-mundialista/`:

- `npm run dev`: levanta el servidor en desarrollo.
- `npm start`: levanta el servidor en modo normal.
- `npm run preview`: genera preview estatico.
- `npm run seed:matches`: carga partidos demo.

## Criterio para agentes

Antes de implementar cambios:

1. Confirmar si el ajuste va en la app real `polla-mundialista/` o en el prototipo de la raiz.
2. Revisar si impacta autenticacion, partidos, predicciones o scoring.
3. Mantener consistencia entre vistas de posiciones, fixture, eliminatoria y predicciones.
4. Si un cambio altera reglas del torneo, actualizar este archivo y el `README.md`.
