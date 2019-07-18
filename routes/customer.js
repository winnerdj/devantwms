
var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var customer = require('../controller/customerController.js');

router.get('/',auth.loggedIn, customer.index);
router.get('/customerlist', auth.loggedIn, customer.customerlist);
router.post('/create',auth.loggedIn, customer.post_create);
router.post('/update', auth.loggedIn, customer.post_update);
module.exports = router;            