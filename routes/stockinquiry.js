var express = require('express');
var router = express.Router();
var auth = require('../controller/authController.js');
var stockinquiry = require('../controller/stockInquiryController.js');

router.get('/', auth.loggedIn,stockinquiry.index);
router.get('/setinitialstock',auth.loggedIn, stockinquiry.setinitialstock);
router.post('/post_upload', auth.loggedIn, stockinquiry.post_setinitialstock);
router.get('/backup_db', auth.loggedIn, stockinquiry.backup_db);
router.get('/export_excel',  stockinquiry.export_excel);
module.exports = router;