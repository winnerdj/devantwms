var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
var Handlebars = require('handlebars');
var routes = require('./routes/index');
var users = require('./routes/users');
var asn = require('./routes/asn');
var gr = require('./routes/gr');
var pu = require('./routes/pu');
var customer = require('./routes/customer');
var item = require('./routes/item');
var shippoint = require('./routes/shippoint');
var location = require('./routes/location');
var stockinquiry = require('./routes/stockinquiry');
var outbound = require('./routes/outbound');
var pickplan = require('./routes/pickplan');
var employee = require('./routes/employee');
var dispatch = require('./routes/dispatch');
var bintobin = require('./routes/bintobin');
var loading = require('./routes/loading');
var batch_uid_correction = require('./routes/batch_uid_correction');
var batch = require('./routes/batch');
var stockconversion = require('./routes/stockconversion');
var stockaccuracy = require('./routes/stockaccuracy');
/*var redis           =     require("redis");
var redisStore      =     require('connect-redis')(session);
var client  = redis.createClient({
  retry_strategy: function (options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with
          // a individual error
          return new Error('The server refused the connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands
          // with a individual error
          return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
          // End reconnecting with built in error
          return undefined;
      }
      // reconnect after
      return Math.min(options.attempt * 100, 3000);
  }
});*/
var app = express();
var multer = require('multer');
Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {

  if (arguments.length < 3)
      throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
  var operator = options.hash.operator || "==";

  var operators = {
      '==':       function(l,r) { return l == r; },
      '===':      function(l,r) { return l === r; },
      '!=':       function(l,r) { return l != r; },
      '<':        function(l,r) { return l < r; },
      '>':        function(l,r) { return l > r; },
      '<=':       function(l,r) { return l <= r; },
      '>=':       function(l,r) { return l >= r; },
      'typeof':   function(l,r) { return typeof l == r; }
  }
  if (!operators[operator])
      throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);
  var result = operators[operator](lvalue,rvalue);
  if( result ) {
      return options.fn(this);
  } else {
      return options.inverse(this);
  }
});

Handlebars.registerHelper('compareprev', function(thisindex,thisfield, thisarray,ret) {
  
  if(thisindex==0){
    return ret.fn(this);
  }
  else if(thisarray[thisindex][thisfield] == thisarray[thisindex-1][thisfield]){
    return ret.inverse(this);
  }
  else{
   return ret.fn(this);
  }
  
});

Handlebars.registerHelper('compareor', function(lvalue,orvalue,ret) {
  var splittedValue = orvalue.split(",");
  if(splittedValue.indexOf(lvalue) > -1) {
    return ret.fn(this);
  }
  return ret.inverse(this);
});
Handlebars.registerHelper('ifIn', function(elem, list, options) {
  if(list.indexOf(elem) > -1) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('ifIsNthItem', function(options) {
  var index = options.data.index + 1,
      nth = options.hash.nth;

  if (index % nth === 0) 
    return options.fn(this);
  else
    return options.inverse(this);
});





Handlebars.registerHelper('dateFormat', require('handlebars-dateformat'));

//view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');


//exphbs.registerHelper('dateFormat', require('handlebars-dateformat'));
// bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true,parameterLimit: 100000000,
  limit: 1024 * 1024 * 10 }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname,'public')));

var expressValidator = require('express-validator');
app.use(expressValidator(
  {
    customValidators: {

      isUsernameAvailable: function(username) {
          return new Promise(function(resolve, reject) {

            User.findOne({'username': username}, function(err, results) { 

              if(err) {
                return resolve(err);
              }
                reject(results);
            });

          });
      }
    }
  }
));

//express session
app.use(session({
  secret:'n3jAe3sbZ9DcGgNvRywrKjwd',
  /*store: new redisStore({ 
    host: 'localhost',
    port: 6379,
    client: client,
    pass: 'pwd@redis33',
  }),*/
  saveUninitialized:  true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function (req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});



app.use('/', routes);
app.use('/users', users);
app.use('/gr', gr);
app.use('/putaway', pu);
app.use('/asn', asn);
app.use('/customer', customer);
app.use('/item', item);
app.use('/location', location);
app.use('/stockinquiry', stockinquiry);
app.use('/outbound', outbound);
app.use('/pickplan', pickplan);
app.use('/shippoint', shippoint);
app.use('/employee', employee);
app.use('/dispatch', dispatch);
app.use('/bin-to-bin', bintobin);
app.use('/loading', loading);
app.use('/batch_uid_correction', batch_uid_correction);
app.use('/batch', batch);
app.use('/stock_conversion', stockconversion);
app.use('/stock_accuracy', stockaccuracy);

app.set('port', (process.env.PORT || 54001));
app.listen(app.get('port'), function(){
    console.log('Server started on port '+app.get('port'));
});

const Sequelize = require('sequelize');
db1 = require('./models/db.js');
db1.authenticate()
.then(() => {
  console.log('Connection has been established successfully.');
})
.catch(err => {
  console.error('Unable to connect to the database:', err);
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/tmp/my-uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({
    storage: storage
}).single('upload_asn');