$.ajax({
    url: "/asn/asn_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Fresh"){
                $("#asn_fresh_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Confirmed"){
                $("#asn_confirmed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Under Amendment"){
                $("#asn_underamendment_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#asn_cancelled_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Closed"){
                $("#asn_closed_count").html(data[i].StatusCount);
            }
        }
        
        
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_asn").submit();
  })