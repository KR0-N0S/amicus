const visitService = require('../services/visitService');
const { AppError } = require('../middleware/errorHandler');

exports.getVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    const visit = await visitService.getVisit(visitId);
    
    // Sprawdzenie czy wizyta dotyczy zalogowanego użytkownika
    // Może być farmerId, vetId lub employeeId
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tej wizyty', 403));
    }

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

exports.getFarmerVisits = async (req, res, next) => {
  try {
    const farmerId = req.userId; // Pobieramy wizyty zalogowanego użytkownika
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await visitService.getFarmerVisits(farmerId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.getVetVisits = async (req, res, next) => {
  try {
    const vetId = req.userId; // Pobieramy wizyty zalogowanego weterynarza
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await visitService.getVetVisits(vetId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createVisit = async (req, res, next) => {
  try {
    const visitData = {
      farmer_id: req.body.farmer_id,
      vet_id: req.body.vet_id,
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status || 'Scheduled',
      employee_id: req.body.employee_id,
      channel: req.body.channel
    };

    const visit = await visitService.createVisit(visitData);

    res.status(201).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await visitService.getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tej wizyty', 403));
    }
    
    const visitData = {
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status,
      vet_id: req.body.vet_id,
      employee_id: req.body.employee_id,
      channel: req.body.channel
    };

    const updatedVisit = await visitService.updateVisit(visitId, visitData);

    res.status(200).json({
      status: 'success',
      data: updatedVisit
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await visitService.getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tej wizyty', 403));
    }

    await visitService.deleteVisit(visitId);

    res.status(200).json({
      status: 'success',
      message: 'Wizyta została usunięta'
    });
  } catch (error) {
    next(error);
  }
};
