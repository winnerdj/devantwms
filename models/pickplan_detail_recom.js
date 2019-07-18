const Sequelize = require('sequelize');
const db = require('./db.js');

var pickplan_detail_recom = db.define('tbl_pickplan_detail_recom', {
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
    ODODetailNo: Sequelize.INTEGER,
    ShipPointCode: Sequelize.STRING,
    OrderQTY: Sequelize.INTEGER,
    OrderUOM: Sequelize.STRING,
    UID: Sequelize.STRING,
    Batch: Sequelize.STRING,
    LocationCode: Sequelize.STRING,
    Status: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_pickplan_detail_recom'
  })
module.exports = pickplan_detail_recom;

