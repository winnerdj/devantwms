var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var dispatch_hdr = require('../models/dispatch_hdr.js');
var dispatch_detail = require('../models/dispatch_detail.js');
var pickplan_detail = require('../models/pickplan_detail.js');
var dispatch_detail_item = require('../models/dispatch_detail_item.js');
var outbound_hdr = require('../models/outbound_hdr.js');
var outbound_detail = require('../models/outbound_detail.js');
var pickplan_hdr = require('../models/pickplan_hdr.js');
var ShipPoint = require('../models/ship_point.js');
var loading_hdr = require('../models/loading_hdr.js');
var loading_detail = require('../models/loading_detail.js');
var Sequelize = require("sequelize");
var employee = require('../models/employee.js');
var item = require('../models/item.js');
var path = require('path');
const isDispatch = 'isDispatch';
const Op = Sequelize.Op;    
var fs = require('fs');
var pdf = require('dynamic-html-pdf');
var html = fs.readFileSync('./views/layouts/pdflayoutDR.handlebars', 'utf8');
const modulename="dispatch";
var Excel = require('exceljs');
//display gr header
exports.index = function(req, res) {
  const pagename = "dispatch_index"
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
  
  let ODO_inp = req.query.ODO_inp;
  let ShipmentNo_inp = req.query.ShipmentNo;
  let paramdate1_inp = today;
  let paramDate2_inp = today;
  let {ODOPrimaryRefDocNo,ODONo,Status,ShipmentNo} = req.query;
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

  dispatch_hdr.findAll({where: whereStatement}).then(dispatch => 
    res.render('../views/dispatch/index',
      {
        dispatch,ODO_inp,
        ShipmentNo_inp,
        paramdate1_inp,
        paramDate2_inp,
        isDispatch,pagename,
        Status,
        userpermissionmodule,
        username: req.session.username,
        modulename
      }
    )
    //res.send({pickplan})
    );

  req.query.paramDate2 = '';
  req.query.paramDate1 = '';
  req.query.ASNNo = '';
};

//display gr header and detail
exports.dispatch_details = function(req, res) {
    
    dispatch_hdr.hasMany(dispatch_detail, {foreignKey: 'DispatchNo'});
    dispatch_detail.belongsTo(dispatch_hdr, {foreignKey: 'DispatchNo'});
    dispatch_hdr.hasOne(employee, {foreignKey: 'ID', sourceKey:'AssignEmployee'});
    dispatch_detail.hasOne(ShipPoint, {foreignKey: 'ShipPointCode' , sourceKey:'ShipPointCode'});
    dispatch_detail.hasMany(dispatch_detail_item, {foreignKey: 'DispatchNo'});
    const pagename = "dispatch_dtl";
    const userpermissionmodule = req.session.permissions.map(
            userpermissions => userpermissions.module
        );
    async function displayDispatch(){
       const dispatchDetail = await dispatch_hdr.findAll({
            where: { DispatchNo : req.query.DispatchNo },
            include: [
              {  
                model: dispatch_detail,
                include:[
                  {
                    model: ShipPoint,
                    on: {
                      col1: db.where(db.col("tbl_dispatch_details.ShipPointCode"), "=", db.col("tbl_dispatch_details->tbl_ship_point.ShipPointCode"))
                    }
                  },
                  {
                    model: dispatch_detail_item,
                    on: {
                      col1: db.where(db.col("tbl_dispatch_details.DispatchNo"), "=", db.col("tbl_dispatch_details->tbl_dispatch_detail_items.DispatchNo")),
                      col2: db.where(db.col("tbl_dispatch_details.DRNo"), "=", db.col("tbl_dispatch_details->tbl_dispatch_detail_items.DRNo")),
                      col3: db.where(db.col("tbl_dispatch_details.SalesOrderNo"), "=", db.col("tbl_dispatch_details->tbl_dispatch_detail_items.SalesOrderNo"))
                    }
                  },
                ] 
              },
              {  
                model: employee 
              }
            ],
            //group: 'tbl_dispatch_details.ShipPointCode'
        })
        await res.render('../views/dispatch/dispatch_dtl',  { dispatchDetail,pagename,userpermissionmodule,username: req.session.username,modulename })
        //res.send({dispatchDetail})
    }
    displayDispatch();
};


