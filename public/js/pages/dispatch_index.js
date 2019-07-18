$.ajax({
    url: "/dispatch/dispatch_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Planned"){
                $("#dispatch_planned_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Confirmed"){
                $("#dispatch_confirmed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#dispatch_cancelled_count").html(data[i].StatusCount);
            }
        }
        
        
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_dispatch").submit();
  })