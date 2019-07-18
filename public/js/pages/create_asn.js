$(document).on("click", "#createasn  :submit", function(e){
    event.preventDefault();
    if($(this).hasClass("submit_btn")){
        let error_list = [];
        $('.req').each(function() {
            if(!$(this).val()||$.trim($(this).val()).length == 0){
                error_list.push('<li>Please fill all required fields</li>');
               return false;
            }
        });
        if (error_list === undefined || error_list.length == 0) {//if no error
            $("#confirmationModal").modal()
            $(document).on("click", "#confirm_btn", function(e){
                $("#createasn").submit();
            });
            
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list+'</div>').insertBefore( "#createasn" );
        }
    }
});
$(document).on("click","#add_item_btn",function(e){
    e.preventDefault();
    $("#item_tbl tbody").append('<tr data-index="'+$.now()+'"><td><input type="hidden" name="ID[]"><input name="ItemCode[]" class="form-control getItemCodeBtn req" data-toggle="modal" id="inp_ItemCode_'+$.now()+'" data-target="#itemCodeModal" readonly required><input type="hidden" name="OrderUOM[]" value="PC" class="form-control" req><input name="OrderQty[]" type="hidden" class="form-control" value = 1 readonly required></td><td> </td><td><input name="SerialNo[]" class="form-control" required></td><td><select name="Batch[]" class="form-control"  ><option></option><option value="Green">Green</option><option value="Pink">Pink</option><option value="Yellow">Yellow</option><option value="Orange">Orange</option></select></td><td><i class="fa fa-fw fa-times added_item_remove_btn" style="color:red;text-align:center;"></i></tr>');
});


  $(document).on("click",".added_item_remove_btn",function(e){
    e.preventDefault();
    $(this).closest("tr").remove();
  }); 
