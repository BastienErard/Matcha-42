# Matcha - Frontend

Interface utilisateur React pour l'application de dating Matcha.

## Technologies utilisees

| Technologie | Version | Description |
|-------------|---------|-------------|
| React | 19.x | Bibliotheque UI |
| TypeScript | 5.9 | Typage statique |
| Vite | 7.x | Build tool et dev server |
| Tailwind CSS | 4.x | Framework CSS utility-first |
| React Router | 7.x | Routing cote client |
| Socket.io Client | 4.8 | Communication temps reel |
| Leaflet | 1.9 | Cartes interactives |
| React-Leaflet | 5.x | Integration Leaflet/React |

## Architecture

```
src/
├── api/                     # Couche d'acces au backend
│   ├── client.ts           # Client HTTP generique
│   ├── auth.ts             # Endpoints authentification
│   ├── profile.ts          # Endpoints profil
│   ├── users.ts            # Endpoints utilisateurs
│   ├── browse.ts           # Endpoints suggestions
│   ├── photos.ts           # Endpoints photos
│   ├── chat.ts             # Endpoints messagerie
│   ├── notifications.ts    # Endpoints notifications
│   ├── location.ts         # Endpoints geolocalisation
│   └── index.ts            # Re-exports
│
├── components/
│   ├── common/             # Composants partages
│   │   ├── NotificationDropdown.tsx  # Menu des notifications
│   │   ├── ProfileMap.tsx            # Carte de localisation
│   │   └── UserProfileModal.tsx      # Modal profil utilisateur
│   │
│   ├── layout/             # Structure de page
│   │   ├── Header.tsx      # Barre de navigation
│   │   ├── Footer.tsx      # Pied de page
│   │   └── Layout.tsx      # Wrapper global
│   │
│   └── ui/                 # Composants UI generiques
│       └── ...
│
├── contexts/               # Contextes React (etat global)
│   ├── AuthContext.tsx     # Authentification
│   ├── ThemeContext.tsx    # Theme clair/sombre
│   └── LanguageContext.tsx # Internationalisation
│
├── hooks/                  # Hooks personnalises
│   ├── useAuth.ts          # Acces au contexte auth
│   ├── useSocket.ts        # Connexion Socket.io
│   ├── useGeolocation.ts   # Geolocalisation navigateur
│   ├── useTheme.ts         # Acces au contexte theme
│   └── useTranslation.ts   # Acces aux traductions
│
├── pages/                  # Pages de l'application
│   ├── auth/              # Pages d'authentification
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── VerifyEmailPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   │
│   ├── browse/            # Navigation/decouverte
│   │   └── DiscoverPage.tsx
│   │
│   ├── profile/           # Gestion du profil
│   │   └── ProfilePage.tsx
│   │
│   ├── onboarding/        # Configuration initiale
│   │   └── OnboardingPage.tsx
│   │
│   ├── messages/          # Messagerie
│   │   └── MessagesPage.tsx
│   │
│   ├── HomePage.tsx       # Page d'accueil
│   └── NotFoundPage.tsx   # Page 404
│
├── routes/                # Configuration du routing
│   ├── index.tsx          # Definition des routes
│   ├── ProtectedRoute.tsx # Route necessitant auth
│   └── GuestRoute.tsx     # Route pour non-connectes
│
├── i18n/                  # Traductions
│   ├── fr.json           # Francais
│   └── en.json           # Anglais
│
├── utils/                 # Utilitaires
│   └── ...
│
├── types/                 # Types TypeScript
│   └── ...
│
├── App.tsx               # Composant racine
├── main.tsx              # Point d'entree
└── index.css             # Styles globaux
```

## Pages et fonctionnalites

### Pages publiques

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | HomePage | Page d'accueil (landing) |
| `/login` | LoginPage | Formulaire de connexion |
| `/register` | RegisterPage | Formulaire d'inscription |
| `/forgot-password` | ForgotPasswordPage | Demande de reset |
| `/reset-password/:token` | ResetPasswordPage | Nouveau mot de passe |
| `/verify/:token` | VerifyEmailPage | Verification email |

### Pages protegees

| Route | Composant | Description |
|-------|-----------|-------------|
| `/onboarding` | OnboardingPage | Configuration du profil |
| `/discover` | DiscoverPage | Suggestions de profils |
| `/profile` | ProfilePage | Mon profil |
| `/messages` | MessagesPage | Conversations |

## Gestion de l'etat

### AuthContext

Gere l'authentification de l'utilisateur :

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasProfilePicture: boolean;
  login: (username: string, password: string) => Promise<Result>;
  register: (data: RegisterData) => Promise<Result>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### ThemeContext

Gere le theme clair/sombre :

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### LanguageContext

Gere l'internationalisation FR/EN :

```typescript
interface LanguageContextType {
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  t: (key: string) => string;
}
```

