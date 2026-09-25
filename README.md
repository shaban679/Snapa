# Snapa Backend — Awamu 1

API ya msingi: Auth, Users, Posts (feed, likes, comments).

## Jinsi ya Kuanza

1. Weka PostgreSQL (mfano kupitia Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`)
2. Nakili `.env.example` kuwa `.env` na jaza `DATABASE_URL` yako
3. Sakinisha dependencies:
   ```
   npm install
   ```
4. Endesha migration ya database:
   ```
   npm run prisma:migrate
   ```
5. Anzisha server:
   ```
   npm run dev
   ```

Server itaendesha kwenye `http://localhost:4000`.

## Endpoints Zilizopo

- `POST /auth/register` — { username, email, password }
- `POST /auth/login` — { email, password }
- `GET /users/me` — profile yako (inahitaji token)
- `GET /users/:username` — profile ya umma
- `PATCH /users/me` — hariri bio/avatar
- `GET /posts` — feed
- `POST /posts` — tengeneza post (inahitaji token)
- `POST /posts/:id/like` — penda/ondoa like (inahitaji token)
- `GET /posts/:id/comments`
- `POST /posts/:id/comments` (inahitaji token)
- `POST /follow/:userId` — fuata mtumiaji (inahitaji token)
- `DELETE /follow/:userId` — acha kufuata (inahitaji token)
- `GET /follow/:userId/followers`
- `GET /follow/:userId/following`
- `GET /notifications` — arifa zako (inahitaji token)
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `GET /stories` — stories za watu unaowafuata (inahitaji token)
- `POST /stories` — tengeneza story, inaisha baada ya masaa 24 (inahitaji token)
- `GET /messages` — orodha ya mazungumzo (inahitaji token)
- `GET /messages/:userId` — historia ya mazungumzo na mtu fulani (inahitaji token)

### Direct Messages za Real-time (WebSocket)
Unganisha na Socket.io ukitoa token:
```js
const socket = io('http://localhost:4000', { auth: { token: JWT_TOKEN } });
socket.emit('dm:send', { to: receiverId, text: 'Habari!' });
socket.on('dm:new', (message) => { /* onyesha ujumbe mpya */ });
socket.emit('dm:typing', { to: receiverId });
socket.on('dm:typing', ({ from }) => { /* onyesha "anaandika..." */ });
```

### Upload ya Picha/Video
- `POST /upload` — multipart/form-data na field `file` (inahitaji token), inarudisha `{ url }`
- Bila `S3_BUCKET`/`S3_ACCESS_KEY`/`S3_SECRET_KEY` kwenye `.env`, faili zinahifadhiwa kwenye `/uploads` ya server (nzuri kwa dev tu — kwa production weka S3 au Cloudflare R2)

### Reels
- `GET /reels`
- `POST /reels` — { videoUrl, caption } (inahitaji token)
- `POST /reels/:id/like` (inahitaji token)

### AI Content Assistant
- `POST /ai/generate-caption` — { idea } -> { caption } (inahitaji token, inahitaji `ANTHROPIC_API_KEY`)

### Push Notifications
- `PATCH /users/me/push-token` — { pushToken } (Expo push token, inahitaji token)
- Arifa zinatumwa moja kwa moja kwa likes, comments, follows, na DM mpya

Kwa endpoints zinazohitaji token, ongeza header:
```
Authorization: Bearer <token>
```

## Hatua Zinazofuata (angalia blueprint)
- Upload ya moja kwa moja ya picha/video kwenda S3/R2
- Stories, Reels, Direct Messages (WebSockets), Notifications
- Endpoint ya AI Content Assistant (`POST /ai/generate-caption`) kwa kutumia Claude API
