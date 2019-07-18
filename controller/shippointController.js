var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var shippoint = require('../models/ship_point.js');
let modulename = "shippoint";
const Op = db.Op;


exports.index = function(req, res) {
    const pagename = "shippoint_index"
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {ShipPointCode,ShipPointName,Status} = req.query
    let ShipPointCode_inp = ShipPointCode;
    let ShipPointName_inp = ShipPointName;
    let Status_inp = Status;
    let whereStatement = {}
    if(ShipPointCode!='' && ShipPointCode)
    whereStatement.ShipPointCode = ShipPointCode;
   /* if(ShipPointName!='' && ShipPointName)
    whereStatement.ShipPointName =    {[Op.like]: '%'+ShipPointName+'%'};*/
    if(Status!='' && Status)
    whereStatement.Status = Status;
    shippoint.findAll({ where: whereStatement })
          .then( shipppoints => 
          {
            //res.send({items});
            res.render('../views/ShipPoint/index',{shipppoints,ShipPointCode_inp,ShipPointName_inp,Status_inp,modulename,pagename,userpermissionmodule,username: req.session.username})
          });

};
exports.post_create = function(req, res) {
    let {ShipPointCode,ShipPointName,Dealer,Address1,Address2,Address3,PostalCode,City,State,Country,ContactPerson,Phone1,Phone2,Fax,Email,Url,Status} = req.body;

    shippoint.create({
        ShipPointCode,ShipPointName,Dealer,Address1,Address2,Address3,PostalCode,City,State,Country,ContactPerson,Phone1,Phone2,Fax,Email,Url,Status
    })
    req.flash('success_msg','Ship Point Successfully Added');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}


exports.post_update = function(req, res) {
    let {ShipPointCode,ShipPointName,Dealer,Address1,Address2,Address3,PostalCode,City,State,Country,ContactPerson,Phone1,Phone2,Fax,Email,Url,Status} = req.body;

    shippoint.update({
        ShipPointName,Dealer,Address1,Address2,Address3,PostalCode,City,State,Country,ContactPerson,Phone1,Phone2,Fax,Email,Url,Status
    },
        {where: {ShipPointCode}}
    )
    req.flash('success_msg','Ship Point Successfully Updated');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}