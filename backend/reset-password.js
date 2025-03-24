const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function resetPassword() {
  try {
    const email = 'admin@example.com';
    const newPassword = 'Admin123';
    
    // Tworzymy hash hasła
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Aktualizujemy hasło
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = $2 WHERE email = $3 RETURNING *',
      [hashedPassword, new Date(), email]
    );
    
    if (result.rows.length > 0) {
      console.log(`Hasło zostało zresetowane dla użytkownika: ${email}`);
      console.log('Nowe dane logowania:');
      console.log(`Email: ${email}`);
      console.log(`Hasło: ${newPassword}`);
    } else {
      console.log(`Użytkownik ${email} nie został znaleziony`);
    }
  } catch (error) {
    console.error('Błąd resetowania hasła:', error);
  } finally {
    pool.end();
  }
}

resetPassword();
