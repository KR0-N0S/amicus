#!/bin/bash

# Utwórz strukturę katalogów dla backendu jeśli nie istnieje
mkdir -p /var/www/amicus/backend
cd /var/www/amicus/backend

# Inicjalizacja projektu Node.js
npm init -y

# Instalacja zależności
npm install express cors helmet dotenv bcryptjs jsonwebtoken pg express-validator express-rate-limit swagger-jsdoc swagger-ui-express winston
npm install -D nodemon

# Tworzenie pliku .env (edytuj zgodnie z potrzebami)
cat > .env << ENVFILE
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=amicus
DB_PASSWORD=twoje_haslo
DB_NAME=amicusdb
JWT_SECRET=amicus_secret_key_change_in_production
JWT_EXPIRES_IN=24h
ENVFILE

# Utworzenie struktury katalogów
mkdir -p config controllers middleware routes services repositories utils

# Aktualizacja package.json
cat > package.json << PACKAGEJSON
{
  "name": "amicus-backend",
  "version": "1.0.0",
  "description": "Backend aplikacji AmicusApp do zarządzania inseminacją i hodowlą",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-rate-limit": "^6.7.0",
    "express-validator": "^7.0.1",
    "helmet": "^6.1.5",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.10.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^4.6.2",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
PACKAGEJSON

echo "Backend zainstalowany pomyślnie. Uruchom go za pomocą:"
echo "cd /var/www/amicus/backend && npm run dev"
