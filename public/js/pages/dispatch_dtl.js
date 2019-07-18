$(document).on("click", "#update_dispatch_form :submit", function(event){
    
    event.preventDefault();
    if($(this).hasClass("submit_btn")){
        let error_list = [];
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
             let DispatchStatus = "";
             if(btnval=="Confirm"){
                 DispatchStatus = "Confirmed";
                 $('#update_dispatch_form').attr('target', '');
                 $('#contactsForm').attr('action', "/dispatch/dispatch_tbl");
                }else if(btnval=="Cancel"){
                 DispatchStatus = "Cancelled";
                 $('#update_dispatch_form').attr('target', '');
                 $('#contactsForm').attr('action', "/dispatch/dispatch_tbl");
                }else if(btnval=="Generate DR"){
                 DispatchStatus = "Generate DR";
                $('#update_dispatch_form').attr('target', '_blank');
                $('#contactsForm').attr('action', "/dispatch/generatedr");
                }
             $('#submit_action').val(DispatchStatus);
             $("#confirmationModal").modal();
             $(document).on("click", "#confirm_btn", function(e){
                $("#update_dispatch_form").submit();
             });
             
         }else{
             $(".alert").remove();
             $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_dispatch_form" );
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