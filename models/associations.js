const stock_accuracy_hdr = require('./stock_accuracy_hdr.js');
const stock_accuracy_detail = require('./stock_accuracy_detail.js');
const item = require('./item.js');



stock_accuracy_hdr.hasMany(stock_accuracy_detail, {foreignKey: 'StockAccuracyNo'});
stock_accuracy_detail.belongsTo( stock_accuracy_hdr, {   foreignKey: 'StockAccuracyNo' });
stock_accuracy_detail.hasOne(item, { foreignKey: 'ItemCode'});

