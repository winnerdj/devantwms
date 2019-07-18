
$(document).on('click','.updateitem_btn',function(){
    const thisindex = $(this).closest('tr').attr('data-index');
    $("#UItemCode").val($("[data-index='"+thisindex+"'] td").eq(0).text());
    $("#UItemDescription").val($("[data-index='"+thisindex+"'] td").eq(1).text());
    $("#UItemCategory").val($("[data-index='"+thisindex+"'] td").eq(2).text());
    $("#UCaseBarcode").val($("[data-index='"+thisindex+"'] td").eq(3).text());
    $("#ULength").val($("[data-index='"+thisindex+"'] td").eq(4).text());
    $("#UHeight").val($("[data-index='"+thisindex+"'] td").eq(5).text());
    $("#UWidth").val($("[data-index='"+thisindex+"'] td").eq(6).text());
    $("#UVolume").val($("[data-index='"+thisindex+"'] td").eq(7).text());
    $("#UWeight").val($("[data-index='"+thisindex+"'] td").eq(8).text());
    $("#UStatus").val($("[data-index='"+thisindex+"'] td").eq(9).text());
    $("#UWarehouseCode").val($("[data-index='"+thisindex+"'] td").eq(10).text());
})