var express = require('express');
var router = express.Router();
var batch_uid_correction = require('../controller/batchUIDCorrectionController.js');
var auth = require('../controller/authController.js');
var underSA = require('../controller/underSAController.js');

router.get('/', auth.loggedIn,batch_uid_correction.index);
router.get('/create', auth.loggedIn,batch_uid_correction.create_batch_uid_correction);
router.post('/create', underSA.checkSAStatus, auth.loggedIn,batch_uid_correction.post_create_batch_uid_correction);
router.post('/validateBatchCorrection', underSA.checkSAStatus, auth.loggedIn,batch_uid_correction.validateBatchCorrection);
router.get('/inventorylist', auth.loggedIn,batch_uid_correction.inventorylist);
module.exports = router;