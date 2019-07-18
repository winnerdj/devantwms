var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var bintobin_hdr = require('../models/bintobin_hdr.js');
var bintobin_detail = require('../models/bintobin_detail.js');
var item = require('../models/item.js');
var inventory = require('../models/inventory.js');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const modulename = "bintobin";


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
//display asn header
exports.index = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);  
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; 

    var yyyy = today.getFullYear();
    if (dd < 10) {
    dd = '0' + dd;
    } 
    if (mm < 10) {
    mm = '0' + mm;
    } 


    var today = yyyy + '-'+ mm + '-' + dd;
    let BinToBinNo_inp = req.query.BinToBinNo;
    let Status_inp = req.query.Status;
    let {BinToBinNo,Status} = req.query;
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
    let whereStatement = {}
    if(BinToBinNo!='' && BinToBinNo)
    whereStatement.BinToBinNo = BinToBinNo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;

    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    bintobin_hdr.findAll({
        where: whereStatement,
        order: [['BinToBinNo', 'ASC']]
    }).then(bintobin_hdr => {
        console.log(bintobin_hdr);
        res.render('../views/bintobin/index',{
            bintobin_hdr,
            BinToBinNo_inp,
            paramdate1_inp,
            paramDate2_inp,
            modulename,
            Status_inp,
            userpermissionmodule,
            username: req.session.username
        });
        
    });
};
exports.create_bintobin = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module); 
    var pagename = "create_bintobin";
    let {Location,Batch,Status,StockStatus,ItemCode} = req.query;
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
    inventory.findAll({
        where: whereStatement,
            raw: true,
    }).then(stockinquiry => {
        res.render('../views/bintobin/create',{stockinquiry,pagename,userpermissionmodule,username: req.session.username,modulename});
    });
}




exports.bintobin_details = function(req, res) {
    const pagename = "bintobin_dtl";
    console.log(req.params);
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    bintobin_hdr.hasMany(bintobin_detail, {foreignKey: 'BinToBinNo'});
    bintobin_detail.hasOne(item, {foreignKey: 'ItemCode'});
    bintobin_hdr.findAll({
        where:{
            BinToBinNo : req.params.BinToBinNo
        },
        include: [{
             model: bintobin_detail,
             include: [{model: item,
                on: {
                    col1: db.where(db.col("tbl_bintobin_details.ItemCode"), "=", db.col("tbl_bintobin_details->tbl_item_master.ItemCode"))
                }
            }]
        }]
        }).then(Bintobin_details => 
            res.render('../views/bintobin/bintobin_dtl',{Bintobin_details,pagename,userpermissionmodule,username: req.session.username,modulename})
            //res.json({Bintobin_details})
            )
		  .catch(error => {  console.error(error) });
}

