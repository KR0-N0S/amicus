const bullService = require('../services/bullService');
const { AppError } = require('../middleware/errorHandler');

exports.getBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    const bull = await bullService.getBull(bullId);

    res.status(200).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBulls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';
    
    const result = await bullService.getAllBulls(page, limit, searchTerm);

    res.status(200).json({
      status: 'success',
      data: result.bulls,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createBull = async (req, res, next) => {
  try {
    const bullData = {
      identification_number: req.body.identification_number,
      vet_number: req.body.vet_number,
      breed: req.body.breed,
      semen_production_date: req.body.semen_production_date,
      supplier: req.body.supplier,
      bull_type: req.body.bull_type,
      last_delivery_date: req.body.last_delivery_date,
      straws_last_delivery: req.body.straws_last_delivery,
      current_straw_count: req.body.current_straw_count,
      suggested_price: req.body.suggested_price,
      additional_info: req.body.additional_info,
      favorite: req.body.favorite,
      vet_id: req.body.vet_id
    };

    const bull = await bullService.createBull(bullData);

    res.status(201).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    
    const bullData = {
      identification_number: req.body.identification_number,
      vet_number: req.body.vet_number,
      breed: req.body.breed,
      semen_production_date: req.body.semen_production_date,
      supplier: req.body.supplier,
      bull_type: req.body.bull_type,
      last_delivery_date: req.body.last_delivery_date,
      straws_last_delivery: req.body.straws_last_delivery,
      current_straw_count: req.body.current_straw_count,
      suggested_price: req.body.suggested_price,
      additional_info: req.body.additional_info,
      favorite: req.body.favorite,
      vet_id: req.body.vet_id
    };

    const updatedBull = await bullService.updateBull(bullId, bullData);

    res.status(200).json({
      status: 'success',
      data: updatedBull
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    
    await bullService.deleteBull(bullId);

    res.status(200).json({
      status: 'success',
      message: 'Byk został usunięty'
    });
  } catch (error) {
    next(error);
  }
};
