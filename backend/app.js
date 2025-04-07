const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// Import tras
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moduleRoutes = require('./routes/moduleRoutes'); // Import tras dla modułów
const actionButtonRoutes = require('./routes/actionButtonRoutes'); // Import tras dla przycisków akcji
const bullRoutes = require('./routes/bullRoutes'); // Import tras dla buhajów
const animalRoutes = require('./routes/animalRoutes'); // Import tras dla zwierząt
const semenProviderRoutes = require('./routes/semenProviderRoutes');

// Import middleware
const { verifyResourceAccess } = require('./middleware/resourceAccessMiddleware');
const { defaultLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Inicjalizacja aplikacji Express
const app = express();
app.set("trust proxy", 1);  // Zaufaj proxy Nginx

// Konfiguracja Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AmicusApp API',
      version: '1.0.0',
      description: 'API dla aplikacji AmicusApp do zarządzania inseminacją i hodowlą',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Serwer deweloperski',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Poprawiona konfiguracja CORS
const allowedOrigins = ['http://83.150.236.135', 'http://83.150.236.135:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Jeżeli nie ma origin (np. zapytania z narzędzi typu curl), albo origin jest dozwolony
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // kluczowe dla obsługi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Dodano PATCH
  allowedHeaders: ['Content-Type', 'Authorization', 'X-HTTP-Method-Override'] // Dodano X-HTTP-Method-Override
};

// Middleware

// Rozszerzona konfiguracja Helmet - zwiększone bezpieczeństwo dla aplikacji medycznej
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Restricting inline scripts when possible
      styleSrc: ["'self'", "'unsafe-inline'"], // Needed for most CSS frameworks
      imgSrc: ["'self'", "data:", "blob:"], // Allow data URIs for images
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true, // Kontroluje DNS prefetching
  expectCt: {
    enforce: true,
    maxAge: 30 * 24 * 60 * 60 // 30 dni w sekundach
  },
  frameguard: { action: "deny" }, // Zapobieganie clickjacking
  hidePoweredBy: true,
  hsts: {
    maxAge: 180 * 24 * 60 * 60, // 180 dni w sekundach
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true, // Zapobieganie MIME sniffing
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "same-origin" },
  xssFilter: true
}));

app.use(cors(corsOptions)); // Zaktualizowana konfiguracja CORS
app.use(cookieParser()); // Dodane - parsowanie cookies
app.use(express.json()); // Parsowanie JSON w ciele żądania
app.use(express.urlencoded({ extended: true })); // Parsowanie danych formularzy

// Aplikowanie limitera domyślnego
app.use(defaultLimiter);

// Trasy API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bulls', bullRoutes); // Trasy dla buhajów
app.use('/api/animals', animalRoutes); // Trasy dla zwierząt (zakładam, że istnieją)
app.use('/api', moduleRoutes); // Trasy dla modułów (wszystkie zaczynają się od /api)
app.use('/api/action-buttons', actionButtonRoutes); // Trasy dla przycisków akcji

// Dokumentacja Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Obsługa nieznanych tras
app.use(notFoundHandler);

// Obsługa błędów
app.use(errorHandler);

// Ustawienia portu i uruchomienie serwera
const PORT = process.env.PORT || 4000;

module.exports = app;