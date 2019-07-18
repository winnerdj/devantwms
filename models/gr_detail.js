const Sequelize = require('sequelize');
const db = require('./db.js');

var GR_detail = db.define('tbl_gr_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    GRNo: {
        type:Sequelize.BIGINT
    },
    ASNNo: {
        type:Sequelize.BIGINT
    },
    ItemCode: Sequelize.STRING,
    UUID: Sequelize.STRING,
    SerialNo: Sequelize.STRING,
    Batch: Sequelize.TEXT,
    Qty: Sequelize.INTEGER,
    OrderUOM: Sequelize.STRING,
    LocationCode: Sequelize.STRING,
    UID: Sequelize.STRING,
    StockStatus: Sequelize.STRING,
    
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_gr_detail'
  })
module.exports = GR_detail;

