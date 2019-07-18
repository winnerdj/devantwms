const Sequelize = require('sequelize');
const db = require('./db.js');

var outbound_hdr = db.define('tbl_outbound_hdr', {
    UUID: {
        type:Sequelize.UUID,
        primaryKey: true,
    },
    ODONo: {
        type:Sequelize.BIGINT,
        autoIncrement: true,
    },
    ODOPrimaryRefDocNo: Sequelize.STRING,
    TransactionType: Sequelize.STRING,
    CustomerCode: Sequelize.STRING,
    ShipmentNo: Sequelize.STRING,
    DeliveryDate: Sequelize.STRING,
    PONo: Sequelize.STRING,
    ShipmentMode: Sequelize.DATE,
    VehicleType: Sequelize.STRING,
    CreatedDateTime: Sequelize.STRING,
    ModifiedBy: Sequelize.STRING,
    ModifiedDateTime: Sequelize.STRING,
    Status: Sequelize.STRING,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_outbound_hdr'
  })
module.exports = outbound_hdr;