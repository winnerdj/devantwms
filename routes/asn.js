var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var underSA = require('../controller/underSAController.js');
var asn = require('../controller/asnController.js');

router.get('/', auth.loggedIn, asn.index);
router.get('/asn_dtl',auth.loggedIn, asn.asn_details);
router.post('/post_upload',underSA.checkSAStatus, asn.upload_asn);
router.get('/create',auth.loggedIn, asn.create_asn);
router.post('/create',underSA.checkSAStatus,auth.loggedIn, asn.post_create_asn);
router.post('/asn_dtl',underSA.checkSAStatus,auth.loggedIn, asn.post_asn_details);
router.get('/asn_status_count',auth.loggedIn, asn.asn_status_count);

module.exports = router;