
var Sequelize = require("sequelize");
var location = require('../models/location.js');
let modulename = "location";
const Op = Sequelize.Op;
//ui
exports.locationlist = function(req, res) {
    location.findAll({
        where:
        {
            Status : 'Active'
        },
        raw: true,
    }).then(location => {
        res.send(location);
    });
};

exports.check_validlocation = function(req, res) {
    async function checkValidLocation(){
       const LocationCode = req.query.LocationCode;
       var filtered = LocationCode.filter(function (el) {
        return el != '';
      });
       const validLocationList =  await location.findAll({
            attributes:['LocationCode'],
            where:
                {
                    LocationCode : {[Op.in]: filtered}
                },
        })
        
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
        let getItemCodeValiArr = await validLocationList.map(validLocationList => validLocationList.LocationCode);
        let CompareDBExcelItemCode = await arr_diff(filtered,getItemCodeValiArr);
        
        res.send(CompareDBExcelItemCode);
    
    }
    checkValidLocation();
 };

 exports.index = function(req, res) {
    const pagename = "location_index"
    const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);
    let {LocationCode,LocationDescription,LocationType,Status,WarehouseCode} = req.query
    let LocationCode_inp = LocationCode;
    let LocationDescription_inp = LocationDescription;
    let LocationType_inp = LocationType;
    let Status_inp = Status;
    let WarehouseCode_inp = WarehouseCode;
    let whereStatement = {}
    if(LocationCode!='' && LocationCode)
    whereStatement.LocationCode = LocationCode;
    if(LocationDescription!='' && LocationDescription)
    whereStatement.LocationDescription =    {[Op.like]: '%'+LocationDescription+'%'};
    if(LocationType!='' && LocationType)
    whereStatement.LocationType = LocationType;
    if(Status!='' && Status)
    whereStatement.Status = Status;
    if(WarehouseCode!='' && WarehouseCode)
    whereStatement.WarehouseCode = WarehouseCode;
    location.findAll({ where: whereStatement })
          .then(locations => 
            res.render('../views/location/index',{
                locations,
                LocationCode_inp,
                LocationDescription_inp,
                LocationType_inp,
                Status_inp,
                WarehouseCode_inp,
                modulename,
                pagename,
                userpermissionmodule,
                username: req.session.username,
            })
          );
}


exports.post_create = function(req, res) {
    let {LocationCode,LocationDescription,LocationType,Status,WarehouseCode} = req.body;

    location.create({
        LocationCode,LocationDescription,LocationType,Status,WarehouseCode
    })
    req.flash('success_msg','Location Successfully Added');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}


exports.post_update = function(req, res) {
    let {LocationCode,LocationDescription,LocationType,Status,WarehouseCode} = req.body;

    location.update({
        LocationDescription,LocationType,Status,WarehouseCode
    },
        {where: {LocationCode}}
    )
    req.flash('success_msg','Location Successfully Updated');
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
}