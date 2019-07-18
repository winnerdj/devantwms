var express = require('express');
const db = require('../models/db.js');
var putaway_hdr = require('../models/putaway_hdr.js');
var putaway_detail = require('../models/putaway_detail.js');
var Sequelize = require("sequelize");
var batch = require('../models/batch.js');
var inventory = require('../models/inventory');
var item = require('../models/item');
const GR_hdr = require('../models/gr_hdr.js');
const gr_detail = require('../models/gr_detail.js');
const user = require('../models/user.js');
const modulename = 'putaway';
const Op = Sequelize.Op;
var path = require('path');
var multer = require('multer');
const XLSX = require('xlsx');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, 'putawayTempFile' + path.extname(file.originalname))
    }
  });

const upload = multer({
    storage: storage
}).single('upload_putaway');	

exports.uploadputaway = function(req, res) {
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
                jsonString = jsonString.replace(/\"Serial Number\":/g, "\"SerialNo\":");
                return jsonString;
            }

            function mapCustomerItemPRD(addedColumnJSON){
                ItemCodeArr = addedColumnJSON.map(ASNno => ASNno.ItemCode);
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
                



                let getBatchValid = await batch.findAll({
                    attributes:['Batch'],
                    where:{
                        Batch:{[Op.in]: BatchArr},
                    }
                })
                let getBatchValidArr = await getBatchValid.map(getBatchValid => getBatchValid.Batch);
                let CompareDBExcelBatch = await arr_diff(BatchArr,getBatchValidArr);
                if(CompareDBExcelItemCode!=''){
                    err_array.push(ASNItemCodeErrList(CompareDBExcelItemCode));
                }
                

                if(CompareDBExcelBatch!=''){
                    err_array.push(BatchErrList(CompareDBExcelBatch));
                    
                }
                

                

                if (err_array === undefined || err_array.length == 0) {
                    return(addedColumnJSON)
                }else{                 
                    let temp = await JSON.stringify(err_array).replace(/[\[\]\"]/g, '').split(',');
                    result1 = await resowlt(temp);
                    return result1;
                }
            }
            
           
            async function uploadGR(){
                await createJSONfromExcel()
                let jsonChange = await XLSX.utils.sheet_to_json(sheet);
                renamedJson = await renameColumnJSON(jsonChange)
                addedColumnJSON = await addColumn(renamedJson) 
                await mapCustomerItemPRD(addedColumnJSON)
                let thisresult = await checkAndInsert(); 
                console.log(thisresult);
                await res.send(thisresult);
            }
            uploadGR();
        }
	})
}


