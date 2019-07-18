var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var putaway = require('../controller/putawayController.js');
var underSA = require('../controller/underSAController.js');

router.get('/',auth.loggedIn, putaway.index);
router.get('/putaway_dtl',auth.loggedIn, putaway.putaway_details);
router.get('/create',auth.loggedIn, putaway.create_putaway);
//router.post('/create',auth.loggedIn, putaway.post_create_asn);
router.post('/putaway_dtl',underSA.checkSAStatus, auth.loggedIn, putaway.post_putaway_details);
router.get('/putaway_status_count',auth.loggedIn, putaway.putaway_status_count);
router.post('/uploadputaway', underSA.checkSAStatus, auth.loggedIn, putaway.uploadputaway);

module.exports = router;