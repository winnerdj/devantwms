
$(document).on('click','.updatebatch_btn',function(){
    const thisindex = $(this).closest('tr').attr('data-index');
    $("#Batch_inp").val($("[data-index='"+thisindex+"'] td").eq(0).text());
    $("#BatchDescription_inp").val($("[data-index='"+thisindex+"'] td").eq(1).text());
    $("#ID_inp").val($(this).attr("data-id"));
})