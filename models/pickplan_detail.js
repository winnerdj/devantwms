const Sequelize = require('sequelize');
const db = require('./db.js');

var pickplan_detail = db.define('tbl_pickplan_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    PickPlanNo: {
        type:Sequelize.BIGINT
    },
    ItemCode: {
      type:Sequelize.STRING
    },
    SerialNo: {
      type:Sequelize.STRING
    },
    ShipPointCode: Sequelize.STRING,
    OrderQTY: Sequelize.INTEGER,
    OrderUOM: Sequelize.STRING,
    UID: Sequelize.STRING,
    Batch: Sequelize.STRING,
    LocationCode: Sequelize.STRING,
    Status: Sequelize.STRING,
    SalesOrderNo: Sequelize.STRING,
    PONo: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_pickplan_detail'
  })
module.exports = pickplan_detail;

