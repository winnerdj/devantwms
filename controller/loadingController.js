var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var dispatch_hdr = require('../models/dispatch_hdr.js');
var dispatch_detail = require('../models/dispatch_detail.js');
var dispatch_detail_item = require('../models/dispatch_detail_item.js');
var pickplan_detail = require('../models/pickplan_detail.js');

var pickplan_hdr = require('../models/pickplan_hdr.js');
var ShipPoint = require('../models/ship_point.js');
var loading_hdr = require('../models/loading_hdr.js');
var loading_detail = require('../models/loading_detail.js');
var Sequelize = require("sequelize");
var employee = require('../models/employee.js');
var inventory = require('../models/inventory');
var item = require('../models/item.js');
var user = require('../models/user.js');
var outbound_hdr = require('../models/outbound_hdr.js');
var Excel = require('exceljs');  

var path = require('path');
const Op = Sequelize.Op;    
var fs = require('fs');
var pdf = require('dynamic-html-pdf');
var html = fs.readFileSync('./views/layouts/pdflayout.handlebars', 'utf8');
const modulename="loading";

//display gr header
exports.index = function(req, res) {
  const pagename = "loading_index";
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

    if(ShipmentNo!='' && ShipmentNo)
    whereStatement.ShipmentNo = ShipmentNo;

    if(Status!='' && Status)
    whereStatement.Status = Status;
    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};

    loading_hdr.findAll({where: whereStatement}).then(dispatch => 
    res.render('../views/loading/index',{dispatch,ODO_inp,ShipmentNo_inp,paramdate1_inp,paramDate2_inp,Status,pagename,userpermissionmodule,username: req.session.username,modulename})
    //res.send({pickplan})
    );

  req.query.paramDate2 = '';
  req.query.paramDate1 = '';
  req.query.ASNNo = '';
};

//display gr header and detail
exports.loading_details = function(req, res) {
    
  loading_hdr.hasMany(loading_detail, {foreignKey: 'LoadingNo'});
  loading_detail.hasOne(item, {foreignKey: 'ItemCode'});  
  loading_detail.hasOne(ShipPoint, {foreignKey: 'ShipPointCode'});  
    const pagename = "loading_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);  
    async function displayDispatch(){
       const loadingDetails = await loading_hdr.findAll({
            where: { LoadingNo : req.query.LoadingNo },
            include: {
              model: loading_detail,
              include:
              [{model: item,
                on: {
                  col1: db.where(db.col("tbl_loading_details.ItemCode"), "=", db.col("tbl_loading_details->tbl_item_master.ItemCode"))
                  }
              },{model: ShipPoint,
                on: {
                  col1: db.where(db.col("tbl_loading_details.ShipPointCode"), "=", db.col("tbl_loading_details->tbl_ship_point.ShipPointCode"))
                  }
              }]
            }
        })
        await res.render('../views/loading/loading_dtl',  { loadingDetails,pagename,userpermissionmodule,username: req.session.username,modulename })
        //res.send({loadingDetails})
    }
    displayDispatch();
};


exports.post_loading_details = function(req, res) {
    let {LoadingNo,IDSC,AssignEmployee,VehicleType,DockNo,Person,PlateNo,ODONo} = req.body;

    const executeLoading = async function(){
      let finalItem = [];

      if(IDSC){
        console.log({IDSC,LoadingNo});
        const items2Load = await loading_detail.findAll({
          where: { LoadingNo: LoadingNo,
                   ID: {[Op.notIn]: IDSC}
                 },
        }).catch( (err)=> console.log(err))
        console.log({items2Load});
        let Updateditems2LoadList = await JSON.parse(JSON.stringify(items2Load)).map((element => {
          element.Status = 'Loaded';
          return element;
        }));
        console.log(Updateditems2LoadList);
        SerialNo2Load = await Updateditems2LoadList.map(Updateditems2LoadList => Updateditems2LoadList.SerialNo);
        const items2Unload = await loading_detail.findAll({
          where: { LoadingNo: LoadingNo,
                   ID: {[Op.in]: IDSC}
                 },
        });
        
        
        let Updateditems2UnloadList = JSON.parse(JSON.stringify(items2Unload)).map((element => {
          element.Status = 'Unloaded';
          return element;
        }));
      
        SerialNo2Unload = Updateditems2UnloadList.map(Updateditems2UnloadList => Updateditems2UnloadList.SerialNo);
  
  
        finalItem = await Updateditems2LoadList.concat(Updateditems2UnloadList);
        await inventory.update({ Status : 'UnLoaded',  }, { where : { SerialNo: {[Op.in]: SerialNo2Unload} }})
      }else{
        const items2Load = await loading_detail.findAll({
          where: { LoadingNo: LoadingNo },
        })
        let Updateditems2LoadList = await JSON.parse(JSON.stringify(items2Load)).map((element => {
          element.Status = 'Loaded';
          return element;
        }));
        SerialNo2Load = await Updateditems2LoadList.map(Updateditems2LoadList => Updateditems2LoadList.SerialNo);
        finalItem = await Updateditems2LoadList;
      }
      await loading_detail.bulkCreate(finalItem, {updateOnDuplicate: true}).catch(error => { console.error(error) });
      await loading_hdr.update({Status: req.body.submit_action,AssignEmployee,VehicleType,DockNo,Person,PlateNo},{where: {LoadingNo}});
      //await inventory.update({ Status : 'Loaded',  }, { where : { SerialNo: {[Op.in]: SerialNo2Load} }})
      await inventory.destroy( { where : { SerialNo: {[Op.in]: SerialNo2Load} }})
      await outbound_hdr.update({ Status : 'Closed',  }, { where : { ODONo }})
      await req.flash('success_msg','Successfully Updated Loading');
      await res.redirect('/loading/loading_dtl?LoadingNo='+LoadingNo);
    }
    executeLoading();
    
 };

