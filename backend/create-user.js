const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function createDefaultUser() {
  try {
    // Sprawdzamy czy użytkownik już istnieje
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (checkResult.rows.length > 0) {
      console.log('Użytkownik admin@example.com już istnieje');
      return;
    }

    // Tworzymy hash hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123', salt);

    // Dodajemy użytkownika
    const result = await pool.query(
      `INSERT INTO users (
        email, password, first_name, last_name, 
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        'admin@example.com',
        hashedPassword,
        'Admin',
        'User',
        'active',
        new Date(),
        new Date()
      ]
    );

    console.log('Utworzono użytkownika:', result.rows[0]);
  } catch (error) {
    console.error('Błąd podczas tworzenia użytkownika:', error);
  } finally {
    // Zamknij połączenie z bazą danych
    pool.end();
  }
}

// Uruchom funkcję
createDefaultUser();
