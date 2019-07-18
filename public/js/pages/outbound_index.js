$.ajax({
    url: "/outbound/outbound_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Fresh"){
                $("#outbound_fresh_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Confirmed"){
                $("#outbound_confirmed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Under Amendment"){
                $("#outbound_underamendment_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#outbound_cancelled_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Closed"){
                $("#outbound_closed_count").html(data[i].StatusCount);
            }
        }
        
        
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_outbound").submit();
  })