//display gr header
exports.index = function(req, res) {
  const pagename="putaway_index"
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
  
  let ASNNo_inp = req.query.ASNNo;
  let ShipmentNo_inp = req.query.ShipmentNo;
  let paramdate1_inp = today;
  let paramDate2_inp = today;
  let {ShipmentNo,ASNNo,Status} = req.query;
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
    
  whereStatement.CreatedDateTime = { 
      [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']
    };
  putaway_hdr.hasOne(user, { foreignKey: 'ID', sourceKey: 'CreatedBy'});
  putaway_hdr.findAll({
      where: whereStatement,
      include: {
        model: user,
        on: {
            col1: db.where(db.col("tbl_putaway_hdr.CreatedBy"), "=", db.col("tbl_user.ID"))
        }
      } 
    }).then(
      
      putaway_hdr => {
        //res.send(putaway_hdr);
        res.render('../views/putaway/index',{
          putaway_hdr,
          ASNNo_inp,
          ShipmentNo_inp,
          paramdate1_inp,
          paramDate2_inp,
          modulename,
          Status,
          pagename,
          userpermissionmodule,
          username: req.session.username
        })
      }
      
    

    );
};

//display putaway header and detail
exports.putaway_details = function(req, res) {
    putaway_hdr.hasMany(putaway_detail, {foreignKey: 'PACode'});
    putaway_detail.belongsTo(putaway_hdr, {foreignKey: 'PACode'});
    putaway_detail.hasMany(gr_detail, {foreignKey: 'ASNNo'});
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    const pagename="putaway_dtl";
    putaway_hdr.findAll({
        where:
            {
                PACode : req.query.PACode
            },
        include: [{
            model: putaway_detail,
            
            include:[{
                model: gr_detail,
                on: {
                    col1: db.where(db.col("tbl_putaway_details.GRNo"), "=", db.col("tbl_putaway_details->tbl_gr_details.GRNo")),
                    col2: db.where(db.col("tbl_putaway_details.ItemCode"), "=", db.col("tbl_putaway_details->tbl_gr_details.ItemCode")),
                    col3: db.where(db.col("tbl_putaway_details.UID"), "=", db.col("tbl_putaway_details->tbl_gr_details.UID"))
                }
            }],
        }],
    }).then(putaway_hdr => {
        res.render('../views/putaway/putaway_dtl',{
            putaway_hdr,
            modulename,
            pagename,
            userpermissionmodule,
            username: req.session.username
        });
    });
};


exports.post_putaway_details = function(req, res) {
    let {ID,UID,LocationCode,AssignEmployee,ItemCode,Batch,GRNo,ASNNo} = req.body;
    putaway_hdr.findOne({
        where : {
            PACode : req.body.PACode
        },
        attributes : ['PACode','Status']
    }).then(function(putaway_hdr){
        if(req.body.submit_action !== "Putaway" ){
            if(putaway_hdr.Status == 'Planned'){
                putaway_hdr.update({
                    Status : req.body.submit_action,
                    ModifiedBy: req.user
                },
                { where : {
                    PACode : req.body.PACode
                }}).then(()=>{
                    req.flash('success_msg','Putaway Successfully '+req.body.submit_action+'.');
                    res.redirect('/putaway/putaway_dtl?PACode='+req.body.PACode);
                })
            }else{
                req.flash('error_msg','Putaway is not in Planned Status.');  
                res.redirect('/putaway/putaway_dtl?PACode='+req.body.PACode); 
            }
        }else{
            if(putaway_hdr.Status == 'Planned' || putaway_hdr.Status == 'Short Closed'){
                putaway_hdr.update({
                    Status : 'Putaway',
                    AssignEmployee,
                    ModifiedBy: req.user
                },
                { where : {
                    PACode : req.body.PACode
                }}).then(()=>{
                    async function execute_putaway(){
                        PutawayDetailArr = [];
                        let inventorylist = await inventory.findAll({
                            where:
                                { 
                                  UID: {  [Op.in]: UID  }  
                                },
                        })
                        let inventorylistString =  await JSON.stringify(inventorylist);
                        let UpdatedInventoryList = JSON.parse(inventorylistString).map((element => {
                            if(element.StockStatus=='Damaged') {
                                element.Status = 'Unservisable';
                            }else if(element.StockStatus=='Aging'){
                                element.Status = 'Unservisable';
                            }else if(element.StockStatus=='Defective'){
                                element.Status = 'Unservisable';
                            }
                            else{
                                element.Status = 'ATP';
                            }
                            return element;
                        }));
                        await ID.forEach(function(element,key) {
                            PutawayDetailArr.push({
                                ID : ID[key],
                                LocationCode : LocationCode[key],
                                ItemCode: ItemCode[key],
                                Batch: Batch[key],
                                ASNNo: ASNNo[key],
                                GRNo: GRNo[key],
                                UID:UID[key],
                                PACode: req.body.PACode
                            })
                            UpdatedInventoryList = UpdatedInventoryList.map((element => {
                                if(element.UID==UID[key]) {
                                    element.Location = LocationCode[key];
                                }
                                return element;
                            }));
                        })
                        
                        
                        await inventory.bulkCreate(UpdatedInventoryList, {updateOnDuplicate: true}).catch(error => {  console.error(error) });
                        await putaway_detail.bulkCreate(PutawayDetailArr, {updateOnDuplicate: true}).catch(error => {  console.error(error) });
                        await req.flash('success_msg','Putaway Successfully Executed.');
                        res.redirect('/putaway/putaway_dtl?PACode='+req.body.PACode);

                    }
                    execute_putaway();
                    
                })
            }else{
                req.flash('error_msg','Putaway is not in Planned Status.');  
                res.redirect('/putaway/putaway_dtl?PACode='+req.body.PACode); 
            }
        }
    });
 };

exports.create_putaway = function(req, res) {
    const pagename = "create_putaway"
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
    
    let ASNNo_inp = req.query.ASNNo;
    let ShipmentNo_inp = req.query.PrimaryRefDocNo;
    let paramdate1_inp = today;
    let paramDate2_inp = today;
    let {ShipmentNo,ASNNo,Status_inp} = req.query;
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

    let whereStatement = {ASNNo: {[Op.notIn]: [db.literal("select ASNNo from tbl_putaway_hdr WHERE Status!='Cancelled'")]}}
    if(ShipmentNo!='' && ShipmentNo)
    whereStatement.ShipmentNo = ShipmentNo;
    if(ASNNo!='' && ASNNo)
    whereStatement.ASNNo = ASNNo;
    whereStatement.CreatedDateTime = { 
        [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']
    };
    
    whereStatement.Status = 'Goods Receipt';
    GR_hdr.findAll({ 
        where: whereStatement,
    })
        .then(GR_hdr => res.render('../views/putaway/create',{
              GR_hdr,
              ASNNo_inp,
              ShipmentNo_inp,
              paramdate1_inp,
              paramDate2_inp,
              Status_inp,
              modulename,
              pagename,
              userpermissionmodule,
              username: req.session.username
        })
    );

};

exports.putaway_status_count = function(req, res) {
    putaway_hdr.findAll({
        group: ['Status'],
        attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
    }).then(function (putaway) {
        res.send(putaway);
    });
}