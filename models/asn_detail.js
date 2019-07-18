const Sequelize = require('sequelize');
const db = require('./db.js');

var ASN_detail = db.define('tbl_asn_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    UUID: {
        type:Sequelize.STRING
    },
    ItemCode: Sequelize.STRING,
    OrderUOM: Sequelize.STRING,
    OrderQty: Sequelize.INTEGER,
    SerialNo: Sequelize.TEXT,
    Batch: Sequelize.TEXT,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_asn_detail'
  })

  // ASN_detail.associate = function(models){
  //   ASN_detail.belongsTo(models.ASN_hdr, {foreignKey: 'ASNNo', targetKey: 'ASNNo'});
  // }
module.exports = ASN_detail;

