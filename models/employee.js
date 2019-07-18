const Sequelize = require('sequelize');
const db = require('./db.js');

var employee = db.define('tbl_employee', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    EmployeeID:Sequelize.STRING,
    FirstName: Sequelize.STRING,
    MiddleName: Sequelize.STRING,
    LastName: Sequelize.STRING,
    Position: Sequelize.STRING
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_employee'
  })
module.exports = employee;