exports.post_bintobin_details = function(req, res) {
    const pagename = "bintobin_dtl";
    let {BinToBinNo,AssignEmployee,LocationFrom,LocationTo,submit_action}=req.body;
    let inputs = req.body;
    let SerialNo_inp = req.body.SerialNo;
    const executeBintoBin = async function(){
        if(submit_action=="Completed"){
            let getStatus = await bintobin_hdr.findOne({
                where : {
                    BinToBinNo : BinToBinNo,             
                },
            });
            if(getStatus.Status== 'Planned'){
                await bintobin_hdr.update({ Status : submit_action, ModifiedBy: req.user,AssignEmployee }, { where : { BinToBinNo }})
                
                let inventorylist = await inventory.findAll({
                    where : {
                        SerialNo: { [Op.in]: SerialNo_inp }         
                    },
                    raw: true
                });
                let UpdateInventory = JSON.parse(JSON.stringify(inventorylist)).map((element => {
                    removethis = SerialNo_inp.map((SerialNo) => SerialNo).indexOf(element.SerialNo);
                    element.Location = LocationTo[removethis];
                    if(element.StockStatus=='Good'){
                        element.Status = 'ATP';
                    }else{
                        element.Status = 'Unservisable';
                    }
                    
                    return element;
                }));
                await inventory.bulkCreate(UpdateInventory, {updateOnDuplicate: true}).catch(error => {  console.error(error) });
                await req.flash('success_msg','Successfully Executed Bin To Bin');
                res.redirect('/bin-to-bin/bintobin_dtl/'+BinToBinNo); 
                

                
            }else{
                req.flash('error_msg','Not in Planned Status');  
                res.redirect('/bin-to-bin/bintobin_dtl/'+BinToBinNo); 
            }
        }else if (submit_action=="Cancelled"){

            let getStatus = await bintobin_hdr.findOne({
                where : {
                    BinToBinNo : BinToBinNo,             
                },
            });
            if(getStatus.Status== 'Planned'){
                await bintobin_hdr.update({ Status : submit_action, ModifiedBy: req.user }, { where : { BinToBinNo }})
                await inventory.update({ Status : 'ATP'},  {where: { SerialNo: { [Op.in]: SerialNo_inp } }})
                await req.flash('success_msg','Successfully Cancelled Bin To Bin');
                res.redirect('/bin-to-bin/bintobin_dtl/'+BinToBinNo); 
            }else{
                req.flash('error_msg','Not in Planned Status');  
                res.redirect('/bin-to-bin/bintobin_dtl/'+BinToBinNo); 
            }
        }
    }
    executeBintoBin();
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
    whereStatement.Status =  {[Op.or]: ['ATP', 'Unloaded', 'Unservisable']};
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

const Validations= async function(LocationTo,ID){
    error_list = [];
    error_req = 0;
    if(!LocationTo){
        error_list.push('<li>No item to selected.</li>');
    }else{
        const checkreq =  await LocationTo.forEach(function(element,key){
            if(LocationTo[key] == ''){
                error_req=1;
            }
        });
        const inventorycheck = await inventory.findAll({
            where: {
                    Status: {[Op.or]: ['ATP', 'Unloaded', 'Unservisable']},
                    ID : {[Op.in]: ID},
                    },
            raw: true,
        }).catch((err)=>console.log(err))
        const inventoryDBID = await inventorycheck.map(inventorycheck => inventorycheck.ID); 
        let compareInputDBID = await arr_diff(inventoryDBID,ID);
        console.log(compareInputDBID);
        if(error_req!=0)
        error_list.push('<li>Please fill all required fields</li>');

        if(LocationTo.length!=ID.length)
        error_list.push('<li>System error. Please contact the administrator</li>');
        if(compareInputDBID.length>0)
        error_list.push('<li>Invalid Item</li>');
    }
    //res.send(error_list);
    return error_list;
}


exports.validateBinToBin = function(req, res) {
    processValidation = async function(){
        let {LocationTo,ID} = req.body;
        const validationResult = await Validations(LocationTo,ID);
        res.send(validationResult);
    }
    processValidation();
}

exports.post_create_bintobin = function(req, res) {
    const processBinToBinPlan = async function(){
        let {LocationTo} = req.body;
        let IDList = req.body.ID;
        const validationResult = await Validations(LocationTo,IDList);
        if(validationResult.length>0){
            req.flash('error_msg',validationResult);  
            res.redirect('/bin-to-bin/create'); 
        }else{
            let created_bintobin_hdr = await bintobin_hdr.create({
                Status: 'Planned',
                CreatedBy : req.user,
                WarehouseCode: req.session.WarehouseCode
            })
            const inventoryItems = await  db.query('SELECT `ID` AS `InventoryID`, `ItemCode`, `SerialNo`, `Location` AS `LocationFrom` FROM `tbl_inventory` AS `tbl_inventory` WHERE `tbl_inventory`.`ID` IN (:IDs) ORDER BY FIELD(InventoryID, :IDs)',  { replacements: { IDs: IDList }, type: db.QueryTypes.SELECT } )
   
            let UpdatedinventoryItems = [];
             await LocationTo.forEach(function(element,key) {
                UpdatedinventoryItems.push({
                    BinToBinNo: created_bintobin_hdr.BinToBinNo,
                    SerialNo : inventoryItems[key]['SerialNo'],
                    ItemCode : inventoryItems[key]['ItemCode'],
                    LocationFrom : inventoryItems[key]['LocationFrom'],
                    LocationTo : LocationTo[key],
                })
            });
            await bintobin_detail.bulkCreate(
                UpdatedinventoryItems
            )
            await inventory.update(
                {Status: 'Picking'},
                {where : {
                    Status: {[Op.or]: ['ATP', 'Unloaded', 'Unservisable']},
                    ID : {[Op.in]: IDList},
                },
            })
            await req.flash('success_msg','Successfully added Bin to Bin Plan');
            await res.redirect('/bin-to-bin/bintobin_dtl/'+created_bintobin_hdr.BinToBinNo);
        }
    } 
    processBinToBinPlan();
}