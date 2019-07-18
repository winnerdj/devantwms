var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var stockconversion = require('../controller/stockConversionController.js');
var underSA = require('../controller/underSAController.js');
router.get('/', auth.loggedIn,stockconversion.index);
router.get('/create', auth.loggedIn,stockconversion.create_stockconversion);
router.post('/create', underSA.checkSAStatus, auth.loggedIn,stockconversion.post_create_stockconversion);
router.get('/stock_conversion_dtl/:StockConversionNo', auth.loggedIn,stockconversion.stock_conversion_details);
router.post('/stock_conversion_dtl', underSA.checkSAStatus, auth.loggedIn,stockconversion.post_stock_conversion_details);
router.post('/validateStockConversion', underSA.checkSAStatus, auth.loggedIn,stockconversion.validateStockConversion);
router.get('/inventorylist', auth.loggedIn,stockconversion.inventorylist);

module.exports = router;