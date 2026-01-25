# Matcha - Backend

API REST et serveur temps reel pour l'application de dating Matcha.

## Technologies utilisees

| Technologie | Version | Description |
|-------------|---------|-------------|
| Node.js | 18+ | Runtime JavaScript |
| TypeScript | 5.9 | Typage statique |
| Express | 5.x | Micro-framework web |
| MySQL | 8.0 | Base de donnees relationnelle |
| Socket.io | 4.8 | Communication temps reel |
| JWT | - | Authentification via tokens |
| Nodemailer | 7.x | Envoi d'emails |
| Multer | 2.x | Upload de fichiers |
| bcryptjs | 3.x | Hashage de mots de passe |

## Architecture

Le backend suit une architecture en couches inspiree du pattern MVC :

```
src/
├── config/
│   └── database.ts          # Configuration du pool MySQL
│
├── controllers/             # Logique des endpoints
│   ├── auth.controller.ts   # Inscription, connexion, verification
│   ├── profile.controller.ts # Gestion du profil utilisateur
│   ├── users.controller.ts  # Consultation des autres profils
│   ├── browse.controller.ts # Suggestions et recherche
│   ├── photo.controller.ts  # Upload et gestion des photos
│   ├── likes.controller.ts  # Systeme de likes
│   ├── blocks.controller.ts # Blocage d'utilisateurs
│   ├── chat.controller.ts   # Messagerie
│   ├── notifications.controller.ts # Notifications
│   ├── location.controller.ts # Geolocalisation
│   └── tag.controller.ts    # Tags/interets
│
├── services/                # Logique metier
│   ├── auth.service.ts      # Logique d'authentification
│   ├── profile.service.ts   # Gestion des profils
│   ├── users.service.ts     # Acces aux donnees utilisateurs
│   ├── browse.service.ts    # Algorithme de suggestions
│   ├── photo.service.ts     # Manipulation des photos
│   ├── likes.service.ts     # Gestion des likes et matchs
│   ├── blocks.service.ts    # Logique de blocage
│   ├── chat.service.ts      # Logique de messagerie
│   ├── notifications.service.ts # Creation de notifications
│   ├── location.service.ts  # Gestion de la localisation
│   ├── geocoding.service.ts # Reverse geocoding (coords -> ville)
│   ├── famerating.service.ts # Calcul du fame rating
│   ├── email.service.ts     # Envoi d'emails
│   └── tag.service.ts       # Gestion des tags
│
├── routes/                  # Definition des routes
│   ├── auth.routes.ts
│   ├── profile.routes.ts
│   ├── users.routes.ts
│   ├── browse.routes.ts
│   ├── photo.routes.ts
│   ├── chat.routes.ts
│   ├── notifications.routes.ts
│   ├── location.routes.ts
│   └── tag.routes.ts
│
├── middlewares/
│   ├── auth.middleware.ts   # Verification du token JWT
│   └── upload.middleware.ts # Configuration Multer
│
├── socket/
│   ├── index.ts             # Configuration Socket.io
│   └── emitter.ts           # Emission d'evenements
│
├── templates/
│   └── email.ts             # Templates HTML pour emails
│
├── utils/
│   ├── jwt.ts               # Generation/verification JWT
│   ├── password.ts          # Hashage/verification bcrypt
│   ├── validation.ts        # Validation des donnees
│   └── date.ts              # Utilitaires de date
│
├── types/
│   └── express.d.ts         # Extension des types Express
│
├── scripts/
│   └── seed.ts              # Script de seeding (500 profils)
│
└── index.ts                 # Point d'entree de l'application
```

## Flux de donnees

```
Requete HTTP
     │
     ▼
  Routes (validation de route, middlewares)
     │
     ▼
  Controllers (validation des donnees, orchestration)
     │
     ▼
  Services (logique metier, requetes SQL)
     │
     ▼
  Base de donnees MySQL
```