## Hooks personnalises

### useAuth

Acces simplifie au contexte d'authentification :

```typescript
const { user, login, logout, isLoading } = useAuth();
```

### useSocket

Gestion de la connexion Socket.io avec support des evenements :

```typescript
const { socket, isConnected } = useSocket({
  onNotification: (notif) => { /* ... */ },
  onMessage: (msg) => { /* ... */ },
  onOnlineStatus: (status) => { /* ... */ },
});
```

### useGeolocation

Acces a la geolocalisation du navigateur :

```typescript
const {
  position,
  error,
  isLoading,
  requestPermission
} = useGeolocation();
```

## Couche API

Le client HTTP (`api/client.ts`) encapsule les appels fetch :

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string };
}

// Utilisation
const result = await apiRequest<UserProfile>('/profile/me');
if (result.success) {
  console.log(result.data);
}
```

Caracteristiques :
- Gestion automatique du Content-Type JSON
- Credentials inclus (cookies)
- Redirection automatique sur 401 (session expiree)
- Gestion des erreurs reseau

## Routing

### ProtectedRoute

Protege les routes necessitant une authentification :

```typescript
<ProtectedRoute requiresOnboarding={true}>
  <DiscoverPage />
</ProtectedRoute>
```

Options :
- Redirige vers `/login` si non connecte
- Redirige vers `/onboarding` si onboarding non complete

### GuestRoute

Redirige les utilisateurs connectes vers `/discover` :

```typescript
<GuestRoute>
  <LoginPage />
</GuestRoute>
```

## Composants cles

### Header

Barre de navigation responsive avec :
- Logo et navigation principale
- Menu burger en mode mobile
- Dropdown des notifications (temps reel)
- Avatar utilisateur avec menu
- Indicateur de messages non lus

### NotificationDropdown

Affiche les notifications en temps reel :
- Likes recus
- Visites de profil
- Messages
- Matchs
- Unlikes

### ProfileMap

Carte Leaflet pour :
- Afficher la position actuelle
- Modifier manuellement la localisation
- Reverse geocoding (coords → adresse)

### UserProfileModal

Modal de visualisation d'un profil avec :
- Carrousel de photos
- Informations du profil
- Statut en ligne
- Boutons d'action (like, block, report)

## Internationalisation

Les traductions sont stockees dans `src/i18n/` :

```json
// fr.json
{
  "auth": {
    "login": "Connexion",
    "register": "Inscription"
  }
}

// en.json
{
  "auth": {
    "login": "Login",
    "register": "Register"
  }
}
```

Utilisation avec le hook :

```typescript
const { t } = useTranslation();
return <h1>{t('auth.login')}</h1>;
```

## Styling

Tailwind CSS est configure avec le plugin Vite officiel :

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### Classes utilitaires courantes

```jsx
// Bouton principal
<button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg">

// Card
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

// Input
<input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500">
```

### Theme sombre

Le theme sombre utilise la classe `dark` sur le HTML root :

```css
/* Styles automatiques avec dark: prefix */
.dark .bg-white { background: #1f2937; }
```

## Socket.io

### Configuration

Le hook `useSocket` gere la connexion comme un singleton :

```typescript
// Une seule connexion globale
let globalSocket: Socket | null = null;

export function useSocket(options) {
  if (!globalSocket) {
    globalSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  // ...
}
```

### Evenements ecoutes

| Evenement | Handler | Description |
|-----------|---------|-------------|
| `notification` | `onNotification` | Nouvelle notification |
| `message` | `onMessage` | Nouveau message |
| `onlineStatus` | `onOnlineStatus` | Statut en ligne |

## Scripts disponibles

```bash
# Developpement avec hot reload
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint
```

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| VITE_API_URL | URL de l'API backend | http://localhost:3000 |

## Docker

Le Dockerfile configure un serveur de developpement Vite :

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

## Structure des pages principales

### DiscoverPage

- Grille de profils suggeres
- Filtres (age, distance, fame, tags)
- Tri (distance, age, fame, tags communs)
- Click sur profil → Modal UserProfileModal

### ProfilePage

- Edition des informations personnelles
- Upload de photos (max 5)
- Selection de la photo de profil
- Gestion des tags/interets
- Modification de la localisation
- Historique des visites et likes recus

### MessagesPage

- Liste des conversations
- Interface de chat temps reel
- Indicateur de messages non lus
- Statut en ligne des correspondants

### OnboardingPage

Wizard de configuration initiale :
1. Genre et preferences
2. Date de naissance
3. Biographie
4. Tags/interets
5. Upload de photos

## Performance

- **Code splitting** : Routes chargees dynamiquement
- **Socket singleton** : Une seule connexion Socket.io
- **Optimistic updates** : UI reactive avant confirmation serveur
- **Lazy loading** : Images chargees a la demande
