
const db = require('../models/db.js');
var user = require('../models/user.js');
exports.loggedIn = function(req, res,next) {
    if (req.user) {
        console.log('true');
        next();
    }else{
        console.log('false');
        res.redirect('/users/login');
    }
};

exports.isPermitted = async function(thisuser,thismodule){
    let  = "true";
    users = await  db.query("SELECT count(*) as `count` FROM tbl_user_role LEFT JOIN tbl_role_permission ON tbl_user_role.roleID = tbl_role_permission.roleID WHERE userID = ? AND module = ? AND PERMISSION IS NOT NULL",{ replacements: [thisuser,thismodule],type: db.QueryTypes.SELECT})
    if(users[0].count>0){ 
        return true; 
    }else{ 
        return false;  ;
    }
    
}