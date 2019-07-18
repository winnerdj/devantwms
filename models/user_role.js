const Sequelize = require('sequelize');
const db = require('./db.js');
var user_role = db.define('tbl_user_role', {
    ID: {
        type:Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userID: Sequelize.BIGINT,
    roleID: Sequelize.BIGINT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_user_role'
});
module.exports = user_role;