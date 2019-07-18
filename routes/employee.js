var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var employee = require('../models/employee.js');
var user = require('../models/user.js');
let isEmployee = "isEmployee";






//ui
router.get('/employeelist',function(req, res){
    user.findAll({
        where:
            {
                Status : 'Active'
            },
            raw: true,
    }).then(user => {
        res.send(user);
    });
});





module.exports = router;