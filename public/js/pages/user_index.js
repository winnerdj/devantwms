$(document).on('click','.updateuser_btn',function(){
    const thisindex = $(this).closest('tr').attr('data-index');
    
    $("#InpEmployeeID").val($("[data-index='"+thisindex+"'] td").eq(0).text());
    $("#InpFirstName").val($("[data-index='"+thisindex+"'] td").eq(1).text());
    $("#InpLastName").val($("[data-index='"+thisindex+"'] td").eq(2).text());
    $("#InpRole").val($("[data-index='"+thisindex+"'] td").eq(3).attr('data-role'));
    $("#ID").val($(this).attr('data-id'));
    $("#InpUsername").val($(this).attr('data-username'));
    $("#InpStatus").val($("[data-index='"+thisindex+"'] td").eq(4).text());
})
