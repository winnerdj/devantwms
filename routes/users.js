var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var User = require('../models/user.js');
var role = require('../models/role.js');
var db = require('../models/db.js');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
function loggedOut(req, res, next) {
    if (req.user) {
        res.redirect('/');
    } else {
        next();
    }
}


router.get('/',function(req, res){
  const pagename="user_index";
  const userpermissionmodule = req.session.permissions.map(userpermissions => userpermissions.module);  
  let {FirstName,LastName,Status,EmployeeID,Role} = req.query;
  let EmployeeID_inp = EmployeeID;
  let FirstName_inp = FirstName;
  let LastName_inp = LastName;
  let Role_inp = Role;
  let whereStatement = {}
    if(EmployeeID!='' && EmployeeID)
    whereStatement.EmployeeID = EmployeeID;
    if(FirstName!='' && FirstName)
    whereStatement.FirstName = FirstName;
    if(LastName_inp!='' && LastName_inp)
    whereStatement.LastName_inp = LastName_inp;
    if(Role!='' && Role)
    whereStatement.Role = Role;

    if(Status!='' && Status)
    whereStatement.Status = Status;
  User.hasOne(role, {foreignKey: 'ID', sourceKey:'Role'});
  const displayUsers = async function(){
    const rolelist = await role.findAll();
    await User.findAll({
      where: whereStatement,
      include:{
                model:role,
                on: {
                  col1: db.where(db.col("tbl_user.Role"), "=", db.col("tbl_role.ID"))
                }
              }
      }).then(Users => 
      {
        
        res.render('../views/users/index',{Users,EmployeeID_inp,FirstName_inp,LastName_inp,Role_inp,Status,rolelist,pagename,userpermissionmodule})
        //res.send({Users,EmployeeID_inp,FirstName_inp,LastName_inp,Role_inp,rolelist})
        
      }
      
      );
  }

  displayUsers();
});
/*
router.get('/register',function(req, res){
    res.render('register');
});
*/
router.get('/create',function(req, res){
  res.render('../views/users/create');
  User.findOne({
    where : {
      username : username
    },
    attributes : ['ID','password','username']
})
});


router.get('/login',loggedOut,function(req, res){
    res.render('login', {layout: 'loginLayout.handlebars'});
});

passport.use(new LocalStrategy(
  async  function(username, password, done) {

      let getUser = await User.findOne({
          where : {
            username : username
          },
          attributes : ['ID','password','username']
      })
      if(!getUser){
          return done(null, false,{message: 'Unknown User'});
      }

      await bcrypt.compare(password, getUser.password, function(err, isMatch) {
          //if(err) throw err;
          if(isMatch){
            return done(null, getUser);
          }else{
            console.log(getUser.password)
            return done(null, false, {message: 'Invalid Password'})
          }
      });

    }
  ));

 


  passport.serializeUser(function(getUser, done) {
    done(null, getUser.ID);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findByPk(id, function(err, user) {
    }).then(result=>{
      if (result) {
        done(null, result.ID);
        console.log(result.ID);
      } else {
        done(result.errors, null);
      }
    });
  });
router.post('/login',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
      res.redirect('/');
});


router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.post('/create',function(req, res){
    let {username,password,EmployeeID,FirstName,LastName,Role,UserLevel} = req.body;
    //validation
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('EmployeeID', 'Employee ID is required').notEmpty();
    req.checkBody('FirstName', 'First Name is required').notEmpty();
    req.checkBody('LastName', 'Last Name is required').notEmpty();
    req.checkBody('Role', 'Role is required').notEmpty();
    password = "d3vantp4ssw0rd";
    var errors = req.validationErrors();
    if(errors){
        res.render('register',{
            errors: errors
        });
        req.session.errors = errors;
      req.session.success = false;
    }else{
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(password, salt, function(err, hash) {
              //newUser.password = hash;
              //newUser.save(callback);
              User.create({
                username: username,
                password: hash,
                EmployeeID,
                FirstName,
                LastName,
                Role,
                UserLevel,
                Status:'Active'
              })
              //return hash;
          });
        });
        
        
        req.flash('success_msg','Successfully created an account.');
        res.redirect("/users");
    }
});

router.post('/validate_cp',function(req, res){
  let {password,confirmpassword,currentPassword} = req.body;
  const  validateCP = async ()=>{
    let errors = [];
    let getUser = await User.findOne({
      where : {
        ID : req.user
      },
      attributes : ['ID','password','username']
    })
  
    if(!getUser){
      errors.push("An error occured please re-login then try again.");
    }else{
      const match = await bcrypt.compare(currentPassword, getUser.password);
      if(!match) {
        errors.push("Current password entered is incorrect.");
      }
    }
  
    if(password!=confirmpassword){
      errors.push("Passwords do not match.");
      
    }

    if(errors.length==0){
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
           User.update({
              password: hash
            },{where: {ID:req.user}})
        });
      });
      res.send();
    }else{
      res.send({errors});
    }
  }
  validateCP();
  
});

