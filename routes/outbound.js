var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var outbound = require('../controller/outboundController.js');
var underSA = require('../controller/underSAController.js');

router.get('/',auth.loggedIn, outbound.index);
router.get('/outbound_dtl', auth.loggedIn, outbound.outbound_details);
router.post('/post_upload',underSA.checkSAStatus, auth.loggedIn, outbound.upload_outbound);
router.get('/create', auth.loggedIn, outbound.create_outbound);
router.post('/create', underSA.checkSAStatus, auth.loggedIn, outbound.post_create_outbound);
router.post('/outbound_dtl', underSA.checkSAStatus, auth.loggedIn, outbound.post_outbound_details);
router.get('/outbound_status_count',auth.loggedIn, outbound.outbound_status_count);

module.exports = router;