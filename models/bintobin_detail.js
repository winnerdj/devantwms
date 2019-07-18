const Sequelize = require('sequelize');
const db = require('./db.js');

var bintobin_detail = db.define('tbl_bintobin_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    BinToBinNo: Sequelize.BIGINT,
    SerialNo: Sequelize.STRING,
    ItemCode: Sequelize.STRING,
    LocationFrom: Sequelize.STRING,
    LocationTo: Sequelize.STRING,
    Batch: Sequelize.TEXT,
},{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_bintobin_detail'
})
module.exports = bintobin_detail;

