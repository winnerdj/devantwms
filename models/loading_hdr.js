const Sequelize = require('sequelize');
const db = require('./db.js');

var loading_hdr = db.define('tbl_loading_hdr', {
    LoadingNo: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    UUID: Sequelize.UUID,
    ShipmentNo: Sequelize.TEXT,
    ODONo: Sequelize.TEXT,
    DispatchNo: Sequelize.BIGINT,
    PlateNo: Sequelize.TEXT,
    LoadSheetDate: Sequelize.DATE,
    VehicleNo: Sequelize.TEXT,
    VehicleType: Sequelize.TEXT,
    DockNo: Sequelize.TEXT,
    Person: Sequelize.TEXT,
    DateTimeFrom: Sequelize.DATE,
    DateTimeTo: Sequelize.DATE,
    CreatedBy: Sequelize.TEXT,
    ModifiedDateTime: Sequelize.DATE,
    ModifiedBy: Sequelize.TEXT,
    Status: Sequelize.TEXT,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_loading_hdr'
  })
module.exports = loading_hdr;