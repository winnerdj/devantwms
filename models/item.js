const Sequelize = require('sequelize');
const db = require('./db.js');

var item = db.define('tbl_item_master', {
    ItemCode: {
        type:Sequelize.STRING,
        primaryKey: true,
    },
    ItemDescription: {
        type:Sequelize.STRING
    },
    CustomerItemCode: {
        type:Sequelize.STRING
    },
    CaseBarcode: Sequelize.STRING,
    ItemCategory: Sequelize.STRING,
    Length: Sequelize.DECIMAL,
    Height: Sequelize.DECIMAL,
    Width: Sequelize.DECIMAL,
    Volume: Sequelize.DECIMAL,
    Weight: Sequelize.DECIMAL,
    UOM: Sequelize.STRING,
    WeightUOM: Sequelize.STRING,
    Status: Sequelize.STRING,
    WarehouseCode: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_item_master'
  })
module.exports = item;

