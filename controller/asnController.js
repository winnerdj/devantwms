const db = require('../models/db.js');
var ASN_hdr = require('../models/asn_hdr.js');
var ASN_detail = require('../models/asn_detail.js');
var GR_hdr = require('../models/gr_hdr.js');
var ItemMaster = require('../models/item.js');
var CustomerMaster = require('../models/customer.js');
var item = require('../models/item.js');
var batch = require('../models/batch.js');
var journal_entry = require('../models/journal_entry');
var path = require('path');
var multer = require('multer');
var Sequelize = require("sequelize");
let modulename = "asn";
const Op = Sequelize.Op;
const uuidv4 = require('uuidv4');
var fs = require('fs');
const XLSX = require('xlsx');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname  +req.user+ path.extname(file.originalname))
    }
  });

const upload = multer({
    storage: storage
}).single('upload_asn');	

function ExcelDateToJSDate(serial) {
    var utc_days  = Math.floor(serial - 25569);
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
    const pagename="asn_index";
    
    let thisuser = req.user;
    const thismodule = 'Inbound';
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
    let ASNNo_inp = req.query.ASNNo;
    let ShipmentNo_inp = req.query.ShipmentNo;
    let Status_inp = req.query.Status;
    let {ShipmentNo,ASNNo,Status} = req.query;
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
    if(ASNNo!='' && ASNNo)
    whereStatement.ASNNo = ASNNo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;

    whereStatement.ASNDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    ASN_hdr.findAll({
        where: whereStatement,
        order: [['ASNNo', 'ASC']]
    }).then(ASN_hdr => 
        res.render('../views/asn/index',{
            ASN_hdr,
            ASNNo_inp,
            ShipmentNo_inp,
            paramdate1_inp,
            paramDate2_inp,
            modulename,
            Status_inp,
            pagename,
            userpermissionmodule,
            username: req.session.username
        }));
};

