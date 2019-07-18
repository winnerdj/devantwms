
const Sequelize = require('sequelize');
const db = require('./db.js');
var user = db.define('tbl_user', {
    ID: {
        type:Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    EmployeeID: Sequelize.STRING,
    FirstName: Sequelize.STRING,
    LastName: Sequelize.STRING,
    Role: Sequelize.STRING,
    UserLevel: Sequelize.STRING,
    Status: Sequelize.STRING,
    WarehouseCode: Sequelize.TEXT,
    },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_user'
    });
module.exports = user;