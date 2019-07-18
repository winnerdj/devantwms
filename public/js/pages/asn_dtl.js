$(document).ready(function(){
  $("#add_row_edit_item").show();
});
$(document).on("click", "#update_asn_form :submit", function(event){
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
        }
      }

      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
            var ASNStatus = "";
            if(btnval=="Amend"){
                ASNStatus = "Under Amendment";
            }else if(btnval=="Cancel"){
              ASNStatus = "Cancelled";
            }else if(btnval=="Confirm"){
              ASNStatus = "Confirmed";
            }else if(btnval=="Confirm and Create Goods Receipt"){
              ASNStatus = "Confirm and Create Goods Receipt";
            }
            $('#submit_action').val(ASNStatus);
            
            $("#confirmationModal").modal()
            $(document).on("click", "#confirm_btn", function(e){
              $("#update_asn_form").submit();
            });
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#update_asn_form" );
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
    const rand_id = Math.floor(Math.random() * 10)+""+$.now(); 
    $('<input type="hidden"  name="ItemCode[]" id="ItemCode_hid_'+rand_id+'"><input type="hidden" value="new" name="ID[]" id="ID_hid_'+rand_id+'"><input type="hidden"  name="SerialNo[]" id="SerialNo_hid_'+rand_id+'"><input type="hidden" name="Batch[]" id="Batch_hid_'+rand_id+'"><input type="hidden" value="PCS" name="OrderUOM[]" id="OrderUOM_hid_'+rand_id+'"><input type="hidden" value="1" name="OrderQty[]" id="OrderQty_hid_'+rand_id+'">').insertBefore("#asn_edit_item_tbl")
           
    //$("#asn_edit_item_tbl tbody").append('<tr data-index="'+$.now()+'" ><td><input type="hidden" name="OrderUOM[]" value="PC" class="form-control req"><input name="OrderQty[]" type="hidden" value="1" class="form-control" required><input type="text" name="ItemCode[]"  class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly="" required=""></td><td class="ItemDesc" id="ItemDesc_'+$.now()+'"></td><td><input name="SerialNo[]" class="form-control" required></td><td><select name="Batch[]" class="form-control" ><option></option><option>Green</option><option>Red</option><option>Orange</option></select><input type="hidden" name="GRItemStatus[]" value="not included in ASN"></td><td><button class="btn btn-xs btn-danger item_remove_btn">x</button></td></tr>');
    $("#asn_edit_item_tbl").bootstrapTable('insertRow', {
        index: 0,
        row: {
          id: '<input type="hidden" name="ID_dm[]" value="'+rand_id+'" id="ID_sh_'+rand_id+'" data-id="'+rand_id+'" value="'+rand_id+'" class="form-control req"><input type="hidden" name="OrderUOM_dm[]" value="PCS" class="form-control req"><input name="OrderQty_dm[]" type="hidden" value="1" class="form-control" required><input type="text" autocomplete="off" name="ItemCode_dm[]"  class="form-control getItemCodeBtn req" data-toggle="modal" id="ItemCode_sh_'+rand_id+'" data-target="#itemCodeModal" readonly="" required="">',
          itemDescription:'',
          SerialNo: '<input name="SerialNo_dm[]" id="SerialNo_sh_'+rand_id+'" class="form-control" required>',
          Batch: '<select name="Batch_dm[]" class="form-control" id="Batch_sh_'+rand_id+'"><option></option><option value="Green">Green</option><option value="Pink">Pink</option><option value="Yellow">Yellow</option><option value="Orange">Orange</option><option value="No Batch">No Batch</option></select>',
          ops: '<i class="fa fa-fw fa-times" style="color:red;float:right;margin-top:-10px;"></i>'
        }
      })
      

            
            
            
      
  });

  $(document).on("change","#asn_edit_item_tbl :input",function(e){
    const thisindex = $(this).closest("tr").attr("data-index");
    const SerialNonValue = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='SerialNo_dm[]'").val();
    const ItemCodeValue = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] input[name='ItemCode_dm[]'").val();
    const itemDescriptionValue = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] td:eq(1)").html();
    const BatchStr= $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] td:eq(3)").html();
    const BatchValue = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] [name='Batch_dm[]'").val();
    const IDValue = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID_dm[']").val();
    const IDdataid = $("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID_dm[]']").attr("data-id");
    var res = BatchStr.replace('selected=""', "").replace(">"+BatchValue, " selected='' >"+BatchValue);
    let rowid = "";
    $("#ItemCode_hid_"+IDdataid).val(ItemCodeValue)
    $("#SerialNo_hid_"+IDdataid).val(SerialNonValue)
    $("#Batch_hid_"+IDdataid).val(BatchValue)
    if($("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID_dm[]'] ").length>0){
       rowid = '<input type="hidden" name="ID_dm[]" id="ID_sh_'+IDValue+'" data-id="'+IDdataid+'" value="'+$("#asn_edit_item_tbl tr[data-index='"+thisindex+"'] [name='ID[]']").val()+'" class="form-control req">';
    }
    $("#asn_edit_item_tbl").bootstrapTable('updateRow', {
      index: thisindex,
      row: {
        id: rowid+'<input type="hidden" name="OrderUOM_dm[]" value="PCS" class="form-control req"><input name="OrderQty_dm[]" type="hidden" value="1" class="form-control" required><input type="text" autocomplete="off" name="ItemCode_dm[]" value="'+ItemCodeValue+'" class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly="" required="">',
        itemDescription: itemDescriptionValue,
        SerialNo: '<input name="SerialNo_dm[]" id="SerialNo_sh_'+IDValue+'" class="form-control" value = "'+SerialNonValue+'" required>',
        Batch: res
      }
    })
  });