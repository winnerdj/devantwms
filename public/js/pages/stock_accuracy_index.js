$(document).on("click", "#create_stock_accuracy :submit", function(event){
    event.preventDefault();
      async function process_form(){
        $("input[name='action']").val("create stock accuracy plAn");
        $("#confirmationModal").modal() 
        $(document).on("click", "#confirm_btn", function(e){
            $("#create_stock_accuracy").submit();
        });
      }
      process_form();
});