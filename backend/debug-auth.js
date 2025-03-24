const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function debugAuth() {
  try {
    const email = 'admin@example.com';
    const password = 'Admin123';
    
    console.log('=== DIAGNOSTYKA PROCESU LOGOWANIA ===');
    console.log(`Email: ${email}, Hasło: ${password}`);
    
    // 1. Sprawdź, czy użytkownik istnieje w bazie
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userQuery.rows.length === 0) {
      console.log('❌ BŁĄD: Użytkownik nie istnieje w bazie danych');
      return;
    }
    
    const user = userQuery.rows[0];
    console.log('✅ Użytkownik znaleziony w bazie danych:', {
      id: user.id,
      email: user.email,
      password_length: user.password ? user.password.length : 0,
      password_hash: user.password ? user.password.substring(0, 20) + '...' : 'NULL'
    });
    
    // 2. Sprawdź hasło
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`Wynik weryfikacji hasła: ${isPasswordValid ? '✅ POPRAWNE' : '❌ NIEPOPRAWNE'}`);
      
      if (!isPasswordValid) {
        // Sprawdź, czy hasło nie jest jakimś innym hasłem
        const testPasswords = ['admin123', 'Admin123!', 'admin', 'password', '123456'];
        for (const testPwd of testPasswords) {
          try {
            const isOtherPassword = await bcrypt.compare(testPwd, user.password);
            if (isOtherPassword) {
              console.log(`🔍 Znaleziono pasujące hasło: "${testPwd}"`);
              break;
            }
          } catch (err) {}
        }
      }
    } catch (bcryptError) {
      console.log('❌ BŁĄD przy weryfikacji hasła:', bcryptError.message);
    }
    
    // 3. Zresetuj hasło z nowym salt
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(password, salt);
    
    console.log('Nowy hash hasła:', newPasswordHash);
    
    // 4. Zapisz nowe hasło
    const updateResult = await pool.query(
      'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      [newPasswordHash, new Date(), user.id]
    );
    
    console.log(`✅ Hasło zostało zaktualizowane dla użytkownika ID ${updateResult.rows[0].id}`);
    
    // 5. Przetestuj nowe hasło
    const updatedUserQuery = await pool.query('SELECT password FROM users WHERE id = $1', [user.id]);
    const updatedPasswordHash = updatedUserQuery.rows[0].password;
    
    const verifyNewPassword = await bcrypt.compare(password, updatedPasswordHash);
    console.log(`Weryfikacja nowego hasła: ${verifyNewPassword ? '✅ POPRAWNE' : '❌ NIEPOPRAWNE'}`);
    
    console.log('\n=== ZALECENIA ===');
    if (verifyNewPassword) {
      console.log('1. Zrestartuj serwer backendu: systemctl restart amicus-backend.service');
      console.log('2. Spróbuj zalogować się przez API: curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"Admin123"}\'');
      console.log('3. Dodaj dodatkowe informacje w logach autoryzacji, aby zrozumieć dokładniej problem');
    } else {
      console.log('Mamy problem z hasłem - haszowanie nie działa poprawnie.');
    }
    
  } catch (error) {
    console.error('BŁĄD DIAGNOSTYKI:', error);
  } finally {
    pool.end();
  }
}

debugAuth();
