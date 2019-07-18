var stock_accuracy_hdr = require('../models/stock_accuracy_hdr.js');
exports.checkSAStatus = function(req, res,next) {
    stock_accuracy_hdr.count({
        where:{
            Status: 'Planned'
        }
    }).then((stock_accuracy_hdr)=>{
        if (stock_accuracy_hdr==0) {
            next();
        }else{
            req.flash('error_msg','Cannot create transaction. Open Stock Accuracy detected.');
            const backURL=req.header('Referer') || '/';
            res.redirect(backURL);
        }
    })
};

