const Sequelize = require('sequelize');
const db = require('./db.js');
var putaway_hdr = db.define('tbl_putaway_hdr', {
  PACode: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    AssignEmployee: Sequelize.STRING,
    ASNNo: Sequelize.BIGINT,
    GRCode: Sequelize.BIGINT,
    CreatedBy: Sequelize.STRING,
    ShipmentNo: Sequelize.STRING,
    CreatedDateTime: Sequelize.DATE,
    DateTimeFrom: Sequelize.DATE,
    DateTimeTo: Sequelize.DATE,
    CreatedBy: Sequelize.TEXT,
    DateTimeExecuted: Sequelize.DATE,
    DateTimeModified: Sequelize.TEXT,
    ModifiedBy: Sequelize.TEXT,
    Status: Sequelize.TEXT,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_putaway_hdr'
});
module.exports = putaway_hdr;