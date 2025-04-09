/**
 * Główny plik aplikacji
 * @author KR0-N0S1
 * @date 2025-04-08 19:39:33
 */

import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// Import tras
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import moduleRoutes from './routes/moduleRoutes';
import actionButtonRoutes from './routes/actionButtonRoutes';
import bullRoutes from './routes/bullRoutes';
import animalRoutes from './routes/animalRoutes';
import semenProviderRoutes from './routes/semenProviderRoutes';

// Import middleware
import { verifyToken } from './middleware/authMiddleware';
import { verifyResourceAccess } from './middleware/resourceAccessMiddleware';
import { defaultLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ensureOrganizationContext } from './middleware/organizationContext';

// Inicjalizacja aplikacji Express
const app = express();
app.set('trust proxy', 1); // Zaufaj proxy (np. Nginx)

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
  apis: ['./dist/routes/*.js'], // Zmienione na wskazywanie skompilowanych plików
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Konfiguracja CORS
const allowedOrigins: string[] = ['http://83.150.236.135', 'http://83.150.236.135:3000'];
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Jeśli zapytanie nie ma origin (np. narzędzia typu curl) lub origin jest dozwolony
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-HTTP-Method-Override', 'X-Organization-Id']
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 180 * 24 * 60 * 60, // 180 dni
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true
}));

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);

// Definiowanie tras API
// Ustawiamy trasy uwierzytelniania najpierw, BEZ weryfikacji tokenu
app.use('/api/auth', authRoutes);

// Middleware uwierzytelniania dla wszystkich pozostałych ścieżek API
app.use('/api', verifyToken);

// Dodaj globalny middleware kontekstu organizacji po uwierzytelnieniu
app.use('/api', ensureOrganizationContext);

// Definiowanie pozostałych tras API (już po middleware uwierzytelniania)
app.use('/api/users', userRoutes);
app.use('/api/bulls', bullRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api', moduleRoutes);
app.use('/api/action-buttons', actionButtonRoutes);
app.use('/api/semen-providers', semenProviderRoutes);

// Dokumentacja Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Obsługa nieznanych tras
app.use(notFoundHandler);

// Obsługa błędów - poprawna typizacja middleware
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  errorHandler(err, req, res, next);
});

// Ustawienia portu i eksport aplikacji
const PORT: number = parseInt(process.env.PORT || '4000', 10);
app.set('port', PORT);

export default app;