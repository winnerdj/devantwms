
$(document).on("click", "#update_bintobin_form :submit", function(event){
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
            var bintobinStatus = "";
            if(btnval=="Cancel"){
                bintobinStatus = "Cancelled";
            }else if(btnval=="Short Close"){
                bintobinStatus = "Short Closed";
            }else if(btnval=="Execute Bin To Bin"){
                bintobinStatus = "Completed";
            }
          $('#submit_action').val(bintobinStatus);
          $("#update_bintobin_form").submit();
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_bintobin_form" );
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
  
  