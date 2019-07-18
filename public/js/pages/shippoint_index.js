
$(document).on('click','.updateShippointModal_btn',function(){
    const thisindex = $(this).closest('tr').attr('data-index');
    $("#ShipPointCode_inp").val($("[data-index='"+thisindex+"'] td").eq(0).text());
    $("#ShipPointName_inp").val($("[data-index='"+thisindex+"'] td").eq(1).text());
    $("#Dealer_inp").val($("[data-index='"+thisindex+"'] td").eq(2).text());
    $("#Address1_inp").val($("[data-index='"+thisindex+"'] td").eq(3).text());
    $("#Address2_inp").val($("[data-index='"+thisindex+"'] td").eq(4).text());
    $("#Address3_inp").val($("[data-index='"+thisindex+"'] td").eq(5).text());
    $("#PostalCode_inp").val($("[data-index='"+thisindex+"'] td").eq(6).text());
    $("#City_inp").val($("[data-index='"+thisindex+"'] td").eq(7).text());
    $("#State_inp").val($("[data-index='"+thisindex+"'] td").eq(8).text());
    $("#Country_inp").val($("[data-index='"+thisindex+"'] td").eq(9).text());
    $("#ContactPerson_inp").val($("[data-index='"+thisindex+"'] td").eq(10).text());
    $("#Phone1_inp").val($("[data-index='"+thisindex+"'] td").eq(11).text());
    $("#Phone2_inp").val($("[data-index='"+thisindex+"'] td").eq(12).text());
    $("#Fax_inp").val($("[data-index='"+thisindex+"'] td").eq(13).text());
    $("#Email_inp").val($("[data-index='"+thisindex+"'] td").eq(14).text());
    $("#Url_inp").val($("[data-index='"+thisindex+"'] td").eq(15).text());
    $("#WarehouseCode_inp").val($("[data-index='"+thisindex+"'] td").eq(16).text());
})