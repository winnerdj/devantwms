const Sequelize = require('sequelize');
const db = require('./db.js');

var batch_uid_correction = db.define('tbl_batch_uid_correction', {
    ID: {
        type:Sequelize.INTEGER,
        primaryKey: true,
    },
    ItemCode: {
        type:Sequelize.STRING
    },
    SerialNo: {
        type:Sequelize.STRING
    },
    BatchFrom: {
        type:Sequelize.STRING
    },
    BatchTo: {
        type:Sequelize.STRING
    },
    UIDFrom: {
        type:Sequelize.STRING
    },
    UIDTo: {
        type:Sequelize.STRING
    },
    CreatedBy: {
        type:Sequelize.STRING
    },
    CreatedDateTime: {
        type:Sequelize.DATE
    },
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_batch_uid_correction'
  })
module.exports = batch_uid_correction;