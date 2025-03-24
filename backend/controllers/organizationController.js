const organizationService = require('../services/organizationService');
const { AppError } = require('../middleware/errorHandler');

exports.getOrganization = async (req, res, next) => {
  try {
    const organizationId = req.params.id;
    
    // Sprawdź czy użytkownik ma dostęp do tej organizacji
    const hasAccess = await organizationService.checkUserPermission(organizationId, req.userId);
    if (!hasAccess) {
      return next(new AppError('Brak dostępu do tej organizacji', 403));
    }
    
    const organization = await organizationService.getOrganization(organizationId);

    res.status(200).json({
      status: 'success',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrganization = async (req, res, next) => {
  try {
    const organizationData = {
      name: req.body.name,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const organization = await organizationService.createOrganization(organizationData, req.userId);

    res.status(201).json({
      status: 'success',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(req.userId);

    res.status(200).json({
      status: 'success',
      data: organizations
    });
  } catch (error) {
    next(error);
  }
};

exports.addUserToOrganization = async (req, res, next) => {
  try {
    const { organizationId, userId, role } = req.body;
    
    // Sprawdź czy użytkownik jest administratorem organizacji
    const isAdmin = await organizationService.checkUserPermission(organizationId, req.userId, 'admin');
    if (!isAdmin) {
      return next(new AppError('Tylko administrator może dodawać użytkowników do organizacji', 403));
    }
    
    const result = await organizationService.addUserToOrganization(organizationId, userId, role);

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