exports.post_dispatch_details = function(req, res) {
    let {ID,ShipPointCode,TAF,DRRefNo,RouteAndLoadSheetRefNo,submit_action,DispatchNo,AssignEmployee,PickPlanNo,SalesOrderNo,DRNo,PONo} = req.body;

    async function executeDispatch(){
        const getStatus = await dispatch_hdr.findOne({ where : { DispatchNo }, attributes : ['DispatchNo','Status']})
        if(submit_action == "Cancelled" ){
            if(getStatus.Status == 'Planned'){
                await dispatch_hdr.update({ Status : submit_action, ModifiedBy: req.user }, { where : { DispatchNo }})
                await dispatch_detail_item.destroy( { where : { DispatchNo }})
                await req.flash('success_msg','Dispatch Successfully '+submit_action+'.');
                await res.redirect('/dispatch/dispatch_dtl?DispatchNo='+DispatchNo);
            }else{
                req.flash('error_msg','Not in Planned Status');  
                res.redirect('/dispatch/dispatch_dtl?DispatchNo='+DispatchNo); 
            }
        }else if(submit_action == "Confirmed" ){
          
            if(getStatus.Status == 'Planned'){
                ShipPointCodeArr = [];
                await dispatch_hdr.update({ Status : submit_action,AssignEmployee, ModifiedBy:req.user }, { where : { DispatchNo }}).catch(function (err) {  console.log(err); })
                await ShipPointCode.forEach(function(element,key){
                if(TAF[key]!=''){
                    ShipPointCodeArr.push({ID:ID[key],DispatchNo,PickPlanNo:PickPlanNo[key],ShipPointCode:ShipPointCode[key],TAF:TAF[key],DRRefNo:DRRefNo[key],RouteAndLoadSheetRefNo: RouteAndLoadSheetRefNo[key],SalesOrderNo: SalesOrderNo[key],DRNo: DRNo[key],PONo: PONo[key]})
                }
                });
                await dispatch_detail.bulkCreate(ShipPointCodeArr, { updateOnDuplicate: true })
                await req.flash('success_msg','Dispatch Successfully '+submit_action+'.');
                await res.redirect('/dispatch/dispatch_dtl?DispatchNo='+DispatchNo);
            }else{
                req.flash('error_msg','Not in planned status. '+submit_action);  
                res.redirect('/dispatch/dispatch_dtl?DispatchNo='+DispatchNo); 
            }
        }
    }
    executeDispatch();
 };

//ui
exports.create_dispatch = function(req, res) {
    pagename="create_dispatch";
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

  let whereStatement = {UUID: {[Op.notIn]: [db.literal("select UUID from tbl_dispatch_hdr WHERE Status!='Cancelled'")]}}
    if(ODOPrimaryRefDocNo!='' && ODOPrimaryRefDocNo)
    whereStatement.ODOPrimaryRefDocNo = ODOPrimaryRefDocNo;
    if(ODONo!='' && ODONo)
    whereStatement.ODONo = ODONo;
    whereStatement.Status = {[Op.or]: ['Picked', 'Short Picked']} ;
  whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};

  pickplan_hdr.findAll({where: whereStatement}).then(pickplan => 
    res.render('../views/dispatch/create',
      {
        pickplan,
        ODO_inp,
        PrimaryRefDocNo_inp,
        paramdate1_inp,
        paramDate2_inp,
        isDispatch,
        pagename,
        userpermissionmodule,
        username: req.session.username,
        modulename
      }
    )

    ).catch((err)=>{console.log(err)});

  req.query.paramDate2 = '';
  req.query.paramDate1 = '';
  req.query.ASNNo = '';;
};


