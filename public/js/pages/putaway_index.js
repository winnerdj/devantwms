$.ajax({
    url: "/putaway/putaway_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Planned"){
                $("#putaway_planned_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Putaway"){
                $("#putaway_putaway_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#putaway_cancelled_count").html(data[i].StatusCount);
            }
        }
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_putaway").submit();
  })