const express = require('express');
const db = require('../models/db.js');
const ASN_hdr = require('../models/asn_hdr.js');
const ASN_detail = require('../models/asn_detail.js');
const GR_hdr = require('../models/gr_hdr.js');
const GR_detail = require('../models/gr_detail.js');
const putaway_hdr = require('../models/putaway_hdr.js');
const putaway_detail = require('../models/putaway_detail.js');
const item = require('../models/item.js');
var batch = require('../models/batch.js');
const inventory = require('../models/inventory.js');
const Sequelize = require("sequelize");
const modulename = "gr";
const Op = Sequelize.Op;
var path = require('path');
var multer = require('multer');
const XLSX = require('xlsx');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, 'GRTempFile' + path.extname(file.originalname))
    }
  });

const upload = multer({
    storage: storage
}).single('upload_GR');	


exports.uploadgr = function(req, res) {
    console.log(req.body);
    console.log('test');
    upload(req, res, (err) =>{
        console.log(req.file);
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
                    //element.Status = "Fresh";
                    //element.CreatedBy = req.user;
                    //element.TransactionType = req.body.TransactionType;
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
                ASN_detail.belongsTo(ASN_hdr, {foreignKey: 'UUID'});


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
                    //InsertASN(addedColumnJSON);
                    //return req.flash('success_msg','Successfully added ASN');
                    return(addedColumnJSON)
                }else{
                    //const Json2csvParser = require('json2csv').Parser                    
                    let temp = await JSON.stringify(err_array).replace(/[\[\]\"]/g, '').split(',');
                    result1 = await resowlt(temp);
                    //let json2csvParser = await new Json2csvParser();
                    //let csv = await json2csvParser.parse(result1);
                    //let path='./public/errors/ASNFileUploadErrors.csv'; 
                    //fs.writeFile(path, csv, function(err,data) {
                    //    if (err) {throw err;}
                    //}); 
                    return result1;
                }
            }
            
            function InsertASN(addedColumnJSON){
             /*   ASN_hdr.bulkCreate(
                   removeDuplicated(addedColumnJSON)
               ).catch(error => {  console.error(error) });
                ASN_detail.bulkCreate(
                   addedColumnJSON
               ).catch(error => {  console.error(error) });*/
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






exports.index = function(req, res) {
    const pagename = "gr_index"
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

    let whereStatement = {}
    if(ShipmentNo!='' && ShipmentNo)
    whereStatement.ShipmentNo = ShipmentNo;
    if(ASNNo!='' && ASNNo)
    whereStatement.ASNNo = ASNNo;
    whereStatement.CreatedDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};
    if(Status_inp!='' && Status_inp)
    whereStatement.Status = Status_inp;
    GR_hdr.findAll({ where: whereStatement })
          .then(GR_hdr => res.render('../views/gr/index',{GR_hdr,ASNNo_inp,ShipmentNo_inp,paramdate1_inp,paramDate2_inp,Status_inp,modulename,pagename,userpermissionmodule,username: req.session.username}));
    req.query.paramDate2 = '';
    req.query.paramDate1 = '';
    req.query.ASNNo = '';
};

//display gr header and detail
exports.gr_details = function(req, res) {
    var pagename = "gr_dtl";
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    GR_hdr.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
    ASN_hdr.hasOne(GR_hdr, {foreignKey: 'UUID'});
    
    ASN_hdr.hasMany(ASN_detail, {foreignKey: 'UUID'});
    ASN_detail.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
    ASN_detail.hasOne(item, {foreignKey: 'ItemCode', sourceKey: 'ItemCode' });
    //item.belongsTo(ASN_detail, {foreignKey: 'ItemCode', sourceKey: 'ItemCode' });
    GR_hdr.hasMany(GR_detail, {foreignKey: 'GRNo'});
    GR_detail.belongsTo(GR_hdr, {foreignKey: 'GRNo'});
    
    const displayGRDetails = async () => {
        const countGR = await GR_detail.findAndCountAll({ where: { GRNo : req.query.GRNo } })
        if(countGR.count>0){
            const GRdetail = await GR_hdr.findAll({
                where: { GRNo : req.query.GRNo },
                include: [{  model: GR_detail }],
            })
            await res.render('../views/gr/gr_dtl',{GR_hdr:GRdetail,pagename,userpermissionmodule,username: req.session.username,modulename})
            //res.send({GR_hdr,pagename})
        }else{
            const GRDetail = await GR_hdr.findAll({
                where: { GRNo : req.query.GRNo },
                include: [{
                    model: ASN_hdr,
                    //include: [{  model: ASN_detail,attributes: ["ID","UUID","ItemCode","OrderUOM","OrderQty","SerialNo","Batch",[db.fn('COUNT', db.col('OrderQty')), "itemCount"]] }]
                    include: [{  model: 
                                    ASN_detail,attributes: ["ID","UUID","ItemCode","OrderUOM","OrderQty","SerialNo","Batch"],
                                    include : [{ model: item,
                                        on: {
                                            col1: db.where(db.col("tbl_asn_hdr->tbl_asn_details.ItemCode"), "=", db.col("tbl_asn_hdr->tbl_asn_details->tbl_item_master.ItemCode"))
                                          }
                                    }]
                             }]
                }],
            //group : 'tbl_asn_hdr->tbl_asn_details.ItemCode'
            order: [[ASN_hdr, ASN_detail , 'ItemCode', 'asc']]
            }).catch(function (err) {
                console.log(err);
            });
            let GR_hdr1 =  await JSON.stringify(GRDetail);  
            var Obj =  await JSON.parse(GR_hdr1);
            
            const Batchlist = await batch.findAll({ }).catch(function (err) {
                console.log(err);
            });
            await res.render('../views/gr/gr_dtl',{GR_hdr:Obj,Batchlist,pagename,userpermissionmodule,username: req.session.username,modulename})
            //res.json({GR_hdr1,pagename,userpermissionmodule})
        }
    };
    displayGRDetails();
};
exports.check_gr_dtl_count = function(req, res) {
    GR_hdr.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
    ASN_hdr.hasOne(GR_hdr, {foreignKey: 'UUID'});
    
    ASN_hdr.hasMany(ASN_detail, {foreignKey: 'UUID'});
    ASN_detail.belongsTo(ASN_hdr, {foreignKey: 'UUID'});
    GR_hdr.hasMany(GR_detail, {foreignKey: 'GRNo'});
    GR_detail.belongsTo(GR_hdr, {foreignKey: 'GRNo'});
  
    GR_detail
    .findAndCountAll({ where: { GRNo : req.query.GRNo } })
    .then(result => {
        if(result.count>0){
  
        }else{
            db.query("SELECT count(OrderQty) as 'ItemCount',ItemCode FROM `tbl_gr_hdr` LEFT JOIN tbl_asn_detail ON tbl_asn_detail.UUID=tbl_gr_hdr.UUID WHERE GRNo= ? GROUP BY ItemCode ", { replacements: [req.query.GRNo], type: db.QueryTypes.SELECT})
            .then(result => {
                res.send(result);
            })  
        }
    });
};


exports.create_gr = function(req, res) {
    pagename="create_gr";
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

    ASN_hdr.hasOne(GR_hdr, {foreignKey: 'UUID'});
    GR_hdr.belongsTo(GR_hdr, {foreignKey: 'UUID'});
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
    let whereStatement = {UUID: {[Op.notIn]: [db.literal("select UUID from tbl_gr_hdr WHERE Status!='Cancelled'")]}}
    if(ShipmentNo!='' && ShipmentNo)
    whereStatement.ShipmentNo = ShipmentNo;
    if(ASNNo!='' && ASNNo)
    whereStatement.ASNNo = ASNNo;
    whereStatement.ASNDateTime = { [Op.between] : [req.query.paramDate1 + ' 00:00:01', req.query.paramDate2 + ' 23:59:59']};    
    whereStatement.Status = 'Confirmed';
    
    ASN_hdr.findAll({
        where: whereStatement,    
    }).then(ASN_hdr => {
        res.render('../views/gr/create',{ASN_hdr,ASNNo_inp,ShipmentNo_inp,paramdate1_inp,paramDate2_inp,modulename,Status_inp,pagename,userpermissionmodule,username: req.session.username});
        //res.send(ASN_hdr);
    })
    .catch(function (err) {
        console.log(err);
      });

 };


exports.post_create_gr = function(req, res) {
    async function process_create_gr(){
        let UUID = req.body.UUID
        let getASNInfo = await ASN_hdr.findOne({
            where: { UUID,Status: 'Confirmed' }    
        }).catch(function (err) {
            console.log(err);
        });
        if(getASNInfo){
            let GRCount= await GR_hdr.findAndCountAll({
                where: { UUID: UUID,
                        Status: {
                            [Op.ne]: 'Cancelled'
                        }
                }    
            }).catch(function (err) {
                console.log(err);
            });
            if(GRCount.count==0){
                let createGR = await GR_hdr.create({
                    UUID:getASNInfo.UUID,
                    ASNNo:getASNInfo.ASNNo,
                    ShipmentNo:getASNInfo.ShipmentNo,
                    CreatedBy: req.user,
                    Status: 'Planned'
                })
                await req.flash('success_msg','GR Successfully Created');
                 res.redirect('/gr/gr_dtl?GRNo='+createGR.GRNo);
                
            }else{
                await req.flash('error_msg','GR already exist.');
                await res.redirect('/gr/create');
            }
            
        }else{
            await req.flash('error_msg','ASN is not yet Confirmed or does not exist.');
            await res.redirect('/gr/create');
        }
        
    }
    process_create_gr();
};

exports.post_gr_details = function(req, res) {
    let {GRNo,ASNNo,ShipmentNo,ItemCode,SerialNo,UID,ItemCode_pa,UID_pa,Batch_pa,Batch,StockStatus,UUID,AssignEmployee} = req.body;
    let PA_items =  [];
    let Gr_items =  [];
    GR_hdr.findOne({
         where : {
             GRNo : GRNo
         },
         attributes : ['GRNo','Status']
     }).then(function(GR_hdr){
         if(req.body.submit_action == "Cancelled" ){
             if(GR_hdr.Status == 'Planned'){
                 GR_hdr.update({
                     Status : req.body.submit_action,
                     AssignEmployee,
                     ModifiedBy: req.user
                 },
                 { where : {
                    GRNo : GRNo
                 }}).then(()=>{
                     req.flash('success_msg','GR Successfully '+req.body.submit_action+'.');
                     res.redirect('/gr/gr_dtl?GRNo='+req.body.GRNo);
                 })
             }else{
                 req.flash('error_msg','GR is not in Planned Status.');  
                 res.redirect('/gr/gr_dtl?GRNo='+req.body.GRNo); 
             }
         }else if(req.body.submit_action == "Goods Receipt" || req.body.submit_action == "Short Closed") {
             if(GR_hdr.Status == 'Planned' || GR_hdr.Status == 'Short Closed'){
                 GR_hdr.update({
                     Status : req.body.submit_action,
                     AssignEmployee,
                     ModifiedBy: req.user
                 },
                 { where : {
                    GRNo : GRNo
                 }}).then(()=>{
                     GR_detail
                     .findAndCountAll({
                         where: {
                             GRNo : GRNo
                         }
                     })
                     .then(result => {
                         console.log(result.count);
                         if(result.count>0){
                         }else{
                            /*ItemCode_pa.forEach(function(element,key) {
                                PA_items.push({PACode:result.PACode,
                                               ASNNo:ASNNo,
                                               ItemCode: ItemCode_pa[key],
                                               UID : UID_pa[key],
                                               Batch: Batch_pa[key],
                                               GRNo: GRNo})
                            });*/
                            ItemCode.forEach(function(element,key) {
                                Gr_items.push({
                                     ASNNo,
                                     UUID,
                                     ShipmentNo,
                                     ItemCode : ItemCode[key],
                                     UID : UID[key],
                                     SerialNo: SerialNo[key],
                                     Qty: 1,
                                     OrderUOM: 'PC',
                                     Batch: Batch[key],
                                     GRNo: GRNo,
                                     StockStatus: StockStatus[key]
                                });
                            });
                         }
                     });
                     putaway_hdr.create({
                         ASNNo,
                         CreatedBy: 1,
                         GRNo,
                         ShipmentNo,
                         Status: 'Planned',
                         CreatedBy: req.user
                     }).then((result)=>{
                         let inventory_items =  [];
                         function loopPAItems(){
                             ItemCode_pa.forEach(function(element,key) {
                                 if(UID_pa[key]!='' && UID.indexOf(UID_pa[key]) > -1){
                                    PA_items.push({
                                        PACode:result.PACode,
                                        ASNNo:ASNNo,
                                        ItemCode: ItemCode_pa[key],
                                        UID : UID_pa[key],
                                        Batch: Batch_pa[key],
                                        GRNo: GRNo
                                    })
                                 }
                             });
                             
                         }
                         function loopItems(){
                            
                             ItemCode.forEach(function(element,key) {
                                 inventory_items.push({PACode:result.PACode,ItemCode : ItemCode[key],UID : UID[key],SerialNo: SerialNo[key],Qty: 1,Batch: Batch[key],GRNo: GRNo,StockStatus: StockStatus[key],Status: 'Goods Received'})
                             
                            });
                         }
                         
                         async function createInventory(finalValue){
                                pa =  await loopPAItems()
                                inventoryloop =  await loopItems()
                                await inventory.bulkCreate(inventory_items).catch(function (err) {
                                 console.log(err);
                               })
                                await GR_detail.bulkCreate(Gr_items)
                                putaway = await putaway_detail.bulkCreate(PA_items)
                                await ASN_hdr.update({  Status : 'Closed' },  { where : { ASNNo : ASNNo}})
                                await req.flash('success_msg','Successfully added Putaway');
                                await res.redirect('/putaway/putaway_dtl?PACode='+result.PACode);
                         };
                         createInventory();
                     })
                 })
             }else{
                 req.flash('error_msg','GR is not in Planned Status.');  
                 res.redirect('/gr/gr_dtl?GRNo='+req.body.GRNo); 
             }
         }
     });
  };
  
exports.check_uid_exist = function(req, res) {
    async function checkUIDExist(){
        const UID = req.query.UID_pa;
        var filtered = UID.filter(function (el) {
         return el != '';
       });
        const UIDList =  await GR_detail.findAll({
            attributes:['UID'],
            where:
                 {
                    UID : {[Op.in]: filtered}
                 },
            group: 'UID'
         })
         var mapUID  = UIDList.map(function(sensor){ return sensor.UID });
         res.send(mapUID);
    }
    checkUIDExist();
};

exports.check_serialno_exist = function(req, res) {
    async function checkSerialExist(){
        const SerialNo = req.body.SerialNo;
        const ItemCode = req.body.ItemCode;
        let filteredSerialNo = await SerialNo.filter(function(el,key) {
            if(el!='') {  return el;   }else{  return false;  }
        }).map(function(el,key) { return SerialNo[key]+ItemCode[key] ;});
        const SerialNoList =  await inventory.findAll({
            attributes:['SerialNo'],
            where: Sequelize.where(Sequelize.fn("concat", Sequelize.col("SerialNo"), Sequelize.col("ItemCode")), {
                [Op.in]: filteredSerialNo
            }),
         }).catch(function (err) {
            console.log(err);
        });
         var mapSerialNo  = SerialNoList.map(function(SerialNoList){ return SerialNoList.SerialNo });
         console.log(mapSerialNo);
         res.send(mapSerialNo);
    }
    checkSerialExist();
};

exports.gr_status_count = function(req, res) {
    GR_hdr.findAll({
        group: ['Status'],
        attributes: ['Status', [db.fn('COUNT', 'Status'), 'StatusCount']],
    }).then(function (gr) {
        res.send(gr);
    });
}

