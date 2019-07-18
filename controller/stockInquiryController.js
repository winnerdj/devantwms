var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var inventory = require('../models/inventory.js');
var item = require('../models/item.js');
let modulename = "stockinquery";
const Sequelize = require("sequelize"); 
const Op = Sequelize.Op;
var path = require('path');
var multer = require('multer');
const XLSX = require('xlsx');
var ItemMaster = require('../models/item.js');
var fs = require('fs');
var mysqldump = require('mysqldump');
var Excel = require('exceljs');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + req.user + path.extname(file.originalname))
    }
  });

const upload = multer({
    storage: storage
}).single('upload_item');



//ui
exports.index = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {Location,Batch,Status,StockStatus,ItemCode,SerialNo,UID} = req.query;
    const Location_inp = Location;
    const Batch_inp = Batch;
    const Status_inp = Status;
    const StockStatus_inp = StockStatus;
    const ItemCode_inp = ItemCode;
    const SerialNo_inp = SerialNo;
    const UID_inp = UID;
    let whereStatement = {Status: {[Op.ne]: 'Loaded'}}
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
    if(UID!='')
    whereStatement.UID = UID;
    inventory.hasOne(item, {foreignKey: 'ItemCode', targetKey: 'ItemCode'});
    inventory.findAll({
        where: whereStatement,
        include: {model: item,
                    on: {
                        col2: db.where(db.col("tbl_item_master.ItemCode"), "=", db.col("tbl_inventory.ItemCode"))
                    },
                 }
    }).then(stockinquiry => {
        res.render('../views/stockinquiry',{stockinquiry,Location_inp,Batch_inp,UID_inp,Status_inp,StockStatus_inp,ItemCode_inp,SerialNo_inp,userpermissionmodule,modulename});
    });
};



exports.setinitialstock = function(req, res) {
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {Location,Batch,Status,StockStatus,ItemCode,SerialNo,UID} = req.query;
    const Location_inp = Location;
    const Batch_inp = Batch;
    const Status_inp = Status;
    const StockStatus_inp = StockStatus;
    const ItemCode_inp = ItemCode;
    const SerialNo_inp = SerialNo;
    const UID_inp = UID;
    let whereStatement = {Status: {[Op.ne]: 'Loaded'}}
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
    if(UID!='')
    whereStatement.UID = UID;
    inventory.hasOne(item, {foreignKey: 'ItemCode', targetKey: 'ItemCode'});
    inventory.findAll({
        where: whereStatement,
        include: {
                model: item,
                    on: {
                        col2: db.where(db.col("tbl_item_master.ItemCode"), "=", db.col("tbl_inventory.ItemCode"))
                    },
                 }
    }).then(stockinquiry => {
        res.render('../views/stockinquiry/setinitialstock',{stockinquiry,Location_inp,Batch_inp,UID_inp,Status_inp,StockStatus_inp,ItemCode_inp,SerialNo_inp,userpermissionmodule,modulename});
    });
};