//ui
exports.create_loading = function(req, res) {
  pagename="create_loading";
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

  let whereStatement = {UUID: {[Op.notIn]: [db.literal("select UUID from tbl_loading_hdr WHERE Status!='Cancelled'")]}}
    if(ODOPrimaryRefDocNo!='' && ODOPrimaryRefDocNo)
    whereStatement.ODOPrimaryRefDocNo = ODOPrimaryRefDocNo;
    if(ODONo!='' && ODONo)
    whereStatement.ODONo = ODONo;
    whereStatement.Status = 'Confirmed';
  //whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};

  dispatch_hdr.findAll({where: whereStatement}).then(pickplan => 
    res.render('../views/loading/create',{pickplan,ODO_inp,PrimaryRefDocNo_inp,paramdate1_inp,paramDate2_inp,pagename,userpermissionmodule,username: req.session.username,modulename})
    //res.send({pickplan})
    ).catch((err)=>{console.log(err)});

  req.query.paramDate2 = '';
  req.query.paramDate1 = '';
  req.query.ASNNo = '';;
};


exports.post_create_loading = function(req, res) {
    const processLoadingCreation = async function(){
        let loadingCheck = await loading_hdr.count({
            where : {
                UUID : req.body.UUID,
                Status : {[Op.ne]: 'Cancelled'},               
            },
        })
        if(loadingCheck==0){
            let dispatchInfo = await dispatch_hdr.findOne({
                where : {
                    UUID : req.body.UUID,           
                },
                raw: true,
            })
            
           let createdLoading = await loading_hdr.create({
              UUID:req.body.UUID,
              ShipmentNo:dispatchInfo.ShipmentNo,
              DispatchNo:dispatchInfo.DispatchNo,
              ODONo:dispatchInfo.ODONo,
              PickPlanNo:dispatchInfo.PickPlanNo,
              Status: 'Planned',
              CreatedBy: req.user,
            })
            let pickplandetailInfo = await pickplan_detail.findAll({
                where: {PickPlanNo:dispatchInfo.PickPlanNo}
            }).catch(function (err) {  console.log(err); });
            let UpdatedpickplanDetailList = await JSON.parse(JSON.stringify(pickplandetailInfo)).map((element => {
                element.LoadingNo = createdLoading.LoadingNo;
                return element;
            }));
            await loading_detail.bulkCreate(  UpdatedpickplanDetailList  ).catch(function (err) {  console.log(err); });
            await req.flash('success_msg','Successfully created Loading');
            await res.redirect('/loading/loading_dtl?LoadingNo='+createdLoading.LoadingNo);
        }else{
            req.flash('error_msg','Loading already exist');  
            res.redirect('/loading/loading_dtl?LoadingNo='+createdLoading.LoadingNo); 
        }
    } 
    processLoadingCreation();
}


