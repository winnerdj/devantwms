const Sequelize = require('sequelize');
const db = require('./db.js');

var stock_conversion_detail = db.define('tbl_stock_conversion_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    StockConversionNo: Sequelize.BIGINT,
    ItemCode: Sequelize.STRING,
    SerialNo: Sequelize.STRING,
    StatusFrom: Sequelize.STRING,
    StatusTo: Sequelize.STRING,
    QtyFrom: Sequelize.INTEGER,
    QtyTo: Sequelize.INTEGER,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_stock_conversion_detail'
  })
module.exports = stock_conversion_detail;

