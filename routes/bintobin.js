var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var bintobin = require('../controller/bintobinController.js');
var underSA = require('../controller/underSAController.js');

router.get('/', auth.loggedIn,bintobin.index);
router.get('/create', auth.loggedIn,bintobin.create_bintobin);
router.get('/bintobin_dtl/:BinToBinNo',auth.loggedIn, bintobin.bintobin_details);
router.post('/bintobin_dtl', auth.loggedIn, underSA.checkSAStatus, bintobin.post_bintobin_details);
//router.post('/post_upload',auth.loggedIn, asn.upload_asn);

router.post('/create', auth.loggedIn, underSA.checkSAStatus, bintobin.post_create_bintobin);
//router.post('/asn_dtl',auth.loggedIn, asn.post_asn_details);
router.get('/inventorylist', auth.loggedIn,bintobin.inventorylist);
router.post('/validateBinToBin',auth.loggedIn, underSA.checkSAStatus, bintobin.validateBinToBin);

module.exports = router;