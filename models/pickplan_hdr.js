const Sequelize = require('sequelize');
const db = require('./db.js');

var pickplan_hdr = db.define('tbl_pickplan_hdr', {
    PickPlanNo: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    ShipmentNo: {
        type:Sequelize.BIGINT,
    },
    ODONo: Sequelize.BIGINT,
    UUID: Sequelize.UUID,
    ODOPrimaryRefDocNo: Sequelize.STRING,
    DateTimeFrom: Sequelize.DATE,
    DateTimeTo: Sequelize.DATE,
    CreatedDateTime: Sequelize.DATE,
    AssignEmployee: Sequelize.STRING,
    ExecutionDateTime: Sequelize.STRING,
    CreatedBy: Sequelize.STRING,
    Status: Sequelize.STRING,
    ModifiedBy: Sequelize.STRING,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_pickplan_hdr'
  })
module.exports = pickplan_hdr;