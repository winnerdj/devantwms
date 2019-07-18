var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var stock_conversion_hdr = require('../models/stock_conversion_hdr.js');
var stock_conversion_detail = require('../models/stock_conversion_detail.js');
var item = require('../models/item.js');
var user = require('../models/user.js');
var inventory = require('../models/inventory.js');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const modulename = "stockConversion";


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

    stock_conversion_hdr.hasOne(user, {foreignKey: 'ID'});
    var today = yyyy + '-'+ mm + '-' + dd;
    let StockConversionNo_inp = req.query.StockConversionNo;
    let Status_inp = req.query.Status;
    let {StockConversionNo,Status} = req.query;
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
    if(StockConversionNo!='' && StockConversionNo)
    whereStatement.StockConversionNo = StockConversionNo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;

    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    stock_conversion_hdr.findAll({
        include: {
            model:user,
            on: {
                col1: db.where(db.col("tbl_stock_conversion_hdr.CreatedBy"), "=", db.col("tbl_user.ID"))
              }
        },
        where: whereStatement,
        order: [['StockConversionNo', 'ASC']]
    }).then(stock_conversion_hdr => {
        res.render('../views/stockconversion/index',{
            stock_conversion_hdr,
            StockConversionNo_inp,
            paramdate1_inp,
            paramDate2_inp,
            modulename,
            Status_inp,
            userpermissionmodule,
            username: req.session.username
        });
        
    });
};


exports.create_stockconversion = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module); 
    var pagename = "create_stockconversion";
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
        res.render('../views/stockconversion/create',{stockinquiry,pagename,userpermissionmodule,username: req.session.username,modulename});
    });
}



