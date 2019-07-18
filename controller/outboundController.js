var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var fileUpload = require('express-fileupload');
var outbound_hdr = require('../models/outbound_hdr.js');
var outbound_detail = require('../models/outbound_detail.js');
var pickplan_hdr = require('../models/pickplan_hdr.js');
var pickplan_detail = require('../models/pickplan_detail.js');
var ItemMaster = require('../models/item.js');
var ShipPointMaster = require('../models/ship_point.js');
var inventory = require('../models/inventory.js');
var batch = require('../models/batch.js');
var pickplan_detail_recom = require('../models/pickplan_detail_recom.js');

//var CustomerMaster = require('../models/customer.js');
var path = require('path');
var multer = require('multer');
var Sequelize = require("sequelize");
let isOutbound = "isOutbound";
const Op = Sequelize.Op;
const uuidv4 = require('uuidv4');
var fs = require('fs');
const modulename = "outbound";
const XLSX = require('xlsx');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname +req.user+ path.extname(file.originalname))
    }
  });

const upload = multer({
    storage: storage
}).single('upload_outbound');



function ExcelDateToJSDate(serial) {
    var utc_days  = Math.floor(serial - 25569)+1;//adding 1day for xlsx bug
    var utc_value = utc_days * 86400;                                        
    var date_info = new Date(utc_value * 1000);
 
    var fractional_day = serial - Math.floor(serial) + 0.0000001;
 
    var total_seconds = Math.floor(86400 * fractional_day);
 
    var seconds = total_seconds % 60;
 
    total_seconds -= seconds;
 
    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;
 
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
 }



//display asn header
exports.index = function(req, res) {
    const pagename="outbound_index";
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
    let {ODOPrimaryRefDocNo,ODONo,Status,ShipmentNo} = req.query;
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
    if(ShipmentNo!='' && ShipmentNo)
    whereStatement.ShipmentNo = ShipmentNo;
    if(ODONo!='' && ODONo)
    whereStatement.ODONo = ODONo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;

    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    outbound_hdr.findAll({
        where: whereStatement,
        order: [['ODONo', 'ASC']]  
    }).then(outbound_hdr => res.render('../views/outbound/index',{outbound_hdr,ODONo_inp,ODOPrimaryRefDocNo_inp,paramdate1_inp,paramDate2_inp,isOutbound,Status_inp,pagename,userpermissionmodule,username: req.session.username,modulename}));

    req.query.paramDate2 = '';
    req.query.paramDate1 = '';
    req.query.ODONo = '';
};

//display asn header and detail
exports.outbound_details = function(req, res) {
    pagename="outbound_dtl";
    outbound_hdr.hasMany(outbound_detail, {foreignKey: 'UUID'});
    outbound_detail.belongsTo(outbound_hdr, {foreignKey: 'UUID'});
    outbound_detail.hasOne(ItemMaster, {foreignKey: 'ItemCode',  sourceKey:'ItemCode'});
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    outbound_hdr.findAll({
        include: [{
            model: outbound_detail,
            include: {model: ItemMaster,
                        on: {
                            col2: db.where(db.col("tbl_outbound_details.ItemCode"), "=", db.col("tbl_outbound_details->tbl_item_master.ItemCode"))
                        },
                     },
            where:{
                UUID : req.query.UUID
            }
        }]
        }).then(outbound_hdr => 
            //res.send({outbound_hdr})
            res.render('../views/outbound/outbound_dtl',{outbound_hdr,isOutbound,pagename,userpermissionmodule,username: req.session.username,modulename})
        );
};