exports.post_setinitialstock = function(req, res) {
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
            let err_array = [];
            function createJSONfromExcel(){
                for(rows = 0; rows < range.e.c; rows++) {
                    let rowAddress = XLSX.utils.encode_cell({c : 0, r : rows});
                    let workSheet = sheet[rowAddress];
                    if(workSheet) {
                        if(workSheet.v == "ID") {
                            sheet['!ref'] = rowAddress + ":" + column.replace('1', '') + range.e.r;
                        }
                    }
                };
                
            }
            function addColumn(jsonString){
                return jsonString;
            }
            function renameColumnJSON(jsonChange){
                jsonString = JSON.stringify(jsonChange);
                jsonString = jsonString.replace(/\"Item Code\":/g, "\"ItemCode\":");
                jsonString = jsonString.replace(/\"Stock Status\":/g, "\"StockStatus\":");
                jsonString = jsonString.replace(/\"Serial No\":/g, "\"SerialNo\":");
                jsonString = jsonString.replace(/\"Pallet ID\":/g, "\"UID\":");
                jsonString = jsonString.replace(/\"Batch\":/g, "\"Batch\":");
                return jsonString;
            }

            async function caseBarcode2ItemCode(jsonChange){
                jsonChange = JSON.parse(jsonChange);
                
              
                caseBarCodeArr =  jsonChange.map(Items => Items.ItemCode);
                getItemMaster = await ItemMaster.findAll({
                    attributes:['CaseBarcode','ItemCode'],
                    where:{
                        CaseBarcode:{[Op.in]: caseBarCodeArr},
                    }
                })
                

                if(req.body.fieldtype=="CaseBarcode"){
                 async function Convert(getItemMaster,jsonChange) {
                    parsedJON = JSON.parse(JSON.stringify(getItemMaster));
                    for (let row in jsonChange) {
                        if(parsedJON.some(item => parseInt(item['CaseBarcode']) === parseInt(jsonChange[row]['ItemCode']))){
                        let resultIndex = parsedJON.findIndex(function(item, i){ return parseInt(item['CaseBarcode']) === parseInt(jsonChange[row]['ItemCode']) })
                        jsonChange[row]['ItemCode']=parsedJON[resultIndex]["ItemCode"];
                        }
                    }
                    return await Promise.all(jsonChange);
                  }
                
                    result = await Convert(getItemMaster,jsonChange);
                    console.log("casebarcode ito");
                }else{
                    result = jsonChange;
                    console.log("itemcode ito");
                }
                
                return result;
            }

            function mapArray(addedColumnJSON){
                //ItemCodeArr = addedColumnJSON.map(Inventory => Inventory.ItemCode);
                //console.log(addedColumnJSON);
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
                let getItemCodeValid = await ItemMaster.findAll({
                    attributes:['ItemCode'],
                    where:{
                        ItemCode:{[Op.in]: ItemCodeArr},
                    }
                })
                let getItemCodeValiArr = await getItemCodeValid.map(getItemCodeValid => getItemCodeValid.ItemCode);
                let CompareDBExcelItemCode = await arr_diff(ItemCodeArr,getItemCodeValiArr);
                
                if(CompareDBExcelItemCode!=''){
                    err_array.push(ASNItemCodeErrList(CompareDBExcelItemCode));
                }
                

                if (err_array === undefined || err_array.length == 0) {
                    InsertASN(addedColumnJSON);
                    return req.flash('success_msg','Successfully Created Initial Stock');
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
            
            function InsertASN(addedColumnJSON){
                db.query("TRUNCATE TABLE tbl_inventory");
                inventory.bulkCreate(
                    addedColumnJSON
                ).catch(error => {  console.error(error) });
           }
           
            async function uploadInventoryItem(){
                await createJSONfromExcel()
                let jsonChange = await XLSX.utils.sheet_to_json(sheet);
                let renamedJson = await renameColumnJSON(jsonChange)
                renamedJson = await caseBarcode2ItemCode(renamedJson)
                addedColumnJSON = await addColumn(renamedJson)
                await mapArray(addedColumnJSON)
                await checkAndInsert() 
                await res.redirect('/stockinquiry/setinitialstock');
            }
            uploadInventoryItem();
        }
	})
}

exports.backup_db = function(req, res) {
    async function process_backup(){
        const result = await mysqldump({
            connection: {
                host: 'localhost',
                user: 'root',
                password: 'pr0j3ct0r',
                database: 'devantwms',
            },
            dumpToFile: './dump.sql',
        });
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition" : "attachment; filename=./dump.sql" });
        fs.createReadStream("./dump.sql").pipe(res);
    }
    process_backup();
}


exports.export_excel = function(req, res){
    async function displayReport(){
        let {Location,Batch,Status,StockStatus,ItemCode,SerialNo,UID} = req.query;
    let whereStatement = {Status: {[Op.ne]: 'Loaded'}}
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
    if(UID!='')
    whereStatement.UID = UID;
    inventory.hasOne(item, {foreignKey: 'ItemCode', targetKey: 'ItemCode'});
    const stockconvertion_details = await inventory.findAll({
        where: whereStatement,
        include: {model: item,
                    on: {
                        col2: db.where(db.col("tbl_item_master.ItemCode"), "=", db.col("tbl_inventory.ItemCode"))
                    },
                 },
        order: [['StockStatus','DESC'],['ItemCode','ASC'],['UID','ASC'],['Location','ASC']]
    })
  
  
  var obj = await JSON.parse(JSON.stringify(stockconvertion_details));

  
  var workbook = new Excel.Workbook();
  
  workbook.xlsx.readFile('./public/reports/stock_onhand_template.xlsx')
      .then(function() {
      
        async function editFile(){
          var worksheet = workbook.getWorksheet(1);
          var row = worksheet.getRow(5);
          let rowc = 3;
          function formatDate(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
          }
          
          var d = new Date();
          var e = formatDate(d);
          worksheet.getRow(1).getCell('A').value = "Stock on hand as of "+e;
          if(obj){
            await obj.forEach(function(element,key) {
                
                worksheet.getRow(rowc).getCell('A').value = element['ItemCode'];
                worksheet.getRow(rowc).getCell('B').value = element['tbl_item_master']['ItemDescription'];
                worksheet.getRow(rowc).getCell('C').value = element['SerialNo'];
                worksheet.getRow(rowc).getCell('D').value = element['UID'];
                worksheet.getRow(rowc).getCell('E').value = element['Batch'];
                worksheet.getRow(rowc).getCell('F').value = element['Location'];
                worksheet.getRow(rowc).getCell('G').value = element['StockStatus'];
                rowc++;
            });
          }
          
   
          row.commit();
          
          
          await  workbook.xlsx.writeFile('./public/reports/stockonhand.xlsx');
          await res.download('./public/reports/stockonhand.xlsx', 'stockonhand_'+Date.now()+".xlsx"); 
        }
        
        editFile();  
      })
    }
    displayReport();
  }

