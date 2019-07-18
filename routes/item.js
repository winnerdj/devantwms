

var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var item = require('../controller/itemController.js');


router.get('/',auth.loggedIn, item.index);
router.get('/itemlist', auth.loggedIn, item.itemlist);
router.post('/create', auth.loggedIn, item.post_create);
router.post('/update', auth.loggedIn, item.post_update);
router.get('/findByItemCode/:ItemCode', auth.loggedIn, item.findByItemCode);

module.exports = router;            