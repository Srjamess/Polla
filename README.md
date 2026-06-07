# Polla Mundialista

Aplicacion full-stack para hacer predicciones de partidos del Mundial. Incluye autenticacion con Firebase, usuarios, partidos, predicciones, control de pagos, calculo de puntos y leaderboard.

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

- Cada usuario puede guardar una prediccion por partido.
- La prediccion se actualiza con upsert si el usuario vuelve a guardarla.
- Las predicciones se bloquean automaticamente cuando `matchDate` ya paso.
- Cuando un admin guarda el resultado real, se recalculan los puntos.

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

- El modelo `User` incluye `isPaid` para marcar si un usuario ya pago la apuesta.
- El leaderboard muestra una insignia visual cuando `isPaid` es verdadero.
- El panel de administracion permite cambiar ese estado sin tocar puntos, predicciones ni el rol de admin.

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
- La app usa `isAdmin` para el panel de administracion y `isPaid` para el control de pagos.
- El frontend usa `localStorage` para guardar el perfil y refresca el token con Firebase.
- Todos los endpoints no-auth estan protegidos con middleware de Firebase Auth.