exports.upload_asn = function(req, res) {
	upload(req, res, (err) =>{
        if(err){
           console.log(err);
        }else{

            let workbook = XLSX.readFile(req.file.path);
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let range = XLSX.utils.decode_range(sheet['!ref']);
            let column = XLSX.utils.encode_cell({c : range.e.c - range.s.c, r : 0});
            let id_prim = {};
            let JournalEntryJSON = [];
            let ItemCodeArr={};
            let err_array = [];
            function createJSONfromExcel(){
                for(rows = 0; rows < range.e.c; rows++) {
                    let rowAddress = XLSX.utils.encode_cell({c : 0, r : rows});
                    let workSheet = sheet[rowAddress];
                    if(workSheet) {
                        if(workSheet.v == "Shipment Manifest #") {
                            sheet['!ref'] = rowAddress + ":" + column.replace('1', '') + range.e.r;
                        }
                    }
                };
            }
            function addColumn(jsonString){
                let newJson2 = JSON.parse(jsonString).map((element => {
                    element.Status = "Fresh";
                    element.CreatedBy = req.user;
                    element.TransactionType = req.body.TransactionType;
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
                jsonString = jsonString.replace(/\"Shipment Manifest #\":/g, "\"ShipmentNo\":");
                jsonString = jsonString.replace(/\"Delivery Order No\":/g, "\"ASNPrimaryRefDocNo\":");
                jsonString = jsonString.replace(/\"Required Delivery Date [(]RDD[)]\":/g, "\"PrimaryRefDocDate\":");
                jsonString = jsonString.replace(/\"PO Number\":/g, "\"TransactionType\":");
                jsonString = jsonString.replace(/\"Customer Code\":/g, "\"CustomerCode\":");
                jsonString = jsonString.replace(/\"SKU Code\":/g, "\"ItemCode\":");
                jsonString = jsonString.replace(/\"UOM\":/g, "\"OrderUOM\":");
                jsonString = jsonString.replace(/\"Quantity\":/g, "\"OrderQty\":");
                jsonString = jsonString.replace(/\"Serial Number Ref.\":/g, "\"SerialNo\":");
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
                ShipmentNoArr = addedColumnJSON.map(ASNno => ASNno.ShipmentNo);
                ItemCodeArr = addedColumnJSON.map(ASNno => ASNno.ItemCode);
                CustomerCodeArr = addedColumnJSON.map(ASNno => ASNno.CustomerCode);
                SerialNoArr = addedColumnJSON.map(ASN_SerialNo => ASN_SerialNo.SerialNo);
                SerialNoItemArr = addedColumnJSON.map(ASN_SerialNo => ASN_SerialNo.SerialNo+ASN_SerialNo.ItemCode);
                BatchArr = addedColumnJSON.map(ASN_SerialNo => ASN_SerialNo.Batch);
                
                
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

            function ASNItemCodeErrList(tempASNItemCode){
                let result = [];
                for (let i = 0; i < tempASNItemCode.length; i++) {
                    result.push("Item code: " +tempASNItemCode[i] + " is not valid.");
                }
                return result;
            }

            function ASNCustomerCodeErrList(tempASNCustomerCode){
                let result = [];
                for (let i = 0; i < tempASNCustomerCode.length; i++) {
                    result.push("Customer code: " +tempASNCustomerCode[i] + " is not valid.");
                }
                return result;
            }
            function BatchErrList(tempBatch){
                let result = [];
                for (let i = 0; i < tempBatch.length; i++) {
                    result.push("Batch No: " +tempBatch[i] + " is not valid.");
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
                let checkShipmentNoExist= await ASN_hdr.findAll({ 
                    attributes: ['ShipmentNo'],
                    where:{
                        ShipmentNo: {
                            [Op.in]: ShipmentNoArr
                        },
                        Status : {
                            [Op.ne]: 'Cancelled'
                        }   
                    }
                })
                ASN_detail.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
                let checkItemCodeSerialExist = await ASN_detail.findAll({   
                    attributes:['ItemCode','SerialNo'],
                    include:{model:ASN_hdr,
                                requred: true,
                                where:{
                                    TransactionType: req.body.TransactionType,
                                    Status : {[Op.ne]: 'Cancelled'}
                                }
                            },
                    where: 
                        Sequelize.where(Sequelize.fn("concat", Sequelize.col("SerialNo"), Sequelize.col("ItemCode")), {
                        [Op.in]: SerialNoItemArr
                    }),
                    
                }).catch((err) => {
                    console.log(err)
                })

                let getItemCodeValid = await ItemMaster.findAll({
                    attributes:['ItemCode'],
                    where:{
                        Itemcode:{[Op.in]: ItemCodeArr},
                    }
                })
                let getItemCodeValiArr = await getItemCodeValid.map(getItemCodeValid => getItemCodeValid.ItemCode);
                let CompareDBExcelItemCode = await arr_diff(ItemCodeArr,getItemCodeValiArr);
                

                let getCustomerCodeValid = await CustomerMaster.findAll({
                    attributes:['CustomerCode'],
                    where:{
                        CustomerCode:{[Op.in]: CustomerCodeArr},
                    }
                })
                let getCustomerCodeValiArr = await getCustomerCodeValid.map(getCustomerCodeValid => getCustomerCodeValid.CustomerCode);
                let CompareDBExcelCustomerCode = await arr_diff(CustomerCodeArr,getCustomerCodeValiArr);


                let getBatchValid = await batch.findAll({
                    attributes:['Batch'],
                    where:{
                        Batch:{[Op.in]: BatchArr},
                    }
                })
                let getBatchValidArr = await getBatchValid.map(getBatchValid => getBatchValid.Batch);
                let CompareDBExcelBatch = await arr_diff(BatchArr,getBatchValidArr);
                if(checkShipmentNoExist!=''){
                    ASNcheckShipmentNoExistNoErr = checkShipmentNoExist.map(ASN_ShipmentNo => "Ref doc no: "+ ASN_ShipmentNo.ShipmentNo+" already exist");
                    err_array.push(ASNcheckShipmentNoExistNoErr);
                }
                if(CompareDBExcelItemCode!=''){
                    err_array.push(ASNItemCodeErrList(CompareDBExcelItemCode));
                }
                
                if(CompareDBExcelCustomerCode!=''){
                    err_array.push(ASNCustomerCodeErrList(CompareDBExcelCustomerCode));
                }

                if(CompareDBExcelBatch!=''){
                    err_array.push(BatchErrList(CompareDBExcelBatch));
                    
                }
                

                if(checkItemCodeSerialExist!=''){
                    ASNPItemCodeSerialErr = checkItemCodeSerialExist.map(ASN_ItemCodeSerial=> "Serial No.:"+ ASN_ItemCodeSerial.SerialNo +" already exist");
                    err_array.push(ASNPItemCodeSerialErr);
                }
                

                if (err_array === undefined || err_array.length == 0) {
                    InsertASN(addedColumnJSON);
                    return req.flash('success_msg','Successfully added ASN');
                }else{
                    const Json2csvParser = require('json2csv').Parser                    
                    let temp = await JSON.stringify(err_array).replace(/[\[\]\"]/g, '').split(',');
                    result1 = await resowlt(temp);
                    let json2csvParser = await new Json2csvParser();
                    let csv = await json2csvParser.parse(result1);
                    let path='./public/errors/ASNFileUploadErrors.csv'; 
                    fs.writeFile(path, csv, function(err,data) {
                        if (err) {throw err;}
                    }); 
                    return req.flash('error_msg', "Error uploading file. <a href='/download/ASNFileUploadErrors.csv'>Click here to download CSV file for validations.</a>");
                }
            }
            
            async function InsertASN(addedColumnJSON){
                await ASN_hdr.bulkCreate(
                   removeDuplicated(addedColumnJSON)
               ).catch(error => {  console.error(error) });
                ASN_detail.bulkCreate(
                   addedColumnJSON
               ).catch(error => {  console.error(error) });
               

                JournalEntryJSON = await addedColumnJSON.map(element=>{
                element.TransactionType = "ASN"
                element.ActionType = "Create"
                element.ReferenceID = element.UUID
                element.TransactBy = element.CreatedBy
                element.Qty = element.OrderQty
                element.UOM = element.OrderUOM
                return element
               })

              await journal_entry.bulkCreate(
                JournalEntryJSON
              ).catch(error => {  console.error(error) });
           }
           
            async function uploadASN(){
                await createJSONfromExcel()
                let jsonChange = await XLSX.utils.sheet_to_json(sheet);
                await jsonChange.forEach(function(element,key) {
                    jsonChange[key]["Required Delivery Date (RDD)"]=ExcelDateToJSDate(jsonChange[key]["Required Delivery Date (RDD)"]);
                })
                renamedJson = await renameColumnJSON(jsonChange)
                addedColumnJSON = await addColumn(renamedJson) 
                await mapCustomerItemPRD(addedColumnJSON)
                await checkAndInsert() 
                await res.redirect('/asn');
            }
            uploadASN();
        }
	})
}
exports.asn_details = function(req, res) {
    const pagename = "asn_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    ASN_hdr.hasMany(ASN_detail, {foreignKey: 'UUID'});
    ASN_detail.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
    ASN_detail.hasOne(item, {foreignKey: 'ItemCode', sourceKey:'ItemCode'});
    ASN_hdr.findAll({
        where:{
            UUID : req.query.UUID
        },
        include: [{
             model: ASN_detail,
             include: [{model: item,
                on: {
                    col1: db.where(db.col("tbl_asn_details.ItemCode"), "=", db.col("tbl_asn_details->tbl_item_master.ItemCode"))
                  }
            }]
        }]
        }).then(ASN_hdr => res.render('../views/asn/asn_dtl',{ASN_hdr,modulename,pagename,userpermissionmodule,username: req.session.username}))
		  .catch(error => {  console.error(error) });
}
exports.create_asn = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
	var pagename = "create_asn"
   res.render('../views/asn/create',{modulename,pagename,userpermissionmodule,username: req.session.username});
}

exports.post_create_asn = function(req, res) {
	let {ShipmentNo,PrimaryRefDocDate,TransactionType,CustomerCode,ItemCode,OrderUOM,OrderQty,SerialNo,Batch} = req.body;
    let array_error = "";

    async function validateASN(){
        if(!ShipmentNo || ShipmentNo=='' ||!PrimaryRefDocDate || PrimaryRefDocDate=='' || !TransactionType || TransactionType=='' || !CustomerCode || CustomerCode=='')
        array_error +="<li>Please Fill the required Fields.</li>";

        let checkIfExist =  await ASN_hdr.count({
            where : {
                ShipmentNo : req.body.ShipmentNo,
                Status : {[Op.ne]: 'Cancelled'},
                TransactionType               
            },
            attributes : ['UUID']
        })

        if(checkIfExist>0)
        array_error +="<li>Shipment No already exist.</li>";
    }
     
    
    async function manualCreateASN(){ 
        let UUID = uuidv4();
        await validateASN();
        if(array_error==""){
            itemCodeArr = [];
            journalEntry = [];
            let createASNHdr = await ASN_hdr.create({
                UUID,
                ShipmentNo,
                PrimaryRefDocDate,
                TransactionType,
                CustomerCode,
                Status : 'Fresh',
                CreatedBy : req.user
            })
            await ItemCode.forEach(function(element,key) {  
                itemCodeArr.push({
                    UUID:createASNHdr.UUID,
                    ItemCode:ItemCode[key],
                    OrderUOM:OrderUOM[key],
                    OrderQty:OrderQty[key],
                    SerialNo:SerialNo[key],
                    Batch:Batch[key]
                });

                journalEntry.push({
                    ReferenceID:createASNHdr.UUID,
                    ItemCode:ItemCode[key],
                    UOM:OrderUOM[key],
                    Qty:OrderQty[key],
                    SerialNo:SerialNo[key],
                    TransactionType:"ASN",
                    ActionType:"Create",
                    TransactBy:req.user
                });
            })
            await ASN_detail.bulkCreate(itemCodeArr).catch(error => {  console.error(error) });
            await journal_entry.bulkCreate(journalEntry).catch(error => {  console.error(error) });
            await req.flash('success_msg','Successfully added ASN');
        }else{
            await req.flash('error_msg', array_error);
        }
         //res.render('../views/asn/create',{isASN});
         res.redirect('/asn/create');
    }
    manualCreateASN();
}


exports.post_asn_details = function(req, res) {
	let {UUID,ASNNo,ShipmentNo,TransactionType,CustomerCode,ItemCode,Batch,OrderUOM,OrderQty,SerialNo,ID,DeleteID} = req.body;
    
    async function process_asn(){
        let checkStatus = await ASN_hdr.findOne({
            where : {
                UUID : req.body.UUID
            },
            attributes : ['UUID','Status']
        })

        if(req.body.submit_action == "Confirmed" ){
            if(checkStatus.Status == 'Fresh' || checkStatus.Status == 'Under Amendment'){
                ItemCodeArr = [];
                journalEntry=[];
                await ASN_hdr.update({ TransactionType,ShipmentNo,CustomerCode,Status : req.body.submit_action, ModifiedBy: req.user },
                    { where : { UUID : req.body.UUID}
                })
                if(ItemCode){
                    await ItemCode.forEach(function(element,key){
                        if(ItemCode[key]!=''){

                            journalEntry.push({
                                ItemCode:ItemCode[key],
                                ReferenceID:UUID,
                                UOM:OrderUOM[key],
                                Qty:OrderQty[key],
                                SerialNo:SerialNo[key],
                                TransactBy:req.user,
                                TransactionType:"ASN",
                                ActionType:"Confirm",
                            })

                            if(ID)
                                ItemCodeArr.push({
                                    ID:ID[key],
                                    ItemCode:ItemCode[key],
                                    Batch:Batch[key],
                                    UUID,
                                    OrderUOM:OrderUOM[key],
                                    OrderQty:OrderQty[key],
                                    SerialNo:SerialNo[key]
                                })
                            else
                            ItemCodeArr.push({
                                ItemCode:ItemCode[key],
                                Batch:Batch[key],
                                UUID,
                                OrderUOM:OrderUOM[key],
                                OrderQty:OrderQty[key],
                                SerialNo:SerialNo[key]
                            })


                            
                        }

                    });

                    await ASN_detail.bulkCreate(ItemCodeArr, { updateOnDuplicate: true }).catch(error => {  console.error(error) });
                    await journal_entry.bulkCreate(journalEntry).catch(error => {  console.error(error) });
                }
                
                if(DeleteID){
                    await ASN_detail.destroy({  where:{ ID: { [Op.in]: DeleteID  }  } }).catch(error => {  console.error(error) });
                }
                await req.flash('success_msg','ASN Successfully Confirmed.');
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID);
            }else{
                req.flash('error_msg','ASN is not in Fresh Status.');  
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
            }
        }else if(req.body.submit_action == "Under Amendment" ){
            if(checkStatus.Status == 'Confirmed'){
                let checkIfExist = await GR_hdr.count({
                    where : {
                        UUID : req.body.UUID,
                        Status : {[Op.ne]: 'Cancelled'},               
                    },
                    attributes : ['UUID']
                })
                if(checkIfExist==0){
                    await ASN_hdr.update({ Status : req.body.submit_action, ModifiedBy: req.user },
                        { where : { UUID : req.body.UUID }
                    })
                    journalEntry=[];
                    const detail = await ASN_detail.findAll(
                        { where : 
                            { 
                                UUID : req.body.UUID 
                            },
                            raw:true
                    })
                    journalEntry= await detail.map(function(element,key){
                        element.ReferenceID=element.UUID
                        element.UOM = element.OrderUOM
                        element.Qty = element.OrderQty
                        element.TransactBy = req.user
                        element.TransactionType= "ASN"
                        element.ActionType= "Amend"
                        return element
                    });
                    console.log(journal_entry);
                        //await journal_entry.bulkCreate(journalEntry).catch(error => {  console.error(error) });
                    



                    await req.flash('success_msg','ASN Successfully Updated.');
                    res.redirect('/asn/asn_dtl?UUID='+req.body.UUID);
                }else{
                    req.flash('error_msg','Cannot amend. Active GR with ASN No.: '+ASNNo+' already exist.');  
                    res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
                }
            }else{
                req.flash('error_msg','ASN is not in Confirmed Status.');  
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
            }
        }else if(req.body.submit_action == "Cancelled" ){
            if(checkStatus.Status == 'Fresh'){
                await ASN_hdr.update({ Status : req.body.submit_action, ModifiedBy: req.user },
                    { where : { UUID : req.body.UUID }
                })
                await req.flash('success_msg','ASN Successfully Cancelled.');
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID);
            }else{
                req.flash('error_msg','ASN is not in Fresh Status.');  
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
            }
        }else { //else if confirm and create goods receipt
            if(checkStatus.Status == 'Fresh' || checkStatus.Status == 'Confirmed' || checkStatus.Status == 'Under Amendment'){//check if fresh or confirmed
                let checkIfExist = await GR_hdr.count({
                    where : {
                        UUID : req.body.UUID,
                        Status : {[Op.ne]: 'Cancelled'},               
                    },
                    attributes : ['UUID']
                })
                if(checkIfExist==0){
                    let ItemCodeArr = [];
                    await ASN_hdr.update({ TransactionType,ShipmentNo,CustomerCode,Status : 'Confirmed', ModifiedBy: req.user },
                        { where : { UUID : req.body.UUID }
                    })
                    await ItemCode.forEach(function(element,key){
                        if(ItemCode[key]!=''){
                            ItemCodeArr.push({ID:ID[key],ItemCode:ItemCode[key],Batch:Batch[key],UUID,OrderUOM:OrderUOM[key],OrderQty:OrderQty[key],SerialNo:SerialNo[key]})
                        }
                    });
                    await ASN_detail.bulkCreate(ItemCodeArr, { updateOnDuplicate: true }).catch(error => {  console.error(error) });
                    if(DeleteID){
                        await ASN_detail.destroy({  where:{ ID: { [Op.in]: DeleteID  }  } }).catch(error => {  console.error(error) });
                    }
                    let createGR = await GR_hdr.create({
                        UUID,
                        ASNNo,
                        ShipmentNo,
                        CreatedBy: req.user,
                        Status: 'Planned'
                    })
                    await req.flash('success_msg','GR Successfully Created.');
                    res.redirect('/gr/gr_dtl?GRNo='+createGR.GRNo);
                }else{
                    req.flash('error_msg','Active GR ASN No. '+ASNNo+' already exist.');  
                    res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
                }
                
            }else{
                req.flash('error_msg','ASN is not in Fresh Status.');  
                res.redirect('/asn/asn_dtl?UUID='+req.body.UUID); 
            }
        }

    } 
    process_asn();
}

exports.asn_status_count = function(req, res) {
	const pagename = "asn_count";
          ASN_hdr.findAll({
            group: ['Status'],
            attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
          }).then(function (asn) {
              res.send(asn);
          });
}