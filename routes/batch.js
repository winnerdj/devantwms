var express = require('express');
var router = express.Router();
var batch = require('../controller/batchController.js');
var auth = require('../controller/authController.js');
router.get('/batchlist', auth.loggedIn, batch.batchlist);
router.get('/', auth.loggedIn,batch.index);
router.post('/create', auth.loggedIn,batch.post_create);
router.post('/update', auth.loggedIn,batch.post_update);
module.exports = router;