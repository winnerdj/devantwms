


$(document).on("click",".generate_uid_btn",function(event){
  event.preventDefault();
  const count = $("#count_"+$(this).data("id")).val();
  const ItemCode = $("#itemcode_"+$(this).data("id")).val();
  const UID = $("#uid_"+$(this).data("id")).val();
  const Batch = $("#batch_"+$(this).data("id")).val();
  if(!$('.added_row_'+$(this).data("id")).length || count == 0){
     $('.added_row_'+$(this).data("id")).remove();
    for(i=0;i<count;i++){
      $("#good_"+$(this).data("id")).append('<div class="row added_row_'+$(this).data("id")+"_"+i+'"><div class="col-12 col-md-6"><label>Serial No</label><input type="hidden" name="ItemCode[]" class="form-control ItemCode_'+ItemCode+'" value="'+ItemCode+'" /><input type="hidden" name="UID[]" class="form-control childUID_'+$(this).data("id")+'" value="'+UID+'" /><input type="hidden" name="Batch[]" class="form-control childBatch_'+$(this).data("id")+'" value="'+Batch+'" /><div class="input-group"><input type="text" autocomplete="off" name="SerialNo[]" class="form-control req" required /><input type="hidden" name="StockStatus[]" class="form-control"  value="Good" readonly required><span class="input-group-btn"><button class="btn btn-default remove_generated_serialinput_btn btn-sm" tabindex=14000 data-id="added_row_'+$(this).data("id")+"_"+i+'"><i class="fa fa-fw fa-times"></i></button></span></div></div><hr /></div>');
    }
  }
});
$(document).on("click",".generate_dmg_uid_btn",function(event){
  event.preventDefault();
  const count = $("#dmg_count_"+$(this).data("id")).val();
  const ItemCode = $("#itemcode_"+$(this).data("id")).val();
  const UID = $("#dmguid_"+$(this).data("id")).val();
  const Batch = $("#dmgbatch_"+$(this).data("id")).val();
  if(!$('.added_row_'+$(this).data("id")).length || count == 0){
     $('.added_row_'+$(this).data("id")).remove();
    for(i=0;i<count;i++){
      $("#dmg_"+$(this).data("id")).append('<div class="row added_dmg_row_'+$(this).data("id")+"_"+i+'"><div class="col-12 col-md-6"><label>Serial No</label><input type="hidden" name="ItemCode[]" class="form-control ItemCode_'+ItemCode+'" value="'+ItemCode+'" /><input type="hidden" name="UID[]" class="form-control dmgchildUID_'+$(this).data("id")+'" value="'+UID+'" /><input type="hidden" name="Batch[]" class="form-control dmgchildBatch_'+$(this).data("id")+'" value="'+Batch+'" /><input type="hidden" name="StockStatus[]" class="form-control"  value="Damaged" readonly required><div class="input-group"><input type="text" autocomplete="off" name="SerialNo[]" class="form-control req" required /><span class="input-group-btn"><button class="btn btn-default remove_generated_serialinput_btn btn-sm" tabindex=14000 data-id="added_row_'+$(this).data("id")+"_"+i+'"><i class="fa fa-fw fa-times"></i></button></span></div></div><hr /></div>');
    }
  }
});



$(document).on("click",".remove_generated_serialinput_btn",function(event){
    event.preventDefault();
    $(this).closest('.row').remove();
});