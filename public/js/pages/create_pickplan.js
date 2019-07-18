$(document).on("click",'.create_btn',function (event) {
    event.preventDefault();
    $("#UUID_inp").val($(this).closest('td').next().next().next().attr('data-id'));
    $("#create_pickplan_form").submit();
});