exports.post_create_dispatch = function(req, res) {
    const processDispatchCreation = async function(){
        let dispatchInfo = await dispatch_hdr.findOne({
            where : {
                UUID : req.body.UUID,
                Status : {[Op.ne]: 'Cancelled'},               
            },
        })
        if(!dispatchInfo){
            pickplan_hdr.hasMany(pickplan_detail, {foreignKey: 'PickPlanNo'});
            pickplan_detail.hasMany(outbound_detail, {foreignKey: 'ItemCode'});
            let pickplanlist = await pickplan_hdr.findAll({
              
              include: {
                model:pickplan_detail,
                include:{
                  model:outbound_detail,
                  on: {
                    col1: db.where(db.col("tbl_pickplan_details.PONo"), "=", db.col("tbl_pickplan_details->tbl_outbound_details.PONo")),
                    col2: db.where(db.col("tbl_pickplan_details.ItemCode"), "=", db.col("tbl_pickplan_details->tbl_outbound_details.ItemCode")),
                    col3: db.where(db.col("tbl_pickplan_details.SalesOrderNo"), "=", db.col("tbl_pickplan_details->tbl_outbound_details.SalesOrderNo")),
                    col4: db.where(db.col("tbl_pickplan_details.ShipPointCode"), "=", db.col("tbl_pickplan_details->tbl_outbound_details.ShipPointCode")),
                    col4: db.where(db.col("tbl_pickplan_hdr.UUID"), "=", db.col("tbl_pickplan_details->tbl_outbound_details.UUID"))
                  }  


                }
              },
              where : {
                    UUID : req.body.UUID,           
              },
              //order: [[pickplan_detail,'SalesOrderNo', 'ASC'],[pickplan_detail,'ShipPointCode', 'ASC']],
              order: [[pickplan_detail,outbound_detail,'ID', 'ASC']],
              group: ['tbl_pickplan_details.SalesOrderNo','tbl_pickplan_details.ShipPointCode','tbl_pickplan_details.ItemCode'],
              raw:true
          })
          console.log(pickplanlist);
          let Dheader = await dispatch_hdr.create({
              UUID: req.body.UUID,
              ShipmentNo:pickplanlist[0].ShipmentNo,
              ODONo:pickplanlist[0].ODONo,
              PickPlanNo:pickplanlist[0].PickPlanNo,
              CreatedBy:req.user,
              Status: 'Planned',
          }).catch(function (err) {  console.log(err); });
          let tempSalesOrder = "";
          let SKUCount = 0;
          let SKUs = [];
          let DRs = [];
          let DRNo = 0;
          await pickplanlist.forEach(function(element,key){
              SKUCount++;
              if(tempSalesOrder!=element['tbl_pickplan_details.SalesOrderNo']+element['tbl_pickplan_details.ShipPointCode'] || SKUCount>8){
                  DRNo++;
                  SKUs.push({
                      DispatchNo:Dheader.DispatchNo,
                      PickPlanNo:pickplanlist[0].PickPlanNo,
                      SalesOrderNo:element['tbl_pickplan_details.SalesOrderNo'],
                      ShipPointCode:element['tbl_pickplan_details.ShipPointCode'],
                      DRNo:DRNo,
                      PONo:element['tbl_pickplan_details.PONo'],
                  })
                  
                  SKUCount = 1;
              }
              DRs.push({
                  DispatchNo:Dheader.DispatchNo,
                  DRNo:DRNo,
                  SalesOrderNo:element['tbl_pickplan_details.SalesOrderNo'],
                  ItemCode:element['tbl_pickplan_details.ItemCode']
              })
              tempSalesOrder=element['tbl_pickplan_details.SalesOrderNo']+element['tbl_pickplan_details.ShipPointCode'];
          });
          console.log(DRs);
         await dispatch_detail.bulkCreate(SKUs).catch(function (err) {  console.log(err); })
         await dispatch_detail_item.bulkCreate(DRs).catch(function (err) {  console.log(err); })
            await req.flash('success_msg','Successfully create Dispatch');
            await res.redirect('/dispatch/dispatch_dtl?DispatchNo='+Dheader.DispatchNo);
        }else{
            req.flash('error_msg','Already dispatched');  
            res.redirect('/dispatch/dispatch_dtl?DispatchNo='+Dheader.DispatchNo); 
        }
    } 
    processDispatchCreation();
}


exports.dispatch_status_count = function(req, res) {
  dispatch_hdr.findAll({
      group: ['Status'],
      attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
  }).then(function (dispatch) {
      res.send(dispatch);
  });
}


