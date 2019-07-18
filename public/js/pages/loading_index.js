$.ajax({
    url: "/loading/loading_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Planned"){
                $("#loading_planned_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Short Closed"){
                $("#loading_shortclosed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Confirmed"){
                $("#loading_confirmed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#loading_cancelled_count").html(data[i].StatusCount);
            }
        }
        
        
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_loading").submit();
  })