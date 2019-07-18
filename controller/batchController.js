var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var batch = require('../models/batch.js');
let modulename = "batch";
const Op = db.Op;

exports.index = function(req, res) {
    const pagename = "batch_index"
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {Batch,BatchDescription} = req.query
    let Batch_inp = Batch;
    let BatchDescription_inp = BatchDescription;
    let whereStatement = {}
    if(Batch!='' && Batch)
    whereStatement.Batch = Batch;
    if(BatchDescription!='' && BatchDescription)
    whereStatement.BatchDescription =    {[Op.like]: '%'+BatchDescription+'%'};
    batch.findAll({ where: whereStatement })
          .then( Batchlist => 
          {
            //res.send({batch});
            res.render('../views/batch/index',{Batchlist,Batch_inp,BatchDescription_inp,modulename,pagename,userpermissionmodule,username: req.session.username})
          });

};
exports.post_create = function(req, res) {
    let {Batch,BatchDescription} = req.body;

    batch.create({
        Batch,BatchDescription
    })
    req.flash('success_msg','Batch Successfully Added');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}


exports.post_update = function(req, res) {
    let {ID,Batch,BatchDescription} = req.body;

    batch.update({
        Batch,BatchDescription
    },
        {where: {ID}}
    )
    req.flash('success_msg','Batch Successfully Updated');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}

exports.batchlist = function(req, res) {
    batch.findAll({
        raw: true,
    }).then(batch => {
        res.send(batch);
    });
};