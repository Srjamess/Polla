# Polla Mundialista

Aplicacion full-stack para hacer predicciones de partidos del Mundial. Incluye autenticacion con JWT, usuarios, partidos, predicciones, calculo de puntos y leaderboard.

## Stack

- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT + bcrypt
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
JWT_SECRET=un-secreto-largo-y-seguro
PORT=3000
```

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

### Partidos

- `GET /api/matches`
- `POST /api/matches` admin
- `PATCH /api/matches/:id/result` admin

### Predicciones

- `POST /api/predictions/:matchId`

### Leaderboard

- `GET /api/leaderboard`

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
JWT_SECRET
PORT
```

Render asigna `PORT` automaticamente, pero puedes dejarlo configurado si lo necesitas. El servidor Express sirve la carpeta `client/` como archivos estaticos.

## Notas

- No hay verificacion por email.
- No hay sistema avanzado de roles.
- El frontend usa `localStorage` para guardar el JWT.
- Todos los endpoints no-auth estan protegidos con middleware JWT.
