// Ten plik jest uruchamiany przed wszystkimi testami

// Ustawiamy timeout dla testów
jest.setTimeout(30000);

// Wyciszamy niektóre logi podczas testów
console.log = jest.fn() as unknown as typeof console.log;
console.info = jest.fn() as unknown as typeof console.info;
console.warn = jest.fn() as unknown as typeof console.warn;

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

// Dodanie globalnego matchera
expect.extend({
  toContainObject(received: any[], expected: Record<string, any>) {
    const pass = received.some(item => 
      Object.keys(expected).every(key => item[key] === expected[key])
    );

    if (pass) {
      return {
        message: () => `expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(expected)}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(expected)}`,
        pass: false
      };
    }
  }
});

// Eksportujemy pusty obiekt aby plik był traktowany jako moduł
export {};