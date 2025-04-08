import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

// Sprawdzenie wyników walidacji
export const validateRequest = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      errors: errors.array() 
    });
  }
  next();
};

// Walidacja rejestracji użytkownika
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Podaj poprawny adres email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Hasło musi mieć minimum 6 znaków')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Hasło musi zawierać małą literę, wielką literę i cyfrę'),
  body('first_name')
    .notEmpty().withMessage('Imię jest wymagane'),
  body('last_name')
    .notEmpty().withMessage('Nazwisko jest wymagane'),
  body('phone')
    .optional()
    .isMobilePhone('any').withMessage('Podaj poprawny numer telefonu')
];

// Walidacja logowania
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Podaj poprawny adres email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Hasło jest wymagane')
];

// Walidacja tworzenia zwierzęcia
export const animalValidation: ValidationChain[] = [
  // Podstawowe dane zwierzęcia
  body('animal_number')
    .notEmpty().withMessage('Numer zwierzęcia jest wymagany'),
  
  body('owner_id')
    .notEmpty().withMessage('ID właściciela jest wymagane')
    .isInt().withMessage('ID właściciela musi być liczbą całkowitą'),
  
  body('organization_id')
    .optional()
    .isInt().withMessage('ID organizacji musi być liczbą całkowitą'),
  
  body('animal_type')
    .notEmpty().withMessage('Typ zwierzęcia jest wymagany')
    .isIn(['farm', 'companion']).withMessage('Typ zwierzęcia musi być "farm" lub "companion"'),
  
  body('species')
    .notEmpty().withMessage('Gatunek jest wymagany'),
  
  body('sex')
    .notEmpty().withMessage('Płeć jest wymagana')
    .isIn(['male', 'female']).withMessage('Płeć musi być "male" lub "female"'),
  
  // Opcjonalne pola
  body('birth_date')
    .optional()
    .isISO8601().withMessage('Data urodzenia musi być w formacie YYYY-MM-DD'),
  
  body('registration_date')
    .optional()
    .isISO8601().withMessage('Data rejestracji musi być w formacie YYYY-MM-DD'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Waga musi być liczbą nieujemną'),
  
  body('breed')
    .optional()
    .isString().withMessage('Rasa musi być tekstem'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notatki muszą być tekstem'),
  
  // Dane dla zwierząt gospodarskich
  body('farm_animal')
    .custom((value, { req }) => {
      // Sprawdzamy czy mamy obiekt farm_animal dla zwierząt gospodarskich
      if (req.body.animal_type === 'farm' && (!value || typeof value !== 'object')) {
        throw new Error('Dla zwierząt gospodarskich wymagane są dane farm_animal');
      }
      return true;
    }),
  
  body('farm_animal.identifier')
    .custom((value, { req }) => {
      // Sprawdzamy czy identifier jest podany dla farm_animal
      if (req.body.animal_type === 'farm' && req.body.farm_animal) {
        // Jeśli nie ma identyfikatora w farm_animal, sprawdzamy czy jest w animal_number
        if (!value && !req.body.animal_number) {
          throw new Error('Identyfikator (kolczyk) jest wymagany dla zwierząt gospodarskich');
        }
      }
      return true;
    }),
  
  // Dane dla zwierząt towarzyszących
  body('companion_animal')
    .custom((value, { req }) => {
      // Opcjonalna walidacja danych companion_animal
      if (req.body.animal_type === 'companion' && value && typeof value !== 'object') {
        throw new Error('Dane companion_animal muszą być obiektem');
      }
      return true;
    }),
  
  // Dodatkowa walidacja zapewniająca, że animal_number jest zgodny z identifier dla zwierząt gospodarskich
  body()
    .custom((value, { req }) => {
      if (req.body.animal_type === 'farm' && 
          req.body.farm_animal && 
          req.body.farm_animal.identifier && 
          req.body.animal_number &&
          req.body.farm_animal.identifier !== req.body.animal_number) {
        throw new Error('Numer zwierzęcia (animal_number) powinien być zgodny z identyfikatorem (farm_animal.identifier)');
      }
      return true;
    })
];

// Walidacja tworzenia inseminacji
export const inseminationValidation: ValidationChain[] = [
  body('animal_id')
    .isInt().withMessage('ID zwierzęcia musi być liczbą całkowitą'),
  body('certificate_number')
    .notEmpty().withMessage('Numer certyfikatu jest wymagany'),
  body('file_number')
    .notEmpty().withMessage('Numer pliku jest wymagany'),
  body('procedure_number')
    .notEmpty().withMessage('Numer procedury jest wymagany'),
  body('procedure_date')
    .isDate().withMessage('Podaj poprawną datę procedury'),
  body('owner_id')
    .isInt().withMessage('ID właściciela musi być liczbą całkowitą'),
  body('bull_id')
    .optional()
    .isInt().withMessage('ID byka musi być liczbą całkowitą')
];

// Walidacja tworzenia i aktualizacji buhaja
export const bullValidation: ValidationChain[] = [
  body('identification_number')
    .notEmpty().withMessage('Numer identyfikacyjny buhaja jest wymagany')
    .matches(/^[A-Z]{2}[0-9]+$/).withMessage('Format numeru: 2 wielkie litery + cyfry (np. PL12345)'),
  body('bull_type')
    .notEmpty().withMessage('Typ buhaja jest wymagany')
    .isIn(['dairy', 'beef', 'dual']).withMessage('Typ buhaja musi być: dairy, beef lub dual'),
  body('name')
    .optional()
    .notEmpty().withMessage('Nazwa buhaja nie może być pusta'),
  body('veterinary_number')
    .optional(),
  body('breed')
    .optional(),
  body('owner_id')
    .optional()
    .isInt().withMessage('ID właściciela musi być liczbą całkowitą'),
  body('sire_id')
    .optional()
    .isInt().withMessage('ID ojca musi być liczbą całkowitą'),
  body('dam_id')
    .optional()
    .isInt().withMessage('ID matki musi być liczbą całkowitą')
];

// Walidacja dostawców nasienia
export const semenProviderValidation: ValidationChain[] = [
  body('name')
    .notEmpty().withMessage('Nazwa dostawcy jest wymagana')
    .isString().withMessage('Nazwa musi być tekstem')
    .isLength({ min: 2, max: 100 }).withMessage('Nazwa musi mieć od 2 do 100 znaków'),
  body('vet_id_number')
    .notEmpty().withMessage('Numer weterynaryjny jest wymagany')
    .isString().withMessage('Numer weterynaryjny musi być tekstem')
    .isLength({ min: 2, max: 50 }).withMessage('Numer weterynaryjny musi mieć od 2 do 50 znaków'),
  body('address_street')
    .optional()
    .isString().withMessage('Ulica musi być tekstem'),
  body('address_city')
    .optional()
    .isString().withMessage('Miasto musi być tekstem'),
  body('address_postal_code')
    .optional()
    .isString().withMessage('Kod pocztowy musi być tekstem'),
  body('address_province')
    .optional()
    .isString().withMessage('Województwo musi być tekstem'),
  body('address_country')
    .optional()
    .isString().withMessage('Kraj musi być tekstem'),
  body('contact_phone')
    .optional()
    .isString().withMessage('Telefon musi być tekstem'),
  body('contact_email')
    .optional()
    .isEmail().withMessage('Email musi być poprawnym adresem email')
    .normalizeEmail(),
  body('is_public')
    .optional()
    .isBoolean().withMessage('Pole is_public musi być wartością logiczną')
];

// Funkcja pomocnicza do łączenia walidatorów z middleware validateRequest
export const withValidation = (validationChains: ValidationChain[]): (ValidationChain | ((req: Request, res: Response, next: NextFunction) => void | Response))[] => {
  return [...validationChains, validateRequest];
};

// Eksport walidatorów z middleware
export const registerValidator = withValidation(registerValidation);
export const loginValidator = withValidation(loginValidation);
export const animalValidator = withValidation(animalValidation);
export const inseminationValidator = withValidation(inseminationValidation);
export const bullValidator = withValidation(bullValidation);
export const semenProviderValidator = withValidation(semenProviderValidation);