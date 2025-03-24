require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function diagnoseAuth() {
  try {
    console.log('==== DIAGNOZA PROBLEMU LOGOWANIA ====');
    console.log('Sprawdzam zmienne środowiskowe:');
    console.log('JWT_SECRET ustawiony?', !!process.env.JWT_SECRET);
    if (!process.env.JWT_SECRET) {
      console.log('⚠️ UWAGA: Brak JWT_SECRET w zmiennych środowiskowych!');
      console.log('Tworzę tymczasowy plik .env z JWT_SECRET');
      
      const fs = require('fs');
      fs.writeFileSync('.env', 'JWT_SECRET=amicus_secret_key_123\nJWT_EXPIRES_IN=7d\n');
      require('dotenv').config(); // Przeładuj zmienne środowiskowe
      console.log('JWT_SECRET ustawiony teraz?', !!process.env.JWT_SECRET);
    }
    
    // Sprawdź połączenie z bazą danych
    console.log('\nSprawdzam połączenie z bazą danych...');
    try {
      await pool.query('SELECT 1');
      console.log('✅ Połączenie z bazą danych działa');
    } catch (dbError) {
      console.log('❌ Problem z połączeniem z bazą danych:', dbError.message);
      return;
    }
    
    // Sprawdź dane użytkownika
    const email = 'admin@example.com';
    const password = 'Admin123';
    console.log(`\nSprawdzam użytkownika ${email} w bazie danych...`);
    
    // Pobierz użytkownika
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`❌ Użytkownik ${email} nie istnieje w bazie danych!`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Użytkownik znaleziony w bazie danych');
    console.log('ID użytkownika:', user.id);
    console.log('Hasło przechowywane w bazie:', user.password ? user.password.substring(0, 10) + '...' : 'NULL');
    
    // Sprawdź hasło
    console.log('\nSprawdzam hasło...');
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`Weryfikacja hasła: ${isPasswordValid ? '✅ POPRAWNE' : '❌ NIEPOPRAWNE'}`);
      
      if (!isPasswordValid) {
        // Resetuj hasło jako ostateczne rozwiązanie
        console.log('\nResetuję hasło użytkownika...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await pool.query(
          'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3 RETURNING id',
          [hashedPassword, new Date(), user.id]
        );
        
        console.log('✅ Hasło zostało zresetowane');
        console.log('Nowy hash hasła:', hashedPassword);
      }
    } catch (bcryptError) {
      console.log('❌ Błąd weryfikacji hasła:', bcryptError.message);
    }
    
    // Spróbuj wygenerować token JWT
    console.log('\nGeneruję token JWT...');
    try {
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'amicus_secret_key_123',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      console.log('✅ Token JWT wygenerowany poprawnie');
      console.log('Token:', token.substring(0, 20) + '...');
    } catch (jwtError) {
      console.log('❌ Błąd generowania tokena JWT:', jwtError.message);
    }
    
    console.log('\n==== SUGESTIE NAPRAWY ====');
    console.log('1. Upewnij się, że plik .env zawiera JWT_SECRET');
    console.log('2. Sprawdź czy kontroler auth poprawnie obsługuje błędy');
    console.log('3. Zrestartuj serwer po zmianach: systemctl restart amicus-backend.service');
    
  } catch (error) {
    console.error('Błąd podczas diagnostyki:', error);
  } finally {
    pool.end();
  }
}

diagnoseAuth();
