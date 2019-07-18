var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var pickplan_hdr = require('../models/pickplan_hdr.js');
var pickplan_detail = require('../models/pickplan_detail.js');
var pickplan_detail_recom = require('../models/pickplan_detail_recom.js');
var outbound_hdr = require('../models/outbound_hdr.js');
var outbound_detail = require('../models/outbound_detail.js');
var dispatch_hdr = require('../models/dispatch_hdr.js');
var dispatch_detail = require('../models/dispatch_detail.js');
var dispatch_detail_item = require('../models/dispatch_detail_item.js');
var outbound_detail =require('../models/outbound_detail.js');
var batch = require('../models/batch.js');
var Sequelize = require("sequelize");
const modulename = "pick";
var inventory = require('../models/inventory.js');
const isPickPlan = 'isPickPlan';
const Op = Sequelize.Op;    
var User = require('../models/user.js');
var ShipPoint = require('../models/ship_point.js');
var Excel = require('exceljs');

exports.index = function(req, res) {
  const pagename = "pickplan_index";
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
  
  let ODO_inp = req.query.ODO_inp;
  let PrimaryRefDocNo_inp = req.query.ODOPrimaryRefDocNo;
  let paramdate1_inp = today;
  let paramDate2_inp = today;
  let {ODOPrimaryRefDocNo,ODONo,Status} = req.query;
  pickplan_hdr.hasOne(User, {foreignKey: 'ID', sourceKey:'CreatedBy'});
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
    if(ODOPrimaryRefDocNo!='' && ODOPrimaryRefDocNo)
    whereStatement.ODOPrimaryRefDocNo = ODOPrimaryRefDocNo;
    if(ODONo!='' && ODONo)
    whereStatement.ODONo = ODONo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;
  whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};

  pickplan_hdr.findAll({
      include: {model:User,
            on: {
                col1: db.where(db.col("tbl_pickplan_hdr.CreatedBy"), "=", db.col("tbl_user.ID"))
            }
        },
      where: whereStatement
    }).then(pickplan => 
    res.render('../views/pickplan/index',{pickplan,ODO_inp,PrimaryRefDocNo_inp,paramdate1_inp,paramDate2_inp,isPickPlan,pagename,Status,userpermissionmodule,username: req.session.username,modulename})
    //res.send({pickplan})
    );

  req.query.paramDate2 = '';
  req.query.paramDate1 = '';
  req.query.ASNNo = '';
};

exports.pickplan_details = function(req, res) {
    pagename="pickplan_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);  
    pickplan_hdr.belongsTo(outbound_hdr, {foreignKey: 'UUID'});
    outbound_hdr.hasOne(pickplan_hdr, {foreignKey: 'UUID'});
    
    pickplan_hdr.hasMany(pickplan_detail, {foreignKey: 'PickPlanNo'});
    pickplan_detail.belongsTo(pickplan_hdr, {foreignKey: 'PickPlanNo'});
    
    outbound_hdr.hasMany(outbound_detail, {foreignKey: 'UUID'});
    
    outbound_detail.belongsTo(outbound_hdr, {foreignKey: 'UUID'});
    outbound_detail.hasOne(ShipPoint, {foreignKey: 'ShipPointCode',sourceKey:'ShipPointCode'});
    outbound_detail.hasMany(pickplan_detail_recom,{foreignKey: 'ODODetailNo', sourceKey:'ID'});
    pickplan_detail
    .findAndCountAll({ where: { PickPlanNo : req.query.PickPlanNo } })
    .then(result => {
        if(result.count>0){
            pickplan_hdr.findAll({
                where: { PickPlanNo : req.query.PickPlanNo },
                include: [{  model: pickplan_detail }],
            })
            .then(pickplan_hdr => {
                res.render('../views/pickplan/pickplan_dtl',{pickplan_hdr,pagename,userpermissionmodule,username: req.session.username,modulename})
                //res.send({pickplan_hdr})
            });
        }else{
            pickplan_hdr.findAll({
                where: { PickPlanNo : req.query.PickPlanNo },
                include: [{
                    model: outbound_hdr,
                    include: [{  model: outbound_detail, 
                                include: [{  model: pickplan_detail_recom,
                                             
                                         },{
                                            model: ShipPoint,
                                            on: {
                                                col1: db.where(db.col("tbl_outbound_hdr->tbl_outbound_details.ShipPointCode"), "=", db.col("tbl_outbound_hdr->tbl_outbound_details->tbl_ship_point.ShipPointCode"))
                                            }
                                         }
                                        ],
                              }],
                }],
                order: [[outbound_hdr, outbound_detail , 'ShipPointCode', 'asc'],[outbound_hdr, outbound_detail , 'ItemCode', 'asc']], 
                //group: ['tbl_outbound_hdr->tbl_outbound_details.ItemCode','tbl_outbound_hdr->tbl_outbound_details.ShipmentNo']
            }).catch(function (err) {
                console.log(err);
            }).then(pickplan_hdr => {
                let pickplan_hdr1 =  JSON.stringify(pickplan_hdr);
                var obj =  JSON.parse(pickplan_hdr1);
                let Batchlist = {};
                const getBatch = async ()=>{
                    Batchlist = await batch.findAll();
                    res.render('../views/pickplan/pickplan_dtl',{pickplan_hdr:obj,pagename,userpermissionmodule,username: req.session.username,modulename,Batchlist});
                    //res.send({pickplan_hdr:obj,Batchlist});
                }
                getBatch();
                
            })
        }
    });
};