exports.inventorylist = function(req, res) {
    let {Location,Batch,Status,StockStatus,ItemCode,ID,SerialNo} = req.query;
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
    if(SerialNo!='')
    whereStatement.SerialNo = SerialNo;
    inventory.hasOne(item, {foreignKey: 'ItemCode', sourceKey:'ItemCode'});
    whereStatement.Status =  {[Op.or]: ['ATP', 'Unservisable']};
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

const Validations= async function(StatusTo,AssignApprover,ID,QtyTo){
    error_list = [];
    error_req = 0;
    if(AssignApprover==''){
        error_req=1;
    }
    if(!StatusTo){
        error_list.push('<li>No item to selected.</li>');
    }else{
        await StatusTo.forEach(function(element,key){
            if(StatusTo[key] == ''){
                error_req=1;
                error_list.push(StatusTo[key]);
            }
        });
        await QtyTo.forEach(function(element,key){
            if(QtyTo[key] != 1 && QtyTo[key] != 0){
                error_list.push('<li>'+QtyTo[key]+' is not valid Qty.</li>');
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
        
        if(StatusTo.length!=ID.length)
        error_list.push('<li>System error. Please contact the administrator</li>');
        if(compareInputDBID.length>0)
        error_list.push('<li>Invalid Item/s:['+compareInputDBID+']</li>');
    }
    if(error_req!=0)
        error_list.push('<li>Please fill all required fields</li>');
    //res.send(error_list);
    return error_list;
}


exports.validateStockConversion = function(req, res) {
    processValidation = async function(){
        let {StatusTo,AssignApprover,ID,QtyTo} = req.body;
        console.log(req.body);
        const validationResult = await Validations(StatusTo,AssignApprover,ID,QtyTo);
        res.send(validationResult);
    }
    processValidation();
}

exports.post_create_stockconversion = function(req, res) {
    const processStockConversion = async function(){
        let {StatusTo,AssignApprover,QtyTo} = req.body;
        let IDList = req.body.ID;
        const validationResult = await Validations(StatusTo,AssignApprover,IDList,QtyTo);
        if(validationResult.length>0){
            req.flash('error_msg',validationResult);  
            res.redirect('/stock_conversion/create'); 
        }else{
            let created_stock_conversion_hdr = await stock_conversion_hdr.create({
                AssignApprover,
                Status: 'Proposed',
                CreatedBy : req.user,
                WarehouseCode: req.session.WarehouseCode
            })
            const inventoryItems = await db.query('SELECT `ID` AS `InventoryID`, `ItemCode`, `SerialNo`, `Batch`,StockStatus,UID,Qty,UOM,GRNo,PACode,PLID,Expiry,Manufacturing,Status,WarehouseCode,Location FROM `tbl_inventory` AS `tbl_inventory` WHERE `tbl_inventory`.`ID` IN (:IDs) ORDER BY FIELD(InventoryID, :IDs)',  { replacements: { IDs: IDList }, type: db.QueryTypes.SELECT } )
   
            let UpdatedinventoryItems = [];
             await StatusTo.forEach(function(element,key) {
                UpdatedinventoryItems.push({
                    StockConversionNo: created_stock_conversion_hdr.StockConversionNo,
                    SerialNo : inventoryItems[key]['SerialNo'],
                    ItemCode : inventoryItems[key]['ItemCode'],
                    StatusFrom : inventoryItems[key]['StockStatus'],
                    StatusTo : StatusTo[key],
                    QtyFrom : 1,
                    QtyTo : QtyTo[key],
                })
            });
            await stock_conversion_detail.bulkCreate(
                UpdatedinventoryItems
            )
            await req.flash('success_msg','Successfully added Stock Conversion Proposal');
            await res.redirect('/stock_conversion/stock_conversion_dtl/'+created_stock_conversion_hdr.StockConversionNo);
        }
    } 
    processStockConversion();
}


exports.stock_conversion_details = function(req, res) {
    const pagename = "stock_conversion_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    stock_conversion_hdr.hasMany(stock_conversion_detail, {foreignKey: 'StockConversionNo'});
    stock_conversion_detail.hasOne(item, {foreignKey: 'ItemCode'});
    stock_conversion_hdr.hasOne(user, {foreignKey: 'employeeID'});
    stock_conversion_hdr.findAll({
        where:{
            StockConversionNo : req.params.StockConversionNo
        },
        include: [{
             model: stock_conversion_detail,
             include: [{model: item,
                on: {
                    col1: db.where(db.col("tbl_stock_conversion_details.ItemCode"), "=", db.col("tbl_stock_conversion_details->tbl_item_master.ItemCode"))
                    }
                }]
            },
            {
                model: user,
                   attributes:['FirstName','LastName'],
                   on: {
                       col1: db.where(db.col("tbl_stock_conversion_hdr.AssignApprover"), "=", db.col("tbl_user.employeeID"))
                   }
           },
        ]
        }).then(stock_conversion_details => 
            res.render('../views/stockconversion/stock_conversion_dtl',{stock_conversion_details,pagename,userpermissionmodule,username: req.session.username,modulename})
            //res.json({stock_conversion_details})
            )
		  .catch(error => {  console.error(error) });
}

exports.post_stock_conversion_details = function(req, res) {
    const pagename = "bintobin_dtl";
    let {StockConversionNo,StatusTo,submit_action,QtyTo,ID}=req.body;
    let inputs = req.body;
    let SerialNo_inp = req.body.SerialNo;
    const executeBintoBin = async function(){
        if(submit_action=="Approved"){
            let getStatus = await stock_conversion_hdr.findOne({
                where : {
                    StockConversionNo : StockConversionNo,             
                },
            });
            if(getStatus.Status== 'Proposed'){
                let inventorylist = await inventory.findAll({
                    where : {
                        SerialNo: { [Op.in]: SerialNo_inp }         
                    },
                    raw: true
                });
                checkStatus = await inventorylist.map(inv => inv.Status);
                let undertransaction = false;
                await checkStatus.forEach(function(element,key){
                    if(element=='ATP' || element=='Unservisable'){

                    }else{
                        undertransaction = true;
                    }
                });
                if(undertransaction==false){
                    await stock_conversion_hdr.update({ Status : submit_action, ModifiedBy: req.user }, { where : { StockConversionNo }})
                    let UpdateInventory = await JSON.parse(JSON.stringify(inventorylist)).map((element => {
                        removethis = SerialNo_inp.map((SerialNo) => SerialNo).indexOf(element.SerialNo);
                        element.StockStatus = StatusTo[removethis];
                        if(element.StockStatus=='Good'){
                            element.Status = 'ATP';
                        }else{
                            element.Status = 'Unservisable';
                        }
                        return element;
                    }));
                    console.log(QtyTo);
                    let InventoryToDelete =[];
                      await QtyTo.map((element,key) => {
                        if(element==0){
                            InventoryToDelete.push(SerialNo_inp[key])
                        }
                        console.log(element);
                    });
                    console.log(InventoryToDelete);
                    await inventory.bulkCreate(UpdateInventory, {updateOnDuplicate: true}).catch(error => {  console.error(error) });
                    await inventory.destroy(
                        {
                            where : {
                                SerialNo: { [Op.in]: InventoryToDelete }         
                            }
                        }
                    ).catch(error => {  console.error(error) });
                    await req.flash('success_msg','Successfully Updated Stock Conversion');
                    res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo); 
                }else{
                    req.flash('error_msg','Item/s is under transaction.');  
                    res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo); 
                }
            }else{
                req.flash('error_msg','Not in Proposed Status');  
                res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo); 
            }
        }else if (submit_action=="Cancelled"){
            let getStatus = await stock_conversion_hdr.findOne({
                where : {
                    StockConversionNo : StockConversionNo,             
                },
            });
            if(getStatus.Status== 'Proposed'){
                await stock_conversion_hdr.update({ Status : submit_action, ModifiedBy: req.user }, { where : { StockConversionNo }})
                await req.flash('success_msg','Successfully Cancelled Stock Conversion');
                res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo); 
            }else{
                req.flash('error_msg','Not in Proposed Status');  
                res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo); 
            }
        }else{
            req.flash('error_msg','An error Occured. Please try again.');  
            res.redirect('/stock_conversion/stock_conversion_dtl/'+StockConversionNo)
        }
    }
    executeBintoBin();
}

