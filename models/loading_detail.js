const Sequelize = require('sequelize');
const db = require('./db.js');

var loading_detail = db.define('tbl_loading_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    LoadingNo: Sequelize.BIGINT,
    ItemCode: Sequelize.STRING,
    SerialNo: Sequelize.STRING,
    ShipPointCode: Sequelize.STRING,
    OrderQTY: Sequelize.INTEGER,
    OrderUOM: Sequelize.STRING,
    UID: Sequelize.STRING,
    Batch: Sequelize.STRING,
    Status: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_loading_detail'
  })
module.exports = loading_detail;

