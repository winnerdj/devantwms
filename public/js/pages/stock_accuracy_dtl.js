$(document).on('click',"#uploadbtn",function(e){
    e.preventDefault();
})






//scroll to error tr
$(document).on("click",".err_serial_link",function(e) {
    e.preventDefault();
    $([document.documentElement, document.body]).animate({
        scrollTop: $("#"+$(this).attr('data-id')+"_serial").offset().top
    }, 1000);
});


//submit
$(document).on("click", "#update_stock_accuracy_form :submit", function(event){
  event.preventDefault();
  if($(this).hasClass("submit_btn")){
    let error_list = [];
    let req_error =0;
    let btnval = $(this).val();

    async function validate(){
      if(btnval!="Cancel"){
        $('.req').each(function() {
        if(!$(this).val()||$.trim($(this).val()).length == 0){
              error_list.push('<li>Please fill all required fields</li>');
            return false;
          }
        });
      }
    }
    
    
    function aftervalidation(){
      if (error_list === undefined || error_list.length == 0) {//if no error
          var GRStatus = "";
          if(btnval=="Approve"){
            GRStatus = "Approved";
          }else if(btnval=="Cancel"){
            GRStatus = "Cancelled";
          }
        $('#submit_action').val(GRStatus);
        $("#update_stock_accuracy_form").submit();
      }else{
          $(".alert").remove();
          $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_stock_accuracy_form" );
          $('html, body').animate({ scrollTop: 0 }, "slow");
      }
    }
    async function process_form(){
      await validate();
      await aftervalidation();
    }
    process_form();
  }
  
});