var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var gr = require('../controller/grController.js');
var underSA = require('../controller/underSAController.js');

router.get('/',auth.loggedIn, gr.index);
router.get('/gr_dtl', underSA.checkSAStatus,auth.loggedIn, gr.gr_details);
router.get('/create', auth.loggedIn, gr.create_gr);
router.post('/gr_dtl', underSA.checkSAStatus, auth.loggedIn, auth.loggedIn, gr.post_gr_details);
router.get('/check_gr_dtl_count', auth.loggedIn, gr.check_gr_dtl_count);
router.post('/create', underSA.checkSAStatus, auth.loggedIn, gr.post_create_gr);
router.get('/check_uid_exist', auth.loggedIn, gr.check_uid_exist);
router.post('/check_serialno_exist', auth.loggedIn, gr.check_serialno_exist);
router.get('/gr_status_count', auth.loggedIn, gr.gr_status_count);
router.post('/uploadgr', underSA.checkSAStatus, auth.loggedIn, gr.uploadgr);
module.exports = router;            