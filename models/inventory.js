const Sequelize = require('sequelize');
const db = require('./db.js');
var inventory = db.define('tbl_inventory', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    ItemCode: Sequelize.STRING,
    StockStatus: Sequelize.STRING,
    SerialNo: Sequelize.STRING,
    UID: Sequelize.STRING,
    Qty: Sequelize.INTEGER,
    GRNo: Sequelize.INTEGER,
    PACode: Sequelize.INTEGER,
    PLID: Sequelize.INTEGER,
    Batch: Sequelize.STRING,
    Expiry: Sequelize.STRING,
    Manufacturing: Sequelize.STRING,
    Location: Sequelize.STRING,
    UID: Sequelize.STRING,
    StockStatus: Sequelize.STRING,
    Status: Sequelize.STRING,
    WarehouseCode: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_inventory'
});
  
module.exports = inventory;