router.post('/changepw',function(req, res){
  let {password,confirmpassword} = req.body;
  //validation
  //req.checkBody('EmployeeID', 'Employee ID is required').notEmpty();
  //req.checkBody('FirstName', 'First Name is required').notEmpty();
  //req.checkBody('LastName', 'Last Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.assert('confirmpassword', 'Passwords do not match').equals(req.body.password);
  var errors = req.validationErrors();

  if(errors){
      /*res.render('changepw',{
          errors: errors
      });*/
      req.session.errors = errors;
      req.session.success = false;
      req.flash('error_msg',{errors});
      backURL=req.header('Referer') || '/';
      res.redirect(backURL);
  }else{

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
          //newUser.password = hash;
          //newUser.save(callback);
         /* User.update({
            password: hash
          },{where: {ID:req.user}})*/
          //return hash;
      });
    });

    
      req.flash('success_msg','User successfully updated');
      backURL=req.header('Referer') || '/';
      res.redirect(backURL);
  }
});

router.post('/update',function(req, res){
  let {EmployeeID,FirstName,LastName,Role,Status,ID,username} = req.body;
  //validation
  req.checkBody('EmployeeID', 'Employee ID is required').notEmpty();
  req.checkBody('FirstName', 'First Name is required').notEmpty();
  req.checkBody('LastName', 'Last Name is required').notEmpty();
  req.checkBody('Role', 'Role is required').notEmpty();
  var errors = req.validationErrors();
  if(errors){
      res.render('register',{
          errors: errors
      });
      req.session.errors = errors;
    req.session.success = false;
  }else{
    User.update({
      username,
      EmployeeID,
      FirstName,
      LastName,
      Role,
      Status
    },{where: {ID}}).then(()=>
    {
      req.flash('success_msg','User successfully updated');
      res.redirect("/users");
    });
    
  }
});

/** for testing or debugging purpose only. uncomment */
//for admin

router.get('/adminquery',function(req, res){
        res.render('../views/users/super_admin')
});
router.post('/super_push',function(req, res){
  db.query(req.body.query).then(querythis => {
    res.send(querythis);
  }).catch(err=>{
    res.send(err);
  })
});

//for admin
/** for testing or debugging purpose only. uncomment */



router.get('/reset_data',function(req, res){
  const TruncateTables = async  ()=>{
    await db.query("TRUNCATE TABLE tbl_asn_hdr");
    await db.query("TRUNCATE TABLE tbl_asn_detail");
    await db.query("TRUNCATE TABLE tbl_gr_hdr");
    await db.query("TRUNCATE TABLE tbl_gr_detail");
    await db.query("TRUNCATE TABLE tbl_putaway_hdr");
    await db.query("TRUNCATE TABLE tbl_putaway_detail");
    await db.query("TRUNCATE TABLE tbl_outbound_hdr");
    await db.query("TRUNCATE TABLE tbl_outbound_detail");
    await db.query("TRUNCATE TABLE tbl_pickplan_hdr");
    await db.query("TRUNCATE TABLE tbl_pickplan_detail");
    await db.query("TRUNCATE TABLE tbl_pickplan_detail_recom");
    await db.query("TRUNCATE TABLE tbl_dispatch_hdr");
    await db.query("TRUNCATE TABLE tbl_dispatch_detail");
    await db.query("TRUNCATE TABLE tbl_dispatch_detail_items");
    await db.query("TRUNCATE TABLE tbl_loading_hdr");
    await db.query("TRUNCATE TABLE tbl_loading_detail");
    await db.query("TRUNCATE TABLE tbl_bintobin_hdr");
    await db.query("TRUNCATE TABLE tbl_bintobin_detail");
    //await db.query("TRUNCATE TABLE tbl_locations");
    await db.query("TRUNCATE TABLE tbl_batch_correction");
    //await db.query("TRUNCATE TABLE tbl_batch");
    await db.query("TRUNCATE TABLE tbl_stock_conversion_hdr");
    await db.query("TRUNCATE TABLE tbl_stock_conversion_detail");
    await db.query("TRUNCATE TABLE tbl_stock_accuracy_detail");
    await db.query("TRUNCATE TABLE tbl_stock_accuracy_hdr");
  }
  TruncateTables();
  res.send('Truncating Done.');
});
module.exports = router;


