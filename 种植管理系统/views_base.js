// ============================================================
// views_base.js - 基地管理视图 (v2.2)
// ============================================================

var App = App || {};

App.renderBaseView = function() {
  var state = App.appState;
  var base = state.base;
  if (!base) { base = App.defaultBase(); state.base = base; }
  var tab = state.currentBaseTab || 'basic';
  var h = '';

  var tabs = [
    {id:'basic',label:'基本信息'},{id:'plots',label:'地块信息'},
    {id:'personnel',label:'人员信息'},{id:'tools',label:'工具台账'},
    {id:'equipment',label:'设备设施'},{id:'materials',label:'物资库存'}
  ];
  h += '<div class="panel"><div class="panel-header" style="padding:6px 16px"><div style="display:flex;gap:4px">';
  tabs.forEach(function(t) {
    var act = t.id === tab ? ' active' : '';
    h += '<button class="btn btn-sm base-tab-btn' + act + '" data-tab="' + t.id + '">' + t.label + '</button>';
  });
  h += '</div></div></div>';

  if (tab === 'basic') {
    var bi = base.basicInfo || {};
    h += '<div class="panel"><div class="panel-header"><h2>基地基本信息</h2><button class="btn btn-sm" id="btnSaveBaseBasic">保存</button></div><div class="panel-body">';
    h += '<div class="form-row"><div class="form-group"><label>基地名称</label><input type="text" id="bbName" value="'+(bi.name||'')+'"></div>';
    h += '<div class="form-group"><label>所属区域</label><input type="text" id="bbRegion" value="'+(bi.region||'')+'"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>行政区划</label><input type="text" id="bbAdmin" value="'+(bi.adminArea||'')+'"></div>';
    h += '<div class="form-group"><label>海拔(m)</label><input type="text" id="bbAlt" value="'+(bi.altitude||'')+'"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>年均温(℃)</label><input type="text" id="bbTemp" value="'+(bi.avgTemp||'')+'"></div>';
    h += '<div class="form-group"><label>年降雨量(mm)</label><input type="text" id="bbRain" value="'+(bi.rainfall||'')+'"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>无霜期(天)</label><input type="text" id="bbFrost" value="'+(bi.frostDays||'')+'"></div>';
    h += '<div class="form-group"><label>年日照时数(h)</label><input type="text" id="bbSun" value="'+(bi.sunshineHours||'')+'"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>土壤类型</label><select id="bbSoil">'+App.selOpts(App.SOIL_TYPES,bi.soilType)+'</select></div>';
    h += '<div class="form-group"><label>土壤pH</label><input type="text" id="bbPh" value="'+(bi.soilPh||'')+'"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>有机质(g/kg)</label><input type="text" id="bbOm" value="'+(bi.organicMatter||'')+'"></div>';
    h += '<div class="form-group"><label>灌溉方式</label><select id="bbIrr">'+App.selOpts(App.IRRIGATION_TYPES,bi.irrigation)+'</select></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>描述</label><textarea id="bbDesc" rows="3">'+(bi.description||'')+'</textarea></div></div>';
    h += '</div></div>';
  }

  if (tab === 'plots') {
    h += '<div class="panel"><div class="panel-header"><h2>地块信息 <span class="ref-badge">'+(base.plots?base.plots.length:0)+' 块</span></h2>';
    h += '<button class="btn btn-sm" id="btnAddPlot">+ 添加地块</button></div><div class="panel-body">';
    if (!base.plots||!base.plots.length) {
      h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无地块信息</div>';
    } else {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th>编号</th><th>名称</th><th>区域</th><th>面积(亩)</th><th>土壤</th><th>灌溉</th><th>设施</th><th>状态</th><th>当前作物</th><th>上茬</th><th>责任人</th><th>地力</th><th>评级</th><th style="width:60px">操作</th></tr></thead><tbody>';
      base.plots.forEach(function(plot, i) {
        h += '<tr><td>'+(plot.code||'—')+'</td><td>'+(plot.name||'—')+'</td><td>'+(plot.area||'—')+'</td><td>'+(plot.acres||'—')+'</td>';
        h += '<td>'+(plot.soilType||'—')+'</td><td>'+(plot.irrigation||'—')+'</td><td>'+(plot.facility||'—')+'</td>';
        h += '<td><span class="status-badge '+(plot.status==='在种'?'status-progress':plot.status==='空闲'?'status-pending':'')+'">'+(plot.status||'—')+'</span></td>';
        h += '<td>'+(plot.currentCrop||'—')+'</td><td>'+(plot.prevCrop||'—')+'</td><td>'+(plot.manager||'—')+'</td>';
        h += '<td>'+(plot.landGrade||'—')+'</td><td>'+(plot.rating||'—')+'</td>';
        h += '<td><button class="btn btn-sm plot-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm plot-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div></div>';
  }

  if (tab === 'personnel') {
    h += '<div class="panel"><div class="panel-header"><h2>人员信息 <span class="ref-badge">'+(base.personnel?base.personnel.length:0)+' 人</span></h2>';
    h += '<button class="btn btn-sm" id="btnAddPerson">+ 添加人员</button></div><div class="panel-body">';
    if (!base.personnel||!base.personnel.length) {
      h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无人员信息</div>';
    } else {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th>工号</th><th>姓名</th><th>性别</th><th>电话</th><th>岗位</th><th>用工</th><th>入职</th><th>日薪(元)</th><th>技能</th><th>负责地块</th><th>健康</th><th style="width:60px">操作</th></tr></thead><tbody>';
      base.personnel.forEach(function(p, i) {
        h += '<tr><td>'+(p.code||'—')+'</td><td>'+(p.name||'—')+'</td><td>'+(p.gender||'—')+'</td><td>'+(p.phone||'—')+'</td>';
        h += '<td>'+(p.position||'—')+'</td><td>'+(p.employType||'—')+'</td><td>'+(p.hireDate||'—')+'</td>';
        h += '<td style="font-weight:600;color:var(--accent)">'+(p.dailyWage||'—')+'</td>';
        h += '<td>'+(p.skills||'—')+'</td><td>'+(p.responsiblePlots||'—')+'</td><td>'+(p.health||'—')+'</td>';
        h += '<td><button class="btn btn-sm person-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm person-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div></div>';
  }

  if (tab === 'tools') {
    h += '<div class="panel"><div class="panel-header"><h2>工具台账 <span class="ref-badge">'+(base.tools?base.tools.length:0)+' 件</span></h2>';
    h += '<button class="btn btn-sm" id="btnAddTool">+ 添加工具</button></div><div class="panel-body">';
    if (!base.tools||!base.tools.length) {
      h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无工具信息</div>';
    } else {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th>编号</th><th>名称</th><th>规格</th><th>品牌</th><th>数量</th><th>单位</th><th>位置</th><th>保管人</th><th>状态</th><th>效率</th><th>成本</th><th style="width:60px">操作</th></tr></thead><tbody>';
      base.tools.forEach(function(t, i) {
        h += '<tr><td>'+(t.code||'—')+'</td><td>'+(t.name||'—')+'</td><td>'+(t.spec||'—')+'</td><td>'+(t.brand||'—')+'</td>';
        h += '<td>'+(t.quantity||'—')+'</td><td>'+(t.unit||'—')+'</td><td>'+(t.location||'—')+'</td><td>'+(t.keeper||'—')+'</td>';
        h += '<td><span class="status-badge '+(t.status==='可借用'?'status-completed':t.status==='维修中'?'status-pending':'')+'">'+(t.status||'—')+'</span></td>';
        h += '<td>'+(t.efficiency||'—')+'</td><td>'+(t.cost||'—')+'</td>';
        h += '<td><button class="btn btn-sm tool-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm tool-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div></div>';
  }

  if (tab === 'equipment') {
    h += '<div class="panel"><div class="panel-header"><h2>设备设施 <span class="ref-badge">'+(base.equipment?base.equipment.length:0)+' 台</span></h2>';
    h += '<button class="btn btn-sm" id="btnAddEquip">+ 添加设备</button></div><div class="panel-body">';
    if (!base.equipment||!base.equipment.length) {
      h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无设备信息</div>';
    } else {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th>编号</th><th>名称</th><th>型号</th><th>分类</th><th>购置</th><th>原值</th><th>年限</th><th>状态</th><th>位置</th><th>责任人</th><th>效率</th><th>成本</th><th style="width:60px">操作</th></tr></thead><tbody>';
      base.equipment.forEach(function(eq, i) {
        h += '<tr><td>'+(eq.code||'—')+'</td><td>'+(eq.name||'—')+'</td><td>'+(eq.model||'—')+'</td><td>'+(eq.assetCategory||'—')+'</td>';
        h += '<td>'+(eq.purchaseDate||'—')+'</td><td>'+(eq.originalValue||'—')+'</td><td>'+(eq.lifeYears||'—')+'</td>';
        h += '<td><span class="status-badge '+(eq.status==='运行'?'status-completed':eq.status==='维修'?'status-pending':'')+'">'+(eq.status||'—')+'</span></td>';
        h += '<td>'+(eq.location||'—')+'</td><td>'+(eq.manager||'—')+'</td><td>'+(eq.efficiency||'—')+'</td><td>'+(eq.cost||'—')+'</td>';
        h += '<td><button class="btn btn-sm equip-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm equip-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div></div>';
  }

  if (tab === 'materials') {
    h += '<div class="panel"><div class="panel-header"><h2>物资库存 <span class="ref-badge">'+(base.materials?base.materials.length:0)+' 项</span></h2>';
    h += '<button class="btn btn-sm" id="btnAddMaterial">+ 添加物资</button></div><div class="panel-body">';
    if (!base.materials||!base.materials.length) {
      h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无物资信息</div>';
    } else {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th>编码</th><th>名称</th><th>类别</th><th>规格</th><th>库存</th><th>单位</th><th>安全库存</th><th>位置</th><th>有效期</th><th>供应商</th><th>单价</th><th style="width:60px">操作</th></tr></thead><tbody>';
      base.materials.forEach(function(mat, i) {
        h += '<tr><td>'+(mat.code||'—')+'</td><td>'+(mat.name||'—')+'</td><td>'+(mat.category||'—')+'</td><td>'+(mat.spec||'—')+'</td>';
        h += '<td>'+(mat.stock||'—')+'</td><td>'+(mat.unit||'—')+'</td><td>'+(mat.minStock||'—')+'</td><td>'+(mat.location||'—')+'</td>';
        h += '<td>'+(mat.expiry||'—')+'</td><td>'+(mat.supplier||'—')+'</td><td>'+(mat.unitPrice||'—')+'</td>';
        h += '<td><button class="btn btn-sm material-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm material-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div></div>';
  }

  App.byId('mainView').innerHTML = h;

  // Tab 切换
  App.qsa('.base-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { state.currentBaseTab = this.dataset.tab; App.renderBaseView(); });
  });

  // 基本信息保存
  if (App.byId('btnSaveBaseBasic')) {
    App.byId('btnSaveBaseBasic').addEventListener('click', function() {
      var bi = base.basicInfo;
      bi.name=App.byId('bbName').value;bi.region=App.byId('bbRegion').value;bi.adminArea=App.byId('bbAdmin').value;
      bi.altitude=App.byId('bbAlt').value;bi.avgTemp=App.byId('bbTemp').value;bi.rainfall=App.byId('bbRain').value;
      bi.frostDays=App.byId('bbFrost').value;bi.sunshineHours=App.byId('bbSun').value;bi.soilType=App.byId('bbSoil').value;
      bi.soilPh=App.byId('bbPh').value;bi.organicMatter=App.byId('bbOm').value;bi.irrigation=App.byId('bbIrr').value;
      bi.description=App.byId('bbDesc').value;
      state.saveAll(); App.showToast('已保存','success');
    });
  }

  // 地块 CRUD
  if(App.byId('btnAddPlot'))App.byId('btnAddPlot').addEventListener('click',App.showAddPlotModal);
  App.qsa('.plot-edit').forEach(function(btn){btn.addEventListener('click',function(){App.showEditPlotModal(parseInt(this.dataset.idx));});});
  App.qsa('.plot-del').forEach(function(btn){btn.addEventListener('click',function(){base.plots.splice(parseInt(this.dataset.idx),1);state.saveAll();App.renderBaseView();App.showToast('已删除','info');});});

  // 人员 CRUD
  if(App.byId('btnAddPerson'))App.byId('btnAddPerson').addEventListener('click',App.showAddPersonModal);
  App.qsa('.person-edit').forEach(function(btn){btn.addEventListener('click',function(){App.showEditPersonModal(parseInt(this.dataset.idx));});});
  App.qsa('.person-del').forEach(function(btn){btn.addEventListener('click',function(){base.personnel.splice(parseInt(this.dataset.idx),1);state.saveAll();App.renderBaseView();App.showToast('已删除','info');});});

  // 工具 CRUD
  if(App.byId('btnAddTool'))App.byId('btnAddTool').addEventListener('click',App.showAddToolModal);
  App.qsa('.tool-edit').forEach(function(btn){btn.addEventListener('click',function(){App.showEditToolModal(parseInt(this.dataset.idx));});});
  App.qsa('.tool-del').forEach(function(btn){btn.addEventListener('click',function(){base.tools.splice(parseInt(this.dataset.idx),1);state.saveAll();App.renderBaseView();App.showToast('已删除','info');});});

  // 设备 CRUD
  if(App.byId('btnAddEquip'))App.byId('btnAddEquip').addEventListener('click',App.showAddEquipModal);
  App.qsa('.equip-edit').forEach(function(btn){btn.addEventListener('click',function(){App.showEditEquipModal(parseInt(this.dataset.idx));});});
  App.qsa('.equip-del').forEach(function(btn){btn.addEventListener('click',function(){base.equipment.splice(parseInt(this.dataset.idx),1);state.saveAll();App.renderBaseView();App.showToast('已删除','info');});});

  // 物资 CRUD
  if(App.byId('btnAddMaterial'))App.byId('btnAddMaterial').addEventListener('click',App.showAddMaterialModal);
  App.qsa('.material-edit').forEach(function(btn){btn.addEventListener('click',function(){App.showEditMaterialModal(parseInt(this.dataset.idx));});});
  App.qsa('.material-del').forEach(function(btn){btn.addEventListener('click',function(){base.materials.splice(parseInt(this.dataset.idx),1);state.saveAll();App.renderBaseView();App.showToast('已删除','info');});});
};
