const Sequelize = require('sequelize');
const db = require('./db.js');

var putaway_detail = db.define('tbl_putaway_detail', {
    ID: {
        type:Sequelize.BIGINT,
        primaryKey: true,
    },
    PACode: {
        type:Sequelize.BIGINT
    },
    ASNNo: {
      type:Sequelize.BIGINT
    },
    ItemCode: {
        type:Sequelize.STRING
    },
    UID: Sequelize.STRING,
    PickQty: Sequelize.INTEGER,
    SerialNo: Sequelize.STRING,
    OrderUOM: Sequelize.STRING,
    GRNo: Sequelize.BIGINT,
    LocationCode: Sequelize.STRING,
    Batch: Sequelize.STRING,
  },{
    timestamps: false,
    freezeTableName: true,
    tableName: 'tbl_putaway_detail'
  })

  // ASN_detail.associate = function(models){
  //   ASN_detail.belongsTo(models.ASN_hdr, {foreignKey: 'ASNNo', targetKey: 'ASNNo'});
  // }
module.exports = putaway_detail;

