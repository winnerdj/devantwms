var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var pickplan = require('../controller/pickplanController.js');
var underSA = require('../controller/underSAController.js');

router.get('/',auth.loggedIn, pickplan.index);
router.get('/pickplan_dtl',auth.loggedIn, pickplan.pickplan_details);
//router.post('/post_upload',auth.loggedIn, pickplan.upload_asn);
router.get('/create',auth.loggedIn, pickplan.create_pickplan);
router.post('/create', underSA.checkSAStatus, auth.loggedIn, pickplan.post_create_pickplan);
router.post('/pickplan_dtl', underSA.checkSAStatus, pickplan.post_pickplan_details);
router.post('/validate_serialno_status_exist',auth.loggedIn, pickplan.validate_serialno_status_exist);
router.get('/check_pickplan_item_count',auth.loggedIn, pickplan.check_pickplan_item_count);
router.get('/pickplan_status_count',pickplan.pickplan_status_count);
module.exports = router;