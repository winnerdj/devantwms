
const db = require('../models/db.js');
var customer = require('../models/customer.js');
let modulename = "item";
const Op = db.Op;
exports.customerlist = function(req, res) {
    customer.findAll({
        where:
            {
                Status : 'Active'
            },
            raw: true,
    }).then(customer => {
        res.send(customer);
    });
};

exports.index = function(req, res) {
    const pagename = "customer_index"
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
    customer.findAll({ where: whereStatement })
          .then( customers => 
          {
            //res.send({items});
            res.render('../views/customer/index',{customers,ItemCode_inp,ItemDescription_inp,ItemCategory_inp,Status_inp,Status_inp,WarehouseCode_inp,modulename,pagename,userpermissionmodule,username: req.session.username})
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