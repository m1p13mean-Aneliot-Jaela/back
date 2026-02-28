const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('./quote-request.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');

// Validation rules
const createQuoteValidation = [
  body('client_name').trim().notEmpty().withMessage('Le nom du client est requis'),
  body('client_phone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('shop_id').isMongoId().withMessage('ID shop invalide'),
  body('shop_name').trim().notEmpty().withMessage('Le nom du shop est requis'),
  body('requested_items').isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
  body('requested_items.*.product_name').trim().notEmpty().withMessage('Nom du produit requis'),
  body('requested_items.*.quantity').isInt({ min: 1 }).withMessage('Quantité minimale: 1')
];

const managerResponseValidation = [
  body('message').trim().notEmpty().withMessage('Un message est requis'),
  body('calculated_total').isFloat({ min: 0 }).withMessage('Total invalide'),
  body('items_confirmed').isArray({ min: 1 }).withMessage('Au moins un produit confirmé'),
  body('items_confirmed.*.product_id').isMongoId().withMessage('ID produit invalide'),
  body('items_confirmed.*.quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('items_confirmed.*.unit_price').isFloat({ min: 0 }).withMessage('Prix unitaire invalide')
];

const clientResponseValidation = [
  body('accepted').isBoolean().withMessage('accepted doit être un booléen'),
  body('message').optional().trim()
];

/**
 * @route   POST /api/quotes
 * @desc    Create new quote request (Client - guest or registered)
 * @access  Public (guest) or Private (registered buyer)
 */
router.post('/', createQuoteValidation, controller.create);

/**
 * @route   GET /api/quotes/my
 * @desc    Get client's own quote requests
 * @access  Public (with phone) or Private (registered buyer)
 */
router.get('/my', controller.getMyQuotes);

/**
 * @route   GET /api/quotes/shop/:shopId
 * @desc    Get shop's quote requests
 * @access  Private (Shop Manager/Staff)
 */
router.get('/shop/:shopId', authenticate, requirePermission('view_orders'), controller.getShopQuotes);

/**
 * @route   GET /api/quotes/stats/:shopId
 * @desc    Get quote statistics
 * @access  Private (Shop Manager)
 */
router.get('/stats/:shopId', authenticate, requirePermission('view_orders'), controller.getStats);

/**
 * @route   GET /api/quotes/:id
 * @desc    Get single quote request
 * @access  Private (owner or shop staff)
 */
router.get('/:id', authenticate, controller.getById);

/**
 * @route   POST /api/quotes/:id/review
 * @desc    Manager starts reviewing a quote
 * @access  Private (Shop Manager)
 */
router.post('/:id/review', authenticate, requirePermission('manage_promotions'), controller.startReview);

/**
 * @route   POST /api/quotes/:id/respond (Manager)
 * @desc    Manager sends quote response
 * @access  Private (Shop Manager)
 */
router.post('/:id/respond/manager', authenticate, requirePermission('manage_promotions'), managerResponseValidation, controller.managerRespond);

/**
 * @route   POST /api/quotes/:id/respond (Client)
 * @desc    Client accepts or rejects quote
 * @access  Public (with phone verification) or Private (registered)
 */
router.post('/:id/respond/client', clientResponseValidation, controller.clientRespond);

/**
 * @route   POST /api/quotes/:id/convert
 * @desc    Convert accepted quote to order
 * @access  Private (Shop Staff)
 */
router.post('/:id/convert', authenticate, requirePermission('process_orders'), controller.convertToOrder);

module.exports = router;
