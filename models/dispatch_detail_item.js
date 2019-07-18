const Sequelize = require('sequelize');
const db = require('./db.js');

var dispatch_detail_item = db.define('tbl_dispatch_detail_items', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    DispatchNo: Sequelize.STRING,
    ItemCode: Sequelize.STRING,
    SalesOrderNo: Sequelize.STRING,
    DRNo: Sequelize.INTEGER,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_dispatch_detail_items'
  })
module.exports = dispatch_detail_item;

