var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var loading = require('../controller/loadingController');
var underSA = require('../controller/underSAController.js');

router.get('/', auth.loggedIn,loading.index);
router.get('/create', auth.loggedIn,loading.create_loading);
router.get('/loading_dtl', auth.loggedIn,loading.loading_details);
router.post('/create', underSA.checkSAStatus, auth.loggedIn, loading.post_create_loading);
router.post('/loading_dtl', underSA.checkSAStatus, auth.loggedIn,loading.post_loading_details);
router.get('/loading_status_count', auth.loggedIn,loading.loading_status_count);
router.post('/generate_loadlist', auth.loggedIn,loading.generate_loadlist);
module.exports = router;