
  
  $(document).on("click", "#add_btn", function(event){
    event.preventDefault();
  })
  $(document).on("click", "#search_btn", function(){
    event.preventDefault();
    $.ajax({
      url: "/stock_conversion/inventorylist",
      data: $("input[name='StockStatus'],[name='SerialNo'],[name='ItemCode'],[name='Location'],[name='Batch'],[name='Status'],[name='ID[]']").serialize(),
      method: "GET",
      dataType:"json",
      success: function(data) {
        var str = "";
        if(data.length>0){
          
          
          $.each(data, function(i, item) {
            str +="<tr id='"+data[i].ID+"'><td>"+data[i].ItemCode+"</td><td>"+data[i]['tbl_item_master.ItemDescription']+"</td><td>"+data[i].SerialNo+"</td><td>"+data[i].UID+"</td><td>"+data[i].Batch+"</td><td>"+data[i].Location+"</td><td>"+data[i].Status+"</td><td>"+data[i].StockStatus+"</td></tr>";
          });
        }else{
          str +='<tr class="nomatch"><td colspan="8" style="text-align: center">No matching records found</td></tr>';
        }
        
        
        $('#from_bintobin_tbl tbody').html(str);
      },
        error: function(data) {
        console.log(data);
      }
    });
  });
  $(document).on('click',"#from_bintobin_tbl tbody tr",function(){
    if(!$(this).hasClass("nomatch")){ 
      $("#to_bintobin_tbl tbody").append("<tr>"+$(this).html()+"<td><select name='StatusTo[]' class='form-control'><option>Good</option><option>Damaged</option><option>Aging</option><option>Defective</option></select><input type='hidden' name='ID[]' value='"+$(this).attr('id')+"' ></td><td><input type='number' class='form-control' max='1' min='0' value='1' name='QtyTo[]'></td><td><span class='glyphicon glyphicon-remove remove_row_btn' style='color:red; cursor: pointer'></span> </td></tr>");
      $("#to_bintobin_tbl tbody tr:last").find("[name='StatusTo[]']").val($(this).find('td:eq(7)').html());
      $("#to_bintobin_tbl .nomatch").remove();
      $(this).remove();
      if($("#from_bintobin_tbl tbody tr").length==0){
        $("#from_bintobin_tbl tbody").html('<tr class="nomatch"><td colspan="8" style="text-align: center">No matching records found</td></tr>');
      }
    }
  });
  $(document).on('click',".remove_row_btn",function(){
    $(this).closest("tr").remove();
    if($("#to_bintobin_tbl tbody tr").length==0){
      $("#to_bintobin_tbl tbody").html('<tr class="nomatch"><td colspan="10" style="text-align: center">No matching records found</td></tr>');
    }
  });


  $(document).on("click", "#create_stockconversionproposal_form :submit", function(event){
    event.preventDefault();
  
  
    if($(this).hasClass("submit_btn")){
      let error_list = [];
      let req_error =0;
      let btnval = $(this).val();
      async function validate(){
        var formData = $("#create_stockconversionproposal_form").serialize();
        await $.ajax({
          url: "/stock_conversion/validateStockConversion",
          data: formData,
          method: "POST",
          dataType:"json",
          success: function(data) {
              for(var i in data) {
                if($('.ItemCode_'+data[i].ItemCode).length!= data[i].ItemCount)
                {
                  error_list.push(data[i]);
                }
              }
          },
          error: function(data) {
              console.log(data);
          }
        });
      }
      
      
      function aftervalidation(){
        if (error_list === undefined || error_list.length == 0) {//if no error
          $("#create_stockconversionproposal_form").submit();
        }else{
            $(".alert").remove();
            $( '<div class="alert alert-danger" id="err_msg_div">'+error_list.join("")+'</div>').insertBefore( "#create_stockconversionproposal_form" );
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
  