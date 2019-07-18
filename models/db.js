const Sequelize = require('sequelize');

module.exports =  new Sequelize('devantwms', 'root', 'secret123', {
  // module.exports =  new Sequelize('swms', 'devant', 'PwdD3v4nt', {
    // host: 'zeus3-aeolus-db.cy2ay0l1hcaz.ap-southeast-1.rds.amazonaws.com',
    host: 'localhost',
    dialect: 'mysql',
    operatorsAliases: false,
    pool: { 
      max: 1000000,
      min: 0,
      idle: 2000000,
      acquire: 2000000,
      idleTimeoutMillis: 50,
      evictionRunIntervalMillis: 5,
      softIdleTimeoutMillis: 5 
    }
});

