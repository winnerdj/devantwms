$(document).on("click","#add_outbounditem_btn",function(e){
    e.preventDefault();
    $("#item_tbl tbody").append('<tr data-index="'+$.now()+'"><td><input name="ItemCode[]" class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly></td><td></td><td><select name="OrderUOM[]" class="form-control" required><option>PC</option></select></td><td><input name="OrderQty[]" type="number" class="form-control req numonly"  ></td><td><input type="text" autocomplete="off" class="form-control getshippointCodeBtn req" name="ShipPointCode[]" data-toggle="modal" id="inp_shippointCode_'+$.now()+'" data-target="#shippointCodeModal" readonly></td><td><input type="text" autocomplete="off" name="SalesOrderNo[]" class="form-control req" required></td><td><input type="text" autocomplete="off" name="PONo[]" class="form-control req" required></td><td><i class="fa fa-fw fa-times item_remove_btn" style="color:red;text-align:center;"></i></td></tr>');
});
$(document).on("click",".item_remove_btn",function(e){
  e.preventDefault();
  $(this).parent().closest("tr").remove();
});

$(document).on("click", "#create_outbound_form :submit", function(event){
    event.preventDefault();
    
    if($(this).hasClass("submit_btn")){
      let error_list = [];
      let btnval = $(this).val();
      async function validate(){
        $('.req').each(function() {
        if(!$(this).val()||$.trim($(this).val()).length == 0){
              error_list.push('<li>Please fill all required fields</li>');
            return false;
          }
          
        });
        let itemship = [];
        $('input[name="ItemCode[]').each(function(key, value) {
            itemship.push($(this).val()+$('input[name="SalesOrderNo[]').eq(key).val());
        });
        
        function find_duplicate_in_array(arra1) {
          var object = {};
          var result = [];
  
          arra1.forEach(function (item) {
            if(!object[item])
              object[item] = 0;
              object[item] += 1;
          })
  
          for (var prop in object) {
             if(object[prop] >= 2) {
                 result.push(prop);
             }
          }
          return result;
      }
      if(find_duplicate_in_array(itemship).length>0){
        error_list.push('<li>Duplicate Item with the same SO No not allowed.</li>');
      }


        $('input[name="OrderQty[]').each(function() {
              if(($(this).val() != Math.floor($(this).val()) || $(this).val()<=0) && $(this).val()){
                error_list.push('<li>'+$(this).val()+' is not a valid</li>');
                return false;
             }
        });
      }
      
      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
            var GRStatus = "";
            if(btnval=="Ammend"){
              GRStatus = "Ammend";
            }else if(btnval=="Cancel"){
              GRStatus = "Cancelled";
            }else if(btnval=="Confirmed"){
              GRStatus = "Confirmed";
            }else if(btnval=="Confirm and Create Pick Plan"){
              GRStatus = "Confirm and Create Pick Plan";
            }
          $('#submit_action').val(GRStatus);
          $("#confirmationModal").modal();
          $(document).on("click", "#confirm_btn", function(e){
            $("#create_outbound_form").submit();
          });
          
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#create_outbound_form" );
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