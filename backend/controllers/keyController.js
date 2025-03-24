const keyService = require('../services/keyService');
const { AppError } = require('../middleware/errorHandler');

exports.getUserKey = async (req, res, next) => {
  try {
    const userId = req.userId;
    const key = await keyService.getUserKey(userId);
    
    if (!key) {
      return res.status(404).json({
        status: 'fail',
        message: 'Klucz nie znaleziony'
      });
    }

    res.status(200).json({
      status: 'success',
      data: key
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateUserKey = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { public_key, backup_encrypted_private_key } = req.body;
    
    if (!public_key) {
      return next(new AppError('Klucz publiczny jest wymagany', 400));
    }
    
    const keyData = {
      public_key,
      backup_encrypted_private_key
    };
    
    const key = await keyService.createOrUpdateUserKey(userId, keyData);

    res.status(200).json({
      status: 'success',
      data: key
    });
  } catch (error) {
    next(error);
  }
};
