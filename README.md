# Polla Mundialista

Aplicacion full-stack para hacer predicciones de partidos del Mundial. Incluye autenticacion con Firebase, cuentas con varias entradas competidoras, partidos, predicciones, control de pagos, calculo de puntos y leaderboard.

## Stack

- Node.js + Express
- MongoDB Atlas + Mongoose
- Firebase Authentication + Firebase Admin
- HTML, CSS y JavaScript vanilla

## Estructura

```txt
polla-mundialista/
├── server/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── index.js
├── client/
│   ├── index.html
│   ├── dashboard.html
│   ├── leaderboard.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

## Requisitos

- Node.js 18 o superior
- Cuenta y cluster en MongoDB Atlas

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

3. Configura tus variables:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/polla_mundialista?retryWrites=true&w=majority
PORT=3000
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-ABCDEFGH
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## Configuracion de Firebase Auth

1. Crea un proyecto en Firebase.
2. Habilita `Email/Password` en `Authentication > Sign-in method`.
3. Agrega `localhost` en `Authentication > Settings > Authorized domains`.
4. Copia la configuracion web del proyecto a las variables `FIREBASE_*` del `.env`.
5. Crea una Service Account en `Project settings > Service accounts` y copia `client_email`, `project_id` y `private_key` al `.env`.

4. Ejecuta el servidor:

```bash
npm run dev
```

5. Abre:

```txt
http://localhost:3000
```

## Usuario admin

La app usa un campo simple `isAdmin` en el modelo `User`. Primero registra un usuario normal desde la interfaz. Luego, en MongoDB Atlas, actualiza ese usuario:

```js
{
  "isAdmin": true
}
```

Con ese usuario podras crear partidos y registrar resultados reales desde el dashboard.

## Cargar fixture de ejemplo

Cuando ya tengas `.env` configurado con MongoDB Atlas, puedes cargar partidos organizados por grupos y fases finales:

```bash
npm run seed:matches
```

El script borra los partidos existentes e inserta un fixture demo con grupos A/B, cuartos, semifinal y final.

## Reglas de prediccion

- Cada cuenta puede crear varias entradas o perfiles de competencia.
- Cada entrada puede guardar una prediccion por partido.
- La prediccion se actualiza con upsert si la entrada vuelve a guardarla.
- Las predicciones se bloquean automaticamente cuando `matchDate` ya paso.
- Cuando un admin guarda el resultado real, se recalculan los puntos.
- Desde el modal de perfil puedes crear y eliminar entradas; al eliminar una entrada se borran tambien sus predicciones.

## Puntuacion

- Marcador exacto: 3 puntos
- Ganador o empate correcto, pero marcador distinto: 1 punto
- Resultado incorrecto: 0 puntos

## Endpoints principales

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/config`

### Entradas

- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/active`

### Partidos

- `GET /api/matches`
- `POST /api/matches` admin
- `PATCH /api/matches/:id/result` admin

### Predicciones

- `POST /api/predictions/:matchId`

### Leaderboard

- `GET /api/leaderboard`

### Admin

- `GET /api/admin/settings`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/payment`
- `POST /api/admin/worst-team`
- `POST /api/admin/predictions-lock`
- `POST /api/admin/reset-pruebas`

## Pagos

- El pago ahora se marca por `Entry`, no por `User`.
- El leaderboard muestra una insignia visual cuando `entry.isPaid` es verdadero y ordena las entradas por puntos.
- Si una persona crea 3 entradas, puedes marcar 1, 2 o 3 como pagadas de forma independiente.
- El panel de administracion permite cambiar ese estado sin tocar puntos, predicciones ni el rol de admin.

## Unificar cuentas duplicadas

Si un mismo jugador termino con varios usuarios, puedes mover sus predicciones a entradas de una sola cuenta sin borrar los datos de la competencia.

Primero crea un respaldo:

```bash
npm run backup:data -- --label before-merge
```

Ese comando guarda un snapshot en `.backups/`.

Script disponible:

```bash
npm run merge:accounts -- --target <usuario_destino> --source <usuario_origen_1> --source <usuario_origen_2> --dry-run
```

- `--target` puede ser `id`, `username` o `email`.
- `--source` puede repetirse varias veces.
- `--dry-run` muestra el plan sin escribir nada.
- `--delete-sources` es obligatorio para la ejecucion real y elimina las cuentas origen despues de mover sus entradas y predicciones.
- El merge real crea un backup automatico antes de tocar la base, salvo que uses `--skip-backup`.

Ejemplo real:

```bash
npm run merge:accounts -- --target juan@mail.com --source juan.1@mail.com --source juan.2@mail.com --delete-sources
```

El script crea una entrada por cada cuenta origen, reasigna sus predicciones a esas entradas y luego recalcula los puntos.

Si necesitas volver atras:

```bash
npm run restore:data -- --latest --yes
```

## Deploy en Render.com

1. Sube el proyecto a GitHub.
2. Crea un nuevo Web Service en Render.
3. Conecta el repositorio.
4. Configura:

```txt
Build Command: npm install
Start Command: npm start
```

5. Agrega variables de entorno en Render:

```txt
MONGO_URI
PORT
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_APP_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Render asigna `PORT` automaticamente, pero puedes dejarlo configurado si lo necesitas. El servidor Express sirve la carpeta `client/` como archivos estaticos.

## Notas

- Firebase maneja la sesion del usuario y el backend verifica su `ID token`.
- La app usa `isAdmin` para el panel de administracion y `Entry.isPaid` para el control de pagos.
- El frontend usa `localStorage` para guardar la cuenta, las entradas y la entrada activa, y refresca el token con Firebase.
- Todos los endpoints no-auth estan protegidos con middleware de Firebase Auth.