exports.generate_loadlist  = function(req, res) {
  let {LoadingNo} = req.body
  async function displayReport(){
    loading_hdr.hasMany(loading_detail, {foreignKey: 'LoadingNo'});
    pickplan_detail.hasOne(dispatch_detail, {foreignKey: 'DispatchNo'});
    dispatch_detail.belongsTo(dispatch_hdr, {foreignKey: 'DispatchNo'});
    dispatch_hdr.hasOne(user, {foreignKey: 'ID', sourceKey:'AssignEmployee'});
    loading_detail.hasOne(ShipPoint, {foreignKey: 'ShipPointCode'});
    loading_detail.hasOne(pickplan_detail, {foreignKey: 'SerialNo', sourceKey:'SerialNo'});
    loading_detail.hasOne(item, {foreignKey: 'ItemCode'});
    loading_detail.hasOne(dispatch_detail_item, {foreignKey: 'ItemCode'});
    //dispatch_detail.hasOne(dispatch_detail_item, {foreignKey: 'ItemCode'});
    loading_hdr.hasOne(dispatch_hdr, {foreignKey: 'UUID', sourceKey:'UUID'});



/*
    const dispatchDetail = await loading_hdr.findAll({
      where: { LoadingNo : LoadingNo },
      include: [
                { model:dispatch_hdr, 
                  on: {
                    col1: db.where(db.col("tbl_loading_hdr.UUID"), "=", db.col("tbl_dispatch_hdr.UUID"))
                  },
                  include:[
                    {model: user,
                      on: {
                        col1: db.where(db.col("tbl_dispatch_hdr.AssignEmployee"), "=", db.col("tbl_dispatch_hdr->tbl_user.EmployeeID"))
                      },
                    },
                  ]
                },
                {  
                  model: loading_detail,
                  attributes: [
                                [db.fn('count', db.col('tbl_loading_details.ID')),'count1'],
                                'ItemCode',
                                'ShipPointCode',
                                [db.literal("SELECT tbl_dispatch_detail.DispatchNo, tbl_dispatch_detail.SalesOrderNo, tbl_dispatch_detail_items.ItemCode, DRRefNo FROM tbl_dispatch_detail LEFT JOIN tbl_dispatch_detail_items ON tbl_dispatch_detail.DispatchNo =tbl_dispatch_detail_items.DispatchNo AND tbl_dispatch_detail.SalesOrderNo = tbl_dispatch_detail_items.SalesOrderNo AND tbl_dispatch_detail.DRNo = tbl_dispatch_detail_items.DRNo "),'DRREF']
                              ],
                  include: [
                    { 
                      model:ShipPoint, 
                      on: {
                        col1: db.where(db.col("tbl_loading_details.ShipPointCode"), "=", db.col("tbl_loading_details->tbl_ship_point.ShipPointCode"))
                      }
                    },
                    {
                      model: item,
                      on: {
                        col1: db.where(db.col("tbl_loading_details.ItemCode"), "=", db.col("tbl_loading_details->tbl_item_master.ItemCode"))

                      },
                    },
                    {
                      model: dispatch_detail_item,
                      attributes:['ItemCode','SalesOrderNo'],
                      on: {
                        col1: db.where(db.col("tbl_loading_details.ItemCode"), "=", db.col("tbl_loading_details->dispatch_detail_items.ItemCode")),
                        col2: db.where(db.col("tbl_loading_details.SalesOrderNo"), "=", db.col("tbl_loading_details->dispatch_detail_items.SalesOrderNo"))
                      },
                    },
                    {
                      model: pickplan_detail,
                      on: {
                        col1: db.where(db.col("tbl_loading_details.SerialNo"), "=", db.col("tbl_loading_details->tbl_pickplan_detail.SerialNo")),
                        col2: db.where(db.col("tbl_dispatch_hdr.PickPlanNo"), "=", db.col("tbl_loading_details->tbl_pickplan_detail.PickPlanNo"))
                      },
                      /*include:[
                        {

                          model: dispatch_detail,
                          include:[{
                            model: dispatch_detail_item,
                          }],
                          on: {
                            col1: db.where(db.col("tbl_loading_details->tbl_pickplan_detail.SalesOrderNo"), "=", db.col("tbl_loading_details->tbl_pickplan_detail->tbl_dispatch_detail.SalesOrderNo")),
                            col2: db.where(db.col("tbl_dispatch_hdr.DispatchNo"), "=", db.col("tbl_loading_details->tbl_pickplan_detail->tbl_dispatch_detail.DispatchNo")),
                            col3: db.where(db.col("tbl_loading_details->tbl_pickplan_detail.ShipPointCode"), "=", db.col("tbl_loading_details->tbl_pickplan_detail->tbl_dispatch_detail.ShipPointCode")),
                          },
                        },
                      ]
                    },
                  ] 
                },
              ],
      group: ['tbl_loading_details.ItemCode','tbl_loading_details->tbl_pickplan_detail.SalesOrderNo','tbl_loading_details.ShipPointCode'],
      order: [['tbl_loading_details','ShipPointCode','ASC'],['tbl_loading_details','tbl_pickplan_detail','tbl_dispatch_detail','DRRefNo','ASC']] 
    }).catch(error => {  console.error(error) });*/
    let dispatchDetail =   await db.query("SELECT `tbl_loading_detail`.ItemCode,`tbl_dispatch_hdr`.DispatchNo,DockNo, tbl_outbound_hdr.ShipmentNo,detDRRefNo, COUNT(`tbl_loading_detail`.ID) AS 'Count',`tbl_ship_point`.ShipPointName,Person,FirstName,LastName FROM `tbl_loading_hdr` LEFT OUTER JOIN `tbl_user` ON `tbl_loading_hdr`.CreatedBy = `tbl_user`.ID LEFT OUTER JOIN `tbl_dispatch_hdr` ON `tbl_loading_hdr`.`DispatchNo`=`tbl_dispatch_hdr`.`DispatchNo` LEFT OUTER JOIN `tbl_loading_detail` ON `tbl_loading_hdr`.`LoadingNo` = `tbl_loading_detail`.`LoadingNo`  LEFT OUTER JOIN `tbl_pickplan_detail` ON `tbl_loading_detail`.`SerialNo`=`tbl_pickplan_detail`.`SerialNo` AND `tbl_dispatch_hdr`.`PickPlanNo`=`tbl_pickplan_detail`.`PickPlanNo` LEFT JOIN (SELECT tbl_dispatch_detail.DispatchNo AS 'detDispatchNo',tbl_dispatch_detail_items.ItemCode AS 'detItemCode', tbl_dispatch_detail.SalesOrderNo AS 'detSalesOrderNo', tbl_dispatch_detail.ShipPointCode AS 'detShipPointCode', tbl_dispatch_detail.DRRefNo AS 'detDRRefNo'  FROM `tbl_dispatch_detail`  LEFT JOIN `tbl_dispatch_detail_items` ON tbl_dispatch_detail.DispatchNo = tbl_dispatch_detail_items.DispatchNo AND tbl_dispatch_detail.SalesOrderNo = tbl_dispatch_detail_items.SalesOrderNo AND tbl_dispatch_detail.DRNo = tbl_dispatch_detail_items.DRNo) AS DispatchHead ON `tbl_dispatch_hdr`.DispatchNo = DispatchHead.detDispatchNo AND `tbl_pickplan_detail`.ItemCode = DispatchHead.detItemCode AND `tbl_pickplan_detail`.SalesOrderNo = DispatchHead.detSalesOrderNo AND `tbl_pickplan_detail`.ShipPointCode = DispatchHead.detShipPointCode  LEFT OUTER JOIN tbl_outbound_hdr ON `tbl_loading_hdr`.`UUID`=`tbl_outbound_hdr`.`UUID` LEFT OUTER JOIN `tbl_ship_point` ON `tbl_ship_point`.ShipPointCode = `tbl_loading_detail`.ShipPointCode WHERE `tbl_loading_hdr`.`LoadingNo` = ? GROUP BY `tbl_loading_detail`.ItemCode, `tbl_loading_detail`.ShipPointCode, `tbl_pickplan_detail`.SalesOrderNo,`tbl_dispatch_hdr`.DispatchNo,detDRRefNo  ORDER BY `tbl_loading_detail`.ShipPointCode, detDRRefNo",{ replacements: [LoadingNo],type: db.QueryTypes.SELECT})
    let dispatchDetail1 = await JSON.stringify(dispatchDetail);
    
    var obj = await JSON.parse(dispatchDetail1);
    let sum = 0; let count=0;
    console.log(obj);
    //res.send(obj);
    await obj.forEach(function(element,key) {
        sum = sum+ element.Count;
    });
    console.log(sum);
    //res.send(obj);
    //var thisJSON = await dispatchDetail.toJSON();
    //res.log(thisJSON);
   /*
   let document = await {
      type: 'buffer',     // 'file' or 'buffer'
      template: html,
      context: {
        dispatchDetail:obj,sum
      },
    };

    var options = {
      format: "A4",
      orientation: "portrait",
      border: "5mm",
      "footer": {
        "height": "10mm",
        "contents": {
          default: '<footer>Page: {{page}}/<span>{{pages}}</span></div></footer>', 
        }
      }
  };
  

   const bufferthis = await pdf.create(document, options).catch(error => {  console.error(error) });
   const pdfBuffer = await Buffer.from(bufferthis)
   res.setHeader('Content-disposition', 'inline; filename="/public/upload/loadlist.pdf"');
   res.setHeader('Content-type', 'application/pdf');
   res.send(pdfBuffer);*/


   var workbook = new Excel.Workbook();

   workbook.xlsx.readFile('./public/reports/Load list.xlsx')
       .then(function() {
         //console.log(obj[0]['tbl_dispatch_hdr']['tbl_outbound_hdr']);
         console.log(obj[0] );
         async function editFile(){
           var worksheet = workbook.getWorksheet(1);
           var row = worksheet.getRow(5);
           worksheet.getRow(11).getCell('C').value = obj[0]['ShipmentNo'];
           
           worksheet.getRow(10).getCell('C').value = obj[0]['DeliveryDate'];  
           const fullborder ={left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }};
           let rownum = 16;
           await obj.forEach(function(element,key) {
               worksheet.getRow(rownum).getCell('A').value = obj[key]['ItemCode'];
               worksheet.getRow(rownum).getCell('A').border = fullborder;
               worksheet.getRow(rownum).getCell('B').value = obj[key]['ShipPointName'];
               worksheet.getRow(rownum).getCell('B').border = fullborder;
               worksheet.getRow(rownum).getCell('C').value = obj[key]['detDRRefNo'];
               worksheet.getRow(rownum).getCell('C').border = fullborder;
               worksheet.getRow(rownum).getCell('D').value = obj[key]['Count'];
               worksheet.getRow(rownum).getCell('D').border = fullborder;
               worksheet.getRow(rownum).getCell('E').value = 'PCS';
               worksheet.getRow(rownum).getCell('E').border = fullborder;
               worksheet.getRow(rownum).getCell('F').border = fullborder;
               rownum++;
           });
           worksheet.getRow(rownum).getCell('A').value = 'Grand Total';
           worksheet.getRow(rownum).getCell('A').border = fullborder;

           worksheet.getRow(rownum).getCell('B').border = fullborder;
           worksheet.getRow(rownum).getCell('C').border = fullborder;

           worksheet.getRow(rownum).getCell('D').value = sum;
           worksheet.getRow(rownum).getCell('D').border = fullborder;

           worksheet.getRow(rownum).getCell('E').border = fullborder;
           worksheet.getRow(rownum).getCell('F').border = fullborder;

           rownum +=2;
           worksheet.getRow(rownum).getCell('A').value = 'Prepared By:';
           worksheet.getRow(rownum).getCell('A').border = {bottom: { style: "thin" }, right: { style: "thin" }};
           worksheet.getRow(rownum).getCell('A').font = { size: 10,  bold: true, };
           worksheet.getRow(rownum).getCell('B').value =  obj[0]['FirstName']+" "+obj[0]['LastName'];
           worksheet.getRow(rownum).getCell('B').font = { size: 10,  bold: true, };
           worksheet.getRow(rownum).getCell('B').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('C').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('D').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('E').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('F').border = {bottom: { style: "thin" }};

           rownum +=2;
           worksheet.getRow(rownum).getCell('A').value = 'Prepared By:';
           worksheet.getRow(rownum).getCell('A').border = {bottom: { style: "thin" }, right: { style: "thin" }};
           worksheet.getRow(rownum).getCell('A').font = { size: 10,  bold: true, };
           worksheet.getRow(rownum).getCell('B').value =  obj[0]['Person'];
           worksheet.getRow(rownum).getCell('B').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('B').font = { size: 10,  bold: true, };
           worksheet.getRow(rownum).getCell('C').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('D').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('E').border = {bottom: { style: "thin" }};
           worksheet.getRow(rownum).getCell('F').border = {bottom: { style: "thin" }};

           rownum++;
           worksheet.getRow(rownum).getCell('A').value = 'Item/s loaded completely and in good condition by:';
           worksheet.getRow(rownum).getCell('A').font = { size: 10,  bold: true, };
           worksheet.getRow(11).getCell('C').border =  {};
           worksheet.getRow(9).getCell('C').border =  {};
           row.commit();
           await  workbook.xlsx.writeFile('./public/reports/loadlist_edited.xlsx');
           await res.download('./public/reports/loadlist_edited.xlsx', 'loadlist_'+Date.now()+".xlsx"); 
         }
         
         editFile();  
       })
   
  }
  displayReport();
}

exports.loading_status_count = function(req, res) {
  loading_hdr.findAll({
      group: ['Status'],
      attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
  }).then(function (loading) {
      res.send(loading);
  });
}
