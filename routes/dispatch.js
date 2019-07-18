var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var dispatch = require('../controller/dispatchController.js');
var underSA = require('../controller/underSAController.js');

router.get('/',auth.loggedIn, dispatch.index);
router.get('/dispatch_dtl', auth.loggedIn, dispatch.dispatch_details);
router.get('/create',auth.loggedIn, dispatch.create_dispatch);
router.post('/dispatch_dtl',auth.loggedIn, underSA.checkSAStatus,  dispatch.post_dispatch_details);
router.post('/create', underSA.checkSAStatus, auth.loggedIn, dispatch.post_create_dispatch);
router.get('/dispatch_status_count',auth.loggedIn, dispatch.dispatch_status_count);
router.get('/generatedr/:DispatchNo/:ID', auth.loggedIn, dispatch.generateDR);
module.exports = router;            