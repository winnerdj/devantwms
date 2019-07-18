$.ajax({
    url: "/pickplan/pickplan_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Planned"){
                $("#pickplan_planned_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Picked"){
                $("#pickplan_picked_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Short Picked"){
                $("#pickplan_shortpicked_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#pickplan_cancelled_count").html(data[i].StatusCount);
            }
        }
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_pickplan").submit();
  })