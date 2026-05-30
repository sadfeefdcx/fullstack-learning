// ============================================================
// modals.js - 弹窗管理层 (v2.2)
// ============================================================

var App = App || {};

App._modal = function(id, title, bodyHtml, footerHtml) {
  var m = document.createElement('div');
  m.className = 'modal-overlay'; m.id = id;
  m.innerHTML = '<div class="modal"><div class="modal-header"><h3>'+title+'</h3><span class="modal-close" onclick="App.closeModal(\''+id+'\')">×</span></div><div class="modal-body">'+bodyHtml+'</div>'+(footerHtml?'<div class="modal-footer">'+footerHtml+'</div>':'')+'</div>';
  document.body.appendChild(m);
  return m;
};

// ── 新建模型 ──
App.showNewModelModal = function() {
  var h = '<div class="form-row"><div class="form-group"><label>模型名称</label><input type="text" id="nmName" placeholder="留空自动生成"></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>品种 <span class="required">*</span></label><select id="nmVariety">'+App.selOpts(Object.keys(App.VARIETIES))+'</select></div>';
  h += '<div class="form-group"><label>苗龄(年) <span class="required">*</span></label><input type="number" id="nmAge" value="3" min="1" max="30"></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>砧木类型</label><select id="nmRootType">'+App.selOpts(App.ROOTSTOCK_TYPES)+'</select></div>';
  h += '<div class="form-group"><label>砧木品种</label><select id="nmRootVar">'+App.selOpts(App.ROOTSTOCK_VARS)+'</select></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>栽培密度</label><select id="nmDensity">'+App.selOpts(App.DENSITY_TYPES)+'</select></div>';
  h += '<div class="form-group"><label>支架模式</label><select id="nmTrellis">'+App.selOpts(App.TRELLIS_TYPES)+'</select></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>备注</label><textarea id="nmNote" rows="2"></textarea></div></div>';
  App._modal('newModelModal','新建生长模型',h,'<button class="btn" id="btnCreateModel">创建模型</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newModelModal\')">取消</button>');
  App.byId('btnCreateModel').addEventListener('click', App.createModel);
};

App.createModel = function() {
  var state = App.appState; var id = 'M'+Date.now();
  var variety = App.byId('nmVariety').value;
  var age = parseInt(App.byId('nmAge').value)||3;
  var m = {
    id:id, name:App.byId('nmName').value.trim(), variety:variety, seedlingAge:age,
    rootstockType:App.byId('nmRootType').value, rootstockVar:App.byId('nmRootVar').value,
    densityType:App.byId('nmDensity').value, trellis:App.byId('nmTrellis').value,
    note:App.byId('nmNote').value.trim(), phases:App.makeDefaultPhases(),
    indicators:App.populateIndicators(variety, age), operations:App.defaultOperations(),
    _operationsSeeded:true, createdAt:new Date().toISOString()
  };
  state.models[id]=m; state.currentModelId=id; state.saveAll();
  App.closeModal('newModelModal'); App.renderSidebar(); App.renderMain();
  App.showToast('模型创建成功（指标已自动适配'+variety+'品种）','success');
};

// ── 编辑模型 ──
App.showEditModelModal = function() {
  var m = App.appState.models[App.appState.currentModelId]; if(!m)return;
  var h = '<div class="form-row"><div class="form-group"><label>模型名称</label><input type="text" id="emName" value="'+(m.name||'')+'"></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>品种</label><select id="emVariety">'+App.selOpts(Object.keys(App.VARIETIES),m.variety)+'</select></div>';
  h += '<div class="form-group"><label>苗龄</label><input type="number" id="emAge" value="'+m.seedlingAge+'" min="1" max="30"></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>砧木类型</label><select id="emRootType">'+App.selOpts(App.ROOTSTOCK_TYPES,m.rootstockType)+'</select></div>';
  h += '<div class="form-group"><label>砧木品种</label><select id="emRootVar">'+App.selOpts(App.ROOTSTOCK_VARS,m.rootstockVar)+'</select></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>密度</label><select id="emDensity">'+App.selOpts(App.DENSITY_TYPES,m.densityType)+'</select></div>';
  h += '<div class="form-group"><label>支架</label><select id="emTrellis">'+App.selOpts(App.TRELLIS_TYPES,m.trellis)+'</select></div></div>';
  h += '<div class="form-row"><div class="form-group"><label>备注</label><textarea id="emNote" rows="2">'+(m.note||'')+'</textarea></div></div>';
  App._modal('editModelModal','编辑生长模型',h,'<button class="btn" id="btnSaveEditModel">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editModelModal\')">取消</button>');
  App.byId('btnSaveEditModel').addEventListener('click', function(){
    m.name=App.byId('emName').value.trim();m.variety=App.byId('emVariety').value;m.seedlingAge=parseInt(App.byId('emAge').value)||3;
    m.rootstockType=App.byId('emRootType').value;m.rootstockVar=App.byId('emRootVar').value;
    m.densityType=App.byId('emDensity').value;m.trellis=App.byId('emTrellis').value;m.note=App.byId('emNote').value.trim();
    App.appState.saveAll();App.closeModal('editModelModal');App.renderSidebar();App.renderMain();App.showToast('模型已更新','success');
  });
};

App.deleteModel = function(id) {
  if(!confirm('确定删除此模型？'))return;
  delete App.appState.models[id];if(App.appState.currentModelId===id)App.appState.currentModelId=null;
  App.appState.saveAll();App.renderSidebar();App.renderMain();App.showToast('模型已删除','info');
};

App.cloneModel = function() {
  var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
  var id='M'+Date.now();state.models[id]=JSON.parse(JSON.stringify(m));
  state.models[id].id=id;state.models[id].name=(m.name||App.modelTitle(m))+' (副本)';
  state.currentModelId=id;state.saveAll();App.renderSidebar();App.renderMain();App.showToast('模型已复制','success');
};

// ── 物候期编辑 ──
App.showEditPhasesModal = function() {
  var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
  var h='<p style="font-size:12px;color:var(--muted);margin-bottom:8px">自定义物候期的BBCH编码范围和时间窗口。</p>';
  h+='<table class="data-table" style="font-size:12px" id="epTable"><thead><tr><th>阶段</th><th>名称</th><th>BBCH起</th><th>BBCH止</th><th>起月</th><th>起旬</th><th>止月</th><th>止旬</th><th>天</th><th style="width:40px"></th></tr></thead><tbody id="epTbody">';
  m.phases.forEach(function(p,i){h+=App._phaseRowHtml(p,i);});
  h+='</tbody></table><div style="margin-top:8px"><button class="btn btn-sm" id="btnAddPhase">+ 添加阶段</button></div>';
  App._modal('editPhasesModal','编辑物候期',h,'<button class="btn" id="btnSavePhases">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editPhasesModal\')">取消</button>');
  App.byId('btnAddPhase').addEventListener('click',function(){
    var tbody=App.byId('epTbody');var idx=tbody.children.length;
    var newPhase={id:'P'+(idx+1),name:'新阶段',bbchStart:0,bbchEnd:99,sm:1,sp:'上旬',em:12,ep:'下旬',dur:30};
    m.phases.push(newPhase);var tr=document.createElement('tr');tr.innerHTML=App._phaseRowHtml(newPhase,idx);tbody.appendChild(tr);
  });
  App.byId('epTbody').addEventListener('click',function(e){
    var del=e.target.closest('.ep-del');if(!del)return;
    var idx=parseInt(del.dataset.idx);if(m.phases.length<=1){App.showToast('至少保留一个阶段','error');return;}
    if(!confirm('确定删除？'))return;m.phases.splice(idx,1);
    var tbody=App.byId('epTbody');tbody.innerHTML='';m.phases.forEach(function(p,i){var tr=document.createElement('tr');tr.innerHTML=App._phaseRowHtml(p,i);tbody.appendChild(tr);});
  });
  App.byId('btnSavePhases').addEventListener('click',function(){
    var rows=App.byId('epTbody').querySelectorAll('tr');m.phases=[];
    rows.forEach(function(tr){
      m.phases.push({id:tr.querySelector('.ep-id').value,name:tr.querySelector('.ep-name').value,bbchStart:parseInt(tr.querySelector('.ep-bs').value)||0,bbchEnd:parseInt(tr.querySelector('.ep-be').value)||99,sm:parseInt(tr.querySelector('.ep-sm').value)||1,sp:tr.querySelector('.ep-sp').value,em:parseInt(tr.querySelector('.ep-em').value)||12,ep:tr.querySelector('.ep-ep').value,dur:parseInt(tr.querySelector('.ep-dur').value)||30});
    });
    state.saveAll();App.closeModal('editPhasesModal');App.renderMain();App.showToast('物候期已更新','success');
  });
};

App._phaseRowHtml = function(p,i) {
  return '<td><input type="text" class="ep-id" data-idx="'+i+'" value="'+p.id+'" style="width:40px;font-size:11px"></td>'+
    '<td><input type="text" class="ep-name" data-idx="'+i+'" value="'+p.name+'" style="width:100px"></td>'+
    '<td><input type="number" class="ep-bs" data-idx="'+i+'" value="'+p.bbchStart+'" min="0" max="99" style="width:50px"></td>'+
    '<td><input type="number" class="ep-be" data-idx="'+i+'" value="'+p.bbchEnd+'" min="0" max="99" style="width:50px"></td>'+
    '<td><input type="number" class="ep-sm" data-idx="'+i+'" value="'+p.sm+'" min="1" max="12" style="width:50px"></td>'+
    '<td><select class="ep-sp" data-idx="'+i+'">'+App.selOpts(App.PERIODS,p.sp)+'</select></td>'+
    '<td><input type="number" class="ep-em" data-idx="'+i+'" value="'+p.em+'" min="1" max="12" style="width:50px"></td>'+
    '<td><select class="ep-ep" data-idx="'+i+'">'+App.selOpts(App.PERIODS,p.ep)+'</select></td>'+
    '<td><input type="number" class="ep-dur" data-idx="'+i+'" value="'+p.dur+'" min="1" style="width:50px"></td>'+
    '<td><button class="btn btn-sm ep-del" data-idx="'+i+'" style="color:var(--danger);padding:2px 6px">×</button></td>';
};

