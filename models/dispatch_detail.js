const Sequelize = require('sequelize');
const db = require('./db.js');

var dispatch_detail = db.define('tbl_dispatch_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    DispatchNo: Sequelize.STRING,
    
    ShipPointCode: Sequelize.STRING,
    ItemCode: Sequelize.STRING,
    SerialNo: Sequelize.TEXT,
    THUID: Sequelize.TEXT,
    OrderUOM: Sequelize.STRING,
    PickPlanNo: Sequelize.BIGINT,
    OrderQty: Sequelize.INTEGER,
    TAF: Sequelize.STRING,
    DRRefNo: Sequelize.STRING,
    RouteAndLoadSheetRefNo: Sequelize.STRING,
    Batch: Sequelize.TEXT,
    SalesOrderNo: Sequelize.TEXT,
    DRNo: Sequelize.INTEGER,
    PONo: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_dispatch_detail'
  })
module.exports = dispatch_detail;

