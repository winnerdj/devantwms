const db = require('../models/db.js');
var item = require('../models/item.js');
let modulename = "item";
var path = require('path');
var multer = require('multer');
var fs = require('fs');
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


const Op = db.Op;
exports.itemlist = function(req, res) {
    item.findAll({
        where:
        {
            Status : 'Active'
        },
        raw: true,
    }).then(item => {
        res.send(item);
    });
};


exports.findByItemCode = function(req, res) {
    item.findAll({
        where:
        {
            ItemCode : req.params.ItemCode
        },
        raw: true,
    }).then(item => {
        res.send(item);
    });
};

exports.index = function(req, res) {
    const pagename = "item_index"
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {ItemCode,ItemDescription,ItemCategory,CaseBarcode,Length,Height,Width,Volume,Weight,WeightUOM,Status,WarehouseCode} = req.query
    let ItemCode_inp = ItemCode;
    let ItemDescription_inp = ItemDescription;
    let ItemCategory_inp = ItemCategory;
    let Status_inp = Status;
    let WarehouseCode_inp = WarehouseCode;
    let whereStatement = {}
    if(ItemCode!='' && ItemCode)
    whereStatement.ItemCode = ItemCode;
    if(ItemDescription!='' && ItemDescription)
    whereStatement.ItemDescription =    {[Op.like]: '%'+ItemDescription+'%'};
    if(ItemCategory!='' && ItemCategory)
    whereStatement.ItemCategory = ItemCategory;
    if(Status_inp!='' && Status_inp)
    whereStatement.Status_inp = Status_inp;
    if(Status!='' && Status)
    whereStatement.Status = Status;
    if(WarehouseCode!='' && WarehouseCode)
    whereStatement.WarehouseCode = WarehouseCode;
    item.findAll({ where: whereStatement })
          .then( items => 
          {
            //res.send({items});
            res.render('../views/items/index',{items,ItemCode_inp,ItemDescription_inp,ItemCategory_inp,Status_inp,Status_inp,WarehouseCode_inp,modulename,pagename,userpermissionmodule,username: req.session.username})
          });

};
exports.post_create = function(req, res) {
    let {ItemCode,ItemDescription,ItemCategory,CaseBarcode,Length,Height,Width,Volume,Weight,WeightUOM,Status,WarehouseCode} = req.body;

    item.create({
        ItemCode,ItemDescription,ItemCategory,CaseBarcode,Length,Height,Width,Volume,Weight,WeightUOM,Status,WarehouseCode
    })
    req.flash('success_msg','Item Successfully Added');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}


exports.post_update = function(req, res) {
    let {ItemCode,ItemDescription,ItemCategory,CaseBarcode,Length,Height,Width,Volume,Weight,WeightUOM,Status,WarehouseCode} = req.body;

    item.update({
        ItemDescription,ItemCategory,CaseBarcode,Length,Height,Width,Volume,Weight,WeightUOM,Status,WarehouseCode
    },
        {where: {ItemCode}}
    )
    req.flash('success_msg','Item Successfully Updated');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}

exports.post_bulk_upload_item = function(req, res) {
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
                        if(workSheet.v == "Item Code") {
                            sheet['!ref'] = rowAddress + ":" + column.replace('1', '') + range.e.r;
                        }
                    }
                };
            }
            function renameColumnJSON(jsonChange){
                jsonString = JSON.stringify(jsonChange);
                jsonString = jsonString.replace(/\"Item Code\":/g, "\"ItemCode\":");
                jsonString = jsonString.replace(/\"Delivery Order No\":/g, "\"ItemDescription\":");
                jsonString = jsonString.replace(/\"Item Category\":/g, "\"ItemCategory\":");
                jsonString = jsonString.replace(/\"Customer Item Code\":/g, "\"CustomerItemCode\":");
                jsonString = jsonString.replace(/\"Case Barcode\":/g, "\"CaseBarcode\":");
                jsonString = jsonString.replace(/\"Length\":/g, "\"Length\":");
                jsonString = jsonString.replace(/\"Height\":/g, "\"Height\":");
                jsonString = jsonString.replace(/\"Width\":/g, "\"Width\":");
                jsonString = jsonString.replace(/\"Volume\":/g, "\"Volume\":");
                jsonString = jsonString.replace(/\"Weight\":/g, "\"Weight\":");
                jsonString = jsonString.replace(/\"Weight UOM\":/g, "\"WeightUOM\":");
                jsonString = jsonString.replace(/\"Status\":/g, "\"Status\":");
                
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
                await mapCustomerItemPRD(addedColumnJSON)
                await checkAndInsert() 
                await res.redirect('/asn');
            }
            uploadASN();
        }
	})
}