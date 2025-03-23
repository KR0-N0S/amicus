#!/bin/bash

# Utwórz strukturę katalogów
mkdir -p /var/www/amicus
cd /var/www/amicus

# Sklonuj repozytorium backendu (jeśli korzystasz z gita)
# git clone https://your-repository-url.git backend
# cd backend

# Alternatywnie, jeśli nie korzystasz z gita
mkdir -p backend
cd backend

# Instalacja zależności
npm install

# Tworzenie pliku .env (edytuj zgodnie z potrzebami)
cat > .env << EOF
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=amicus
DB_PASSWORD=twoje_haslo
DB_NAME=amicusdb
JWT_SECRET=twoj_sekretny_klucz_tutaj
JWT_EXPIRES_IN=24h
EOF

echo "Backend zainstalowany pomyślnie. Uruchom go za pomocą:"
echo "cd /var/www/amicus/backend && npm run dev"
