const { body, validationResult } = require('express-validator');

// Sprawdzenie wyników walidacji
const validateRequest = (req, res, next) => {
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
const registerValidator = [
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
    .isMobilePhone().withMessage('Podaj poprawny numer telefonu'),
  validateRequest
];

// Walidacja logowania
const loginValidator = [
  body('email')
    .isEmail().withMessage('Podaj poprawny adres email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Hasło jest wymagane'),
  validateRequest
];

// Walidacja tworzenia zwierzęcia
const animalValidator = [
  body('animal_number')
    .notEmpty().withMessage('Numer zwierzęcia jest wymagany'),
  body('owner_id')
    .isInt().withMessage('ID właściciela musi być liczbą całkowitą'),
  body('age')
    .optional()
    .isInt({ min: 0 }).withMessage('Wiek musi być liczbą nieujemną'),
  body('sex')
    .optional()
    .isIn(['male', 'female']).withMessage('Płeć musi być "male" lub "female"'),
  validateRequest
];

// Walidacja tworzenia inseminacji
const inseminationValidator = [
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
    .isInt().withMessage('ID byka musi być liczbą całkowitą'),
  validateRequest
];

// Eksport walidatorów
module.exports = {
  validateRequest,
  registerValidator,
  loginValidator,
  animalValidator,
  inseminationValidator
};
