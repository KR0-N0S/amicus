const actionButtonService = require('../services/actionButtonService');
const { AppError } = require('../middleware/errorHandler');

// Pobierz wszystkie przyciski akcji użytkownika
exports.getUserActionButtons = async (req, res, next) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    const actionButtons = await actionButtonService.getUserActionButtons(req.userId);
    
    res.status(200).json({
      status: 'success',
      results: actionButtons.length,
      data: actionButtons
    });
  } catch (error) {
    next(error);
  }
};

// Pobierz pojedynczy przycisk akcji
exports.getActionButton = async (req, res, next) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    const actionButton = await actionButtonService.getActionButtonById(
      req.params.buttonId,
      req.userId
    );
    
    res.status(200).json({
      status: 'success',
      data: actionButton
    });
  } catch (error) {
    next(error);
  }
};

// Utwórz nowy przycisk akcji – z poprawionym debugowaniem
exports.createActionButton = async (req, res, next) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    console.log('Creating action button with user ID:', req.userId);
    console.log('Request body:', req.body);
    
    const data = {
      ...req.body,
      user_id: req.userId
    };
    
    console.log('Data passed to service:', data);
    
    const button = await actionButtonService.createActionButton(data);
    console.log('Created button:', button);
    
    res.status(201).json({
      status: 'success',
      data: button
    });
  } catch (error) {
    console.error('Error creating action button:', error);
    next(error);
  }
};

// Aktualizuj przycisk akcji – z poprawionym debugowaniem
exports.updateActionButton = async (req, res, next) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    console.log('Updating action button with ID:', req.params.buttonId, 'for user ID:', req.userId);
    console.log('Request body:', req.body);
    
    req.body.user_id = req.userId;
    
    const actionButton = await actionButtonService.updateActionButton(
      req.params.buttonId,
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: actionButton
    });
  } catch (error) {
    console.error('Error updating action button:', error);
    next(error);
  }
};

// Usuń przycisk akcji
exports.deleteActionButton = async (req, res, next) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    await actionButtonService.deleteActionButton(
      req.params.buttonId,
      req.userId
    );
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};