exports.generateDR = function(req, res){
  async function displayReport(){
    dispatch_hdr.hasMany(dispatch_detail, {foreignKey: 'DispatchNo'});
    dispatch_detail.belongsTo(dispatch_hdr, {foreignKey: 'DispatchNo'});
    dispatch_hdr.hasOne(outbound_hdr, {foreignKey: 'ODONo'});
    dispatch_hdr.hasOne(employee, {foreignKey: 'ID', sourceKey:'AssignEmployee'});
    dispatch_detail.hasOne(ShipPoint, {foreignKey: 'ShipPointCode'});
    dispatch_detail.hasMany(pickplan_detail, {foreignKey: 'ShipPointCode', sourceKey:'ShipPointCode'});
    dispatch_detail.hasMany(dispatch_detail_item, {foreignKey: 'DRNo', sourceKey:'DRNo'});
    dispatch_detail_item.hasMany(pickplan_detail, {foreignKey: 'ItemCode', sourceKey:'ItemCode'});
    dispatch_detail_item.hasOne(item, {foreignKey: 'ItemCode', sourceKey:'ItemCode'});
    dispatch_hdr.hasOne(loading_hdr, {foreignKey: 'UUID', sourceKey: 'UUID'});

    const dispatchDetail = await dispatch_detail.findAll({
      where: { 
        ID : req.params.ID,
        DispatchNo : req.params.DispatchNo
       },
      include: [
        { model:ShipPoint, 
          on: {
            col1: db.where(db.col("tbl_dispatch_detail.ShipPointCode"), "=", db.col("tbl_ship_point.ShipPointCode"))
          }
        },
        { model:dispatch_hdr, 
          include:[
            { 
              model:outbound_hdr,
              on: {
                col1: db.where(db.col("tbl_dispatch_hdr.ODONo"), "=", db.col("tbl_dispatch_hdr->tbl_outbound_hdr.ODONo"))
              }, 
            },
          ]
        },
        
        
        { model:dispatch_detail_item, 
          on: {
            col1: db.where(db.col("tbl_dispatch_detail.DispatchNo"), "=", db.col("tbl_dispatch_detail_items.DispatchNo")),
            col2: db.where( db.col("tbl_dispatch_detail.DRNo"), "=", db.col("tbl_dispatch_detail_items.DRNo"))
          },
          include:
          [
            {
              model:pickplan_detail,
              on: {
                col1: db.where(db.col("tbl_dispatch_detail_items.ItemCode"), "=", db.col("tbl_dispatch_detail_items->tbl_pickplan_details.ItemCode")),
                col2: db.where(db.col("tbl_dispatch_detail_items.SalesOrderNo"), "=", db.col("tbl_dispatch_detail_items->tbl_pickplan_details.SalesOrderNo")),
                col3: db.where(db.col("tbl_dispatch_detail.PickPlanNo"), "=", db.col("tbl_dispatch_detail_items->tbl_pickplan_details.PickPlanNo")),
              },
            },
            {
              model:item,
              on:{
                col1: db.where(db.col("tbl_dispatch_detail_items.ItemCode"), "=", db.col("tbl_dispatch_detail_items->tbl_item_master.ItemCode"))
              }
            }
          ]
        },
      ]
      
    }).catch(error => {  console.error(error) });



    let dispatchDetail1 = await JSON.stringify(dispatchDetail);
    
    var obj = await JSON.parse(dispatchDetail1);
    let sum = 0; let count=0;
    await obj.forEach(function(element,key) {
      obj[key]['tbl_dispatch_detail_items'].forEach(function(element1,key1) {
        sum = sum +element1['tbl_pickplan_details'].length;
      })
    });
   
   
var workbook = new Excel.Workbook();

workbook.xlsx.readFile('./public/reports/dr_template1.xlsx')
    .then(function() {
      //console.log(obj[0]['tbl_dispatch_hdr']['tbl_outbound_hdr']);
      console.log(obj[0] );
      async function editFile(){
        var worksheet = workbook.getWorksheet(1);
        var row = worksheet.getRow(5);
        worksheet.getRow(7).getCell('B').value = obj[0]['tbl_ship_point']['ShipPointName']; 
        worksheet.getRow(8).getCell('B').value = obj[0]['tbl_ship_point']['Address1'];
        worksheet.getRow(7).getCell('M').value = obj[0]['tbl_dispatch_hdr']['tbl_outbound_hdr']['DeliveryDate'];  
        worksheet.getRow(9).getCell('M').value = obj[0]['PONo'];
        worksheet.getRow(21).getCell('A').value = sum;
        let sumarryqtystart = 13;
        await obj.forEach(function(element,key) {
          obj[key]['tbl_dispatch_detail_items'].forEach(function(element1,key1) {
            worksheet.getRow(sumarryqtystart).getCell('A').value = element1['tbl_pickplan_details'].length;
            worksheet.getRow(sumarryqtystart).getCell('B').value = 'PCS.';
            worksheet.getRow(sumarryqtystart).getCell('C').value = element1['tbl_item_master']['ItemDescription'];
            sumarryqtystart++;
          })
        });
        let SerialRow = 23;
        let SerialColumn = 5;
        let ItemCodeTemp = ''
        await obj.forEach(function(element,key) {
          obj[key]['tbl_dispatch_detail_items'].forEach(function(element1,key1) {
            element1['tbl_pickplan_details'].forEach(function(element2,key2) {
              if(element2['ItemCode']!=ItemCodeTemp || SerialColumn>=16){
                SerialColumn = 5;
                SerialRow++;
                if(element2['ItemCode']!=ItemCodeTemp){
                  worksheet.getRow(SerialRow).getCell('B').value = element2['ItemCode'];
                }
                ItemCodeTemp = element2['ItemCode'];
              }
              worksheet.getRow(SerialRow).getCell(SerialColumn).value = element2['SerialNo'];
              SerialColumn +=3;
            });
          })
        });
        row.commit();
        await  workbook.xlsx.writeFile('./public/reports/dr.xlsx');
        await res.download('./public/reports/dr.xlsx', 'DR_'+Date.now()+".xlsx"); 
      }
      
      editFile();  
    })
  }
  displayReport();
}

