const Sequelize = require('sequelize');
const db = require('./db.js');
var GR_hdr = db.define('tbl_gr_hdr', {
    GRNo: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    ASNNo: {
      type:Sequelize.BIGINT,
      unique: true
    },
    UUID: Sequelize.STRING,
    ShipmentNo: Sequelize.STRING,
    AssignEmployee: Sequelize.STRING,
    CreatedBy: Sequelize.TEXT,
    CreatedDateTime: Sequelize.DATE,
    DateTimeExecuted: Sequelize.TEXT,
    Status: Sequelize.TEXT,
    ModifiedBy: Sequelize.TEXT,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_gr_hdr'
});
module.exports = GR_hdr;