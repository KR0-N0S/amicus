const userService = require('../services/userService');
const { AppError } = require('../middleware/errorHandler');

exports.getProfile = async (req, res, next) => {
  try {
    const result = await userService.getUserProfile(req.userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const updatedUser = await userService.updateUserProfile(req.userId, userData);

    res.status(200).json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return next(new AppError('Bieżące i nowe hasło są wymagane', 400));
    }

    const result = await userService.changePassword(req.userId, current_password, new_password);

    res.status(200).json({
      status: 'success',
      message: 'Hasło zostało zmienione'
    });
  } catch (error) {
    next(error);
  }
};
