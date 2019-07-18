const Sequelize = require('sequelize');
const db = require('./db.js');
var ASN_hdr = db.define('tbl_asn_hdr', {
  UUID: {
      type:Sequelize.UUID,
      primaryKey: true
    },
    ASNNo: {
        type:Sequelize.BIGINT,
        autoIncrement: true
    },
    ASNPrimaryRefDocNo: {
      type:Sequelize.STRING,
    },
    ShipmentNo: {
      type:Sequelize.STRING,
      unique : true,
    },
    ASNDateTime: Sequelize.DATE,
    PrimaryRefDocDate: Sequelize.DATE,
    TransactionType: Sequelize.TEXT,
    CustomerCode: Sequelize.TEXT,
    CreatedBy: Sequelize.TEXT,
    ModifiedBy: Sequelize.TEXT,
    Status: Sequelize.TEXT,
    ASNPrimaryRefDocNo: Sequelize.TEXT,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_asn_hdr'
});
  
module.exports = ASN_hdr;