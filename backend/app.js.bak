const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// Import tras
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// Pozostałe trasy można dodać później

// Import middleware
const { defaultLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Inicjalizacja aplikacji Express
const app = express();

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

// Middleware
app.use(cors()); // Pozwala na żądania CORS
app.use(helmet()); // Zabezpieczenia nagłówków HTTP
app.use(express.json()); // Parsowanie JSON w ciele żądania
app.use(express.urlencoded({ extended: true })); // Parsowanie danych formularzy

// Aplikowanie limitera domyślnego
app.use(defaultLimiter);

// Trasy API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Pozostałe trasy można dodać później

// Dokumentacja Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Obsługa nieznanych tras
app.use(notFoundHandler);

// Obsługa błędów
app.use(errorHandler);

// Ustawienia portu i uruchomienie serwera
const PORT = process.env.PORT || 4000;

module.exports = app;
