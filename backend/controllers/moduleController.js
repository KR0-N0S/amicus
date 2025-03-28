/**
 * Kontroler do zarządzania modułami aplikacji
 * @author KR0-N0S
 * @date 2025-03-28
 */

const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Pobiera listę wszystkich modułów
 */
exports.getAllModules = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, code, name, description, is_active
      FROM modules
      ORDER BY name
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Pobiera listę modułów dla organizacji
 */
exports.getOrganizationModules = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    
    const result = await db.query(`
      SELECT m.id, m.code, m.name, m.description, 
             om.active, om.subscription_start_date, om.subscription_end_date,
             om.custom_settings
      FROM modules m
      LEFT JOIN organization_modules om ON m.id = om.module_id AND om.organization_id = $1
      ORDER BY m.name
    `, [organizationId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching organization modules:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Aktualizuje dostęp organizacji do modułów
 */
exports.updateOrganizationModules = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { modules } = req.body;
    
    if (!Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Bad request: modules must be an array'
      });
    }
    
    // Rozpocznij transakcję
    await db.query('BEGIN');
    
    // Aktualizuj moduły
    for (const module of modules) {
      if (!module.id) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Each module must have an id field'
        });
      }
      
      // Sprawdź czy moduł istnieje
      const moduleExists = await db.query(`
        SELECT id FROM modules WHERE id = $1
      `, [module.id]);
      
      if (moduleExists.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Module with ID ${module.id} does not exist`
        });
      }
      
      // Sprawdź czy powiązanie już istnieje
      const existingLink = await db.query(`
        SELECT id FROM organization_modules
        WHERE organization_id = $1 AND module_id = $2
      `, [organizationId, module.id]);
      
      if (existingLink.rows.length > 0) {
        // Aktualizuj istniejące powiązanie
        await db.query(`
          UPDATE organization_modules
          SET active = $3,
              subscription_start_date = $4,
              subscription_end_date = $5,
              custom_settings = $6,
              updated_at = NOW()
          WHERE organization_id = $1 AND module_id = $2
        `, [
          organizationId, 
          module.id, 
          module.active !== undefined ? module.active : true,
          module.subscription_start_date || new Date(),
          module.subscription_end_date || null,
          module.custom_settings || {}
        ]);
      } else if (module.active !== false) {
        // Utwórz nowe powiązanie tylko jeśli active nie jest ustawione na false
        await db.query(`
          INSERT INTO organization_modules 
          (organization_id, module_id, active, subscription_start_date, subscription_end_date, custom_settings)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          organizationId, 
          module.id, 
          module.active !== undefined ? module.active : true,
          module.subscription_start_date || new Date(),
          module.subscription_end_date || null,
          module.custom_settings || {}
        ]);
      }
    }
    
    // Zatwierdź transakcję
    await db.query('COMMIT');
    
    // Pobierz zaktualizowaną listę modułów
    const result = await db.query(`
      SELECT m.id, m.code, m.name, m.description, 
             om.active, om.subscription_start_date, om.subscription_end_date,
             om.custom_settings
      FROM modules m
      LEFT JOIN organization_modules om ON m.id = om.module_id AND om.organization_id = $1
      ORDER BY m.name
    `, [organizationId]);
    
    res.status(200).json({
      success: true,
      message: 'Organization modules updated successfully',
      data: result.rows
    });
  } catch (error) {
    // W przypadku błędu wycofaj transakcję
    await db.query('ROLLBACK');
    console.error('Error updating organization modules:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Pobiera uprawnienia użytkownika do modułów
 */
exports.getUserModulePermissions = async (req, res, next) => {
  try {
    const { organizationId, userId } = req.params;
    
    // Sprawdź czy użytkownik istnieje i należy do organizacji
    const userExists = await db.query(`
      SELECT u.id FROM users u
      JOIN user_organizations uo ON u.id = uo.user_id
      WHERE u.id = $1 AND uo.organization_id = $2
    `, [userId, organizationId]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist or does not belong to this organization'
      });
    }
    
    // Pobierz uprawnienia użytkownika
    const result = await db.query(`
      SELECT m.id, m.code, m.name, um.can_access, um.permissions
      FROM modules m
      JOIN organization_modules om ON m.id = om.module_id
      LEFT JOIN user_modules um ON m.id = um.module_id AND um.user_id = $1 AND um.organization_id = $2
      WHERE om.organization_id = $2 AND om.active = true
      ORDER BY m.name
    `, [userId, organizationId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user module permissions:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Aktualizuje uprawnienia użytkownika do modułu
 */
exports.updateUserModulePermissions = async (req, res, next) => {
  try {
    const { organizationId, userId, moduleId } = req.params;
    const { can_access, permissions } = req.body;
    
    // Sprawdź czy użytkownik istnieje i należy do organizacji
    const userExists = await db.query(`
      SELECT u.id FROM users u
      JOIN user_organizations uo ON u.id = uo.user_id
      WHERE u.id = $1 AND uo.organization_id = $2
    `, [userId, organizationId]);
    
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist or does not belong to this organization'
      });
    }
    
    // Sprawdź czy organizacja ma dostęp do tego modułu
    const moduleAccess = await db.query(`
      SELECT id FROM organization_modules 
      WHERE organization_id = $1 AND module_id = $2 AND active = true
    `, [organizationId, moduleId]);
    
    if (moduleAccess.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization does not have access to this module'
      });
    }
    
    // Sprawdź czy istnieje już rekord uprawnień
    const existingPermission = await db.query(`
      SELECT id FROM user_modules
      WHERE user_id = $1 AND organization_id = $2 AND module_id = $3
    `, [userId, organizationId, moduleId]);
    
    if (existingPermission.rows.length > 0) {
      // Aktualizuj istniejące uprawnienia
      await db.query(`
        UPDATE user_modules
        SET can_access = $4,
            permissions = $5,
            updated_at = NOW()
        WHERE user_id = $1 AND organization_id = $2 AND module_id = $3
      `, [userId, organizationId, moduleId, can_access, permissions || {}]);
    } else {
      // Utwórz nowy rekord uprawnień
      await db.query(`
        INSERT INTO user_modules
        (user_id, organization_id, module_id, can_access, permissions)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, organizationId, moduleId, can_access, permissions || {}]);
    }
    
    // Zarejestruj zmianę w historii
    await db.query(`
      INSERT INTO module_access_history
      (organization_id, user_id, module_id, action_type, action_details, performed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      organizationId,
      userId,
      moduleId,
      'update_permissions',
      JSON.stringify({ can_access, permissions }),
      req.userId
    ]);
    
    res.status(200).json({
      success: true,
      message: 'User permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating user module permissions:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Aktywuje okres próbny dla organizacji (wszystkie moduły)
 */
exports.activateTrialPeriod = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { days } = req.body;
    
    const trialDays = days || 14; // Domyślnie 14 dni
    
    // Rozpocznij transakcję
    await db.query('BEGIN');
    
    // Pobierz wszystkie aktywne moduły
    const modules = await db.query(`SELECT id FROM modules WHERE is_active = true`);
    
    // Dla każdego modułu ustaw okres próbny
    for (const module of modules.rows) {
      // Sprawdź czy istnieje już rekord dla tej organizacji i modułu
      const existingModule = await db.query(`
        SELECT id, active, subscription_end_date 
        FROM organization_modules
        WHERE organization_id = $1 AND module_id = $2
      `, [organizationId, module.id]);
      
      if (existingModule.rows.length > 0) {
        // Jeśli już istnieje, przedłuż okres próbny tylko jeśli obecny wygasł
        const currentModule = existingModule.rows[0];
        
        // Jeśli moduł jest już aktywny i ma ważną subskrypcję, nie zmieniaj
        if (currentModule.active && 
            currentModule.subscription_end_date && 
            new Date(currentModule.subscription_end_date) > new Date()) {
          continue;
        }
        
        // Aktualizuj istniejący rekord
        await db.query(`
          UPDATE organization_modules
          SET active = true,
              subscription_start_date = CURRENT_TIMESTAMP,
              subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '${trialDays} days',
              updated_at = NOW()
          WHERE organization_id = $1 AND module_id = $2
        `, [organizationId, module.id]);
      } else {
        // Utwórz nowy rekord
        await db.query(`
          INSERT INTO organization_modules
          (organization_id, module_id, active, subscription_start_date, subscription_end_date)
          VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${trialDays} days')
        `, [organizationId, module.id]);
      }
    }
    
    // Zatwierdź transakcję
    await db.query('COMMIT');
    
    // Oblicz datę zakończenia okresu próbnego
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    res.status(200).json({
      success: true,
      message: `Trial period activated for ${trialDays} days`,
      trialEndDate: trialEndDate
    });
  } catch (error) {
    // W przypadku błędu wycofaj transakcję
    await db.query('ROLLBACK');
    console.error('Error activating trial period:', error);
    next(new AppError('Server error', 500));
  }
};

/**
 * Generuje raport wykorzystania modułów
 */
exports.generateModuleUsageReport = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Domyślnie ostatnie 30 dni, jeśli nie podano dat
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Pobierz statystyki wykorzystania modułów
    const result = await db.query(`
      SELECT 
        m.code, 
        m.name,
        COUNT(*) AS access_count,
        COUNT(DISTINCT mah.user_id) AS unique_users_count,
        MAX(mah.performed_at) AS last_access
      FROM module_access_history mah
      JOIN modules m ON mah.module_id = m.id
      WHERE mah.organization_id = $1
        AND mah.performed_at BETWEEN $2 AND $3
        AND mah.action_type = 'access_granted'
      GROUP BY m.id, m.code, m.name
      ORDER BY access_count DESC
    `, [organizationId, start, end]);
    
    res.status(200).json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        modules: result.rows
      }
    });
  } catch (error) {
    console.error('Error generating module usage report:', error);
    next(new AppError('Server error', 500));
  }
};