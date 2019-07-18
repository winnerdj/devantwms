$(document).on("click", "#update_putaway_form :submit", function(event){
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
          await $.ajax({
              url: "/location/check_validlocation",
              data: $("input[name='LocationCode[]']").serialize(),

              method: "GET",
              dataType:"json",
              success: function(data) {
                  if(data.length>0)
                  error_list.push('<li>Location Code not valid : '+data+'</li>');
              },
              error: function(data) {
                  console.log(data);
              }
          });
        }
      }
      
      
      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
            var PAStatus = "";
            if(btnval=="Putaway"){
                PAStatus = "Putaway";
            }else if(btnval=="Cancel"){
                PAStatus = "Cancelled";
            }else if(btnval=="Short Close"){
                PAStatus = "Short Closed";
            }
            $('#submit_action').val(PAStatus);
            $("#confirmationModal").modal()
            $(document).on("click", "#confirm_btn", function(e){
              $("#update_putaway_form").submit();
            });
            
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_putaway_form" );
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


  /////putaway UPLOAD
$(document).on('click',"#putawayUpload :submit",(function(e) {
  e.preventDefault();
  formData = new FormData();
 formData.append('upload_putaway', $("#upload_putaway")[0].files[0]);
  $.ajax({
  url: "/putaway/uploadputaway",
   type: "POST",
   data:  formData,
   contentType: false,
         cache: false,
   processData:false,
   beforeSend : function()
   {
    $("#err").fadeOut();
   },
   success: function(data)
      {
        for(var i in data) {
        let dataid =  $("#putaway_edit_item_tbl input[value='"+data[i].UID+"']").closest('tr').attr( "id");
        $("#"+dataid+" input[name='LocationCode[]']").val(data[i].Location)
        } 
        $('#uploadPutawayModal').modal('hide');        
        $("#putawayUpload")[0].reset(); 
      },
     error: function(e) 
      {
        $("#err").html(e).fadeIn();
      }          
    });
 }));
/////end UPLOAD