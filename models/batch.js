const Sequelize = require('sequelize');
const db = require('./db.js');

var batch = db.define('tbl_batch', {
    ID: {
        type:Sequelize.INTEGER,
        primaryKey: true,
    },
    Batch: {
        type:Sequelize.STRING
    },
    BatchDescription: {
        type:Sequelize.STRING
    },
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_batch'
  })
module.exports = batch;