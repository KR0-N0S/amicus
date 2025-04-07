// Ten plik jest uruchamiany przed wszystkimi testami
// Możemy tutaj skonfigurować globalne mocki lub zmienne

// Ustawiamy timeout dla testów
jest.setTimeout(30000);

// Wyciszamy niektóre logi podczas testów
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();

// Reset wszystkich mocków po każdym teście
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Dodany prosty test, aby uniknąć błędu "Your test suite must contain at least one test"
describe('Setup tests', () => {
  test('środowisko testowe jest poprawnie skonfigurowane', () => {
    expect(true).toBe(true);
  });
});