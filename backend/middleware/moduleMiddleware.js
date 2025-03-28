/**
 * Middleware do kontroli dostępu do modułów aplikacji
 * @author KR0-N0S
 * @date 2025-03-28
 */

const { AppError } = require('./errorHandler');
const db = require('../config/db');

/**
 * Middleware sprawdzające dostęp do konkretnego modułu
 * @param {string|string[]} requiredModules - Pojedynczy moduł lub tablica modułów wymaganych do dostępu
 */
exports.requireModule = (requiredModules) => {
  return async (req, res, next) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.userId || !req.user) {
        return res.status(401).json({
          message: 'Unauthorized: Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Pobierz organizację z parametrów, query lub body
      const organizationId = req.params.organizationId || 
                            req.query.organizationId || 
                            req.body.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          message: 'Bad Request: Organization ID is required',
          code: 'ORGANIZATION_REQUIRED'
        });
      }

      // Konwertuj wymagane moduły do tablicy, jeśli nie jest to tablica
      const modules = Array.isArray(requiredModules) ? requiredModules : [requiredModules];
      
      // Sprawdź, czy organizacja ma aktywne wymagane moduły (uwzględnij datę ważności subskrypcji)
      const moduleQuery = await db.query(`
        SELECT m.code, m.name, om.active, om.subscription_end_date
        FROM modules m
        JOIN organization_modules om ON m.id = om.module_id
        WHERE om.organization_id = $1 
          AND m.code = ANY($2)
          AND om.active = true
          AND (om.subscription_end_date IS NULL OR om.subscription_end_date > NOW())
      `, [organizationId, modules]);
      
      // Sprawdź czy wszystkie wymagane moduły są dostępne
      if (moduleQuery.rows.length !== modules.length) {
        const availableModules = moduleQuery.rows.map(row => row.code);
        const missingModules = modules.filter(module => !availableModules.includes(module));
        
        // Zarejestruj próbę dostępu (dla celów audytu)
        await db.query(`
          INSERT INTO module_access_history (
            organization_id, user_id, module_id, action_type, action_details, performed_by
          )
          SELECT $1, $2, m.id, 'access_denied', $3, $2
          FROM modules m
          WHERE m.code = ANY($4)
        `, [
          organizationId, 
          req.userId, 
          JSON.stringify({ 
            path: req.path, 
            method: req.method,
            message: 'Access denied - organization does not have required modules' 
          }), 
          missingModules
        ]);
        
        return res.status(403).json({
          message: 'Forbidden: Organization does not have access to required modules',
          code: 'MODULE_ACCESS_DENIED',
          missingModules: missingModules
        });
      }

      // Sprawdź indywidualne uprawnienia użytkownika (jeśli istnieją)
      const userModuleQuery = await db.query(`
        SELECT um.module_id, m.code, um.can_access, um.permissions
        FROM user_modules um
        JOIN modules m ON um.module_id = m.id
        WHERE um.organization_id = $1 
        AND um.user_id = $2
        AND m.code = ANY($3)
      `, [organizationId, req.userId, modules]);

      // Jeśli istnieją indywidualne ustawienia użytkownika, sprawdź czy ma dostęp
      if (userModuleQuery.rows.length > 0) {
        const deniedModules = userModuleQuery.rows
          .filter(row => row.can_access !== true)
          .map(row => row.code);
          
        if (deniedModules.length > 0) {
          // Zarejestruj próbę dostępu (dla celów audytu)
          await db.query(`
            INSERT INTO module_access_history (
              organization_id, user_id, module_id, action_type, action_details, performed_by
            )
            SELECT $1, $2, m.id, 'access_denied', $3, $2
            FROM modules m
            WHERE m.code = ANY($4)
          `, [
            organizationId, 
            req.userId, 
            JSON.stringify({ 
              path: req.path, 
              method: req.method,
              message: 'Access denied - user does not have required module permissions' 
            }),
            deniedModules
          ]);
          
          return res.status(403).json({
            message: 'Forbidden: You do not have permissions to access required modules',
            code: 'USER_MODULE_ACCESS_DENIED',
            deniedModules: deniedModules
          });
        }
      }

      // Dodaj informacje o dostępnych modułach do obiektu żądania
      req.organizationModules = moduleQuery.rows;
      
      // Dodaj specyficzne uprawnienia użytkownika (jeśli istnieją)
      if (userModuleQuery.rows.length > 0) {
        req.userModulePermissions = userModuleQuery.rows.reduce((acc, row) => {
          acc[row.code] = row.permissions || {};
          return acc;
        }, {});
      }

      // Zarejestruj udany dostęp (dla celów audytu)
      await db.query(`
        INSERT INTO module_access_history (
          organization_id, user_id, module_id, action_type, action_details, performed_by
        )
        SELECT $1, $2, m.id, 'access_granted', $3, $2
        FROM modules m
        WHERE m.code = $4
      `, [
        organizationId, 
        req.userId, 
        JSON.stringify({ 
          path: req.path, 
          method: req.method 
        }), 
        modules[0] // Zapisujemy główny moduł dla prostoty
      ]);

      next();
    } catch (error) {
      console.error('Error in requireModule middleware:', error);
      next(new AppError('Server error while checking module access', 500));
    }
  };
};

/**
 * Middleware łączące kontrolę roli i modułu
 * @param {string|string[]} allowedRoles - Role, które mają dostęp
 * @param {string|string[]} requiredModules - Moduły wymagane do dostępu
 */
exports.requireRoleAndModule = (allowedRoles, requiredModules) => {
  return async (req, res, next) => {
    try {
      // Najpierw sprawdź rolę
      const roleMiddleware = require('./roleMiddleware');
      roleMiddleware.requireRole(allowedRoles)(req, res, (roleErr) => {
        if (roleErr) return next(roleErr);
        
        // Następnie sprawdź dostęp do modułu
        exports.requireModule(requiredModules)(req, res, next);
      });
    } catch (error) {
      console.error('Error in requireRoleAndModule middleware:', error);
      next(new AppError('Server error while checking role and module access', 500));
    }
  };
};

/**
 * Middleware sprawdzające dostęp do konkretnej funkcjonalności w module
 * @param {string} moduleCode - Kod modułu
 * @param {string} featureKey - Klucz funkcjonalności w module
 */
exports.requireModuleFeature = (moduleCode, featureKey) => {
  return async (req, res, next) => {
    try {
      // Najpierw sprawdź dostęp do modułu
      exports.requireModule(moduleCode)(req, res, async (moduleErr) => {
        if (moduleErr) return next(moduleErr);
        
        // Sprawdź, czy użytkownik ma dostęp do konkretnej funkcjonalności
        if (!req.userModulePermissions || 
            !req.userModulePermissions[moduleCode] || 
            req.userModulePermissions[moduleCode][featureKey] !== false) {
          
          // Domyślnie zezwalamy, jeśli nie ma określonych szczegółowych uprawnień
          // lub jeśli uprawnienie nie jest wyraźnie ustawione na false
          return next();
        }
        
        return res.status(403).json({
          message: `Forbidden: You do not have permission to access the ${featureKey} feature`,
          code: 'FEATURE_ACCESS_DENIED'
        });
      });
    } catch (error) {
      console.error('Error in requireModuleFeature middleware:', error);
      next(new AppError('Server error while checking feature access', 500));
    }
  };
};