const Sequelize = require('sequelize');
const db = require('./db.js');

var location = db.define('tbl_locations', {
    LocationCode: {
        type:Sequelize.STRING,
        primaryKey: true,
    },
    LocationDescription: {
        type:Sequelize.STRING
    },
    LocationType: {
        type:Sequelize.STRING
    },
    Status: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_locations'
  })
module.exports = location;