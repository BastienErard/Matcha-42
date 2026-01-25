# Matcha

**Projet 42 - Application de dating web full-stack**

Matcha est une application de rencontre permettant aux utilisateurs de s'inscrire, completer leur profil, rechercher et consulter d'autres profils, exprimer leur interet via un systeme de "like", et communiquer en temps reel avec leurs matchs.

## Apercu du projet

Ce projet a ete realise dans le cadre du cursus de specialisation web de l'ecole 42. L'objectif etait de developper une application de dating complete, de l'inscription jusqu'a la mise en relation des utilisateurs.

### Fonctionnalites principales

- **Authentification securisee** : Inscription, connexion, verification par email, reinitialisation de mot de passe
- **Profils utilisateurs** : Genre, preferences sexuelles, biographie, centres d'interet (tags), photos (jusqu'a 5)
- **Geolocalisation** : Positionnement GPS, fallback IP, modification manuelle
- **Systeme de matching** : Suggestions intelligentes basees sur la localisation, les tags communs et le fame rating
- **Recherche avancee** : Filtres par age, localisation, fame rating et tags
- **Interactions** : Likes, visites de profil, blocage, signalement
- **Chat en temps reel** : Messagerie instantanee entre utilisateurs connectes (matchs mutuels)
- **Notifications en temps reel** : Likes, visites, messages, matchs, unlikes

## Stack technique

### Backend
- **Runtime** : Node.js avec TypeScript
- **Framework** : Express.js (micro-framework)
- **Base de donnees** : MySQL 8.0
- **Temps reel** : Socket.io
- **Authentification** : JWT (JSON Web Tokens) via cookies HttpOnly
- **Email** : Nodemailer (SMTP)

### Frontend
- **Framework** : React 19 avec TypeScript
- **Build tool** : Vite 7
- **Styling** : Tailwind CSS 4
- **Routing** : React Router DOM 7
- **Cartes** : Leaflet / React-Leaflet
- **Temps reel** : Socket.io Client

### Infrastructure
- **Conteneurisation** : Docker & Docker Compose
- **Base de donnees** : MySQL 8.0
- **Administration BDD** : phpMyAdmin

## Structure du projet

```
Matcha-42/
├── client/                 # Application frontend React
│   ├── src/
│   │   ├── api/           # Appels API vers le backend
│   │   ├── components/    # Composants React reutilisables
│   │   ├── contexts/      # Contextes React (Auth, Theme, Language)
│   │   ├── hooks/         # Hooks personnalises
│   │   ├── pages/         # Pages de l'application
│   │   ├── routes/        # Configuration du routing
│   │   └── i18n/          # Internationalisation (FR/EN)
│   └── package.json
│
├── server/                 # API backend Express
│   ├── src/
│   │   ├── config/        # Configuration (database)
│   │   ├── controllers/   # Logique des endpoints
│   │   ├── middlewares/   # Middlewares (auth, upload)
│   │   ├── routes/        # Definition des routes
│   │   ├── services/      # Logique metier
│   │   ├── socket/        # Gestion Socket.io
│   │   ├── templates/     # Templates emails
│   │   └── utils/         # Utilitaires (JWT, validation)
│   └── package.json
│
├── database/              # Scripts SQL
│   ├── init.sql          # Schema de la base de donnees
│   └── seed.sql          # Donnees de test
│
├── uploads/               # Photos uploadees par les utilisateurs
├── docker-compose.yml     # Orchestration des conteneurs
└── .env.example          # Variables d'environnement exemple
```

## Installation et lancement

### Prerequisites

- Docker et Docker Compose
- Node.js 18+ (pour le developpement local)

### Configuration

1. Cloner le repository :
```bash
git clone https://github.com/BastienErard/Matcha-42.git
cd Matcha-42
```

2. Copier et configurer les variables d'environnement :
```bash
cp .env.example .env
```

3. Editer le fichier `.env` avec vos propres valeurs :
```env
# Database
MYSQL_HOST=database
MYSQL_PORT=3306
MYSQL_USER=matcha_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=matcha

# Backend
PORT=3000
JWT_SECRET=your_jwt_secret_here

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

### Lancement avec Docker

```bash
docker-compose up --build
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **phpMyAdmin** : http://localhost:8080

### Lancement en developpement (sans Docker)

**Backend** :
```bash
cd server
npm install
npm run dev
```

**Frontend** :
```bash
cd client
npm install
npm run dev
```

### Seeding de la base de donnees

Pour generer 500 profils de test (requis par le sujet) :
```bash
cd server
npm run seed
```

## Architecture et patterns

### Backend (MVC-like)
- **Routes** : Definition des endpoints et middlewares associes
- **Controllers** : Validation des requetes et orchestration
- **Services** : Logique metier et acces a la base de donnees

### Frontend
- **Context API** : Gestion de l'etat global (authentification, theme, langue)
- **Custom Hooks** : Logique reutilisable (useAuth, useSocket, useGeolocation)
- **Protected Routes** : Routes necessitant une authentification

## Securite

Le projet implemente les mesures de securite suivantes :
- Hashage des mots de passe avec bcrypt
- Protection contre les injections SQL (requetes parametrees)
- Sanitization des inputs (sanitize-html)
- Tokens JWT stockes dans des cookies HttpOnly
- Validation des formulaires cote client et serveur
- Protection CORS configuree
- Verification des types de fichiers uploades

## Base de donnees

Le schema comprend les tables suivantes :
- `users` : Informations d'authentification
- `profiles` : Donnees de profil detaillees
- `photos` : Photos uploadees (max 5 par utilisateur)
- `tags` : Centres d'interet
- `user_tags` : Association utilisateurs-tags
- `likes` : Systeme de likes
- `visits` : Historique des visites de profil
- `blocks` : Utilisateurs bloques
- `reports` : Signalements de faux comptes
- `conversations` : Conversations entre matchs
- `messages` : Messages individuels
- `notifications` : Notifications en temps reel

## API Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/logout | Deconnexion |
| GET | /api/auth/verify/:token | Verification email |
| POST | /api/auth/forgot-password | Demande reset mot de passe |
| POST | /api/auth/reset-password/:token | Reset mot de passe |
| GET | /api/profile/me | Profil utilisateur connecte |
| PUT | /api/profile | Mise a jour du profil |
| GET | /api/users/:id | Profil d'un utilisateur |
| POST | /api/users/:id/like | Liker un utilisateur |
| DELETE | /api/users/:id/like | Unliker un utilisateur |
| POST | /api/users/:id/block | Bloquer un utilisateur |
| DELETE | /api/users/:id/block | Debloquer un utilisateur |
| POST | /api/users/:id/report | Signaler un utilisateur |
| GET | /api/browse | Suggestions de profils |
| GET | /api/chat/conversations | Liste des conversations |
| GET | /api/chat/conversations/:id | Messages d'une conversation |
| POST | /api/chat/conversations/:id | Envoyer un message |
| GET | /api/notifications | Liste des notifications |
| PUT | /api/notifications/read | Marquer comme lues |

## Temps reel (Socket.io)

Evenements emis par le serveur :
- `notification` : Nouvelle notification (like, visite, match, unlike)
- `message` : Nouveau message dans une conversation
- `onlineStatus` : Changement de statut en ligne d'un utilisateur

## Auteur

Projet realise par **Bastien Erard** dans le cadre du cursus 42.

## Licence

Ce projet est realise a des fins educatives dans le cadre du cursus 42.
