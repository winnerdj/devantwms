var express = require('express');   
var router = express.Router();
var auth = require('../controller/authController.js');
var location = require('../controller/locationController.js');




router.get('/',auth.loggedIn, location.index);
router.get('/locationlist', auth.loggedIn, location.locationlist);
router.get('/check_validlocation', auth.loggedIn, location.check_validlocation);
router.post('/create', auth.loggedIn, location.post_create);
router.post('/update', auth.loggedIn, location.post_update);
module.exports = router;            