const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Akceptuje certyfikaty self-signed
  } : false
});

// Test połączenia
pool.connect((err, client, release) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err.stack);
  } else {
    console.log('Połączenie z bazą danych ustanowione pomyślnie');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
