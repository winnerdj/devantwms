var express = require('express');
const db = require('../models/db.js');
var router = express.Router();
var stock_accuracy_hdr = require('../models/stock_accuracy_hdr.js');
var stock_accuracy_detail = require('../models/stock_accuracy_detail.js');
var asn_hdr = require('../models/asn_hdr.js');
var asn_detail = require('../models/asn_detail.js');
const GR_hdr = require('../models/gr_hdr.js');
const putaway_hdr = require('../models/putaway_hdr.js');
const outbound_hdr = require('../models/outbound_hdr.js');
const pickplan_hdr = require('../models/pickplan_hdr.js');
const dispatch_hdr = require('../models/dispatch_hdr.js');
const loading_hdr = require('../models/loading_hdr.js');
const bintobin_hdr = require('../models/bintobin_hdr.js');
const stock_conversion_hdr = require('../models/stock_conversion_hdr.js');
var associations = require('../models/associations.js');
var item = require('../models/item.js');
var user = require('../models/user.js');
var inventory = require('../models/inventory.js');
var Sequelize = require("sequelize");
const uuidv4 = require('uuidv4');
const Op = Sequelize.Op;
var path = require('path');
var multer = require('multer');
const XLSX = require('xlsx');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, 'stockAccuracyTempFile' + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage
}).single('upload_stockaccuracy');	

const modulename = "stockAccuracy";