exports.post_pickplan_details = function(req, res) {
    var status_checker = '';
    let {ID,UID,ShipPointCode,LocationCode,submit_action,PickPlanNo,ItemCode,SerialNo,Batch,UUID,ODONo,ShipmentNo,AssignEmployee,SalesOrderNo,PONo} = req.body;

    async function executePickPlan(){
        const getStatus = await pickplan_hdr.findOne({ where : { PickPlanNo }, attributes : ['PickPlanNo','Status']})
        if(submit_action == "Cancelled" ){
            if(getStatus.Status == 'Planned'){
                await inventory.update({ Status : 'ATP'},  {where: { PLID: PickPlanNo  }})
                await pickplan_hdr.update({ Status : submit_action }, { where : { PickPlanNo }})
                await req.flash('success_msg','Pickplan Successfully '+submit_action+'.');
                await res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo);
            }else{
                req.flash('error_msg','Only Pick Plan with Planned Status can be Cancel');  
                res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo); 
            }
        }else if(submit_action == "For Dispatch" ){
            if(getStatus.Status == 'Picked' || getStatus.Status == 'Short Picked'){
                let items =  [];
                
                let checkIfExist = await dispatch_hdr.count({
                    where : {
                        PickPlanNo : PickPlanNo,
                        Status : {[Op.ne]: 'Cancelled'},               
                    },
                    attributes : ['UUID']
                })
                if(checkIfExist==0){
                    pickplan_detail.hasMany(outbound_detail, {foreignKey: 'ItemCode'});
                    pickplan_detail.hasOne(pickplan_hdr, {foreignKey: 'PickPlanNo'});
                    let pickplanlist = await pickplan_detail.findAll({
                        attributes:['ShipPointCode','SalesOrderNo','ItemCode','PONo'],
                        include:[
                            {
                                model: pickplan_hdr,
                                on: {
                                    col1: db.where(db.col("tbl_pickplan_detail.PickPlanNo"), "=", db.col("tbl_pickplan_hdr.PickPlanNo")),
                                }
                            },
                            {model: outbound_detail,
                                on: {
                                    col1: db.where(db.col("tbl_pickplan_detail.PONo"), "=", db.col("tbl_outbound_details.PONo")),
                                    col2: db.where(db.col("tbl_pickplan_detail.ItemCode"), "=", db.col("tbl_outbound_details.ItemCode")),
                                    col3: db.where(db.col("tbl_pickplan_detail.SalesOrderNo"), "=", db.col("tbl_outbound_details.SalesOrderNo")),
                                    col4: db.where(db.col("tbl_pickplan_detail.ShipPointCode"), "=", db.col("tbl_outbound_details.ShipPointCode")),
                                    col4: db.where(db.col("tbl_pickplan_hdr.UUID"), "=", db.col("tbl_outbound_details.UUID"))
                                }  
                            }
                        ]    
                        ,
                        where : {
                            PickPlanNo,            
                        },
                        //order: [['SalesOrderNo', 'ASC'],['ShipPointCode', 'ASC']],
                        order: [[outbound_detail,'ID','ASC']],
                        group: ['ShipPointCode','SalesOrderNo','ItemCode'],
                        raw:true
                    }).catch(function (err) {  console.log(err); });
                    let Dheader = await dispatch_hdr.create({
                        UUID,
                        ShipmentNo,
                        ODONo,
                        PickPlanNo,
                        CreatedBy:req.user,
                        Status: 'Planned',
                    }).catch(function (err) {  console.log(err); });
                    let tempSalesOrder = "";
                    let SKUCount = 0;
                    let SKUs = [];
                    let DRs = [];
                    let DRNo = 0;
                    console.log(Dheader.DispatchNo);
                    await pickplanlist.forEach(function(element,key){
                        SKUCount += 1;
                        if(tempSalesOrder!=element['SalesOrderNo']+element['ShipPointCode']|| SKUCount>8){
                            DRNo += 1;
                            SKUs.push({
                                DispatchNo:Dheader.DispatchNo,
                                PickPlanNo,
                                SalesOrderNo:element['SalesOrderNo'],
                                ShipPointCode:element['ShipPointCode'],
                                DRNo:DRNo,
                                PONo: element['PONo']
                            })
                            SKUCount = 1;
                        }

                        DRs.push({
                            DispatchNo:Dheader.DispatchNo,
                            DRNo:DRNo,
                            SalesOrderNo:element['SalesOrderNo'],
                            ItemCode:element['ItemCode']
                        })


                        tempSalesOrder=element['SalesOrderNo']+element['ShipPointCode'];
                        //items.push({DispatchNo:Dheader.DispatchNo,PickPlanNo,ShipPointCode:uniqueShipPointCode[key]})
                    });

                    await dispatch_detail.bulkCreate(SKUs).catch(function (err) {  console.log(err); })
                    await dispatch_detail_item.bulkCreate(DRs).catch(function (err) {  console.log(err); })
                    await req.flash('success_msg','Successfully create Dispatch');
                    await res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo);
                }else{
                    req.flash('error_msg','Active Dispatch already exist');  
                    res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo); 
                }
                
            }else{
                req.flash('error_msg','Not yet Picked');  
                res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo); 
            }
           
        }else{
            if(getStatus.Status == 'Planned'){
                const pickPlanCount = await pickplan_detail.findAndCountAll({ where: {  PickPlanNo }})
                if(pickPlanCount.count>0){
                }else{
                    let pickplan_items =  [];
                    let inventory_items =  [];
                    await ItemCode.forEach(function(element,key) {
                        pickplan_items.push({
                            PickPlanNo,
                            ItemCode : ItemCode[key],
                            SerialNo: SerialNo[key],
                            OrderQTY: 1,
                            OrderUOM: 'PC',
                            UID:UID[key],
                            Batch: Batch[key],
                            ShipPointCode: ShipPointCode[key],
                            LocationCode: LocationCode[key],
                            SalesOrderNo: SalesOrderNo[key],
                            PONo: PONo[key],
                            Status:'good',
                        })
                        inventory_items.push(SerialNo[key])
                    });
                    await inventory.update({ Status : 'ATP'},  {where: { PLID: PickPlanNo  }})
                    await pickplan_hdr.update({ Status : submit_action,AssignEmployee }, { where : { PickPlanNo }})
                    await pickplan_detail.bulkCreate(pickplan_items).catch(function (err) {  console.log(err); })
                    await inventory.update({ Status : 'Picked', Location:'OUTBOUND-STG'},  {where: { SerialNo: { [Op.in]: inventory_items } }})
                    await req.flash('success_msg','Successfully added Putaway');
                    await res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo);
                }
            }else{
                req.flash('error_msg','Only Pick Plan with Planned Status can be '+submit_action);  
                res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+PickPlanNo); 
            }
        }
    }

    executePickPlan();



 
 };

