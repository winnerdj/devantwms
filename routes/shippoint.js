var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var shippoint = require('../models/ship_point.js');

let isItem = "isShippoint";
var auth = require('../controller/authController.js');
var ship_point = require('../controller/shippointController.js');


router.get('/',auth.loggedIn, ship_point.index);
router.post('/create',auth.loggedIn, ship_point.post_create);
router.post('/update',auth.loggedIn, ship_point.post_update);



//ui
router.get('/shippointlist',function(req, res){
    shippoint.findAll({
        attributes: [`ShipPointCode`, `ShipPointName`, `Address1`,`Status`],
        where:
            {
                Status : 'Active'
            },
            raw: true,
    }).then(shippoint => {
        res.send(shippoint);
    });
});





module.exports = router;