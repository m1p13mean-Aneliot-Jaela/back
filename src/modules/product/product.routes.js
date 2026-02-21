const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

router.post('/', productController.create.bind(productController));
router.get('/by-shop/:shopId', productController.getByShop.bind(productController));
router.get('/by-shop/:shopId/stats', productController.getStats.bind(productController));
router.get('/by-shop/:shopId/categories', productController.getCategories.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.get('/', productController.search.bind(productController));
router.put('/:id', productController.update.bind(productController));
router.delete('/:id', productController.delete.bind(productController));

module.exports = router;