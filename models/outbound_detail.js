const Sequelize = require('sequelize');
const db = require('./db.js');

var outbound_detail = db.define('tbl_outbound_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    UUID: {
      type:Sequelize.STRING
    },
    ItemCode: Sequelize.STRING,
    OrderQty: Sequelize.INTEGER,
    OrderUOM: Sequelize.STRING,
    ShipPointCode: Sequelize.STRING,
    SalesOrderNo: Sequelize.STRING,
    PONo: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_outbound_detail'
  })
module.exports = outbound_detail;