exports.uploadstockaccuracy = function(req, res) {
    upload(req, res, (err) =>{
        if(err){
           console.log(err);
        }else{
            let workbook = XLSX.readFile(req.file.path);
           
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let range = XLSX.utils.decode_range(sheet['!ref']);
            let column = XLSX.utils.encode_cell({c : range.e.c - range.s.c, r : 0});
            let ItemCodeArr={};
            let err_array = [];
            let getItemsDescription = [];
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
        function addColumn(jsonString){
                let newJson2 = JSON.parse(jsonString).map((element => {
                    return element;
                }));
                return newJson2;
            }
            function renameColumnJSON(jsonChange){	
                jsonString = JSON.stringify(jsonChange);
                jsonString = jsonString.replace(/\"Item Code\":/g, "\"ItemCode\":");
                jsonString = jsonString.replace(/\"Pallet ID\":/g, "\"UID\":");
                jsonString = jsonString.replace(/\"Stock Status\":/g, "\"StockStatus\":");
                jsonString = jsonString.replace(/\"Batch\":/g, "\"Batch\":");
                jsonString = jsonString.replace(/\"Serial No\":/g, "\"SerialNo\":");
                return jsonString;
            }

            function mapCustomerItemPRD(addedColumnJSON){
                ItemCodeArr = addedColumnJSON.map(element => element.ItemCode);
                SerialNoArr = addedColumnJSON.map(element => element.SerialNo);
                BatchArr = addedColumnJSON.map(element => element.Batch);
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
                let getItemCodeValid = await item.findAll({
                    attributes:['ItemCode'],
                    where:{
                        Itemcode:{[Op.in]: ItemCodeArr},
                    }
                })
                let getItemCodeValiArr = await getItemCodeValid.map(getItemCodeValid => getItemCodeValid.ItemCode);
                let CompareDBExcelItemCode = await arr_diff(ItemCodeArr,getItemCodeValiArr);
                
                let getSerialnotInSystem = await inventory.findAll({
                    attributes:['ItemCode'],
                    where:{
                        ItemCode: {
                            [Op.in]: ItemCodeArr
                        }
                    },
                    group: 'ItemCode',
                    raw:true
                })
                let getSerialnotInSystemMap = await getSerialnotInSystem.map(getItemCodeValid => getItemCodeValid.ItemCode);
                let CompareDBExcelSerialNo = await arr_diff(ItemCodeArr,getSerialnotInSystemMap);
                if(CompareDBExcelSerialNo.length>0){
                    getItemsDescription = await item.findAll({
                        where:{
                            ItemCode: {
                                [Op.in]: CompareDBExcelSerialNo
                            }
                        },
                        group: 'ItemCode',
                        raw:true
                    })
                }
                
                if (err_array === undefined || err_array.length == 0) {
                    return(addedColumnJSON)
                }else{                 
                    let temp = await JSON.stringify(err_array).replace(/[\[\]\"]/g, '').split(',');
                    result1 = await resowlt(temp);
                    return result1;
                }
            }
            
           
            async function uploadSA(){
                await createJSONfromExcel()
                let jsonChange = await XLSX.utils.sheet_to_json(sheet);
                renamedJson = await renameColumnJSON(jsonChange)
                addedColumnJSON = await addColumn(renamedJson) 
                await mapCustomerItemPRD(addedColumnJSON)
                let thisresult = await checkAndInsert(); 
                console.log(thisresult);
                console.log(getItemsDescription);
                await res.send({thisresult,getItemsDescription});
            }
            uploadSA();
        }
	})
}

//display accuracy header
exports.index = function(req, res) {
    const pagename = "stock_accuracy_index";
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
    let StockAccuracyNo_inp = req.query.StockAccuracyNo;
    let Status_inp = req.query.Status;
    let {StockAccuracyNo,Status} = req.query;
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
    if(StockAccuracyNo!='' && StockAccuracyNo)
    whereStatement.StockAccuracyNo = StockAccuracyNo;
    
    if(Status!='' && Status)
    whereStatement.Status = Status;

    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    stock_accuracy_hdr.findAll({
        where: whereStatement,
        order: [['StockAccuracyNo', 'ASC']]
    }).then(stock_accuracy_hdr => {
        res.render('../views/stockaccuracy/index',{
            stock_accuracy_hdr,
            StockAccuracyNo_inp,
            paramdate1_inp,
            paramDate2_inp,
            modulename,
            Status_inp,
            userpermissionmodule,
            username: req.session.username,
            pagename
            
        });
    });
};


exports.create_stockaccuracy = function(req, res) {
    const  createStockaccuracy = async () => {
        const openASN = await asn_hdr.count(
        {
            where:{
                Status : {
                    [Op.or]:
                    [
                            'Fresh', 
                            'Under Amendment'
                    ]    
                }
            }
        })
        
        const openGR = await GR_hdr.count({
            where:{
                Status : 'Planned'
            }
        })
        const openPutaway = await putaway_hdr.count({
            where:{
                Status : 'Planned'
            }
        })

        const openOutbound = await outbound_hdr.count({
            where:{
                Status : {
                    [Op.or]:
                    [
                        'Fresh', 
                        'Under Amendment'
                    ]    
                }
            }
        })

        const openPickplan = await pickplan_hdr.count({
            where:{
                Status : 'Planned'
            }
        })

        const openDispatch = await dispatch_hdr.count({
            where:{
                Status : 'Planned'
            }
        })

        const openLoading = await loading_hdr.count({
            where:{
                Status : 'Planned'
            }
        })

        const openStockAccuracy = await stock_accuracy_hdr.count({
            where:{
                Status : 'Planned'
            }
        })


        const openB2B = await bintobin_hdr.count({
            where:{
                Status : 'Planned'
            }
        })
        const openStockConversion = await stock_conversion_hdr.count({
            where:{
                Status : 'Proposed'
            }
        })

        const ItemsWithTransaction = await inventory.count({
            where:{
                
                Status: {
                    [Op.notIn]:['ATP','Unservisable']
                }
                
            }
        })
        if( openASN>0 || openGR>0 || openPutaway>0 || openOutbound>0 || openPickplan>0 || openDispatch>0 || openLoading>0 || openStockAccuracy>0 || openB2B>0 || openStockConversion>0 || ItemsWithTransaction>0){
            req.flash('error_msg','Cannot create stock accuracy. ');
            await res.redirect('/stock_accuracy/');
        }else if(req.body.action!="create stock accuracy plAn"){
            await res.redirect('/stock_accuracy/');
        }else{
            const created_stock_accuracy = await stock_accuracy_hdr.create(
                {
                    CreatedBy:req.user,
                    Status:'Planned',
                }
            );
            const getInventory = await inventory.findAll(
                {
                    where:{
                        Status: {
                            [Op.ne]: 'Loaded'
                        }
                    },
                    raw: true
            });
            const updatedInventoryArray = await getInventory.map((element)=>{
                element.StockAccuracyNo = created_stock_accuracy.StockAccuracyNo
                element.Qty = 1
                element.Variance = 0
                delete element.ID
                return element
            });
            
            await stock_accuracy_detail.bulkCreate(updatedInventoryArray);
            await res.redirect('/stock_accuracy/stock_accuracy_dtl/'+created_stock_accuracy.StockAccuracyNo);
        }
        
    }
    createStockaccuracy();   
}




exports.stock_accuracy_details = function(req, res) {
    const pagename = "stock_accuracy_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    
    
        const displayStockAccuracyDetail = async ()=>{
            const stock_accuracy_details = await stock_accuracy_hdr.findAll({
                where:{
                    StockAccuracyNo : req.params.StockAccuracyNo
                },
                include: [{
                     model: stock_accuracy_detail,
                     include: [{model: item,
                        on: {
                            col1: db.where(db.col("tbl_stock_accuracy_details.ItemCode"), "=", db.col("tbl_stock_accuracy_details->tbl_item_master.ItemCode"))
                            }
                        }]
                    },
                ],
            }).catch(error => {  
                console.error(error) 
            });
            //const SAdetail = await stock_accuracy_detail.findAll({ StockAccuracyNo : req.params.StockAccuracyNo });
            await res.render('../views/stockaccuracy/stock_accuracy_dtl',
                {
                    stock_accuracy_details,
                    pagename,
                    userpermissionmodule,
                    username: req.session.username,
                    modulename
                }
            )
        }
        displayStockAccuracyDetail();
}

exports.post_stock_accuracy_details = function(req, res) {
    let {StockAccuracyNo,submit_action,Location,ActualLocation,Qty,ActualQty,Variance,SerialNo,ItemCode,ID}=req.body;
    let inputs = req.body;
    let SerialNo_inp = req.body.SerialNo;
    let inputArr = [];
    let ItemNotInSystem = [];
    let UUID = uuidv4()
    backURL=req.header('Referer') || '/';
    const updateStockAccuracy = async ()=>{
        if(submit_action=="Approved"){
            stock_accuracy_hdr.update(
                {Status:submit_action,
                ModifiedBy: req.user,},
                {
                    where:
                    {
                        StockAccuracyNo
                    }
            })
            await ID.forEach(function(element,key){
                inputArr.push({
                    ID:ID[key],
                    StockAccuracyNo:StockAccuracyNo,
                    ItemCode:ItemCode[key],
                    SerialNo:SerialNo[key],
                    Location:Location[key],
                    Qty:Qty[key],
                    ActualLocation:ActualLocation[key],
                    ActualQty:ActualQty[key],
                    Variance:Variance[key],
                });
                if(Qty[key]<ActualQty[key]){
                    ItemNotInSystem.push({
                        UUID,
                        ItemCode: ItemCode[key],
                        SerialNo: SerialNo[key],
                        OrderQty:ActualQty[key],
                        OrderUOM:'PCS',
                    })
                }
            });
            await stock_accuracy_detail.bulkCreate(
                inputArr, 
                { updateOnDuplicate: true }
            )
            .catch(error => {  
                console.error(error) 
            });
            
            await asn_hdr.create(
                {
                    UUID,
                    ShipmentNo: "W2W-"+StockAccuracyNo,
                    TransactionType: "W2W",
                    CustomerCode: "FWH09DAV",
                    CreatedBy: req.user,
                    Status: "Fresh"
                } 
            )
            .catch(error => {  
                console.error(error) 
            });
            await asn_detail.bulkCreate(ItemNotInSystem)
            .catch(error => {  
                console.error(error) 
            });
            res.redirect(backURL);
            console.log('update');
        }else if(submit_action=="Cancelled"){
            stock_accuracy_hdr.update(
            {
                Status:submit_action,
                ModifiedBy: req.user
            },{
                where:
                {
                    StockAccuracyNo
                }
            })
            res.redirect(backURL);
        }else{
            res.redirect(backURL);
        }
    }
    updateStockAccuracy();
}

