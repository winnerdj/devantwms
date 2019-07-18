$.ajax({
    url: "/gr/gr_status_count",
    method: "GET",
    dataType:"json",
    success: function(data) {
        for(var i in data) {
            if(data[i].Status=="Planned"){
                $("#gr_planned_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Goods Receipt"){
                $("#gr_goodsreceipt_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Short Closed"){
                $("#gr_shortclosed_count").html(data[i].StatusCount);
            }
            if(data[i].Status=="Cancelled"){
                $("#gr_cancelled_count").html(data[i].StatusCount);
            }
        }
    },
    error: function(data) {
        console.log(data);
    }
  });

  $(document).on("click",".status-box",function(){  
      $("#Status_inp").val($(this).attr("data-id"));
      $("#filter_gr").submit();
  })