## API Endpoints detailles

### Authentification (`/api/auth`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | /register | Inscription d'un nouvel utilisateur | Non |
| POST | /login | Connexion (set cookie JWT) | Non |
| POST | /logout | Deconnexion (clear cookie) | Oui |
| GET | /verify/:token | Verification de l'email | Non |
| POST | /forgot-password | Demande de reset mot de passe | Non |
| POST | /reset-password/:token | Reset du mot de passe | Non |

### Profil (`/api/profile`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | /me | Recupere le profil complet de l'utilisateur connecte | Oui |
| PUT | / | Met a jour le profil (genre, preferences, bio, tags) | Oui |
| PUT | /onboarding | Complete l'onboarding initial | Oui |
| PUT | /location | Met a jour la localisation | Oui |
| GET | /location/source | Recupere la source de localisation actuelle | Oui |
| POST | /location/ip | Obtient la localisation par IP | Oui |
| GET | /visits | Liste des visiteurs du profil | Oui |
| GET | /likes | Liste des utilisateurs qui ont like | Oui |

### Utilisateurs (`/api/users`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | /:id | Profil public d'un utilisateur | Oui |
| POST | /:id/like | Like un utilisateur | Oui |
| DELETE | /:id/like | Unlike un utilisateur | Oui |
| POST | /:id/block | Bloque un utilisateur | Oui |
| DELETE | /:id/block | Debloque un utilisateur | Oui |
| POST | /:id/report | Signale un faux compte | Oui |

### Navigation (`/api/browse`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | / | Suggestions de profils avec filtres | Oui |

Parametres de query :
- `ageMin`, `ageMax` : Filtre par age
- `fameMin`, `fameMax` : Filtre par fame rating
- `distance` : Distance maximale en km
- `tags` : Liste de tags (comma-separated)
- `sortBy` : Critere de tri (distance, age, fame, tags)
- `sortOrder` : Ordre de tri (asc, desc)

### Photos (`/api/photos`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | /upload | Upload une photo (max 5) | Oui |
| DELETE | /:id | Supprime une photo | Oui |
| PUT | /:id/profile | Definit comme photo de profil | Oui |

### Chat (`/api/chat`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | /conversations | Liste des conversations | Oui |
| GET | /conversations/:id | Messages d'une conversation | Oui |
| POST | /conversations/:id | Envoie un message | Oui |

### Notifications (`/api/notifications`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | / | Liste des notifications | Oui |
| PUT | /read | Marque toutes comme lues | Oui |
| PUT | /:id/read | Marque une notification comme lue | Oui |

### Tags (`/api/tags`)

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | / | Liste de tous les tags disponibles | Non |

## Authentification

L'authentification utilise des **JSON Web Tokens (JWT)** stockes dans des cookies HttpOnly :

```typescript
// Generation du token (auth.service.ts)
const token = jwt.sign(
  { userId: user.id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Stockage dans cookie HttpOnly
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});
```

Le middleware `authMiddleware` verifie automatiquement le token pour les routes protegees.

## Socket.io - Temps reel

### Configuration

Le serveur Socket.io partage le meme serveur HTTP qu'Express :

```typescript
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});
```

### Authentification Socket

Les sockets utilisent le meme systeme JWT que l'API REST :

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token || cookie.parse(headers.cookie).token;
  const decoded = verifyToken(token);
  socket.data.userId = decoded.userId;
  next();
});
```

### Evenements emis

| Evenement | Payload | Description |
|-----------|---------|-------------|
| `notification` | `{ id, type, fromUser, createdAt }` | Nouvelle notification |
| `message` | `{ id, conversationId, senderId, content, createdAt }` | Nouveau message |
| `onlineStatus` | `{ userId, isOnline }` | Changement de statut |

### Gestion du statut en ligne

Le serveur maintient une Map des sockets actifs par utilisateur :

```typescript
const userSockets = new Map<number, Set<string>>();

