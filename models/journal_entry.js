const Sequelize = require('sequelize');
const db = require('./db.js');

var journal_entry = db.define('tbl_journal_entry', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement:true
    },
    TransactionType: {
        type:Sequelize.STRING
    },
    ActionType: {
        type:Sequelize.STRING
    },
    ItemCode: Sequelize.STRING,
    SerialNo: Sequelize.STRING,
    ReferenceID: Sequelize.STRING,
    Qty: Sequelize.STRING,
    UOM: Sequelize.STRING,
    TransactBy: Sequelize.STRING,
    TransactDateTime: Sequelize.STRING,
    WarehouseCode: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_journal_entry'
  })
module.exports = journal_entry;