exports.upload_outbound = function(req, res) {
    upload(req, res, (err) =>{
        if(err){
           console.log(err);
        }else{

            let workbook = XLSX.readFile(req.file.path);
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let range = XLSX.utils.decode_range(sheet['!ref']);
            let column = XLSX.utils.encode_cell({c : range.e.c - range.s.c, r : 0});
            let id_prim = {};
            let ItemCodeArr={};
            let ShipPointCodeArr = {};
            let err_array = [];
            function createJSONfromExcel(){
                for(rows = 0; rows < range.e.c; rows++) {
                    let rowAddress = XLSX.utils.encode_cell({c : 0, r : rows});
                    let workSheet = sheet[rowAddress];
                    if(workSheet) {
                        if(workSheet.v == "Sales Order No.") {
                           // sheet['!ref'] = rowAddress + ":" + column.replace('1', '') + range.e.r;
                           sheet['!ref'] = rowAddress + ":" +  range.e.r;
                        }
                    }
                };
            }
            function addColumn(jsonString){
                let newJson2 = JSON.parse(jsonString).map((element => {
                    element.Status = "Fresh";
                    element.CreatedBy = req.user;
                    element.TransactionType = req.body.TransactionType;;
                    if(!id_prim[element.ShipmentNo]) {
                        element.UUID = uuidv4();
                        id_prim[element.ShipmentNo] = element.UUID;
                    }
                    else{
                        element.UUID = id_prim[element.ShipmentNo];
                    }
                    return element;
                }));
                return newJson2;
            }
            function renameColumnJSON(jsonChange){
                jsonString = JSON.stringify(jsonChange);
                //jsonString = jsonString.replace(/\"Sales Order No.\":/g, "\"ODOPrimaryRefDocNo\":");
                jsonString = jsonString.replace(/\"Sales Order No.\":/g, "\"SalesOrderNo\":");
                
                jsonString = jsonString.replace(/\"Shipment No\":/g, "\"ShipmentNo\":");
                jsonString = jsonString.replace(/\"Del Date\":/g, "\"DeliveryDate\":");
                jsonString = jsonString.replace(/\"Item No.\":/g, "\"ItemCode\":");
                jsonString = jsonString.replace(/\"Whse to\":/g, "\"ShipPointCode\":");
                jsonString = jsonString.replace(/\"Whse From\":/g, "\"CustomerCode\":");
                jsonString = jsonString.replace(/\"QTY\":/g, "\"OrderQty\":");
                jsonString = jsonString.replace(/\"Purchase Order NO.\":/g, "\"PONo\":");
                jsonString = jsonString.replace(/T16:00:00.000Z/gi, "");
                //
                return jsonString;
            }

            function removeDuplicated(arr, key = 'ShipmentNo') {
                const map = new Map();
                arr.map(fromExcelJson => {
                    if (!map.has(fromExcelJson[key])) {
                        map.set(fromExcelJson[key], fromExcelJson);
                    }
                });
                return [...map.values()];
            }

            function mapCustomerItemPRD(addedColumnJSON){
                ODOPrimaryRefDocNoArr = addedColumnJSON.map(ODONo => ODONo.ODOPrimaryRefDocNo);
                ItemCodeArr = addedColumnJSON.map(ODONo => ODONo.ItemCode);
                ShipPointCodeArr = addedColumnJSON.map(ODONo => ODONo.ShipPointCode)
                ShipmentNoArr = addedColumnJSON.map(ODONo => ODONo.ShipmentNo )
                ShipmentNoDDArr = addedColumnJSON.map(ODONo => ODONo.ShipmentNo+ODONo.DeliveryDate )
               
            }

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

            function ODOShipPointCodeErrList(tempODOShipPoint){
                let result = [];
                for (let i = 0; i < tempODOShipPoint.length; i++){
                    result.push("Ship Point Code: " +tempODOShipPoint[i] + " is not valid.");
                }
                return result;
            }

            function ODOItemCodeErrList(tempODOItemCode){
                let result = [];
                for (let i = 0; i < tempODOItemCode.length; i++) {
                    result.push("Item code: " +tempODOItemCode[i] + " is not valid.");
                }
                return result;
            }


            function resowlt(temp){
                let result = [];
                for (let i = 0; i < temp.length; i++) {
                    let obj = {
                        UploadErrors: temp[i]
                    };
                    result.push(obj);
                }
                return result;
            }
            async function checkAndInsert(){
                let checkShipmentNoArrExist= await outbound_hdr.findAll({ 
                    attributes: ['ShipmentNo'],
                    /*where:{
                        ShipmentNo: {
                            [Op.in]: ShipmentNoArr
                        }   
                    }*/
                    where : 
                    [
                        db.where(
                            db.fn("concat", db.col("ShipmentNo"), db.col("DeliveryDate")), {[Op.in]:ShipmentNoDDArr}, 
                        ),
                        { TransactionType: req.body.TransactionType },
                        {Status : {[Op.ne]: 'Cancelled'}},
                    ],
                })

                let getItemCodeValid = await ItemMaster.findAll({
                    attributes:['ItemCode'],
                    where:{
                        Itemcode:{[Op.in]: ItemCodeArr},
                    }
                })

                let getShipPointCodeValid = await ShipPointMaster.findAll({
                    attributes:['ShipPointCode'],
                    where:{
                        ShipPointCode:{[Op.in]: ShipPointCodeArr}
                    }
                })

                
                let getItemCodeValiArr = await getItemCodeValid.map(getItemCodeValid => getItemCodeValid.ItemCode);
                
                let getShipPointCodeValidArr = await getShipPointCodeValid.map(getShipPointCodeValid => getShipPointCodeValid.ShipPointCode);
                
                let CompareDBExcelItemCode = await arr_diff(ItemCodeArr,getItemCodeValiArr);
                let CompareDBShipPointCode = await arr_diff(ShipPointCodeArr,getShipPointCodeValidArr);
                if(checkShipmentNoArrExist!=''){
                    checkShipmentNoArrExisterr = checkShipmentNoArrExist.map(ShipmentNoer => "Shipment No: "+ ShipmentNoer.ShipmentNo+" already exist");
                    err_array.push(checkShipmentNoArrExisterr);
                }
                
                if(CompareDBExcelItemCode!=''){
                    err_array.push(ODOItemCodeErrList(CompareDBExcelItemCode));
                }

                if(CompareDBShipPointCode!= ''){
                    err_array.push(ODOShipPointCodeErrList(CompareDBShipPointCode));
                }

                if (err_array === undefined || err_array.length == 0) {
                    InsertODO(addedColumnJSON);
                    return req.flash('success_msg','Successfully added ODO');
                }else{
                    const Json2csvParser = require('json2csv').Parser;
                    let temp = await JSON.stringify(err_array).replace(/[\[\]\"]/g, '').split(',');
              
                    result1 = await resowlt(temp);
                    let json2csvParser = await new Json2csvParser();
                    let csv = await json2csvParser.parse(result1);
                    let path='./public/errors/ODOFileUploadErrors.csv'; 
                    fs.writeFile(path, csv, function(err,data) {
                        if (err) {throw err;}
                    }); 
                    return req.flash('error_msg', "Error uploading file. <a href='/download/ODOFileUploadErrors.csv'>Click here to download CSV file for validations.</a>");
                }
            }
            
            function InsertODO(addedColumnJSON){
                outbound_hdr.bulkCreate(
                   removeDuplicated(addedColumnJSON)
               ).catch(function(err) {
                // print the error details
                console.log(err);
            });
                outbound_detail.bulkCreate(
                   addedColumnJSON
               ).catch(function(err) {
                // print the error details
                console.log(err);
            });
           }
           
            async function uploadODO(){
                await createJSONfromExcel()
                let jsonChange = await XLSX.utils.sheet_to_json(sheet);
                
                //console.log(jsonChange);
                if (!jsonChange[0]["Del Date"] || !jsonChange[0]["Sales Order No."] || !jsonChange[0]["Shipment No"] || !jsonChange[0]["Item No."] || !jsonChange[0]["Whse to"] ||  !jsonChange[0]["QTY"] ||  !jsonChange[0]["Purchase Order NO."])
                {
                    req.flash('error_msg', "Invalid File. Please check the field headers");
                    res.redirect('/outbound');
                    console.log(jsonChange);
                }else{
                    await jsonChange.forEach(function(element,key) {
                        if(jsonChange[key]["Del Date"]!=''){
                            jsonChange[key]["Del Date"]=ExcelDateToJSDate(jsonChange[key]["Del Date"]);
                            //jsonChange[key]["Whse to"]=jsonChange[key]["Whse to"].toString();
                        }
                        
                    })
                    renamedJson = await renameColumnJSON(jsonChange)
                    addedColumnJSON = await addColumn(renamedJson) 
                    await mapCustomerItemPRD(addedColumnJSON)
                    await checkAndInsert() 
                    await res.redirect('/outbound');
                }
                
            }
            uploadODO();
        }
    })
};

//ui
exports.create_outbound = function(req, res) {
    pagename = "create_outbound";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
   res.render('../views/outbound/create',{isOutbound,pagename,userpermissionmodule,username: req.session.username,modulename});
};

//Create ASN hdr and detail
exports.post_create_outbound = function(req, res) {
    let {ODOPrimaryRefDocNo,ShipmentNo,PrimaryRefDocDate,TransactionType,CustomerCode,ItemCode,OrderUOM,OrderQty,ShipPointCode,SalesOrderNo,DeliveryDate,PONo} = req.body;
    let array_error = "";

    async function validateODO(){
        if(!SalesOrderNo || SalesOrderNo=='' || !ShipmentNo || ShipmentNo=='' || !TransactionType || TransactionType=='' || !CustomerCode || CustomerCode=='')
        array_error +="<li>Please Fill the required Fields.</li>";

        let checkIfExist =  await outbound_hdr.count({
            where : 
                [
                    db.where(
                        db.fn("concat", db.col("ShipmentNo"), db.col("DeliveryDate")), ShipmentNo+DeliveryDate, 
                    ),
                    { TransactionType },
                    {Status : {[Op.ne]: 'Cancelled'}},
                ],
            attributes : ['UUID']
        }).catch(err=>{
            console.log(err);
        })

        if(checkIfExist>0)
        array_error +="<li>Shipment No already exist.</li>";

        //console.log(array_error);
    }
     
    
    async function manualCreateODO(){
        let UUID = uuidv4();
        await validateODO();
        if(array_error==""){
            itemCodeArr = [];
            let createdOubound= await outbound_hdr.create({
                UUID,
                ODOPrimaryRefDocNo,
                PrimaryRefDocDate,
                ShipmentNo,
                TransactionType,
                CustomerCode,
                DeliveryDate,
                Status : 'Fresh',
                CreatedBy: req.user
            })
            await ItemCode.forEach(function(element,key) {
                itemCodeArr.push({
                    UUID:createdOubound.UUID,
                    ItemCode:ItemCode[key],
                    OrderUOM:OrderUOM[key],
                    OrderQty:OrderQty[key],
                    ShipPointCode:ShipPointCode[key],
                    SalesOrderNo:SalesOrderNo[key],
                    PONo:PONo[key]
                })
            });
            await outbound_detail.bulkCreate(itemCodeArr).catch(error => {  console.error(error) });
            await req.flash('success_msg','Successfully added ODO');
        }else{
            await req.flash('error_msg', array_error);
        }
         //res.render('../views/asn/create',{isASN});
         res.redirect('/outbound/create');
    }
    manualCreateODO();
    

  
 };

 //Confirm ASN
 exports.post_outbound_details = function(req, res) {
    let {UUID,ODONo,ODOPrimaryRefDocNo,ShipmentNo,ShipPointCode,ItemCode,OrderUOM,OrderQty,CustomerCode,TransactionType,ID,DeleteID,SalesOrderNo,DeliveryDate,PONo} = req.body;

    async function process_outbound(){
        let checkStatus = await outbound_hdr.findOne({
            where : {
                UUID : req.body.UUID
            },
            attributes : ['UUID','Status']
        })
        if(req.body.submit_action == "Confirmed" ){
            let checkIfExist = await pickplan_hdr.count({
                where : {
                    UUID : req.body.UUID,
                    Status : {[Op.ne]: 'Cancelled'},               
                },
                attributes : ['UUID']
            })
            if(checkIfExist==0){
                if(checkStatus.Status == 'Fresh' || checkStatus.Status == 'Under Amendment'){
                    let ItemCodeArr = [];
                    await outbound_hdr.update({ Status : req.body.submit_action,CustomerCode, ModifiedBy: req.user,ShipmentNo,ODOPrimaryRefDocNo,TransactionType,DeliveryDate },
                        { where : { UUID : req.body.UUID }
                    })
                    await ItemCode.forEach(function(element,key){
                        if(ItemCode[key]!=''){
                            ItemCodeArr.push({ID:ID[key],ItemCode:ItemCode[key],UUID,OrderUOM:OrderUOM[key],OrderQty:OrderQty[key],ShipPointCode:ShipPointCode[key],SalesOrderNo:SalesOrderNo[key],PONo:PONo[key]})
                        }
                    });
                    await outbound_detail.bulkCreate(ItemCodeArr, { updateOnDuplicate: true }).catch(error => {  console.error(error) });
              
                    if(DeleteID){
                        await outbound_detail.destroy({  where:{ ID: { [Op.in]: DeleteID  }  } }).catch(error => {  console.error(error) });
                    }
                    await req.flash('success_msg','ODO Successfully Updated.');
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID);
                }else{
                    req.flash('error_msg','ODO is not in Fresh Status.');  
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
                }
            }else{
                req.flash('error_msg','Active Pick Plan with ODO No.: '+ODONo+' already exist.');  
                res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
            }
        }else if(req.body.submit_action == "Under Amendment" ){
            let checkIfExist = await pickplan_hdr.count({
                where : {
                    UUID : req.body.UUID,
                    Status : {[Op.ne]: 'Cancelled'},               
                },
                attributes : ['UUID']
            })
            if(checkIfExist==0){
                if(checkStatus.Status == 'Confirmed'){
                    await outbound_hdr.update({ Status : req.body.submit_action, ModifiedBy: req.user },
                        { where : { UUID : req.body.UUID }
                    })
                    await req.flash('success_msg','Outbound Successfully Updated.');
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID);
                }else{
                    req.flash('error_msg','Outbound is not in Fresh Status.');  
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
                }
            }else{
                req.flash('error_msg','Active Pick Plan with ODO No.: '+ODONo+' already exist.');  
                res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
            }
        }else if(req.body.submit_action == "Confirm and Create Pick Plan") { //else if confirm and create goods receipt
            if(checkStatus.Status == 'Fresh' || checkStatus.Status == 'Confirmed'|| checkStatus.Status == 'Under Amendment'){//check if fresh or confirmed
                let checkIfExist = await pickplan_hdr.count({
                    where : {
                        UUID : req.body.UUID,
                        Status : {[Op.ne]: 'Cancelled'},               
                    },
                    attributes : ['UUID']
                })
                if(checkIfExist==0){
                    let ItemCodeArr = [];
                    await outbound_hdr.update({ Status : 'Confirmed',CustomerCode, ModifiedBy: req.user,ShipmentNo,ODOPrimaryRefDocNo,TransactionType,DeliveryDate },
                        { where : { UUID : req.body.UUID }
                    })
                    await ItemCode.forEach(function(element,key){
                        if(ItemCode[key]!=''){
                            ItemCodeArr.push({ID:ID[key],ItemCode:ItemCode[key],UUID,OrderUOM:OrderUOM[key],OrderQty:OrderQty[key],ShipPointCode:ShipPointCode[key],SalesOrderNo:SalesOrderNo[key],PONo:PONo[key]})
                        }
                    });
                    await outbound_detail.bulkCreate(ItemCodeArr, { updateOnDuplicate: true }).catch(error => {  console.error(error) });
                    if(DeleteID){
                        await outbound_detail.destroy({  where:{ ID: { [Op.in]: DeleteID  }  } }).catch(error => {  console.error(error) });
                    }
                    let createpickplan = await pickplan_hdr.create({
                        UUID,
                        ODONo,
                        ShipmentNo,
                        ODOPrimaryRefDocNo,
                        CreatedBy: req.user,
                        Status: 'Planned'
                    }).catch(function(err) {
                        console.log(err);
                    })

                    //allocate to pick
               /* const allitemsToPick = await outbound_detail.findAll({ where: {UUID}})
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
                    await req.flash('success_msg','Pick Plan Successfully Created.');
                    await res.redirect('/pickplan/pickplan_dtl?PickPlanNo='+createpickplan.PickPlanNo);
                }else{
                    req.flash('error_msg','Active Pick Plan with ODO No.: '+ODONo+' already exist.');  
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
                }
                
            }else{
                req.flash('error_msg','Outbound is not in Fresh Status.');  
                res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
            }
        }else if(req.body.submit_action == "Cancelled"){
            if(checkStatus.Status == 'Fresh'){
                await outbound_hdr.update({ Status : req.body.submit_action, ModifiedBy: req.user },
                    { where : { UUID : req.body.UUID }
                })
                await req.flash('success_msg','Outbound Successfully Updated.');
                    res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID);
            }else{
                req.flash('error_msg','Outbound is not in Fresh Status.');  
                res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID)
            }
        }else{
            req.flash('error_msg','An error occured.');  
            res.redirect('/outbound/outbound_dtl?UUID='+req.body.UUID); 
        }

    } 
    process_outbound();
 };


 exports.outbound_status_count = function(req, res) {
	const pagename = "outbound_count";
          outbound_hdr.findAll({
            group: ['Status'],
            attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
          }).then(function (outbound) {
              res.send(outbound);
            
          });
}