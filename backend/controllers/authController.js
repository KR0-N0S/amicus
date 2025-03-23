const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const organizationData = req.body.organization || null;

    const result = await authService.register(userData, organizationData);

    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        organization: result.organization,
        token: result.token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        organizations: result.organizations,
        token: result.token
      }
    });
  } catch (error) {
    next(new AppError('Nieprawidłowe dane logowania', 401));
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await authService.getUserProfile(req.userId);

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        organizations: result.organizations
      }
    });
  } catch (error) {
    next(error);
  }
};