// Connexion → ajoute le socket
userSockets.get(userId).add(socket.id);

// Deconnexion → retire le socket
userSockets.get(userId).delete(socket.id);

// Si plus de sockets → utilisateur hors ligne
if (sockets.size === 0) {
  await updateOnlineStatus(userId, false);
}
```

## Fame Rating

Le **fame rating** est calcule automatiquement en fonction de :

- Nombre de likes recus (+)
- Nombre de visites recues (+)
- Nombre de blocages recus (-)
- Completude du profil (+)

```typescript
// famerating.service.ts
export const recalculateFameRating = async (userId: number) => {
  // Base : 50
  // + 2 points par like recu
  // + 1 point par visite recue
  // - 5 points par blocage recu
  // Plafonne entre 0 et 100
};
```

## Algorithme de suggestions

Le service `browse.service.ts` implemente l'algorithme de suggestions :

1. **Filtrage de base** :
   - Exclut l'utilisateur connecte
   - Exclut les utilisateurs bloques (dans les deux sens)
   - Filtre par preferences sexuelles (compatibilite mutuelle)

2. **Scoring** :
   - Distance geographique (formule de Haversine)
   - Nombre de tags en commun
   - Fame rating

3. **Tri et pagination** :
   - Tri par critere choisi (distance, age, fame, tags)
   - Pagination pour performance

## Securite

### Validation des donnees

```typescript
// Exemple de validation dans un controller
if (!email || !username || !password) {
  return res.status(400).json({ code: 'MISSING_FIELDS' });
}

if (!isValidEmail(email)) {
  return res.status(400).json({ code: 'INVALID_EMAIL' });
}

if (isCommonPassword(password)) {
  return res.status(400).json({ code: 'COMMON_PASSWORD' });
}
```

### Protection SQL

Toutes les requetes utilisent des requetes parametrees :

```typescript
// Correct
await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

// Jamais de concatenation directe
// pool.query(`SELECT * FROM users WHERE id = ${userId}`); // DANGEREUX
```

### Sanitization

Le package `sanitize-html` est utilise pour nettoyer les inputs :

```typescript
import sanitizeHtml from 'sanitize-html';

const cleanBio = sanitizeHtml(biography, {
  allowedTags: [],
  allowedAttributes: {}
});
```

### Upload de fichiers

Multer est configure pour :
- Limiter la taille des fichiers (5MB)
- Verifier le type MIME (images uniquement)
- Generer des noms de fichiers uniques

## Scripts disponibles

```bash
# Developpement avec hot-reload
npm run dev

# Build pour production
npm run build

# Lancement en production
npm start

# Seeding de la base de donnees (500 profils)
npm run seed
```

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| PORT | Port du serveur | 3000 |
| MYSQL_HOST | Hote MySQL | database |
| MYSQL_PORT | Port MySQL | 3306 |
| MYSQL_USER | Utilisateur MySQL | matcha_user |
| MYSQL_PASSWORD | Mot de passe MySQL | secret |
| MYSQL_DATABASE | Nom de la base | matcha |
| JWT_SECRET | Cle secrete JWT | random_string |
| FRONTEND_URL | URL du frontend | http://localhost:5173 |
| SMTP_HOST | Hote SMTP | smtp.gmail.com |
| SMTP_PORT | Port SMTP | 587 |
| SMTP_USER | Email SMTP | email@gmail.com |
| SMTP_PASS | Mot de passe SMTP | app_password |
| SMTP_FROM | Email expediteur | email@gmail.com |
| UPLOAD_DIR | Dossier uploads | /app/uploads |

## Docker

Le Dockerfile configure un environnement Node.js :

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

## Base de donnees

Le pool de connexions MySQL est configure avec :
- Maximum 10 connexions simultanees
- Attente automatique si toutes les connexions sont utilisees
- Reconnexion automatique en cas de perte de connexion

```typescript
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});
```
