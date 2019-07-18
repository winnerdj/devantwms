$(document).on("click",'.create_btn',function () {
    $("#UUID_inp").val($(this).closest('td').next().next().next().attr('data-id'));
    $("#create_loading_form").submit();
});