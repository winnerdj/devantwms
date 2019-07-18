const Sequelize = require('sequelize');
const db = require('./db.js');
var bintobin_hdr = db.define('tbl_bintobin_hdr', {
    BinToBinNo: {
      type:Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    StartDatetimeExecution: Sequelize.TEXT,
    EndDatetimeExecution: Sequelize.TEXT,
    CreatedBy: Sequelize.TEXT,
    CreatedDateTime: Sequelize.DATE,
    ModifiedBy: Sequelize.TEXT,
    ModifiedDateTime: Sequelize.DATE,
    WarehouseCode: Sequelize.TEXT,
    AssignEmployee: Sequelize.TEXT,
    Status: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_bintobin_hdr'
});
  
module.exports = bintobin_hdr;