
$(document).on('click','.updatelocation_btn',function(){
    const thisindex = $(this).closest('tr').attr('data-index');
    $("#ULocationCode").val($("[data-index='"+thisindex+"'] td").eq(0).text());
    $("#ULocationDescription").val($("[data-index='"+thisindex+"'] td").eq(1).text());
    $("#ULocationType").val($("[data-index='"+thisindex+"'] td").eq(2).text());
    $("#UStatus").val($("[data-index='"+thisindex+"'] td").eq(3).text());
})