
  var $table = $('#loading_edit_item_tbl');
  var $button = $('#btnget');

  $(function() {
    $button.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getData')))
      $table.bootstrapTable('getData', {useCurrentPage: false});
    })
  })
  


  window.inputEvents = {
    'change :checkbox': function (e, value, row, index) {
      let checkbx = '<input type="checkbox" checked name="check" id="'+$("[data-index='"+index+"']").attr('id')+'">';
      if($("[data-index='"+index+"'] input[type='checkbox']").prop('checked')){
        checkbx = '<input type="checkbox"  name="check" id="'+$("[data-index='"+index+"']").attr('id')+'" checked>'; 
       $('#added_'+index).remove();
       $('#added_SN'+index).remove();
      }else{
        checkbx = '<input type="checkbox"  name="check" id="'+$("[data-index='"+index+"']").attr('id')+'">';
        $("<input type='hidden' id='added_"+index+"' name='IDSC' class='forShortClose' value='"+$("[data-index='"+index+"']").attr('id')+"'><input type='hidden' id='added_SN"+index+"' name='SerialNoSC' class='forShortClose' value='"+$("#loading_edit_item_tbl [data-index='"+index+"'] td").eq("5").html()+"'>").insertAfter('#loading_edit_item_tbl');
      }
      row.shiptoname ="<span>"+$("[data-index='"+index+"'] .ShipPointName").text()+"</span>"+$("[data-index='"+index+"'] input[name='itemStatus[]']");
      row.selling = checkbx,
      $table.bootstrapTable('updateRow', {
        index: index,
        row: row
      })
    }
  }


  $(document).on("click", "#update_loading_form :submit", function(event){
    
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
                 $('#update_loading_form').attr('target', '');
                 $('#update_loading_form').attr('action', "/loading/loading_dtl");
                }else if(btnval=="Cancel"){
                 DispatchStatus = "Cancelled";
                 $('#update_loading_form').attr('target', '');
                 $('#update_loading_form').attr('action', "/loading/loading_dtl");
                }else if(btnval=="Generate Loadlist"){
                 DispatchStatus = "Generate Loadlist";
                 $('#update_loading_form').attr('target', '_blank');
                 $('#update_loading_form').attr('action', "/loading/generate_loadlist");
                }
             $('#submit_action').val(DispatchStatus);
             $("#confirmationModal").modal();
             $(document).on("click", "#confirm_btn", function(e){
              $("#update_loading_form").submit();
             });
             
         }else{
             $(".alert").remove();
             $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_loading_form" );
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