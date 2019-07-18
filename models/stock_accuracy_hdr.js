const Sequelize = require('sequelize');
const db = require('./db.js');


var stock_accuracy_hdr = db.define('tbl_stock_accuracy_hdr', {
    StockAccuracyNo: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    CreatedBy:Sequelize.STRING,
    CreatedDateTime: Sequelize.DATE,
    ModifiedBy: Sequelize.STRING,
    ModifiedDateTime: Sequelize.DATE,
    Status: Sequelize.STRING
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_stock_accuracy_hdr'
  })


module.exports = stock_accuracy_hdr;