//ui
exports.create_pickplan = function(req, res) {

    pagename="create_pickplan";
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
    let ODONo_inp = req.query.ODONo;
    let ODOPrimaryRefDocNo_inp = req.query.ODOPrimaryRefDocNo;
    let Status_inp = req.query.Status;
    let {ODOPrimaryRefDocNo,ODONo,Status} = req.query;
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
    let whereStatement = {UUID: {[Op.notIn]: [db.literal("select UUID from tbl_pickplan_hdr WHERE Status!='Cancelled'")]}}
    if(ODOPrimaryRefDocNo!='' && ODOPrimaryRefDocNo)
    whereStatement.ODOPrimaryRefDocNo = ODOPrimaryRefDocNo;
    if(ODONo!='' && ODONo)
    whereStatement.ODONo = ODONo;


    whereStatement.Status = 'Confirmed';

    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    outbound_hdr.findAll({
        where: whereStatement  
    }).then(outbound_hdr => res.render('../views/pickplan/create',{outbound_hdr,ODONo_inp,ODOPrimaryRefDocNo_inp,paramdate1_inp,paramDate2_inp,isPickPlan,Status_inp,pagename,userpermissionmodule,modulename}));

    req.query.paramDate2 = '';
    req.query.paramDate1 = '';
    req.query.ODONo = '';
};


