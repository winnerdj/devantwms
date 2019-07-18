const Sequelize = require('sequelize');
const db = require('./db.js');
var dispatch_hdr= db.define('tbl_dispatch_hdr', {
    DispatchNo: {
      type:Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    ShipmentNo: {
      type:Sequelize.STRING,
      unique : true,
    },
    UUID: Sequelize.STRING,
    ODONo: Sequelize.STRING,
    PickPlanNo: Sequelize.STRING,
    ExecutionDateTime: Sequelize.STRING,
    AssignEmployee: Sequelize.STRING,
    CreatedBy: Sequelize.TEXT,
    Status: Sequelize.TEXT,
    CreatedDateTime:Sequelize.DATE,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_dispatch_hdr'
});
  
module.exports = dispatch_hdr;