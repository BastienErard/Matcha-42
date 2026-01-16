#!/bin/sh

echo "⏳ Attente de la base de données..."
sleep 5

echo "🌱 Vérification du seeding..."
npx ts-node src/scripts/seed.ts

echo "🚀 Démarrage du serveur..."
npm run dev
