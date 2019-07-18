const express = require('express');
const db = require('../models/db.js');
const batch_uid_correction = require('../models/batch_uid_correction.js');
const inventory = require('../models/inventory');
const item = require('../models/item');
const user = require('../models/user.js');
const Sequelize = require("sequelize");
const modulename = "batch_correction";
const Op = Sequelize.Op;

function arr_diff(a1, a2) {
    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }
    return diff;
}
exports.index = function(req, res) {
    const pagename = "batch_correction_index"
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    
    var yyyy = today.getFullYear();
    if (dd < 10) {
    dd = '0' + dd;
    } 
    if (mm < 10) {
    mm = '0' + mm;
    } 
    var today = yyyy + '-'+ mm + '-' + dd;
    let {SerialNo, ItemCode,paramDate1,paramDate2} = req.query;
    let paramdate1_inp = today;
    let paramDate2_inp = today;
    if(req.query.paramDate1){
        paramdate1_inp = req.query.paramDate1;
    }else{
        req.query.paramDate1 = paramdate1_inp;
    }
    if(req.query.paramDate2){
        paramDate2_inp = req.query.paramDate2;
    }else{
        req.query.paramDate2 = paramDate2_inp;
    }
    batch_uid_correction.hasOne(user, {foreignKey: 'ID'});
    let whereStatement = {}
    if(SerialNo!='' && SerialNo)
    whereStatement.SerialNo = SerialNo;
    if(ItemCode!='' && ItemCode)
    whereStatement.ItemCode = ItemCode;
    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    batch_uid_correction.findAll({
        include:{
            model:user,
            on: {
                col1: db.where(db.col("tbl_batch_uid_correction.CreatedBy"), "=", db.col("tbl_user.ID"))
              }
        }, 
        where: whereStatement
     })
        .then(batch_uid_correction => res.render('../views/batch_uid_correction/index',{batch_uid_correction,SerialNo,ItemCode,modulename,pagename,userpermissionmodule,username: req.session.username}));
};

exports.create_batch_uid_correction = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
	var pagename = "create_batch_uid_correction"
    res.render('../views/batch_uid_correction/create',{modulename,pagename,userpermissionmodule,username: req.session.username});
}

exports.inventorylist = function(req, res) {
    let {Location,Batch,Status,StockStatus,ItemCode,ID} = req.query;
    console.log(req.query);
    let whereStatement = {}
    if(Location!='')
    whereStatement.Location = Location;
    if(Batch!='')
    whereStatement.Batch = Batch;
    if(Status!='')
    whereStatement.Status = Status;
    if(StockStatus!='')
    whereStatement.StockStatus = StockStatus;
    if(ItemCode!='')
    whereStatement.ItemCode = ItemCode;
    inventory.hasOne(item, {foreignKey: 'ItemCode', sourceKey:'ItemCode'});
    whereStatement.Status =  {[Op.or]: ['ATP', 'Unservisable', 'Goods Received']};
    if (ID === undefined || ID.length == 0) {
    }else{
        whereStatement.ID ={[Op.notIn]: [ID]};
    }
    inventory.findAll({
        where: whereStatement,
        include: {model:item, 
                on: {
                col1: db.where(db.col("tbl_inventory.ItemCode"), "=", db.col("tbl_item_master.ItemCode"))
                }
            },
            raw: true,
    }).then(stockinquiry => {
        res.send(stockinquiry);
    });
}
exports.validateBatchCorrection = function(req, res) {
    processValidation = async function(){
        let {BatchTo,ID} = req.body;
        const validationResult = await Validations(BatchTo,ID);
        res.send(validationResult);
    }
    processValidation();
}
const Validations= async function(BatchTo,ID){
    error_list = [];
    error_req = 0;
    if(!BatchTo){
        error_list.push('<li>No item selected.</li>');
    }else{
        const checkreq =  await BatchTo.forEach(function(element,key){
            if(BatchTo[key] == ''){
                error_req=1;
            }
        });
        const inventorycheck = await inventory.findAll({
            where: {
                    Status: {[Op.or]: ['ATP', 'Unservisable']},
                    ID : {[Op.in]: ID},
                    },
            raw: true,
        }).catch((err)=>console.log(err))
        const inventoryDBID = await inventorycheck.map(inventorycheck => inventorycheck.ID); 
        let compareInputDBID = await arr_diff(inventoryDBID,ID);
        if(error_req!=0)
        error_list.push('<li>Please fill all required fields</li>');

        if(BatchTo.length!=ID.length)
        error_list.push('<li>System error. Please contact the administrator</li>');
        if(compareInputDBID.length>0)
        error_list.push('<li>Invalid Item</li>');
    }
    //res.send(error_list);
    return error_list;
}
exports.post_create_batch_uid_correction = function(req, res) {
    const processBatchUIDCorrection = async function(){
        let {BatchTo,UIDTo} = req.body;
        let IDList = req.body.ID;
        const validationResult = await Validations(BatchTo,IDList);
        if(validationResult.length>0){
            req.flash('error_msg',validationResult);  
            res.redirect('/bin-to-bin/create'); 
        }else{
            let UpdatedinventoryItemsForBatchCorrection = [];
            let UpdatedinventoryItemsForInventory = [];
            const inventoryItems = await  db.query('SELECT `ID` AS `InventoryID`, `ItemCode`, `SerialNo`, `Batch` AS `BatchFrom`,StockStatus,UID,Qty,UOM,GRNo,PACode,PLID,Expiry,Manufacturing,Status,WarehouseCode,Location FROM `tbl_inventory` AS `tbl_inventory` WHERE `tbl_inventory`.`ID` IN (:IDs) ORDER BY FIELD(InventoryID, :IDs)',  { replacements: { IDs: IDList }, type: db.QueryTypes.SELECT } )
            await BatchTo.forEach(function(element,key) {
                UpdatedinventoryItemsForBatchCorrection.push({
                    SerialNo : inventoryItems[key]['SerialNo'],
                    ItemCode : inventoryItems[key]['ItemCode'],
                    BatchFrom : inventoryItems[key]['BatchFrom'],
                    UIDFrom :inventoryItems[key]['UID'],
                    BatchTo : BatchTo[key],
                    UIDTo : UIDTo[key],
                    CreatedBy: req.user
                });
                UpdatedinventoryItemsForInventory.push({
                    ID : inventoryItems[key]['InventoryID'],
                    ItemCode : inventoryItems[key]['ItemCode'],
                    StockStatus : inventoryItems[key]['StockStatus'],
                    SerialNo : inventoryItems[key]['SerialNo'],
                    UID : UIDTo[key],
                    Qty : inventoryItems[key]['Qty'],
                    UOM : inventoryItems[key]['UOM'],
                    GRNo : inventoryItems[key]['GRNo'],
                    PACode : inventoryItems[key]['PACode'],
                    PLID : inventoryItems[key]['PLID'],
                    Batch : BatchTo[key],
                    Expiry : inventoryItems[key]['Expiry'],
                    Manufacturing : inventoryItems[key]['Manufacturing'],
                    Location : inventoryItems[key]['Location'],
                    Status : inventoryItems[key]['Status'],
                    WarehouseCode : inventoryItems[key]['WarehouseCode'],
                })
            });
            await inventory.bulkCreate(UpdatedinventoryItemsForInventory, {updateOnDuplicate: true}).catch(error => {  console.error(error) });
            await batch_uid_correction.bulkCreate( UpdatedinventoryItemsForBatchCorrection );
            await req.flash('success_msg','Successfully Corrected Batch No');
            await res.redirect('/batch_uid_correction/create');
        }
    } 
    processBatchUIDCorrection();
}