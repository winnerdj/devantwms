const Sequelize = require('sequelize');
const db = require('./db.js');
var stock_conversion_hdr = db.define('tbl_stock_conversion_hdr', {
    StockConversionNo: {
      type:Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    AssignApprover: Sequelize.TEXT,
    CreatedBy: Sequelize.TEXT,
    CreatedDateTime: Sequelize.DATE,
    ModifiedBy: Sequelize.TEXT,
    ModifiedDateTime: Sequelize.DATE,
    Status: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_stock_conversion_hdr'
});
  
module.exports = stock_conversion_hdr;