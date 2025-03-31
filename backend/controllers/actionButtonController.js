const actionButtonService = require('../services/actionButtonService');
const { AppError } = require('../middleware/errorHandler');

// Pobierz wszystkie przyciski akcji użytkownika
exports.getUserActionButtons = async (req, res, next) => {
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

// Utwórz nowy przycisk akcji
exports.createActionButton = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      user_id: req.userId
    };

    const button = await actionButtonService.createActionButton(data);
    res.status(201).json({
      status: 'success',
      data: button
    });
  } catch (error) {
    next(error);
  }
};

// Aktualizuj przycisk akcji
exports.updateActionButton = async (req, res, next) => {
  try {
    // Dodaj ID użytkownika do danych
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
    next(error);
  }
};

// Usuń przycisk akcji
exports.deleteActionButton = async (req, res, next) => {
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