exports.post_create_pickplan = function(req, res) {
    async function process_create_pickplan(){
        let UUID = req.body.UUID
        let getOutboundInfo = await outbound_hdr.findOne({
            where: { UUID,Status: 'Confirmed' }    
        }).catch(function (err) {
            console.log(err);
        });
        if(getOutboundInfo){
            let pickplanCount= await pickplan_hdr.findAndCountAll({
                where: { UUID, 
                         Status:{
                             [Op.ne]: 'Cancelled'
                         }
                }    
            }).catch(function (err) {
                console.log(err);
            });
            //console.log(pickplanCount.count);
            if(pickplanCount.count==0){
                let createpickplan = await pickplan_hdr.create({
                    UUID: getOutboundInfo.UUID,
                    ODONo: getOutboundInfo.ODONo,
                    ShipmentNo: getOutboundInfo.ShipmentNo,
                    CreatedBy: req.user,
                    Status: 'Planned'
                })

                //allocate to pick
              /*  const allitemsToPick = await outbound_detail.findAll({ where: {UUID}})
                let ItemCodetoPick= allitemsToPick.map(itemsToPick => itemsToPick.ItemCode);
                inventory.hasOne(batch, {foreignKey: 'ID'});
                let ATPItems =    await inventory.findAll({
                                                attributes:['ID','ItemCode','SerialNo','UID','Batch','Location'],

                                                where: {ItemCode : {[Op.in]: ItemCodetoPick},Status: 'ATP' },
                                                include: [{  model: batch }],
                                                order: [
                                                    ['ItemCode', 'DESC',],['ID', 'ASC']
                                                ],
                                                raw: true,
                                    });
                                    let rec_items = [];
                                    let inventoryItemsToUpdate =[];
                if(ATPItems.length>0){
                    let ATPItems1 =  ATPItems.slice(0);
                    
                    await allitemsToPick.forEach(function(element,key){
                        for (i=0;i<element.OrderQty;i++)
                        {
                            const result = ATPItems1.find(obj => {
                                return obj.ItemCode === element.ItemCode
                            });
                            if(result){
                                removethis = ATPItems1.map((item) => item['ID']).indexOf(result.ID);
                                inventoryItemsToUpdate.push(result.ID);
                                ATPItems1.splice(removethis, 1);
                                rec_items.push({PickPlanNo: createpickplan.PickPlanNo, ShipPointCode: element.ShipPointCode,ItemCode: element.ItemCode,SerialNo: result.SerialNo,OrderQTY: 1,OrderUOM: 'PCS',UID: result.UID,Batch: result.Batch,ODODetailNo: element.ID, LocationCode: result.Location});
                            }
                        }
                    });
                }
                await pickplan_detail_recom.bulkCreate(rec_items).catch(function (err) {  console.log(err); })
                await inventory.update({ Status : 'Allocated',PLID:createpickplan.PickPlanNo},  {where: { ID: { [Op.in]: inventoryItemsToUpdate } }})*/
                //allocation item to pick end







                await req.flash('success_msg','Pick Plan Successfully Created');
                await res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+createpickplan.PickPlanNo);
                res.send({allitemsToPick,removethis});
            }else{
                await req.flash('error_msg','Pick Plan already exist.');
                await res.redirect('/pickplan/create');
            }
            
        }else{
            await req.flash('error_msg','Outbound is not yet Confirmed or does not exist.');
            await res.redirect('/pickplan/create');
        }
        
    }
    process_create_pickplan();
};

