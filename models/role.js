const Sequelize = require('sequelize');
const db = require('./db.js');
var role = db.define('tbl_roles', {
    ID: {
        type:Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Role: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_roles'
});
module.exports = role;