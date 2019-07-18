const Sequelize = require('sequelize');
const db = require('./db.js');


var ShipPoint = db.define('tbl_ship_point', {
    ShipPointCode:{
        type:Sequelize.STRING,
        primaryKey: true,
    },
    ShipPointName: Sequelize.STRING,
    Dealer: Sequelize.STRING,
    Address1: Sequelize.STRING,
    Address2: Sequelize.STRING,
    Address3: Sequelize.STRING,
    PostalCode: Sequelize.STRING,
    City: Sequelize.STRING,
    State: Sequelize.STRING,
    Country: Sequelize.STRING,
    ContactPerson: Sequelize.STRING,
    Phone1: Sequelize.STRING,
    Phone2: Sequelize.STRING,
    Fax: Sequelize.STRING,
    Email: Sequelize.STRING,
    Url: Sequelize.STRING,
    Status: Sequelize.STRING,
},
{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_ship_point'
}

)
module.exports = ShipPoint;