exports.validate_serialno_status_exist = function(req, res) {

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

    let {SerialNo,ItemCode,ShipPointCode,UID,Batch,LocationCode,PickPlanNo,ODONo} = req.body;



    var getSerialNoItemCode = function(filteredSerialNoItemCode){
        const SerialNoList =  inventory.findAll({
            attributes:['SerialNo','ItemCode','Status','PLID'],
            where: Sequelize.where(Sequelize.fn("concat", Sequelize.col("SerialNo"), Sequelize.col("ItemCode"), Sequelize.col("Location"), Sequelize.col("UID"), Sequelize.col("Batch")), {
                [Op.in]: filteredSerialNoItemCode
            }),
         }).catch(function (err) {
            console.log(err);
        });
        return SerialNoList;
    }
    
    async function checkSerialExist(){
    try {
        let filteredSerialNo = await SerialNo.filter(function(el,key) {
        if(el!='') {  return el;   }else{  return false;  }
        }).map(function(el,key) { return el;});
        /*
        let filteredSerialNoItemCode = await SerialNo.filter(function(el,key) {
            if(el!='') {  return el;   }else{  return false;  }
        }).map(function(el,key) {  return SerialNo[key]+""+ItemCode[key]+""+LocationCode[key]+""+UID[key]+""+Batch[key];});    
        */
        let filteredSerialNoItemCode = [];
        SerialNo.forEach(function(element,key){
            if(element.indexOf('') > -1){
                filteredSerialNoItemCode.push( element+""+ItemCode[key]+""+LocationCode[key]+""+UID[key]+""+Batch[key])
            }
        });
        const SerialNoItemCode =   getSerialNoItemCode(filteredSerialNoItemCode);
        const SerialNoDB = await SerialNoItemCode.map(SerialNoList => SerialNoList.SerialNo);//list of serialNo
        let NotExist = await arr_diff(filteredSerialNo,SerialNoDB);//validate array is not exist
        

        const ifSO =  await outbound_hdr.findAndCountAll({
            where: {ODONo, TransactionType: 'SO'}
         }).catch(function (err) {
            console.log(err);
        });
        var NotATP=[];
        if(ifSO.count>0){
            NotATP = await SerialNoItemCode.filter(function(el,key) { //not in atp status
                if(el.Status=='ATP' ||  (el.Status =='Allocated' && el.PLID==PickPlanNo)) 
                { return false;    }else{   return el.SerialNo;   }
            }).map(function(el,key) { return el.SerialNo;});
        }else{
            NotATP = await SerialNoItemCode.filter(function(el,key) { //not in atp status
                if(el.Status=='ATP' ||  (el.Status =='Unservisable')) 
                { return false;    }else{   return el.SerialNo;   }
            }).map(function(el,key) { return el.SerialNo;});
        }
        
            
        console.log({NotATP,NotExist,filteredSerialNo});

        res.send({NotATP,NotExist});
        } catch (e) {
            console.error('error is', e);
        }
    }
    checkSerialExist();
};


exports.check_pickplan_item_count = function(req, res) {
    let {PickPlanNo} = req.body;
    db.query("SELECT SUM(OrderQty) as 'ItemCount',ItemCode,tbl_outbound_detail.ShipPointCode,ShipPointName FROM `tbl_pickplan_hdr` LEFT JOIN tbl_outbound_detail ON tbl_outbound_detail.UUID=tbl_pickplan_hdr.UUID LEFT JOIN tbl_ship_point ON tbl_outbound_detail.ShipPointCode = tbl_ship_point.ShipPointCode WHERE PickPlanNo= ? GROUP BY ItemCode,ShipPointCode", { replacements: [req.query.PickPlanNo], type: db.QueryTypes.SELECT})
            .then(result => {
                console.log(result);
                res.send(result);
    })  
    
}

exports.pickplan_status_count = function(req, res) {
    pickplan_hdr.findAll({
        group: ['Status'],
         attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
    }).then(function (pickplan) {
        res.send(pickplan);
    });
}