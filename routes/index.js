var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
const db = require('../models/db.js');


function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/users/login');
    }
}

router.get('/',loggedIn,function(req, res){
    const displayDasboard = async function(){
        permissions =   await db.query("SELECT module,Permission,username,WarehouseCode,FirstName,LastName,tbl_roles.Role AS `userRole` FROM tbl_user LEFT JOIN tbl_role_permission ON tbl_user.Role = tbl_role_permission.roleID LEFT JOIN tbl_roles ON tbl_user.Role = tbl_roles.ID  WHERE tbl_user.ID = ?",{ replacements: [req.user],type: db.QueryTypes.SELECT})
        if(permissions){ 
            req.session.username = permissions[0].FirstName+" "+permissions[0].LastName+" ("+permissions[0].userRole+")";
            req.session.WarehouseCode = permissions[0].WarehouseCode;
            req.session.permissions = permissions;
            const userpermissionmodule = permissions.map(permissions => permissions.module);
            console.log({userpermissionmodule});
            res.render('index',
            {
                userpermissionmodule,
                username: req.session.username
            });
            
        }else{ 
            console.log(users); 
        }
        
    }
    displayDasboard();
});

// define a route to download a file 
router.get('/download/:file(*)',(req, res) => {
    var file = req.params.file;
    var path = "";
    let newfilename = "";
    if(file=="ODOFileUploadErrors.csv")
    newfilename = "ODOFileUploadErrors";
    if(file=="ASNFileUploadErrors.csv")
    newfilename = "ASNFileUploadErrors";
    var fileLocation = './public/errors/'+file;
    console.log(fileLocation);
    res.download(fileLocation, newfilename+Date.now()+".csv"); 
  });


  router.get('/403',(req, res) => {
    res.render('../views/403'); 
  }); 
module.exports = router;