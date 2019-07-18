$(document).ready(function(){
  $("#add_row_edit_item").show();
});
$(document).on("click","#update_outbound_form",function(e){
    e.preventDefault();
    $("#item_tbl tbody").append('<tr data-index="'+$.now()+'"><td><input name="ItemCode[]" class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly></td><td></td><td><select name="OrderUOM[]" class="form-control" required><option>PC</option></select></td><td><input name="OrderQty[]" type="number" class="form-control req numonly"  ></td><td><input type="text" autocomplete="off" class="form-control getshippointCodeBtn req" name="ShipPointCode[]" data-toggle="modal" id="inp_shippointCode_'+$.now()+'" data-target="#shippointCodeModal" readonly></td><td><button class="btn btn-xs item_remove_btn">x</button></td></tr>');
});

$(document).on("click", "#update_outbound_form :submit", function(event){
    event.preventDefault();
    
    if($(this).hasClass("submit_btn")){
      let error_list = [];
      let btnval = $(this).val();
      async function validate(){
        if(btnval!="Cancel" && btnval!="Amend"){
          $('.req').each(function() {
          if(!$(this).val()||$.trim($(this).val()).length == 0){
                error_list.push('<li>Please fill all required fields</li>');
              return false;
            }
            
          });
          if(btnval!="Amend"){
            $('input[name="OrderQty[]"]').each(function() {
                  if(($(this).val() != Math.floor($(this).val()) || $(this).val()<=0) && $(this).val()){
                    error_list.push('<li> Quantity '+$(this).val()+' is not a valid</li>');
                    return false;
                  }
            });
            
          }

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
            error_list.push('<li>Duplicate Item with the same SO No is not allowed.</li>');
          }
        }
      }
      
      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
            var outboundStatus = "";
            if(btnval=="Amend"){
                outboundStatus = "Under Amendment";
            }else if(btnval=="Cancel"){
                outboundStatus = "Cancelled";
            }else if(btnval=="Confirm"){
                outboundStatus = "Confirmed";
            }else if(btnval=="Confirm and Create Pick Plan"){
                outboundStatus = "Confirm and Create Pick Plan";
            }
          $('#submit_action').val(outboundStatus);
          $("#confirmationModal").modal()
          $(document).on("click", "#confirm_btn", function(e){
            $("#update_outbound_form").submit();
          });
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_outbound_form" );
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
  $(document).on("click","#add_row_edit_item",function(e){
    e.preventDefault();
    //$("#outbound_edit_item_tbl tbody").append('<tr data-index="'+$.now()+'" ><td><input type="text" name="ItemCode[]"  class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly="" required=""></td><td class="ItemDesc" id="ItemDesc_'+$.now()+'"></td><td><select name="OrderUOM[]" class="form-control" required=""><option>PC</option></select></td><td><input type="number" name="OrderQty[]" value="1" class="form-control req" required=""></td><td><input type="text" name="ShipPointCode[]"  class="form-control getshippointCodeBtn req" data-toggle="modal" id="inp_shippointCode_'+$.now()+'" data-target="#shippointCodeModal" required="" readonly=""></td><td><button class="btn btn-xs btn-danger item_remove_btn">x</button></td></tr>');
    $("#outbound_edit_item_tbl").bootstrapTable('insertRow', {
      index: 0,
      row: {
        id: '<input type="text" autocomplete="off" name="ItemCode[]"  class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly="" required="">',
        itemDescription:'',
        UOM: '<select name="OrderUOM[]" class="form-control" required=""><option>PC</option></select>',
        QTY: '<input type="number" name="OrderQty[]" class="form-control req" required="">',
        ShipTo: '<input type="text" autocomplete="off" name="ShipPointCode[]"  class="form-control getshippointCodeBtn req" data-toggle="modal" id="inp_shippointCode_'+$.now()+'" data-target="#shippointCodeModal" required="" readonly="">',
        SalesOrderNo: '<input type="text" autocomplete="off" name="SalesOrderNo[]"  class="form-control  req"  id="inp_SalesOrderNo_'+$.now()+'" required >',
        PONo: '<input type="text" autocomplete="off" name="PONo[]"  class="form-control  req"  id="inp_PONo_'+$.now()+'" required >',
        ops: '<a class="remove" href="javascript:void(0)" title="Remove"><i class="fa fa-trash"></i></a>'
      }
    })
  });

  $(document).on("change","#outbound_edit_item_tbl :input",function(e){
    const thisindex = $(this).closest("tr").attr("data-index");
    const ItemCodeValue = $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='ItemCode[]'").val();
    const itemDescriptionValue = $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] td:eq(1)").html();
    const ShipToValue= $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='ShipPointCode[]'").val();
    const QTYValue= $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='OrderQty[]'").val();
    const SalesOrderNoValue= $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='SalesOrderNo[]']").val();
    const PONoNoValue= $("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='PONo[]'").val();
    let rowid = "";
    if($("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID'").length>0){
       rowid = '<input type="hidden" name="ID" value="'+$("#outbound_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID'").val()+'" class="form-control req">';
    }
    $("#outbound_edit_item_tbl").bootstrapTable('updateRow', {
      index: thisindex,
      row: {
        id: rowid+'<input type="text" autocomplete="off" name="ItemCode[]" value="'+ItemCodeValue+'" class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly="" required="">',
        itemDescription: itemDescriptionValue,
        QTY: '<input type="number" name="OrderQty[]" class="form-control req" value="'+QTYValue+'" required="">',
        ShipTo: '<input type="text" autocomplete="off" name="ShipPointCode[]"  class="form-control getshippointCodeBtn req" data-toggle="modal" id="inp_shippointCode_'+$.now()+'" value="'+ShipToValue+'" data-target="#shippointCodeModal" required="" readonly="">',
        SalesOrderNo: '<input type="text" autocomplete="off" name="SalesOrderNo[]" value="'+SalesOrderNoValue+'" class="form-control  req"  id="inp_SalesOrderNo_'+$.now()+'" required >',
        PONo: '<input type="text" autocomplete="off" name="PONo[]" value="'+PONoNoValue+'" class="form-control  req"  id="inp_PONo_'+$.now()+'" required >',
      }
    })
  });


  
