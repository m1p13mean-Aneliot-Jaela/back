const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');
const quoteRequestService = require('./quote-request.service');
const { validationResult } = require('express-validator');

const controller = {
  /**
   * POST /api/quotes
   * Create a new quote request (Client)
   */
  create: catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const quote = await quoteRequestService.createRequest({
      ...req.body,
      client_id: req.user?.user_type === 'buyer' ? req.user.id : null
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Demande créée avec succès',
      data: { quote }
    });
  }),

  /**
   * GET /api/quotes/my
   * Get client's own quote requests
   */
  getMyQuotes: catchAsync(async (req, res) => {
    const { phone } = req.query;
    
    if (!phone && req.user?.user_type !== 'buyer') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Numéro de téléphone requis'
      });
    }

    const clientPhone = phone || req.user?.phone;
    const clientId = req.user?.user_type === 'buyer' ? req.user.id : null;

    const quotes = await quoteRequestService.getClientQuotes(clientPhone, clientId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { quotes }
    });
  }),

  /**
   * GET /api/quotes/shop/:shopId
   * Get shop's quote requests (Manager/Staff)
   */
  getShopQuotes: catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { status, search, limit } = req.query;

    const { quotes, stats } = await quoteRequestService.getShopQuotes(shopId, {
      status,
      search,
      limit: parseInt(limit) || 50
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { quotes, stats }
    });
  }),

  /**
   * GET /api/quotes/:id
   * Get single quote request
   */
  getById: catchAsync(async (req, res) => {
    const quote = await quoteRequestService.getQuoteById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { quote }
    });
  }),

  /**
   * POST /api/quotes/:id/review
   * Manager starts reviewing a quote
   */
  startReview: catchAsync(async (req, res) => {
    const quote = await quoteRequestService.startReview(
      req.params.id,
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Demande en cours de traitement',
      data: { quote }
    });
  }),

  /**
   * POST /api/quotes/:id/respond (Manager)
   * Manager sends quote response
   */
  managerRespond: catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { message, calculated_total, items_confirmed, shipping_fee } = req.body;

    const quote = await quoteRequestService.managerRespond(
      req.params.id,
      { message, calculated_total, items_confirmed, shipping_fee },
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Devis envoyé au client',
      data: { quote }
    });
  }),

  /**
   * POST /api/quotes/:id/respond (Client)
   * Client accepts or rejects quote
   */
  clientRespond: catchAsync(async (req, res) => {
    const { accepted, message } = req.body;

    const quote = await quoteRequestService.clientRespond(
      req.params.id,
      accepted,
      message
    );

    const msg = accepted 
      ? 'Devis accepté avec succès' 
      : 'Devis refusé';

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: msg,
      data: { quote }
    });
  }),

  /**
   * POST /api/quotes/:id/convert
   * Convert accepted quote to order (Manager) - Creates order automatically
   */
  convertToOrder: catchAsync(async (req, res) => {
    const { assigned_staff_id } = req.body;

    const result = await quoteRequestService.convertToOrder(
      req.params.id,
      req.user.id,
      assigned_staff_id
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Demande convertie en commande automatiquement',
      data: { 
        quote: result.quote,
        order: result.order
      }
    });
  }),

  /**
   * GET /api/quotes/stats/:shopId
   * Get quote statistics for shop dashboard
   */
  getStats: catchAsync(async (req, res) => {
    const stats = await quoteRequestService.getStats(req.params.shopId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { stats }
    });
  })
};

module.exports = controller;
