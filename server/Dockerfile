FROM node:20-alpine

WORKDIR /app

# Copie les fichiers de dépendances d'abord (optimise le cache Docker)
COPY package*.json ./

RUN npm install

# Le code source sera monté en volume (pas copié) pour le hot reload
# Cette copie sert uniquement au build de production
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
