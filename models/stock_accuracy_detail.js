const Sequelize = require('sequelize');
const db = require('./db.js');
var stock_accuracy_detail = db.define('tbl_stock_accuracy_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    StockAccuracyNo: {
        type:Sequelize.BIGINT,
    },
    ItemCode:{
        type: Sequelize.STRING,
    }, 
    SerialNo: Sequelize.STRING,
    Location: Sequelize.STRING,
    UID: Sequelize.STRING,
    Qty: Sequelize.INTEGER,
    ActualQty: Sequelize.STRING,
    ActualLocation: Sequelize.STRING,
    ActualUID: Sequelize.STRING,
    Variance: Sequelize.INTEGER
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_stock_accuracy_detail'
  })


module.exports = stock_accuracy_detail;