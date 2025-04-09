// Deklaracje globalne dla modułów bez typów
declare module '*.js';

// Moduły dla głównych katalogów
declare module './controllers/*';
declare module './routes/*';
declare module './middleware/*';
declare module './services/*';
declare module './repositories/*';
declare module './models/*';
declare module './utils/*';

// Deklaracje globalne dla Jest
/// <reference types="jest" />

// Rozszerzenie dla niestandardowych matcherów Jest
declare namespace jest {
  interface Matchers<R> {
    toContainObject(expected: Record<string, any>): R;
  }
}