// ── 编辑指标 ──
App.showEditIndicatorModal = function(idx) {
  var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
  var ind=m.indicators[idx];if(!ind)return;
  var panelCat=App.getPanelName([ind.id,ind.name,ind.category,ind.type]);
  var h='<div class="form-row"><div class="form-group"><label>指标名称</label><input type="text" id="eiName" value="'+ind.name+'"></div>';
  h+='<div class="form-group"><label>编号</label><input type="text" id="eiId" value="'+ind.id+'"'+(ind.isCustom?'':' readonly style="background:#f5f5f5"')+'></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>类别</label><select id="eiCategory">'+App.indCatOptions(panelCat,ind.category)+'</select></div>';
  h+='<div class="form-group"><label>类型</label><input type="text" id="eiType" value="'+(ind.type||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>单位</label><select id="eiUnit">'+App.indUnitOptions(panelCat,ind.unit)+'</select></div>';
  h+='<div class="form-group"><label>BBCH起</label><input type="number" id="eiBs" value="'+ind.bbchStart+'" min="0" max="99"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="eiBe" value="'+ind.bbchEnd+'" min="0" max="99"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>参考范围</label><input type="text" id="eiRef" value="'+(ind.refRange||'')+'"></div></div>';
  h+='<hr><h4>阈值设置</h4>';
  h+='<div class="form-row"><div class="form-group"><label>🟢 适宜下限</label><input type="text" id="eiOptL" value="'+(ind.optLow||'')+'"></div>';
  h+='<div class="form-group"><label>🟢 适宜上限</label><input type="text" id="eiOptH" value="'+(ind.optHigh||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>🟡 预警下限</label><input type="text" id="eiAlertL" value="'+(ind.alertLow||'')+'"></div>';
  h+='<div class="form-group"><label>🟡 预警上限</label><input type="text" id="eiAlertH" value="'+(ind.alertHigh||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>🟠 行动下限</label><input type="text" id="eiActionL" value="'+(ind.actionLow||'')+'"></div>';
  h+='<div class="form-group"><label>🟠 行动上限</label><input type="text" id="eiActionH" value="'+(ind.actionHigh||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>🔴 危害下限</label><input type="text" id="eiDamageL" value="'+(ind.damageLow||'')+'"></div>';
  h+='<div class="form-group"><label>🔴 危害上限</label><input type="text" id="eiDamageH" value="'+(ind.damageHigh||'')+'"></div></div>';
  App._modal('editIndModal','编辑指标: '+ind.name,h,'<button class="btn" id="btnSaveInd">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editIndModal\')">取消</button>');
  App.byId('btnSaveInd').addEventListener('click',function(){
    ind.name=App.byId('eiName').value;ind.id=App.byId('eiId').value;ind.category=App.byId('eiCategory').value;
    ind.type=App.byId('eiType').value;ind.unit=App.byId('eiUnit').value;
    ind.bbchStart=parseInt(App.byId('eiBs').value)||0;ind.bbchEnd=parseInt(App.byId('eiBe').value)||99;
    ind.refRange=App.byId('eiRef').value;
    ind.optLow=App.byId('eiOptL').value;ind.optHigh=App.byId('eiOptH').value;
    ind.alertLow=App.byId('eiAlertL').value;ind.alertHigh=App.byId('eiAlertH').value;
    ind.actionLow=App.byId('eiActionL').value;ind.actionHigh=App.byId('eiActionH').value;
    ind.damageLow=App.byId('eiDamageL').value;ind.damageHigh=App.byId('eiDamageH').value;
    state.saveAll();App.closeModal('editIndModal');App.renderMain();App.showToast('指标已更新','success');
  });
};

// ── 添加指标 ──
App.showAddIndicatorModal = function(panelCat) {
  var h='<div class="form-row"><div class="form-group"><label>指标名称 <span class="required">*</span></label><input type="text" id="aiName"></div>';
  h+='<div class="form-group"><label>编号</label><input type="text" id="aiId" value="CUS-'+Date.now()+'" readonly style="background:#f5f5f5"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>类别</label><select id="aiCategory">'+App.indCatOptions(panelCat)+'</select></div>';
  h+='<div class="form-group"><label>类型</label><input type="text" id="aiType" value="表征指标"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>单位</label><select id="aiUnit">'+App.indUnitOptions(panelCat)+'</select></div>';
  h+='<div class="form-group"><label>BBCH起</label><input type="number" id="aiBs" value="0"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="aiBe" value="99"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>参考范围</label><input type="text" id="aiRef"></div></div>';
  App._modal('addIndModal','添加指标',h,'<button class="btn" id="btnAddInd">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addIndModal\')">取消</button>');
  App.byId('btnAddInd').addEventListener('click',function(){
    var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
    var name=App.byId('aiName').value.trim();if(!name){App.showToast('请输入名称','error');return;}
    m.indicators.push({id:App.byId('aiId').value,name:name,category:App.byId('aiCategory').value,type:App.byId('aiType').value,unit:App.byId('aiUnit').value,bbchStart:parseInt(App.byId('aiBs').value)||0,bbchEnd:parseInt(App.byId('aiBe').value)||99,refRange:App.byId('aiRef').value,optLow:'',optHigh:'',alertLow:'',alertHigh:'',actionLow:'',actionHigh:'',damageLow:'',damageHigh:'',enabled:true,isCustom:true});
    state.saveAll();App.closeModal('addIndModal');App.renderMain();App.showToast('已添加','success');
  });
};

// ── 添加/编辑作业 ──
App.showAddOperationModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>作业名称 <span class="required">*</span></label><input type="text" id="aoName"></div>';
  h+='<div class="form-group"><label>类型</label><select id="aoCat">'+App.selOpts(App.OP_CATEGORIES)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>目的</label><textarea id="aoPurpose" rows="2"></textarea></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>方式</label><div id="aoMethods">'+App.OP_METHODS.map(function(m){return '<label style="display:inline-block;margin-right:8px;font-size:12px"><input type="checkbox" class="ao-method" value="'+m+'"> '+m+'</label>';}).join('')+'</div></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>BBCH起</label><input type="number" id="aoBs" value="0"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="aoBe" value="99"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>物料(元/亩)</label><input type="text" id="aoMat" value="0"></div>';
  h+='<div class="form-group"><label>人工(元/亩)</label><input type="text" id="aoLab" value="0"></div>';
  h+='<div class="form-group"><label>设备(元/亩)</label><input type="text" id="aoEquip" value="0"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>标准</label><textarea id="aoStd" rows="3"></textarea></div></div>';
  App._modal('addOpModal','添加作业',h,'<button class="btn" id="btnAddOp">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addOpModal\')">取消</button>');
  App.byId('btnAddOp').addEventListener('click',function(){
    var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
    var name=App.byId('aoName').value.trim();if(!name){App.showToast('请输入名称','error');return;}
    var methods=[];App.qsa('.ao-method:checked').forEach(function(cb){methods.push(cb.value);});
    m.operations.push({id:'OP_CUS_'+Date.now(),category:App.byId('aoCat').value,name:name,purpose:App.byId('aoPurpose').value,methods:methods,bbchStart:parseInt(App.byId('aoBs').value)||0,bbchEnd:parseInt(App.byId('aoBe').value)||99,materialCost:App.byId('aoMat').value,laborCost:App.byId('aoLab').value,equipCost:App.byId('aoEquip').value,standard:App.byId('aoStd').value,enabled:true});
    state.saveAll();App.closeModal('addOpModal');App.renderMain();App.showToast('已添加','success');
  });
};

App.showEditOperationModal = function(idx) {
  var state=App.appState;var m=state.models[state.currentModelId];if(!m)return;
  var op=m.operations[idx];if(!op)return;
  var h='<div class="form-row"><div class="form-group"><label>名称</label><input type="text" id="eoName" value="'+op.name+'"></div>';
  h+='<div class="form-group"><label>类型</label><select id="eoCat">'+App.selOpts(App.OP_CATEGORIES,op.category)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>目的</label><textarea id="eoPurpose" rows="2">'+(op.purpose||'')+'</textarea></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>方式</label><div id="eoMethods">'+App.OP_METHODS.map(function(m){var c=(op.methods||[]).indexOf(m)>=0?' checked':'';return '<label style="display:inline-block;margin-right:8px;font-size:12px"><input type="checkbox" class="eo-method" value="'+m+'"'+c+'> '+m+'</label>';}).join('')+'</div></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>BBCH起</label><input type="number" id="eoBs" value="'+op.bbchStart+'"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="eoBe" value="'+op.bbchEnd+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>物料(元/亩)</label><input type="text" id="eoMat" value="'+(op.materialCost||'')+'"></div>';
  h+='<div class="form-group"><label>人工(元/亩)</label><input type="text" id="eoLab" value="'+(op.laborCost||'')+'"></div>';
  h+='<div class="form-group"><label>设备(元/亩)</label><input type="text" id="eoEquip" value="'+(op.equipCost||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>标准</label><textarea id="eoStd" rows="3">'+(op.standard||'')+'</textarea></div></div>';
  App._modal('editOpModal','编辑作业',h,'<button class="btn" id="btnSaveOp">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editOpModal\')">取消</button>');
  App.byId('btnSaveOp').addEventListener('click',function(){
    op.name=App.byId('eoName').value;op.category=App.byId('eoCat').value;op.purpose=App.byId('eoPurpose').value;
    var methods=[];App.qsa('.eo-method:checked').forEach(function(cb){methods.push(cb.value);});op.methods=methods;
    op.bbchStart=parseInt(App.byId('eoBs').value)||0;op.bbchEnd=parseInt(App.byId('eoBe').value)||99;
    op.materialCost=App.byId('eoMat').value;op.laborCost=App.byId('eoLab').value;op.equipCost=App.byId('eoEquip').value;op.standard=App.byId('eoStd').value;
    state.saveAll();App.closeModal('editOpModal');App.renderMain();App.showToast('已更新','success');
  });
};

// ── 新建计划 ──
App.showNewPlanModal = function() {
  var state=App.appState;
  var modelOpts=Object.keys(state.models).map(function(id){var m=state.models[id];return '<option value="'+id+'">'+App.modelTitle(m)+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>计划名称</label><input type="text" id="npName" placeholder="留空自动生成"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>关联模型 <span class="required">*</span></label><select id="npModel">'+modelOpts+'</select></div>';
  h+='<div class="form-group"><label>年份</label><input type="number" id="npYear" value="'+new Date().getFullYear()+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>地块</label><input type="text" id="npPlot"></div>';
  h+='<div class="form-group"><label>面积(亩)</label><input type="text" id="npArea"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>密度</label><input type="text" id="npDensity"></div>';
  h+='<div class="form-group"><label>株行距</label><input type="text" id="npRow" style="width:60px"> × <input type="text" id="npPlant" style="width:60px"> m</div></div>';
  h+='<div class="form-row"><div class="form-group"><label>目标产量(kg/亩)</label><input type="text" id="npYield"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>描述</label><textarea id="npDesc" rows="2"></textarea></div></div>';
  App._modal('newPlanModal','新建计划',h,'<button class="btn" id="btnCreatePlan">创建</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newPlanModal\')">取消</button>');
  App.byId('btnCreatePlan').addEventListener('click',App.createPlan);
};

App.createPlan = function() {
  var state=App.appState;var id='P'+Date.now();
  var p={id:id,name:App.byId('npName').value.trim(),modelId:App.byId('npModel').value,year:parseInt(App.byId('npYear').value)||new Date().getFullYear(),plot:App.byId('npPlot').value,area:App.byId('npArea').value,density:App.byId('npDensity').value,rowSpacing:App.byId('npRow').value,plantSpacing:App.byId('npPlant').value,targetYield:App.byId('npYield').value,description:App.byId('npDesc').value.trim(),operations:[],createdAt:new Date().toISOString()};
  if(!p.name)p.name=App.planTitle(p);
  state.plans[id]=p;state.currentPlanId=id;state.saveAll();App.closeModal('newPlanModal');App.renderSidebar();App.renderMain();App.showToast('计划创建成功','success');
};

// ── 添加计划作业（含资源配置）──
App.showAddPlanOpModal = function() {
  var state=App.appState;var p=state.plans[state.currentPlanId];if(!p)return;
  var m=state.models[p.modelId];var ops=m?(m.operations||[]).filter(function(o){return o.enabled!==false;}):[];
  var h='<div class="form-row"><div class="form-group"><label>作业名称 <span class="required">*</span></label><input type="text" id="apoName" list="opSuggestions" placeholder="从模型选择或手动输入">';
  h+='<datalist id="opSuggestions">'+ops.map(function(o){return '<option value="'+o.name+'">';}).join('')+'</datalist></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>类型</label><input type="text" id="apoCategory" readonly style="background:#f5f5f5"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>状态</label><select id="apoStatus"><option value="pending">待执行</option><option value="inProgress">进行中</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select></div>';
  h+='<div class="form-group"><label>日期</label><input type="date" id="apoDate"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责人</label><input type="text" id="apoAssignee"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>BBCH起</label><input type="number" id="apoBs" value="0"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="apoBe" value="99"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="apoNote" rows="2"></textarea></div></div>';
  h+='<hr><h4 style="margin:8px 0">资源配置</h4>';
  h+='<div style="background:#fafaf7;padding:8px;border-radius:4px;margin-bottom:8px">';
  h+='<div style="font-size:12px;font-weight:600;margin-bottom:4px">👤 人工</div>';
  h+='<div class="form-row"><div class="form-group"><label>人数</label><input type="number" id="apoLaborCount" value="0" min="0" style="width:60px"></div>';
  h+='<div class="form-group"><label>技能</label><input type="text" id="apoLaborSkill" style="width:100px"></div>';
  h+='<div class="form-group"><label>工价(元/天)</label><input type="number" id="apoLaborWage" value="150" min="0" style="width:80px"></div>';
  h+='<div class="form-group"><label>天数</label><input type="number" id="apoLaborDays" value="1" min="1" style="width:60px"></div></div>';
  h+='<div style="font-size:12px;color:var(--accent);font-weight:600">人工成本: <span id="apoLaborCost">0</span> 元</div></div>';
  h+='<div style="background:#fafaf7;padding:8px;border-radius:4px;margin-bottom:8px">';
  h+='<div style="font-size:12px;font-weight:600;margin-bottom:4px">📦 物资</div>';
  h+='<table class="data-table" style="font-size:11px;margin-bottom:4px" id="apoMatTable"><thead><tr><th>名称</th><th>规格</th><th>数量</th><th>单位</th><th>单价</th><th>成本</th><th style="width:30px"></th></tr></thead><tbody id="apoMatBody"></tbody></table>';
  h+='<button class="btn btn-sm" id="apoAddMat">+ 添加物资</button> <button class="btn btn-sm" id="apoMatFromStock">从库存选择</button></div>';
  h+='<div style="background:var(--accent-light);padding:8px;border-radius:4px;font-size:12px;font-weight:600">预算: 物资 <span id="apoMatTotal">0</span> + 人工 <span id="apoLaborTotal">0</span> = <span id="apoGrandTotal" style="color:var(--accent)">0</span> 元</div>';

  App._modal('addPlanOpModal','添加计划作业',h,'<button class="btn" id="btnAddPlanOp">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addPlanOpModal\')">取消</button>');

  App.byId('apoName').addEventListener('input',function(){
    var name=this.value.trim();var catInput=App.byId('apoCategory');
    if(!name){catInput.value='';return;}var matched=ops.filter(function(o){return o.name===name;});
    catInput.value=matched.length?(matched[0].category||''):'其他';
  });

  function calcLabor(){var c=parseInt(App.byId('apoLaborCount').value)||0,w=parseInt(App.byId('apoLaborWage').value)||0,d=parseInt(App.byId('apoLaborDays').value)||1;App.byId('apoLaborCost').textContent=c*w*d;updateBudget();}
  App.byId('apoLaborCount').addEventListener('input',calcLabor);App.byId('apoLaborWage').addEventListener('input',calcLabor);App.byId('apoLaborDays').addEventListener('input',calcLabor);

  function addMatRow(name,spec,qty,unit,price){
    var tbody=App.byId('apoMatBody');var tr=document.createElement('tr');
    tr.innerHTML='<td><input type="text" class="apm-name" value="'+name+'" style="width:100px"></td><td><input type="text" class="apm-spec" value="'+spec+'" style="width:100px"></td><td><input type="number" class="apm-qty" value="'+qty+'" min="0" step="0.1" style="width:60px"></td><td><input type="text" class="apm-unit" value="'+unit+'" style="width:40px"></td><td><input type="number" class="apm-price" value="'+price+'" min="0" step="0.01" style="width:70px"></td><td class="apm-amount" style="font-weight:600">0</td><td><button class="btn btn-sm apm-del" style="color:var(--danger);padding:2px 6px">×</button></td>';
    tbody.appendChild(tr);
    function calc(){var q=parseFloat(tr.querySelector('.apm-qty').value)||0,pr=parseFloat(tr.querySelector('.apm-price').value)||0;tr.querySelector('.apm-amount').textContent=(q*pr).toFixed(2);updateBudget();}
    tr.querySelector('.apm-qty').addEventListener('input',calc);tr.querySelector('.apm-price').addEventListener('input',calc);
    tr.querySelector('.apm-del').addEventListener('click',function(){tr.remove();updateBudget();});calc();
  }
  App.byId('apoAddMat').addEventListener('click',function(){addMatRow('','',0,'',0);});

  App.byId('apoMatFromStock').addEventListener('click',function(){
    var mats=(state.base||{}).materials||[];
    if(!mats.length){App.showToast('库存为空','error');return;}
    var selHtml='<div style="max-height:300px;overflow-y:auto"><table class="data-table" style="font-size:12px"><thead><tr><th>选择</th><th>名称</th><th>规格</th><th>库存</th><th>单价</th></tr></thead><tbody>';
    mats.forEach(function(mat,i){selHtml+='<tr><td><input type="checkbox" class="msel-cb" data-idx="'+i+'"></td><td>'+mat.name+'</td><td>'+(mat.spec||'')+'</td><td>'+(mat.stock||0)+' '+(mat.unit||'')+'</td><td>'+(mat.unitPrice||0)+'元</td></tr>';});
    selHtml+='</tbody></table></div><div style="margin-top:8px"><button class="btn btn-sm" id="btnMatSelOk">确认</button></div>';
    App._modal('matSelectModal','从库存选择',selHtml,'<button class="btn btn-secondary" onclick="App.closeModal(\'matSelectModal\')">取消</button>');
    App.byId('btnMatSelOk').addEventListener('click',function(){
      App.qsa('.msel-cb:checked').forEach(function(cb){var mat=mats[parseInt(cb.dataset.idx)];addMatRow(mat.name,mat.spec||'',0,mat.unit||'',mat.unitPrice||0);});
      App.closeModal('matSelectModal');
    });
  });

  function updateBudget(){
    var matT=0;App.qsa('#apoMatBody .apm-amount').forEach(function(el){matT+=parseFloat(el.textContent)||0;});
    var labT=parseFloat(App.byId('apoLaborCost').textContent)||0;
    App.byId('apoMatTotal').textContent=matT.toFixed(2);App.byId('apoLaborTotal').textContent=labT;
    App.byId('apoGrandTotal').textContent=(matT+labT).toFixed(2);
  }

  App.byId('btnAddPlanOp').addEventListener('click',function(){
    var name=App.byId('apoName').value.trim();if(!name){App.showToast('请输入名称','error');return;}
    if(!p.operations)p.operations=[];
    var materials=[];App.qsa('#apoMatBody tr').forEach(function(tr){
      var mn=tr.querySelector('.apm-name').value.trim();if(!mn)return;
      var q=parseFloat(tr.querySelector('.apm-qty').value)||0,pr=parseFloat(tr.querySelector('.apm-price').value)||0;
      materials.push({name:mn,spec:tr.querySelector('.apm-spec').value,qty:q,unit:tr.querySelector('.apm-unit').value,unitPrice:pr,amount:q*pr});
    });
    var lt=parseInt(App.byId('apoLaborCost').textContent)||0;
    var mt=parseFloat(App.byId('apoMatTotal').textContent)||0;
    p.operations.push({id:'PO_'+Date.now(),name:name,category:App.byId('apoCategory').value||'其他',status:App.byId('apoStatus').value,plannedDate:App.byId('apoDate').value,assignee:App.byId('apoAssignee').value,bbchStart:parseInt(App.byId('apoBs').value)||0,bbchEnd:parseInt(App.byId('apoBe').value)||99,note:App.byId('apoNote').value,personnel:{count:parseInt(App.byId('apoLaborCount').value)||0,skill:App.byId('apoLaborSkill').value,dailyWage:parseInt(App.byId('apoLaborWage').value)||0,days:parseInt(App.byId('apoLaborDays').value)||1,laborCost:lt},tools:[],facility:'',materials:materials,budgetSummary:{materialTotal:mt,laborTotal:lt,toolTotal:0,grandTotal:mt+lt}});
    state.saveAll();App.closeModal('addPlanOpModal');App.renderMain();App.showToast('已添加','success');
  });
};

// ── 编辑计划作业 ──
App.showEditPlanOpModal = function(idx) {
  var state=App.appState;var p=state.plans[state.currentPlanId];if(!p)return;
  var op=p.operations[idx];if(!op)return;
  var pers=op.personnel||{};var mats=op.materials||[];var budget=op.budgetSummary||{};
  var h='<div class="form-row"><div class="form-group"><label>名称</label><input type="text" id="epoName" value="'+op.name+'"></div>';
  h+='<div class="form-group"><label>类型</label><input type="text" id="epoCategory" value="'+(op.category||'其他')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>状态</label><select id="epoStatus"><option value="pending"'+(op.status==='pending'?' selected':'')+'>待执行</option><option value="inProgress"'+(op.status==='inProgress'?' selected':'')+'>进行中</option><option value="completed"'+(op.status==='completed'?' selected':'')+'>已完成</option><option value="cancelled"'+(op.status==='cancelled'?' selected':'')+'>已取消</option></select></div>';
  h+='<div class="form-group"><label>日期</label><input type="date" id="epoDate" value="'+(op.plannedDate||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责人</label><input type="text" id="epoAssignee" value="'+(op.assignee||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>BBCH起</label><input type="number" id="epoBs" value="'+(op.bbchStart||0)+'"></div>';
  h+='<div class="form-group"><label>BBCH止</label><input type="number" id="epoBe" value="'+(op.bbchEnd||99)+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="epoNote" rows="2">'+(op.note||'')+'</textarea></div></div>';
  h+='<hr><h4 style="margin:8px 0">资源配置</h4>';
  h+='<div style="background:#fafaf7;padding:8px;border-radius:4px;margin-bottom:8px">';
  h+='<div style="font-size:12px;font-weight:600;margin-bottom:4px">👤 人工</div>';
  h+='<div class="form-row"><div class="form-group"><label>人数</label><input type="number" id="epoLaborCount" value="'+(pers.count||0)+'" min="0" style="width:60px"></div>';
  h+='<div class="form-group"><label>技能</label><input type="text" id="epoLaborSkill" value="'+(pers.skill||'')+'" style="width:100px"></div>';
  h+='<div class="form-group"><label>工价(元/天)</label><input type="number" id="epoLaborWage" value="'+(pers.dailyWage||150)+'" min="0" style="width:80px"></div>';
  h+='<div class="form-group"><label>天数</label><input type="number" id="epoLaborDays" value="'+(pers.days||1)+'" min="1" style="width:60px"></div></div>';
  h+='<div style="font-size:12px;color:var(--accent);font-weight:600">人工成本: <span id="epoLaborCost">'+(pers.laborCost||0)+'</span> 元</div></div>';
  h+='<div style="background:#fafaf7;padding:8px;border-radius:4px;margin-bottom:8px">';
  h+='<div style="font-size:12px;font-weight:600;margin-bottom:4px">📦 物资</div>';
  h+='<table class="data-table" style="font-size:11px;margin-bottom:4px"><thead><tr><th>名称</th><th>规格</th><th>数量</th><th>单位</th><th>单价</th><th>成本</th><th style="width:30px"></th></tr></thead><tbody id="epoMatBody">';
  mats.forEach(function(mat){
    h+='<tr><td><input type="text" class="epm-name" value="'+(mat.name||'')+'" style="width:100px"></td><td><input type="text" class="epm-spec" value="'+(mat.spec||'')+'" style="width:100px"></td><td><input type="number" class="epm-qty" value="'+(mat.qty||0)+'" min="0" step="0.1" style="width:60px"></td><td><input type="text" class="epm-unit" value="'+(mat.unit||'')+'" style="width:40px"></td><td><input type="number" class="epm-price" value="'+(mat.unitPrice||0)+'" min="0" step="0.01" style="width:70px"></td><td class="epm-amount" style="font-weight:600">'+((mat.amount||0).toFixed(2))+'</td><td><button class="btn btn-sm epm-del" style="color:var(--danger);padding:2px 6px">×</button></td></tr>';
  });
  h+='</tbody></table><button class="btn btn-sm" id="epoAddMat">+ 添加物资</button></div>';
  h+='<div style="background:var(--accent-light);padding:8px;border-radius:4px;font-size:12px;font-weight:600">预算: 物资 <span id="epoMatTotal">'+(budget.materialTotal||0).toFixed(2)+'</span> + 人工 <span id="epoLaborTotal">'+(budget.laborTotal||0)+'</span> = <span id="epoGrandTotal" style="color:var(--accent)">'+(budget.grandTotal||0).toFixed(2)+'</span> 元</div>';

  App._modal('editPlanOpModal','编辑计划作业',h,'<button class="btn" id="btnSavePlanOp">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editPlanOpModal\')">取消</button>');

  function calcLabor(){var c=parseInt(App.byId('epoLaborCount').value)||0,w=parseInt(App.byId('epoLaborWage').value)||0,d=parseInt(App.byId('epoLaborDays').value)||1;App.byId('epoLaborCost').textContent=c*w*d;updateBudget();}
  App.byId('epoLaborCount').addEventListener('input',calcLabor);App.byId('epoLaborWage').addEventListener('input',calcLabor);App.byId('epoLaborDays').addEventListener('input',calcLabor);

  function addMatRow(name,spec,qty,unit,price){
    var tbody=App.byId('epoMatBody');var tr=document.createElement('tr');
    tr.innerHTML='<td><input type="text" class="epm-name" value="'+name+'" style="width:100px"></td><td><input type="text" class="epm-spec" value="'+spec+'" style="width:100px"></td><td><input type="number" class="epm-qty" value="'+qty+'" min="0" step="0.1" style="width:60px"></td><td><input type="text" class="epm-unit" value="'+unit+'" style="width:40px"></td><td><input type="number" class="epm-price" value="'+price+'" min="0" step="0.01" style="width:70px"></td><td class="epm-amount" style="font-weight:600">0</td><td><button class="btn btn-sm epm-del" style="color:var(--danger);padding:2px 6px">×</button></td>';
    tbody.appendChild(tr);
    function calc(){var q=parseFloat(tr.querySelector('.epm-qty').value)||0,pr=parseFloat(tr.querySelector('.epm-price').value)||0;tr.querySelector('.epm-amount').textContent=(q*pr).toFixed(2);updateBudget();}
    tr.querySelector('.epm-qty').addEventListener('input',calc);tr.querySelector('.epm-price').addEventListener('input',calc);
    tr.querySelector('.epm-del').addEventListener('click',function(){tr.remove();updateBudget();});calc();
  }
  App.byId('epoAddMat').addEventListener('click',function(){addMatRow('','',0,'',0);});

  App.qsa('#epoMatBody tr').forEach(function(tr){
    function calc(){var q=parseFloat(tr.querySelector('.epm-qty').value)||0,pr=parseFloat(tr.querySelector('.epm-price').value)||0;tr.querySelector('.epm-amount').textContent=(q*pr).toFixed(2);updateBudget();}
    tr.querySelector('.epm-qty').addEventListener('input',calc);tr.querySelector('.epm-price').addEventListener('input',calc);
    tr.querySelector('.epm-del').addEventListener('click',function(){tr.remove();updateBudget();});
  });

  function updateBudget(){
    var mt=0;App.qsa('#epoMatBody .epm-amount').forEach(function(el){mt+=parseFloat(el.textContent)||0;});
    var lt=parseFloat(App.byId('epoLaborCost').textContent)||0;
    App.byId('epoMatTotal').textContent=mt.toFixed(2);App.byId('epoLaborTotal').textContent=lt;
    App.byId('epoGrandTotal').textContent=(mt+lt).toFixed(2);
  }

  App.byId('btnSavePlanOp').addEventListener('click',function(){
    var materials=[];App.qsa('#epoMatBody tr').forEach(function(tr){
      var mn=tr.querySelector('.epm-name').value.trim();if(!mn)return;
      var q=parseFloat(tr.querySelector('.epm-qty').value)||0,pr=parseFloat(tr.querySelector('.epm-price').value)||0;
      materials.push({name:mn,spec:tr.querySelector('.epm-spec').value,qty:q,unit:tr.querySelector('.epm-unit').value,unitPrice:pr,amount:q*pr});
    });
    op.name=App.byId('epoName').value;op.category=App.byId('epoCategory').value||'其他';
    op.status=App.byId('epoStatus').value;op.plannedDate=App.byId('epoDate').value;op.assignee=App.byId('epoAssignee').value;
    op.bbchStart=parseInt(App.byId('epoBs').value)||0;op.bbchEnd=parseInt(App.byId('epoBe').value)||99;op.note=App.byId('epoNote').value;
    var lt=parseInt(App.byId('epoLaborCost').textContent)||0;var mt=parseFloat(App.byId('epoMatTotal').textContent)||0;
    op.personnel={count:parseInt(App.byId('epoLaborCount').value)||0,skill:App.byId('epoLaborSkill').value,dailyWage:parseInt(App.byId('epoLaborWage').value)||0,days:parseInt(App.byId('epoLaborDays').value)||1,laborCost:lt};
    op.tools=[];op.materials=materials;op.budgetSummary={materialTotal:mt,laborTotal:lt,toolTotal:0,grandTotal:mt+lt};
    state.saveAll();App.closeModal('editPlanOpModal');App.renderMain();App.showToast('已更新','success');
  });
};

// ── 编辑计划 ──
App.showEditPlanModal = function() {
  var state=App.appState;var p=state.plans[state.currentPlanId];if(!p)return;
  var modelOpts=Object.keys(state.models).map(function(id){return '<option value="'+id+'"'+(id===p.modelId?' selected':'')+'>'+App.modelTitle(state.models[id])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>名称</label><input type="text" id="epName" value="'+(p.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>模型</label><select id="epModel">'+modelOpts+'</select></div>';
  h+='<div class="form-group"><label>年份</label><input type="number" id="epYear" value="'+(p.year||new Date().getFullYear())+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>地块</label><input type="text" id="epPlot" value="'+(p.plot||'')+'"></div>';
  h+='<div class="form-group"><label>面积</label><input type="text" id="epArea" value="'+(p.area||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>密度</label><input type="text" id="epDensity" value="'+(p.density||'')+'"></div>';
  h+='<div class="form-group"><label>株行距</label><input type="text" id="epRow" value="'+(p.rowSpacing||'')+'" style="width:60px"> × <input type="text" id="epPlant" value="'+(p.plantSpacing||'')+'" style="width:60px"> m</div></div>';
  h+='<div class="form-row"><div class="form-group"><label>目标产量</label><input type="text" id="epYield" value="'+(p.targetYield||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>描述</label><textarea id="epDesc" rows="2">'+(p.description||'')+'</textarea></div></div>';
  App._modal('editPlanModal','编辑计划',h,'<button class="btn" id="btnSavePlan">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editPlanModal\')">取消</button>');
  App.byId('btnSavePlan').addEventListener('click',function(){
    p.name=App.byId('epName').value.trim();p.modelId=App.byId('epModel').value;p.year=parseInt(App.byId('epYear').value)||new Date().getFullYear();
    p.plot=App.byId('epPlot').value;p.area=App.byId('epArea').value;p.density=App.byId('epDensity').value;
    p.rowSpacing=App.byId('epRow').value;p.plantSpacing=App.byId('epPlant').value;p.targetYield=App.byId('epYield').value;p.description=App.byId('epDesc').value.trim();
    state.saveAll();App.closeModal('editPlanModal');App.renderMain();App.showToast('已更新','success');
  });
};

App.executePlan = function() {
  var state=App.appState;var p=state.plans[state.currentPlanId];if(!p)return;
  if(!p.operations||!p.operations.length){App.showToast('无作业','error');return;}
  if(!confirm('执行此计划？'))return;
  var id='R'+Date.now();state.records[id]={id:id,name:p.name+'·执行记录',modelId:p.modelId,planId:state.currentPlanId,year:p.year,adminArea:'',regionType:'',description:'从计划生成',phaseActuals:{},observations:{},createdAt:new Date().toISOString()};
  state.currentRecordId=id;state.saveAll();App.renderSidebar();App.renderMain();App.showToast('已执行','success');
};

App.deletePlan = function(id) {
  if(!confirm('确定删除？'))return;delete App.appState.plans[id];if(App.appState.currentPlanId===id)App.appState.currentPlanId=null;
  App.appState.saveAll();App.renderSidebar();App.renderMain();App.showToast('已删除','info');
};

// ── 新建/编辑记录 ──
App.showNewRecordModal = function() {
  var state=App.appState;
  var modelOpts=Object.keys(state.models).map(function(id){return '<option value="'+id+'">'+App.modelTitle(state.models[id])+'</option>';}).join('');
  var planOpts='<option value="">无关联</option>'+Object.keys(state.plans).map(function(id){return '<option value="'+id+'">'+App.planTitle(state.plans[id])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>名称</label><input type="text" id="nrName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>模型 <span class="required">*</span></label><select id="nrModel">'+modelOpts+'</select></div>';
  h+='<div class="form-group"><label>年份</label><input type="number" id="nrYear" value="'+new Date().getFullYear()+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>关联计划</label><select id="nrPlan">'+planOpts+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>区划</label><input type="text" id="nrAdmin"></div>';
  h+='<div class="form-group"><label>区域</label><select id="nrRegion">'+App.selOpts(['黄土高原北部','黄土高原南部','渤海湾','黄河故道','西南冷凉高地'])+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>描述</label><textarea id="nrDesc" rows="2"></textarea></div></div>';
  App._modal('newRecordModal','新建记录',h,'<button class="btn" id="btnCreateRecord">创建</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newRecordModal\')">取消</button>');
  App.byId('btnCreateRecord').addEventListener('click',App.createRecord);
};

App.createRecord = function() {
  var state=App.appState;var id='R'+Date.now();
  var r={id:id,name:App.byId('nrName').value.trim(),modelId:App.byId('nrModel').value,planId:App.byId('nrPlan').value||null,year:parseInt(App.byId('nrYear').value)||new Date().getFullYear(),adminArea:App.byId('nrAdmin').value,regionType:App.byId('nrRegion').value,description:App.byId('nrDesc').value.trim(),phaseActuals:{},observations:{},createdAt:new Date().toISOString()};
  if(!r.name)r.name=App.recordTitle(r);state.records[id]=r;state.currentRecordId=id;state.saveAll();
  App.closeModal('newRecordModal');App.renderSidebar();App.renderMain();App.showToast('记录创建成功','success');
};

App.showEditRecordModal = function() {
  var state=App.appState;var r=state.records[state.currentRecordId];if(!r)return;
  var modelOpts=Object.keys(state.models).map(function(id){return '<option value="'+id+'"'+(id===r.modelId?' selected':'')+'>'+App.modelTitle(state.models[id])+'</option>';}).join('');
  var planOpts='<option value="">无关联</option>'+Object.keys(state.plans).map(function(id){return '<option value="'+id+'"'+(id===r.planId?' selected':'')+'>'+App.planTitle(state.plans[id])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>名称</label><input type="text" id="erName" value="'+(r.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>模型</label><select id="erModel">'+modelOpts+'</select></div>';
  h+='<div class="form-group"><label>年份</label><input type="number" id="erYear" value="'+(r.year||new Date().getFullYear())+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>计划</label><select id="erPlan">'+planOpts+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>区划</label><input type="text" id="erAdmin" value="'+(r.adminArea||'')+'"></div>';
  h+='<div class="form-group"><label>区域</label><select id="erRegion">'+App.selOpts(['黄土高原北部','黄土高原南部','渤海湾','黄河故道','西南冷凉高地'],r.regionType)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>描述</label><textarea id="erDesc" rows="2">'+(r.description||'')+'</textarea></div></div>';
  App._modal('editRecordModal','编辑记录',h,'<button class="btn" id="btnSaveRecord">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editRecordModal\')">取消</button>');
  App.byId('btnSaveRecord').addEventListener('click',function(){
    r.name=App.byId('erName').value.trim();r.modelId=App.byId('erModel').value;r.planId=App.byId('erPlan').value||null;
    r.year=parseInt(App.byId('erYear').value)||new Date().getFullYear();r.adminArea=App.byId('erAdmin').value;
    r.regionType=App.byId('erRegion').value;r.description=App.byId('erDesc').value.trim();
    state.saveAll();App.closeModal('editRecordModal');App.renderMain();App.showToast('已更新','success');
  });
};

App.deleteRecord = function(id) {
  if(!confirm('确定？'))return;delete App.appState.records[id];if(App.appState.currentRecordId===id)App.appState.currentRecordId=null;
  App.appState.saveAll();App.renderSidebar();App.renderMain();App.showToast('已删除','info');
};

App.saveObservations = function() {
  var state=App.appState;var r=state.records[state.currentRecordId];if(!r)return;
  if(!r.observations)r.observations={};
  App.qsa('.obs-val').forEach(function(inp){var id=inp.dataset.id;if(!r.observations[id])r.observations[id]={};r.observations[id].value=inp.value;});
  App.qsa('.obs-date').forEach(function(inp){var id=inp.dataset.id;if(!r.observations[id])r.observations[id]={};r.observations[id].date=inp.value;});
  App.qsa('.obs-note').forEach(function(inp){var id=inp.dataset.id;if(!r.observations[id])r.observations[id]={};r.observations[id].note=inp.value;});
  state.saveAll();App.showToast('已保存','success');
};

// ── 派工单 ──
App.showNewWorkOrderModal = function() {
  var state=App.appState;
  var planOpts='<option value="">无关联</option>'+Object.keys(state.plans).map(function(id){return '<option value="'+id+'">'+App.planTitle(state.plans[id])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>任务 <span class="required">*</span></label><input type="text" id="nwoTask"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>计划</label><select id="nwoPlan">'+planOpts+'</select></div>';
  h+='<div class="form-group"><label>状态</label><select id="nwoStatus"><option value="pending">待执行</option><option value="inProgress">执行中</option><option value="completed">已完成</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>日期</label><input type="date" id="nwoDate" value="'+new Date().toISOString().slice(0,10)+'"></div>';
  h+='<div class="form-group"><label>地点</label><input type="text" id="nwoLocation"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责人</label><input type="text" id="nwoAssignee"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>技术参数</label><textarea id="nwoTech" rows="2"></textarea></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>质量标准</label><textarea id="nwoQuality" rows="2"></textarea></div></div>';
  App._modal('newWorkOrderModal','新建派工单',h,'<button class="btn" id="btnCreateWorkOrder">创建</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newWorkOrderModal\')">取消</button>');
  App.byId('btnCreateWorkOrder').addEventListener('click',App.createWorkOrder);
};

App.createWorkOrder = function() {
  var state=App.appState;var id='WO_'+Date.now();
  var task=App.byId('nwoTask').value.trim();if(!task){App.showToast('请输入任务','error');return;}
  state.workOrders[id]={id:id,planId:App.byId('nwoPlan').value||null,planOpId:null,status:App.byId('nwoStatus').value,issueDate:App.byId('nwoDate').value,location:App.byId('nwoLocation').value,taskDescription:task,technicalParams:App.byId('nwoTech').value,qualityStandard:App.byId('nwoQuality').value,assignee:App.byId('nwoAssignee').value,workers:[],totalWorkers:0,plannedHours:0,decisionFactors:{weather:'',personnel:'',urgency:'',resources:''},tools:[],materials:[],equipment:[],execution:{actualStart:'',actualEnd:'',completion:'',incompleteReason:'',actualArea:'',actualMaterials:[],toolReturn:'',equipmentReturn:'',signatory:'',signDate:''},createdAt:new Date().toISOString()};
  state.currentWorkOrderId=id;state.saveAll();App.closeModal('newWorkOrderModal');App.renderSidebar();App.renderMain();App.showToast('派工单创建成功','success');
};

App.showEditWorkOrderModal = function(id) {
  var state=App.appState;var wo=state.workOrders[id];if(!wo)return;
  var planOpts='<option value="">无关联</option>'+Object.keys(state.plans).map(function(pid){return '<option value="'+pid+'"'+(pid===wo.planId?' selected':'')+'">'+App.planTitle(state.plans[pid])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>任务</label><input type="text" id="ewoTask" value="'+(wo.taskDescription||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>计划</label><select id="ewoPlan">'+planOpts+'</select></div>';
  h+='<div class="form-group"><label>状态</label><select id="ewoStatus"><option value="pending"'+(wo.status==='pending'?' selected':'')+'>待执行</option><option value="inProgress"'+(wo.status==='inProgress'?' selected':'')+'>执行中</option><option value="completed"'+(wo.status==='completed'?' selected':'')+'>已完成</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>日期</label><input type="date" id="ewoDate" value="'+(wo.issueDate||'')+'"></div>';
  h+='<div class="form-group"><label>地点</label><input type="text" id="ewoLocation" value="'+(wo.location||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责人</label><input type="text" id="ewoAssignee" value="'+(wo.assignee||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>技术参数</label><textarea id="ewoTech" rows="2">'+(wo.technicalParams||'')+'</textarea></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>质量标准</label><textarea id="ewoQuality" rows="2">'+(wo.qualityStandard||'')+'</textarea></div></div>';
  App._modal('editWorkOrderModal','编辑派工单',h,'<button class="btn" id="btnSaveWorkOrder">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editWorkOrderModal\')">取消</button>');
  App.byId('btnSaveWorkOrder').addEventListener('click',function(){
    wo.taskDescription=App.byId('ewoTask').value.trim();wo.planId=App.byId('ewoPlan').value||null;wo.status=App.byId('ewoStatus').value;
    wo.issueDate=App.byId('ewoDate').value;wo.location=App.byId('ewoLocation').value;wo.assignee=App.byId('ewoAssignee').value;
    wo.technicalParams=App.byId('ewoTech').value;wo.qualityStandard=App.byId('ewoQuality').value;
    state.saveAll();App.closeModal('editWorkOrderModal');App.renderMain();App.showToast('已更新','success');
  });
};

// ── 作业记录 ──
App.showNewWorkRecordModal = function() {
  var state=App.appState;
  var woOpts='<option value="">无关联</option>'+Object.keys(state.workOrders).map(function(id){return '<option value="'+id+'">'+(state.workOrders[id].taskDescription||id)+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>日期</label><input type="date" id="nwrDate" value="'+new Date().toISOString().slice(0,10)+'"></div>';
  h+='<div class="form-group"><label>类型</label><select id="nwrType"><option value="自己作业">自己作业</option><option value="外包作业">外包作业</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>派工单</label><select id="nwrWO">'+woOpts+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>分区</label><input type="text" id="nwrArea"></div>';
  h+='<div class="form-group"><label>作物</label><input type="text" id="nwrCrop"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>作业项目</label><input type="text" id="nwrOps" placeholder="逗号分隔"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="nwrNote" rows="2"></textarea></div></div>';
  App._modal('newWorkRecordModal','新建作业记录',h,'<button class="btn" id="btnCreateWorkRecord">创建</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newWorkRecordModal\')">取消</button>');
  App.byId('btnCreateWorkRecord').addEventListener('click',App.createWorkRecord);
};

App.createWorkRecord = function() {
  var state=App.appState;var id='WR_'+Date.now();var woId=App.byId('nwrWO').value||null;
  var opsStr=App.byId('nwrOps').value.trim();
  var wr={id:id,workOrderId:woId,recordDate:App.byId('nwrDate').value,workType:App.byId('nwrType').value,workArea:App.byId('nwrArea').value,crop:App.byId('nwrCrop').value,operationNames:opsStr?opsStr.split(/[,，]/).map(function(s){return s.trim();}).filter(Boolean):[],workCondition:'合适',conditionNote:'',personnel:{count:0,names:[],hours:{total:0},wages:{total:0}},equipment:[],tools:[],materials:[],outsourcing:{projectName:'',description:'',pricingUnit:'亩',unitPrice:0,totalPrice:0},costSummary:{laborTotal:0,equipmentTotal:0,toolTotal:0,materialTotal:0,outsourcingTotal:0,grandTotal:0},note:App.byId('nwrNote').value,createdAt:new Date().toISOString()};
  if(woId){var wo=state.workOrders[woId];if(wo){wr.planId=wo.planId;if(!wr.workArea)wr.workArea=wo.location;if(!wr.operationNames.length)wr.operationNames=[wo.taskDescription];wr.personnel.count=wo.totalWorkers||0;wr.personnel.names=wo.workers||[];wr.equipment=(wo.equipment||[]).map(function(e){return{name:e.name,source:'自有',hours:e.hours||0,cost:0,total:0};});wr.tools=(wo.tools||[]).map(function(t){return{name:t.name,source:'自有',hours:0,cost:0,total:0};});wr.materials=(wo.materials||[]).map(function(m){return{name:m.name,spec:m.spec||'',qty:0,unit:m.unit||'',unitPrice:0,amount:0};});}}
  state.workRecords[id]=wr;state.currentWorkRecordId=id;state.saveAll();App.closeModal('newWorkRecordModal');App.renderSidebar();App.renderMain();App.showToast('创建成功','success');
};

App.showEditWorkRecordModal = function(id) {
  var state=App.appState;var wr=state.workRecords[id];if(!wr)return;
  var woOpts='<option value="">无关联</option>'+Object.keys(state.workOrders).map(function(woid){return '<option value="'+woid+'"'+(woid===wr.workOrderId?' selected':'')+'">'+(state.workOrders[woid].taskDescription||woid)+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>日期</label><input type="date" id="ewrDate" value="'+(wr.recordDate||'')+'"></div>';
  h+='<div class="form-group"><label>类型</label><select id="ewrType"><option value="自己作业"'+(wr.workType==='自己作业'?' selected':'')+'>自己作业</option><option value="外包作业"'+(wr.workType==='外包作业'?' selected':'')+'>外包作业</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>派工单</label><select id="ewrWO">'+woOpts+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>分区</label><input type="text" id="ewrArea" value="'+(wr.workArea||'')+'"></div>';
  h+='<div class="form-group"><label>作物</label><input type="text" id="ewrCrop" value="'+(wr.crop||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>作业项目</label><input type="text" id="ewrOps" value="'+((wr.operationNames||[]).join(', '))+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="ewrNote" rows="2">'+(wr.note||'')+'</textarea></div></div>';
  App._modal('editWorkRecordModal','编辑作业记录',h,'<button class="btn" id="btnSaveWorkRecord">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editWorkRecordModal\')">取消</button>');
  App.byId('btnSaveWorkRecord').addEventListener('click',function(){
    wr.recordDate=App.byId('ewrDate').value;wr.workType=App.byId('ewrType').value;wr.workOrderId=App.byId('ewrWO').value||null;
    wr.workArea=App.byId('ewrArea').value;wr.crop=App.byId('ewrCrop').value;
    var opsStr=App.byId('ewrOps').value.trim();wr.operationNames=opsStr?opsStr.split(/[,，]/).map(function(s){return s.trim();}).filter(Boolean):[];
    wr.note=App.byId('ewrNote').value;state.saveAll();App.closeModal('editWorkRecordModal');App.renderMain();App.showToast('已更新','success');
  });
};

// ── 导入导出 ──
App.showExportModal = function() {
  var h='<p style="font-size:12px;color:var(--muted);margin-bottom:8px">选择导出内容：</p>';
  h+='<label style="display:block;margin-bottom:4px;font-size:12px"><input type="checkbox" id="expModels" checked> 生长模型</label>';
  h+='<label style="display:block;margin-bottom:4px;font-size:12px"><input type="checkbox" id="expPlans" checked> 种植计划</label>';
  h+='<label style="display:block;margin-bottom:4px;font-size:12px"><input type="checkbox" id="expRecords" checked> 记录</label>';
  h+='<label style="display:block;margin-bottom:4px;font-size:12px"><input type="checkbox" id="expBase" checked> 基地数据</label>';
  App._modal('exportModal','导出',h,'<button class="btn" id="btnDoExport">导出</button> <button class="btn btn-secondary" onclick="App.closeModal(\'exportModal\')">取消</button>');
  App.byId('btnDoExport').addEventListener('click',function(){
    var state=App.appState;var data={};
    if(App.byId('expModels').checked)data.models=state.models;if(App.byId('expPlans').checked)data.plans=state.plans;
    if(App.byId('expRecords').checked)data.records=state.records;if(App.byId('expBase').checked)data.base=state.base;
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='apple_export_'+Date.now()+'.json';a.click();
    App.closeModal('exportModal');App.showToast('已导出','success');
  });
};

App.showImportModal = function() {
  var h='<p style="font-size:12px;color:var(--muted);margin-bottom:8px">选择JSON文件导入（合并到现有数据）：</p>';
  h+='<input type="file" id="importFile" accept=".json" style="font-size:12px">';
  App._modal('importModal','导入',h,'<button class="btn" id="btnDoImport">导入</button> <button class="btn btn-secondary" onclick="App.closeModal(\'importModal\')">取消</button>');
  App.byId('btnDoImport').addEventListener('click',function(){
    var file=App.byId('importFile').files[0];if(!file){App.showToast('请选择文件','error');return;}
    var reader=new FileReader();reader.onload=function(e){
      try{var data=JSON.parse(e.target.result);var state=App.appState;
        if(data.models)Object.assign(state.models,data.models);if(data.plans)Object.assign(state.plans,data.plans);
        if(data.records)Object.assign(state.records,data.records);if(data.base)Object.assign(state.base,data.base);
        state.saveAll();App.closeModal('importModal');App.renderSidebar();App.renderMain();App.showToast('导入成功','success');
      }catch(err){App.showToast('失败: '+err.message,'error');}
    };reader.readAsText(file);
  });
};

// ── 数据采集弹窗（v2.2 新增）──
App.showNewDataCollectionModal = function() {
  var state=App.appState;
  var planOpts='<option value="">请选择计划</option>'+Object.keys(state.plans).map(function(id){return '<option value="'+id+'">'+App.planTitle(state.plans[id])+'</option>';}).join('');
  var h='<div class="form-row"><div class="form-group"><label>关联计划 <span class="required">*</span></label><select id="ndcPlan">'+planOpts+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>物候期 <span class="required">*</span></label><select id="ndcPhase"><option value="">请先选计划</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>日期</label><input type="date" id="ndcDate" value="'+new Date().toISOString().slice(0,10)+'"></div>';
  h+='<div class="form-group"><label>采集人</label><input type="text" id="ndcCollector"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>天气</label><input type="text" id="ndcWeather"></div>';
  h+='<div class="form-group"><label>地块</label><input type="text" id="ndcLocation"></div></div>';
  h+='<hr><h4 style="margin:8px 0">📋 待采集指标 <span style="font-size:12px;color:var(--muted);font-weight:400" id="ndcIndCount">(选物候期后加载)</span></h4>';
  h+='<div id="ndcIndPreview" style="max-height:350px;overflow-y:auto"><p style="font-size:12px;color:var(--muted)">请先选择计划和物候期</p></div>';

  App._modal('newDCModal','📊 新建数据采集',h,'<button class="btn" id="btnCreateDC">创建并录入</button> <button class="btn btn-secondary" onclick="App.closeModal(\'newDCModal\')">取消</button>');

  App.byId('ndcPlan').addEventListener('change',function(){
    var planId=this.value;var ps=App.byId('ndcPhase');
    if(!planId){ps.innerHTML='<option value="">请先选计划</option>';return;}
    var plan=state.plans[planId];var model=plan?state.models[plan.modelId]:null;
    if(!model||!model.phases){ps.innerHTML='<option value="">无模型</option>';return;}
    ps.innerHTML=model.phases.map(function(p){return '<option value="'+p.id+'">'+p.name+' (BBCH '+p.bbchStart+'-'+p.bbchEnd+')</option>';}).join('');
    loadIndicators();
  });
  App.byId('ndcPhase').addEventListener('change',loadIndicators);

  function loadIndicators(){
    var planId=App.byId('ndcPlan').value;var phaseId=App.byId('ndcPhase').value;
    var preview=App.byId('ndcIndPreview');var countEl=App.byId('ndcIndCount');
    if(!planId||!phaseId){preview.innerHTML='<p style="font-size:12px;color:var(--muted)">请选择</p>';countEl.textContent='(请选择)';return;}
    var plan=state.plans[planId];var model=plan?state.models[plan.modelId]:null;if(!model)return;
    var phase=model.phases.find(function(p){return p.id===phaseId;});if(!phase)return;
    var inds=(model.indicators||[]).filter(function(ind){return ind.enabled!==false&&ind.bbchStart<=phase.bbchEnd&&ind.bbchEnd>=phase.bbchStart;});
    countEl.textContent='('+inds.length+' 个指标)';
    if(!inds.length){preview.innerHTML='<p style="font-size:12px;color:var(--muted)">无适用指标</p>';return;}
    var th='<table class="data-table" style="font-size:12px"><thead><tr><th>指标</th><th>单位</th><th>BBCH</th><th>参考</th><th>值</th><th>备注</th></tr></thead><tbody>';
    inds.forEach(function(ind){
      var refStr=ind.refRange||'—';if(ind.optLow||ind.optHigh)refStr='🟢'+(ind.optLow||'')+'-'+(ind.optHigh||'')+(ind.alertLow||ind.alertHigh?' 🟡'+(ind.alertLow||'')+'-'+(ind.alertHigh||''):'');
      th+='<tr><td>'+ind.name+'</td><td>'+ind.unit+'</td><td>'+App.pad2(ind.bbchStart)+'-'+App.pad2(ind.bbchEnd)+'</td>';
      th+='<td style="font-size:10px;color:var(--muted)">'+refStr+'</td>';
      th+='<td><input type="text" class="ndc-val" data-id="'+ind.id+'" data-name="'+ind.name+'" data-unit="'+ind.unit+'" data-ref="'+(ind.refRange||'')+'" data-bs="'+ind.bbchStart+'" data-be="'+ind.bbchEnd+'" style="width:80px;font-size:11px"></td>';
      th+='<td><input type="text" class="ndc-note" style="width:80px;font-size:11px"></td></tr>';
    });
    th+='</tbody></table>';preview.innerHTML=th;
  }

  // ★ 修正：去掉了重复的 items 循环 ★
  App.byId('btnCreateDC').addEventListener('click',function(){
    var planId=App.byId('ndcPlan').value;var phaseId=App.byId('ndcPhase').value;
    if(!planId){App.showToast('请选择计划','error');return;}if(!phaseId){App.showToast('请选择物候期','error');return;}
    var plan=state.plans[planId];var model=plan?state.models[plan.modelId]:null;
    var phase=model?model.phases.find(function(p){return p.id===phaseId;}):null;
    var items=[];
    App.qsa('.ndc-val').forEach(function(inp){
      var indId=inp.dataset.id,val=inp.value.trim();
      var noteInp=inp.closest('tr').querySelector('.ndc-note');var note=noteInp?noteInp.value.trim():'';
      var ind=model?model.indicators.find(function(i){return i.id===indId;}):null;
      var status='normal';if(val&&ind)status=App.judgeIndicatorStatus(val,ind);
      items.push({indicatorId:indId,indicatorName:inp.dataset.name||'',value:val,unit:inp.dataset.unit||'',refRange:inp.dataset.ref||'',bbchStart:parseInt(inp.dataset.bs)||0,bbchEnd:parseInt(inp.dataset.be)||0,status:status,note:note});
    });
    var adjustments=[];
    items.forEach(function(item){
      if(item.status==='normal')return;var action=App.INDICATOR_ACTION_MAP[item.indicatorId];if(!action)return;
      var matchedOps=(action.ops||[]).map(function(opId){var op=model?(model.operations||[]).find(function(o){return o.id===opId;}):null;return{id:opId,name:op?op.name:opId};});
      adjustments.push({id:'ADJ_'+Date.now()+'_'+item.indicatorId,triggerIndicators:[item.indicatorId],triggerSummary:item.indicatorName+' = '+item.value+item.unit+' ('+App.statusConfig[item.status].label+')',description:action.suggestion,relatedOpIds:matchedOps.map(function(o){return o.id;}),relatedOpNames:matchedOps.map(function(o){return o.name;}),priority:item.status==='danger'||item.status==='alert'?'urgent':'normal',status:'pending',workOrderId:null});
    });
    var data={planId:planId,modelId:plan.modelId,phaseId:phaseId,phaseName:phase?phase.name:'',collectDate:App.byId('ndcDate').value,collector:App.byId('ndcCollector').value,weather:App.byId('ndcWeather').value,location:App.byId('ndcLocation').value,items:items,adjustments:adjustments};
    App.closeModal('newDCModal');App.createDataCollection(data);
  });
};
// ============================================================
// 基地管理弹窗（v2.2 补全）
// ============================================================

// 兜底常量（如果 data.js 已定义则不覆盖）
App.SOIL_TYPES = App.SOIL_TYPES || ['垆土','黄绵土','砂壤土','粘壤土','褐土','黑垆土','其他'];
App.IRRIGATION_TYPES = App.IRRIGATION_TYPES || ['滴灌','喷灌','沟灌','畦灌','无灌溉','其他'];
App.FACILITY_TYPES = App.FACILITY_TYPES || ['露地','钢架大棚','塑料大棚','防雨棚','其他'];
App.PLOT_STATES = App.PLOT_STATES || ['在种','空闲','休耕','其他'];

// ── 地块 ──
App.showAddPlotModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="apCode"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="apName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>区域</label><input type="text" id="apArea"></div>';
  h+='<div class="form-group"><label>面积(亩)</label><input type="text" id="apAcres"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>土壤</label><select id="apSoil">'+App.selOpts(App.SOIL_TYPES)+'</select></div>';
  h+='<div class="form-group"><label>灌溉</label><select id="apIrr">'+App.selOpts(App.IRRIGATION_TYPES)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>设施</label><select id="apFacility">'+App.selOpts(App.FACILITY_TYPES)+'</select></div>';
  h+='<div class="form-group"><label>状态</label><select id="apStatus">'+App.selOpts(App.PLOT_STATES)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>当前作物</label><input type="text" id="apCrop"></div>';
  h+='<div class="form-group"><label>上茬</label><input type="text" id="apPrev"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>责任人</label><input type="text" id="apManager"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>地力等级</label><input type="text" id="apGrade"></div>';
  h+='<div class="form-group"><label>评级</label><input type="text" id="apRating"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="apNotes" rows="2"></textarea></div></div>';
  App._modal('addPlotModal','添加地块',h,'<button class="btn" id="btnSavePlot">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addPlotModal\')">取消</button>');
  App.byId('btnSavePlot').addEventListener('click',function(){
    var base=App.appState.base;if(!base.plots)base.plots=[];
    base.plots.push({code:App.byId('apCode').value,name:App.byId('apName').value,area:App.byId('apArea').value,acres:App.byId('apAcres').value,soilType:App.byId('apSoil').value,irrigation:App.byId('apIrr').value,facility:App.byId('apFacility').value,status:App.byId('apStatus').value,currentCrop:App.byId('apCrop').value,prevCrop:App.byId('apPrev').value,manager:App.byId('apManager').value,landGrade:App.byId('apGrade').value,rating:App.byId('apRating').value,notes:App.byId('apNotes').value});
    App.appState.saveAll();App.closeModal('addPlotModal');App.renderBaseView();App.showToast('已添加','success');
  });
};

App.showEditPlotModal = function(idx) {
  var base=App.appState.base;if(!base||!base.plots)return;
  var p=base.plots[idx];if(!p)return;
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="epCode" value="'+(p.code||'')+'"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="epName" value="'+(p.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>区域</label><input type="text" id="epArea" value="'+(p.area||'')+'"></div>';
  h+='<div class="form-group"><label>面积(亩)</label><input type="text" id="epAcres" value="'+(p.acres||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>土壤</label><select id="epSoil">'+App.selOpts(App.SOIL_TYPES,p.soilType)+'</select></div>';
  h+='<div class="form-group"><label>灌溉</label><select id="epIrr">'+App.selOpts(App.IRRIGATION_TYPES,p.irrigation)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>设施</label><select id="epFacility">'+App.selOpts(App.FACILITY_TYPES,p.facility)+'</select></div>';
  h+='<div class="form-group"><label>状态</label><select id="epStatus">'+App.selOpts(App.PLOT_STATES,p.status)+'</select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>当前作物</label><input type="text" id="epCrop" value="'+(p.currentCrop||'')+'"></div>';
  h+='<div class="form-group"><label>上茬</label><input type="text" id="epPrev" value="'+(p.prevCrop||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>责任人</label><input type="text" id="epManager" value="'+(p.manager||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>地力等级</label><input type="text" id="epGrade" value="'+(p.landGrade||'')+'"></div>';
  h+='<div class="form-group"><label>评级</label><input type="text" id="epRating" value="'+(p.rating||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="epNotes" rows="2">'+(p.notes||'')+'</textarea></div></div>';
  App._modal('editPlotModal','编辑地块',h,'<button class="btn" id="btnSavePlotE">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editPlotModal\')">取消</button>');
  App.byId('btnSavePlotE').addEventListener('click',function(){
    p.code=App.byId('epCode').value;p.name=App.byId('epName').value;p.area=App.byId('epArea').value;p.acres=App.byId('epAcres').value;
    p.soilType=App.byId('epSoil').value;p.irrigation=App.byId('epIrr').value;p.facility=App.byId('epFacility').value;p.status=App.byId('epStatus').value;
    p.currentCrop=App.byId('epCrop').value;p.prevCrop=App.byId('epPrev').value;p.manager=App.byId('epManager').value;
    p.landGrade=App.byId('epGrade').value;p.rating=App.byId('epRating').value;p.notes=App.byId('epNotes').value;
    App.appState.saveAll();App.closeModal('editPlotModal');App.renderBaseView();App.showToast('已更新','success');
  });
};

// ── 人员 ──
App.showAddPersonModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>工号</label><input type="text" id="apCode"></div>';
  h+='<div class="form-group"><label>姓名</label><input type="text" id="apName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>性别</label><select id="apGender"><option value="男">男</option><option value="女">女</option></select></div>';
  h+='<div class="form-group"><label>电话</label><input type="text" id="apPhone"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>岗位</label><input type="text" id="apPosition"></div>';
  h+='<div class="form-group"><label>用工类型</label><select id="apEmploy"><option value="长期工">长期工</option><option value="季节工">季节工</option><option value="临时工">临时工</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>入职日期</label><input type="date" id="apHire"></div>';
  h+='<div class="form-group"><label>日薪(元)</label><input type="number" id="apWage" value="150" min="0"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>技能</label><input type="text" id="apSkills" placeholder="逗号分隔"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责地块</label><input type="text" id="apPlots"></div>';
  h+='<div class="form-group"><label>健康</label><select id="apHealth"><option value="健康">健康</option><option value="其他">其他</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="apNotes" rows="2"></textarea></div></div>';
  App._modal('addPersonModal','添加人员',h,'<button class="btn" id="btnSavePerson">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addPersonModal\')">取消</button>');
  App.byId('btnSavePerson').addEventListener('click',function(){
    var base=App.appState.base;if(!base.personnel)base.personnel=[];
    base.personnel.push({code:App.byId('apCode').value,name:App.byId('apName').value,gender:App.byId('apGender').value,phone:App.byId('apPhone').value,position:App.byId('apPosition').value,employType:App.byId('apEmploy').value,hireDate:App.byId('apHire').value,dailyWage:App.byId('apWage').value,skills:App.byId('apSkills').value,responsiblePlots:App.byId('apPlots').value,health:App.byId('apHealth').value,notes:App.byId('apNotes').value});
    App.appState.saveAll();App.closeModal('addPersonModal');App.renderBaseView();App.showToast('已添加','success');
  });
};

App.showEditPersonModal = function(idx) {
  var base=App.appState.base;if(!base||!base.personnel)return;
  var p=base.personnel[idx];if(!p)return;
  var h='<div class="form-row"><div class="form-group"><label>工号</label><input type="text" id="epCode" value="'+(p.code||'')+'"></div>';
  h+='<div class="form-group"><label>姓名</label><input type="text" id="epName" value="'+(p.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>性别</label><select id="epGender"><option value="男"'+(p.gender==='男'?' selected':'')+'>男</option><option value="女"'+(p.gender==='女'?' selected':'')+'>女</option></select></div>';
  h+='<div class="form-group"><label>电话</label><input type="text" id="epPhone" value="'+(p.phone||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>岗位</label><input type="text" id="epPosition" value="'+(p.position||'')+'"></div>';
  h+='<div class="form-group"><label>用工类型</label><select id="epEmploy"><option value="长期工"'+(p.employType==='长期工'?' selected':'')+'>长期工</option><option value="季节工"'+(p.employType==='季节工'?' selected':'')+'>季节工</option><option value="临时工"'+(p.employType==='临时工'?' selected':'')+'>临时工</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>入职日期</label><input type="date" id="epHire" value="'+(p.hireDate||'')+'"></div>';
  h+='<div class="form-group"><label>日薪(元)</label><input type="number" id="epWage" value="'+(p.dailyWage||150)+'" min="0"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>技能</label><input type="text" id="epSkills" value="'+(p.skills||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>负责地块</label><input type="text" id="epPlots" value="'+(p.responsiblePlots||'')+'"></div>';
  h+='<div class="form-group"><label>健康</label><select id="epHealth"><option value="健康"'+(p.health==='健康'?' selected':'')+'>健康</option><option value="其他"'+(p.health==='其他'?' selected':'')+'>其他</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="epNotes" rows="2">'+(p.notes||'')+'</textarea></div></div>';
  App._modal('editPersonModal','编辑人员',h,'<button class="btn" id="btnSavePersonE">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editPersonModal\')">取消</button>');
  App.byId('btnSavePersonE').addEventListener('click',function(){
    p.code=App.byId('epCode').value;p.name=App.byId('epName').value;p.gender=App.byId('epGender').value;p.phone=App.byId('epPhone').value;
    p.position=App.byId('epPosition').value;p.employType=App.byId('epEmploy').value;p.hireDate=App.byId('epHire').value;p.dailyWage=App.byId('epWage').value;
    p.skills=App.byId('epSkills').value;p.responsiblePlots=App.byId('epPlots').value;p.health=App.byId('epHealth').value;p.notes=App.byId('epNotes').value;
    App.appState.saveAll();App.closeModal('editPersonModal');App.renderBaseView();App.showToast('已更新','success');
  });
};

// ── 工具 ──
App.showAddToolModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="atCode"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="atName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>规格</label><input type="text" id="atSpec"></div>';
  h+='<div class="form-group"><label>品牌</label><input type="text" id="atBrand"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>数量</label><input type="number" id="atQty" value="1" min="0"></div>';
  h+='<div class="form-group"><label>单位</label><input type="text" id="atUnit" value="把"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>存放位置</label><input type="text" id="atLocation"></div>';
  h+='<div class="form-group"><label>保管人</label><input type="text" id="atKeeper"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>状态</label><select id="atStatus"><option value="可借用">可借用</option><option value="使用中">使用中</option><option value="维修中">维修中</option><option value="报废">报废</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用效率</label><input type="text" id="atEfficiency"></div>';
  h+='<div class="form-group"><label>成本(元)</label><input type="text" id="atCost"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="atNotes" rows="2"></textarea></div></div>';
  App._modal('addToolModal','添加工具',h,'<button class="btn" id="btnSaveTool">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addToolModal\')">取消</button>');
  App.byId('btnSaveTool').addEventListener('click',function(){
    var base=App.appState.base;if(!base.tools)base.tools=[];
    base.tools.push({code:App.byId('atCode').value,name:App.byId('atName').value,spec:App.byId('atSpec').value,brand:App.byId('atBrand').value,quantity:App.byId('atQty').value,unit:App.byId('atUnit').value,location:App.byId('atLocation').value,keeper:App.byId('atKeeper').value,status:App.byId('atStatus').value,efficiency:App.byId('atEfficiency').value,cost:App.byId('atCost').value,notes:App.byId('atNotes').value});
    App.appState.saveAll();App.closeModal('addToolModal');App.renderBaseView();App.showToast('已添加','success');
  });
};

App.showEditToolModal = function(idx) {
  var base=App.appState.base;if(!base||!base.tools)return;
  var t=base.tools[idx];if(!t)return;
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="etCode" value="'+(t.code||'')+'"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="etName" value="'+(t.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>规格</label><input type="text" id="etSpec" value="'+(t.spec||'')+'"></div>';
  h+='<div class="form-group"><label>品牌</label><input type="text" id="etBrand" value="'+(t.brand||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>数量</label><input type="number" id="etQty" value="'+(t.quantity||0)+'" min="0"></div>';
  h+='<div class="form-group"><label>单位</label><input type="text" id="etUnit" value="'+(t.unit||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>存放位置</label><input type="text" id="etLocation" value="'+(t.location||'')+'"></div>';
  h+='<div class="form-group"><label>保管人</label><input type="text" id="etKeeper" value="'+(t.keeper||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>状态</label><select id="etStatus"><option value="可借用"'+(t.status==='可借用'?' selected':'')+'>可借用</option><option value="使用中"'+(t.status==='使用中'?' selected':'')+'>使用中</option><option value="维修中"'+(t.status==='维修中'?' selected':'')+'>维修中</option><option value="报废"'+(t.status==='报废'?' selected':'')+'>报废</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用效率</label><input type="text" id="etEfficiency" value="'+(t.efficiency||'')+'"></div>';
  h+='<div class="form-group"><label>成本(元)</label><input type="text" id="etCost" value="'+(t.cost||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>备注</label><textarea id="etNotes" rows="2">'+(t.notes||'')+'</textarea></div></div>';
  App._modal('editToolModal','编辑工具',h,'<button class="btn" id="btnSaveToolE">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editToolModal\')">取消</button>');
  App.byId('btnSaveToolE').addEventListener('click',function(){
    t.code=App.byId('etCode').value;t.name=App.byId('etName').value;t.spec=App.byId('etSpec').value;t.brand=App.byId('etBrand').value;
    t.quantity=App.byId('etQty').value;t.unit=App.byId('etUnit').value;t.location=App.byId('etLocation').value;t.keeper=App.byId('etKeeper').value;
    t.status=App.byId('etStatus').value;t.efficiency=App.byId('etEfficiency').value;t.cost=App.byId('etCost').value;t.notes=App.byId('etNotes').value;
    App.appState.saveAll();App.closeModal('editToolModal');App.renderBaseView();App.showToast('已更新','success');
  });
};

// ── 设备 ──
App.showAddEquipModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="aeCode"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="aeName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>型号</label><input type="text" id="aeModel"></div>';
  h+='<div class="form-group"><label>分类</label><input type="text" id="aeCategory"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>购置日期</label><input type="date" id="aePurchase"></div>';
  h+='<div class="form-group"><label>原值(元)</label><input type="number" id="aeValue" min="0"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用年限</label><input type="number" id="aeLife" value="10" min="0"></div>';
  h+='<div class="form-group"><label>状态</label><select id="aeStatus"><option value="运行">运行</option><option value="维修">维修</option><option value="闲置">闲置</option><option value="报废">报废</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>位置</label><input type="text" id="aeLocation"></div>';
  h+='<div class="form-group"><label>责任人</label><input type="text" id="aeManager"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用效率</label><input type="text" id="aeEfficiency"></div>';
  h+='<div class="form-group"><label>维护成本</label><input type="text" id="aeCost"></div></div>';
  App._modal('addEquipModal','添加设备',h,'<button class="btn" id="btnSaveEquip">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addEquipModal\')">取消</button>');
  App.byId('btnSaveEquip').addEventListener('click',function(){
    var base=App.appState.base;if(!base.equipment)base.equipment=[];
    base.equipment.push({code:App.byId('aeCode').value,name:App.byId('aeName').value,model:App.byId('aeModel').value,assetCategory:App.byId('aeCategory').value,purchaseDate:App.byId('aePurchase').value,originalValue:App.byId('aeValue').value,lifeYears:App.byId('aeLife').value,status:App.byId('aeStatus').value,location:App.byId('aeLocation').value,manager:App.byId('aeManager').value,efficiency:App.byId('aeEfficiency').value,cost:App.byId('aeCost').value});
    App.appState.saveAll();App.closeModal('addEquipModal');App.renderBaseView();App.showToast('已添加','success');
  });
};

App.showEditEquipModal = function(idx) {
  var base=App.appState.base;if(!base||!base.equipment)return;
  var eq=base.equipment[idx];if(!eq)return;
  var h='<div class="form-row"><div class="form-group"><label>编号</label><input type="text" id="eeCode" value="'+(eq.code||'')+'"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="eeName" value="'+(eq.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>型号</label><input type="text" id="eeModel" value="'+(eq.model||'')+'"></div>';
  h+='<div class="form-group"><label>分类</label><input type="text" id="eeCategory" value="'+(eq.assetCategory||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>购置日期</label><input type="date" id="eePurchase" value="'+(eq.purchaseDate||'')+'"></div>';
  h+='<div class="form-group"><label>原值(元)</label><input type="number" id="eeValue" value="'+(eq.originalValue||0)+'" min="0"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用年限</label><input type="number" id="eeLife" value="'+(eq.lifeYears||10)+'" min="0"></div>';
  h+='<div class="form-group"><label>状态</label><select id="eeStatus"><option value="运行"'+(eq.status==='运行'?' selected':'')+'>运行</option><option value="维修"'+(eq.status==='维修'?' selected':'')+'>维修</option><option value="闲置"'+(eq.status==='闲置'?' selected':'')+'>闲置</option><option value="报废"'+(eq.status==='报废'?' selected':'')+'>报废</option></select></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>位置</label><input type="text" id="eeLocation" value="'+(eq.location||'')+'"></div>';
  h+='<div class="form-group"><label>责任人</label><input type="text" id="eeManager" value="'+(eq.manager||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>使用效率</label><input type="text" id="eeEfficiency" value="'+(eq.efficiency||'')+'"></div>';
  h+='<div class="form-group"><label>维护成本</label><input type="text" id="eeCost" value="'+(eq.cost||'')+'"></div></div>';
  App._modal('editEquipModal','编辑设备',h,'<button class="btn" id="btnSaveEquipE">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editEquipModal\')">取消</button>');
  App.byId('btnSaveEquipE').addEventListener('click',function(){
    eq.code=App.byId('eeCode').value;eq.name=App.byId('eeName').value;eq.model=App.byId('eeModel').value;eq.assetCategory=App.byId('eeCategory').value;
    eq.purchaseDate=App.byId('eePurchase').value;eq.originalValue=App.byId('eeValue').value;eq.lifeYears=App.byId('eeLife').value;eq.status=App.byId('eeStatus').value;
    eq.location=App.byId('eeLocation').value;eq.manager=App.byId('eeManager').value;eq.efficiency=App.byId('eeEfficiency').value;eq.cost=App.byId('eeCost').value;
    App.appState.saveAll();App.closeModal('editEquipModal');App.renderBaseView();App.showToast('已更新','success');
  });
};

// ── 物资 ──
App.showAddMaterialModal = function() {
  var h='<div class="form-row"><div class="form-group"><label>编码</label><input type="text" id="amCode"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="amName"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>类别</label><input type="text" id="amCategory" placeholder="如: 农药/肥料/工具"></div>';
  h+='<div class="form-group"><label>规格</label><input type="text" id="amSpec"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>库存</label><input type="number" id="amStock" value="0" min="0"></div>';
  h+='<div class="form-group"><label>单位</label><input type="text" id="amUnit" value="瓶"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>安全库存</label><input type="number" id="amMin" value="0" min="0"></div>';
  h+='<div class="form-group"><label>存放位置</label><input type="text" id="amLocation"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>有效期</label><input type="date" id="amExpiry"></div>';
  h+='<div class="form-group"><label>供应商</label><input type="text" id="amSupplier"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>单价(元)</label><input type="number" id="amPrice" value="0" min="0" step="0.01"></div></div>';
  App._modal('addMaterialModal','添加物资',h,'<button class="btn" id="btnSaveMat">添加</button> <button class="btn btn-secondary" onclick="App.closeModal(\'addMaterialModal\')">取消</button>');
  App.byId('btnSaveMat').addEventListener('click',function(){
    var base=App.appState.base;if(!base.materials)base.materials=[];
    base.materials.push({code:App.byId('amCode').value,name:App.byId('amName').value,category:App.byId('amCategory').value,spec:App.byId('amSpec').value,stock:App.byId('amStock').value,unit:App.byId('amUnit').value,minStock:App.byId('amMin').value,location:App.byId('amLocation').value,expiry:App.byId('amExpiry').value,supplier:App.byId('amSupplier').value,unitPrice:App.byId('amPrice').value});
    App.appState.saveAll();App.closeModal('addMaterialModal');App.renderBaseView();App.showToast('已添加','success');
  });
};

App.showEditMaterialModal = function(idx) {
  var base=App.appState.base;if(!base||!base.materials)return;
  var mat=base.materials[idx];if(!mat)return;
  var h='<div class="form-row"><div class="form-group"><label>编码</label><input type="text" id="emCode" value="'+(mat.code||'')+'"></div>';
  h+='<div class="form-group"><label>名称</label><input type="text" id="emName" value="'+(mat.name||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>类别</label><input type="text" id="emCategory" value="'+(mat.category||'')+'"></div>';
  h+='<div class="form-group"><label>规格</label><input type="text" id="emSpec" value="'+(mat.spec||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>库存</label><input type="number" id="emStock" value="'+(mat.stock||0)+'" min="0"></div>';
  h+='<div class="form-group"><label>单位</label><input type="text" id="emUnit" value="'+(mat.unit||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>安全库存</label><input type="number" id="emMin" value="'+(mat.minStock||0)+'" min="0"></div>';
  h+='<div class="form-group"><label>存放位置</label><input type="text" id="emLocation" value="'+(mat.location||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>有效期</label><input type="date" id="emExpiry" value="'+(mat.expiry||'')+'"></div>';
  h+='<div class="form-group"><label>供应商</label><input type="text" id="emSupplier" value="'+(mat.supplier||'')+'"></div></div>';
  h+='<div class="form-row"><div class="form-group"><label>单价(元)</label><input type="number" id="emPrice" value="'+(mat.unitPrice||0)+'" min="0" step="0.01"></div></div>';
  App._modal('editMaterialModal','编辑物资',h,'<button class="btn" id="btnSaveMatE">保存</button> <button class="btn btn-secondary" onclick="App.closeModal(\'editMaterialModal\')">取消</button>');
  App.byId('btnSaveMatE').addEventListener('click',function(){
    mat.code=App.byId('emCode').value;mat.name=App.byId('emName').value;mat.category=App.byId('emCategory').value;mat.spec=App.byId('emSpec').value;
    mat.stock=App.byId('emStock').value;mat.unit=App.byId('emUnit').value;mat.minStock=App.byId('emMin').value;mat.location=App.byId('emLocation').value;
    mat.expiry=App.byId('emExpiry').value;mat.supplier=App.byId('emSupplier').value;mat.unitPrice=App.byId('emPrice').value;
    App.appState.saveAll();App.closeModal('editMaterialModal');App.renderBaseView();App.showToast('已更新','success');
  });
};
