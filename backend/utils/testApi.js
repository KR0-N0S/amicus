const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
let token = null;

// Test rejestracji użytkownika
const testRegister = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'Test1234',
      first_name: 'Test',
      last_name: 'User',
      phone: '123456789',
      organization: {
        name: 'Test Organization'
      }
    });
    
    console.log('Rejestracja zakończona sukcesem:', response.data);
    return response.data;
  } catch (error) {
    console.error('Błąd rejestracji:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Test logowania
const testLogin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Test1234'
    });
    
    token = response.data.data.token;
    console.log('Logowanie zakończone sukcesem:', response.data);
    return response.data;
  } catch (error) {
    console.error('Błąd logowania:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Test pobierania profilu użytkownika
const testGetProfile = async () => {
  try {
    if (!token) {
      console.error('Brak tokenu, najpierw zaloguj się');
      return null;
    }
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Pobieranie profilu zakończone sukcesem:', response.data);
    return response.data;
  } catch (error) {
    console.error('Błąd pobierania profilu:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Funkcja uruchomieniowa testów
const runTests = async () => {
  console.log('Rozpoczynanie testów API...');
  
  // Próba logowania istniejącego użytkownika
  let loginResult = await testLogin();
  
  // Jeśli logowanie nie powiodło się, spróbuj zarejestrować nowego użytkownika
  if (!loginResult) {
    console.log('Próba rejestracji nowego użytkownika...');
    await testRegister();
    loginResult = await testLogin();
  }
  
  if (loginResult) {
    await testGetProfile();
  }
  
  console.log('Testy API zakończone');
};

// Uruchom testy
runTests();
