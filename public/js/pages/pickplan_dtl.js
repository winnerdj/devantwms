
$(document).on("click", "#update_pickplan_form :submit", function(event){
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

       /*   var UID_head = await $("input[name='UID_pa[]']").map(function() {
              if ($(this).val() != '')
              return $(this).val()
          }).get();
          var duplicateUID_head = await UID_head.filter(function(element, pos) {
          if(UID_head.indexOf(element) != pos){
              return true;
              }
              else{
              return false;
              }
          });
          if(duplicateUID_head!=0){
              error_list.push('<li>UID cannot be duplicate</li>');
          }*/

          var SerialNo = await $("input[name='SerialNo[]']").map(function() {
              if ($(this).val() != '')
              return $(this).val()
          }).get();
          var duplicateSerialNo = await SerialNo.filter(function(element, pos) {
          if(SerialNo.indexOf(element) != pos){
              return true;
              
              }
              else{
              return false;
              }
          });
          if(duplicateSerialNo!=0){
              error_list.push('<li>Serial No cannot be duplicate [ '+duplicateSerialNo.join(', ')+' ]</li>');
          }
          if(btnval!="Create Dispatch"){
            if($('input[name="SerialNo[]"]').filter(function () { return !!this.value;  }).length!=0){
              await $.ajax({
                url: "/pickplan/validate_serialno_status_exist",
                data: $("input[name='SerialNo[]'],[name='ItemCode[]'],[name='ShipPointCode[]'],[name='UID[]'],[name='Batch[]'],[name='LocationCode[]'],[name='PickPlanNo'],[name='ODONo']").serialize(),
                method: "POST",
                dataType:"json",
                success: function(data) {
                      if(data.NotATP.length>0)
                        {
                          error_list.push('<li>Items '+data.NotATP+' are not available</li>');
                        }
                        if(data.NotExist.length>0)
                        {
                          //error_list.push('<li>Provided combination of Serial No, Item code, Location, Batch and UID with Serial No. '+data.NotExist+' does not match in inventory. </li>');
                          for(var i in data.NotExist) {
                            error_list.push('<li>Serial no. ['+data.NotExist[i]+'] does not match the inventory.</li>');
                          }
                        }
                        
                },
                  error: function(data) {
                  console.log(data);
                }
              });
            }
            if(btnval=='Short Pick'){
              if( !$('input[name="SerialNo[]"]').length )
              {
                error_list.push('<li>You havent add item to pick.</li>');
              }else{
                await $.ajax({
                  url: "/pickplan/check_pickplan_item_count?PickPlanNo="+$("input[name='PickPlanNo']").val(),
                  method: "GET",
                  dataType:"json",
                  success: function(data) {
                      for(var i in data) {
                        if($('.item_'+data[i].ItemCode+data[i].ShipPointCode).length> data[i].ItemCount)
                        {
                          error_list.push('<li>Pick quantity is more than outbound quantity [Item Code : '+data[i].ItemCode+'  Shipment No: '+data[i].ShipPointCode+']</li>');
                        }
                      }
                  },
                  error: function(data) {
                    console.log(data);
                  }
                });
              }
            }else{
              await $.ajax({
                url: "/pickplan/check_pickplan_item_count?PickPlanNo="+$("input[name='PickPlanNo']").val(),
                method: "GET",
                dataType:"json",
                success: function(data) {
                    for(var i in data) {
                      if($('.item_'+data[i].ItemCode+data[i].ShipPointCode).length!= data[i].ItemCount)
                      {
                        error_list.push('<li>Pick qty and Outbound qty does not match [item : '+data[i].ItemCode+' Shipment No: '+data[i].ShipPointName+']</li>');
                      }
                    }
                },
                error: function(data) {
                    console.log(data);
                }
              });
            }
          }
        }
        
        
      }
      
      
      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
            let PPStatus = "";
            if(btnval=="Execute Pick"){
                PPStatus = "Picked";
            }else if(btnval=="Cancel"){
                PPStatus = "Cancelled";
            }else if(btnval=="Short Pick"){
                PPStatus = "Short Picked";
            }else if(btnval=="Create Dispatch"){
                PPStatus = "For Dispatch";
            }
          $('#submit_action').val(PPStatus);
          $("#confirmationModal").modal();
          $(document).on("click", "#confirm_btn", function(e){
            $("#update_pickplan_form").submit();
          });
          
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_pickplan_form" );
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
  
  
  $(document).on("click",".generate_pp_serial_btn",function(event){
    event.preventDefault();
    const count = $("#count_"+$(this).data("id")).val();
    const ItemCode = $("#itemcode_"+$(this).data("id")).val();
    const UID = $("#uid_"+$(this).data("id")).val();
    const Batch = $("#batch_"+$(this).data("id")).val();
    const LocationCode = $("#locationCode_"+$(this).data("id")).val();
    const ShipPointCode = $("#ShipPointCode_"+$(this).data("id")).val();
    const SalesOrderNo = $("#SalesOrderNo_"+$(this).data("id")).val();
    const PONo = $("#PONo_"+$(this).data("id")).val();
    if(!$('.added_row_'+$(this).data("id")).length || count == 0){
       $('.added_row_'+$(this).data("id")).remove();
       for(i=0;i<count;i++){
        $("#good_"+$(this).data("id")).append('<div class="row added_row_'+$(this).data("id")+"_"+i+'"><div class="col-12 col-md-6"><label>Serial No</label><input type="hidden" name="ItemCode[]" class="form-control item_'+ItemCode+ShipPointCode+'" value="'+ItemCode+'" /><input type="hidden" name="SalesOrderNo[]" class="form-control" value="'+SalesOrderNo+'" /><input type="hidden" name="PONo[]" class="form-control" value="'+PONo+'" /><input type="hidden" name="ShipPointCode[]" class="form-control" value="'+ShipPointCode+'" /><input type="hidden" name="UID[]" class="form-control childUID_'+$(this).data("id")+'" value="'+UID+'" /><input type="hidden" name="Batch[]" class="form-control childBatch_'+$(this).data("id")+'" value="'+Batch+'" /><input type="hidden" name="LocationCode[]" class="form-control childLocationCode_'+$(this).data("id")+'" value="'+LocationCode+'" /><div class="input-group"><input type="text" autocomplete="off" name="SerialNo[]" class="form-control req" required /><span class="input-group-btn"><button class="btn btn-default remove_generated_serialinput_btn btn-sm" tabindex=14000 data-id="added_row_'+$(this).data("id")+"_"+i+'"><i class="fa fa-fw fa-times"></i></button></span></div></div><hr /></div>');
      }
    }
  });

  $(document).on("click",".remove_generated_serialinput_btn",function(event){
    event.preventDefault();
    $(this).closest('.row').remove();
  });
  

