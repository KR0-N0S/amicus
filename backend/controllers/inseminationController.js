const inseminationService = require('../services/inseminationService');
const { AppError } = require('../middleware/errorHandler');

exports.getInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    const insemination = await inseminationService.getInsemination(inseminationId);
    
    // Sprawdzenie czy inseminacja należy do zalogowanego użytkownika
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tego wpisu inseminacji', 403));
    }

    res.status(200).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnimalInseminations = async (req, res, next) => {
  try {
    const animalId = req.params.animalId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await inseminationService.getAnimalInseminations(animalId, page, limit);
    
    // Tutaj można dodać sprawdzenie czy zwierzę należy do użytkownika
    // W tym przypadku zakładamy, że walidacja jest w serwisie

    res.status(200).json({
      status: 'success',
      data: {
        animal: result.animal,
        inseminations: result.inseminations
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserInseminations = async (req, res, next) => {
  try {
    const ownerId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Obsługa filtrów
    const filters = {};
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.animalId) filters.animalId = req.query.animalId;
    
    const result = await inseminationService.getOwnerInseminations(ownerId, page, limit, filters);

    res.status(200).json({
      status: 'success',
      data: result.inseminations,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createInsemination = async (req, res, next) => {
  try {
    // Przypisujemy inseminację do zalogowanego użytkownika
    const inseminationData = {
      animal_id: req.body.animal_id,
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      owner_id: req.userId,
      bull_id: req.body.bull_id
    };

    const insemination = await inseminationService.createInsemination(inseminationData);

    res.status(201).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await inseminationService.getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tego wpisu inseminacji', 403));
    }
    
    const inseminationData = {
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      bull_id: req.body.bull_id
    };

    const updatedInsemination = await inseminationService.updateInsemination(
      inseminationId, 
      inseminationData
    );

    res.status(200).json({
      status: 'success',
      data: updatedInsemination
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await inseminationService.getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tego wpisu inseminacji', 403));
    }

    await inseminationService.deleteInsemination(inseminationId);

    res.status(200).json({
      status: 'success',
      message: 'Wpis inseminacji został usunięty'
    });
  } catch (error) {
    next(error);
  }
};
