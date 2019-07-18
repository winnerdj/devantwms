var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var stockAccuracy = require('../controller/stockAccuracyController.js');

router.get('/', auth.loggedIn,stockAccuracy.index);
router.post('/create', auth.loggedIn,stockAccuracy.create_stockaccuracy);
router.get('/stock_accuracy_dtl/:StockAccuracyNo', auth.loggedIn,stockAccuracy.stock_accuracy_details);
router.post('/uploadstockaccuracy', auth.loggedIn,stockAccuracy.uploadstockaccuracy);
router.post('/stock_accuracy_dtl', auth.loggedIn,stockAccuracy.post_stock_accuracy_details);

module.exports = router;