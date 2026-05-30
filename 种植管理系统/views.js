// ============================================================
// views.js - 视图渲染层 (v2.2)
// 指标按子分类分组显示、分组折叠、搜索联动
// ============================================================

var App = App || {};

// ============================================================
// 侧边栏渲染
// ============================================================
App.renderSidebar = function() {
  var state = App.appState;
  var baseTabs = [
    {id:'basic',label:'基本信息'},{id:'plots',label:'地块信息'},
    {id:'personnel',label:'人员信息'},{id:'tools',label:'工具台账'},
    {id:'equipment',label:'设备设施'},{id:'materials',label:'物资库存'}
  ];
  var baseHtml = '';
  baseTabs.forEach(function(t) {
    var act = state.currentBaseTab === t.id && !state.currentModelId && !state.currentPlanId && !state.currentRecordId && !state.currentWorkOrderId && !state.currentWorkRecordId && !state.currentDataCollectionId ? ' active' : '';
    baseHtml += '<div class="item-row' + act + '" data-type="base" data-tab="' + t.id + '"><div class="label">' + t.label + '</div></div>';
  });
  App.byId('baseNav').innerHTML = baseHtml;

  var dotC = {秦脆:'#e91e63',瑞雪:'#27ae60',福布拉斯:'#e67e22',蜜脆:'#ff9800',富士冠军:'#9c27b0',红思尼克:'#f44336',爱妃:'#e91e63'};

  var mh = '';
  Object.keys(state.models).forEach(function(id) {
    var m = state.models[id], act = id === state.currentModelId ? ' active' : '';
    mh += '<div class="item-row' + act + '" data-type="model" data-id="' + id + '">' +
      '<span class="dot" style="background:' + (dotC[m.variety]||'#2980b9') + '"></span>' +
      '<span class="label">' + App.modelTitle(m) + '</span>' +
      '<span class="del" data-action="delModel">×</span></div>';
  });
  App.byId('modelList').innerHTML = mh || '<div style="font-size:11px;color:var(--muted);padding:4px 0">暂无模型</div>';

  var ph = '';
  Object.keys(state.plans).forEach(function(id) {
    var p = state.plans[id], act = id === state.currentPlanId ? ' active' : '';
    ph += '<div class="item-row' + act + '" data-type="plan" data-id="' + id + '">' +
      '<span class="dot" style="background:#9b59b6"></span>' +
      '<span class="label">' + App.planTitle(p) + '</span>' +
      '<span class="del" data-action="delPlan">×</span></div>';
  });
  App.byId('planList').innerHTML = ph || '<div style="font-size:11px;color:var(--muted);padding:4px 0">暂无计划</div>';

  var dch = '';
  Object.keys(state.dataCollections).forEach(function(id) {
    var dc = state.dataCollections[id], act = id === state.currentDataCollectionId ? ' active' : '';
    var abnormalCount = (dc.items||[]).filter(function(it){return it.status!=='normal';}).length;
    var badge = abnormalCount > 0 ? '<span style="font-size:10px;color:var(--danger);font-weight:600;margin-left:auto;padding:0 4px">⚠'+abnormalCount+'</span>' : '<span style="font-size:10px;color:var(--accent);margin-left:auto;padding:0 4px">✓</span>';
    dch += '<div class="item-row' + act + '" data-type="datacollection" data-id="' + id + '">' +
      '<span class="dot" style="background:' + (abnormalCount>0?'#e67e22':'#27ae60') + '"></span>' +
      '<span class="label">' + (dc.collectDate||'') + ' ' + (dc.phaseName||'') + '</span>' +
      badge +
      '<span class="del" data-action="delDC">×</span></div>';
  });
  App.byId('dataCollectionList').innerHTML = dch || '<div style="font-size:11px;color:var(--muted);padding:4px 0">暂无采集记录</div>';

  var wh = '';
  Object.keys(state.workOrders).forEach(function(id) {
    var wo = state.workOrders[id], act = id === state.currentWorkOrderId ? ' active' : '';
    var si = {pending:'⏳',inProgress:'🔄',completed:'✅',cancelled:'❌'};
    wh += '<div class="item-row' + act + '" data-type="workorder" data-id="' + id + '">' +
      '<span class="dot" style="background:#e67e22"></span>' +
      '<span class="label">' + (wo.taskDescription||wo.id) + '</span>' +
      '<span style="font-size:10px;color:var(--muted)">' + (si[wo.status]||'') + '</span>' +
      '<span class="del" data-action="delWorkOrder">×</span></div>';
  });
  App.byId('workOrderList').innerHTML = wh || '<div style="font-size:11px;color:var(--muted);padding:4px 0">暂无派工单</div>';

  var wrh = '';
  Object.keys(state.workRecords).forEach(function(id) {
    var wr = state.workRecords[id], act = id === state.currentWorkRecordId ? ' active' : '';
    wrh += '<div class="item-row' + act + '" data-type="workrecord" data-id="' + id + '">' +
      '<span class="dot" style="background:#27ae60"></span>' +
      '<span class="label">' + (wr.recordDate||wr.id) + ' ' + (wr.operationNames||['']).join(',') + '</span>' +
      '<span class="del" data-action="delWorkRecord">×</span></div>';
  });
  App.byId('workRecordList').innerHTML = wrh || '<div style="font-size:11px;color:var(--muted);padding:4px 0">暂无作业记录</div>';

  App.qsa('#sidebar .item-row').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.dataset.action === 'delModel') { App.deleteModel(e.target.closest('.item-row').dataset.id); return; }
      if (e.target.dataset.action === 'delPlan') { App.deletePlan(e.target.closest('.item-row').dataset.id); return; }
      if (e.target.dataset.action === 'delRecord') { App.deleteRecord(e.target.closest('.item-row').dataset.id); return; }
      if (e.target.dataset.action === 'delWorkOrder') { App.deleteWorkOrder(e.target.closest('.item-row').dataset.id); return; }
      if (e.target.dataset.action === 'delWorkRecord') { App.deleteWorkRecord(e.target.closest('.item-row').dataset.id); return; }
      if (e.target.dataset.action === 'delDC') { App.deleteDataCollection(e.target.closest('.item-row').dataset.id); return; }
      var t = this.dataset.type;
      state.currentModelId = t==='model'?this.dataset.id:null;
      state.currentPlanId = t==='plan'?this.dataset.id:null;
      state.currentRecordId = t==='record'?this.dataset.id:null;
      state.currentWorkOrderId = t==='workorder'?this.dataset.id:null;
      state.currentWorkRecordId = t==='workrecord'?this.dataset.id:null;
      state.currentDataCollectionId = t==='datacollection'?this.dataset.id:null;
      state.currentCostView = t==='costanalysis'?this.dataset.view:null;
      state.currentBaseTab = t==='base'?this.dataset.tab:'';
      App.renderSidebar();
      App.renderMain();
    });
  });
};

// ============================================================
// 主视图分发
// ============================================================
App.renderMain = function() {
  var v = App.byId('mainView'), e = App.byId('emptyState');
  var s = App.appState;
  if (s.currentModelId) { App.renderModelView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentPlanId) { App.renderPlanView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentRecordId) { App.renderRecordView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentDataCollectionId) { App.renderDataCollectionView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentWorkOrderId) { App.renderWorkOrderView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentWorkRecordId) { App.renderWorkRecordView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentCostView) { App.renderCostAnalysisView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else if (s.currentBaseTab) { App.renderBaseView(); e.classList.add('hidden'); v.classList.remove('hidden'); }
  else { e.classList.remove('hidden'); v.classList.add('hidden'); v.innerHTML = ''; }
};

// ============================================================
// 模型视图（指标按子分类分组 + 折叠）
// ============================================================
App.renderModelView = function() {
  var state = App.appState;
  var m = state.models[state.currentModelId];
  if (!m) return;
  if (!m.phases) m.phases = App.makeDefaultPhases();
  var v = App.getVInfo(m.variety);
  var h = '';

  h += '<div class="panel"><div class="panel-header"><h2>生长模型: ' + App.modelTitle(m) + '</h2>';
  h += '<div><button class="btn btn-sm" id="btnEditModel">编辑基本信息</button> <button class="btn btn-sm" id="btnCloneModel">复制模型</button> <button class="btn btn-sm btn-danger" id="btnDelModel">删除</button></div></div>';
  h += '<div class="panel-body">';
  h += '<div class="info-row"><span>品种: <strong>' + m.variety + '</strong></span><span>苗龄: <strong>' + m.seedlingAge + '年</strong></span><span>砧木: <strong>' + m.rootstockVar + '</strong>(<small>' + m.rootstockType + '</small>)</span><span>栽培: <strong>' + m.densityType + '·' + m.trellis + '</strong></span></div>';
  var tip = '<strong>品种提示:</strong> 钙:'+(v.ca||'—')+' | 锈:'+(v.rust||'—')+' | 日灼:'+(v.burn||'—')+' | 色:'+(v.color||'—')+' | 熟:'+(v.mature||'—')+' | 氮:'+(v.n||'—')+' | 补钙:'+(v.caT||'—')+' | TSS:'+(v.tss||'—');
  if (v.note) tip += '<br>💡 ' + v.note;
  h += '<div class="tip-card">' + tip + '</div>';
  h += '</div></div>';

  // 物候期条形图
  h += '<div class="panel"><div class="panel-header"><h2>自定义物候期</h2><button class="btn btn-sm" id="btnEditPhases">编辑绑定</button></div><div class="panel-body">';
  var totalDur = 0;
  m.phases.forEach(function(p) { totalDur += (p.dur||1); });
  h += '<div style="height:40px;display:flex;border-radius:4px;overflow:hidden;border:1px solid var(--border);margin-bottom:6px">';
  m.phases.forEach(function(p, i) {
    var w = Math.max((p.dur||1)/totalDur*100, 3);
    h += '<div class="bbch-seg ' + App.phaseClass(i) + '" style="width:' + w + '%;font-size:11px;font-weight:600;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.3)" title="' + p.name + ': ' + (p.dur||'?') + '天 | BBCH ' + App.pad2(p.bbchStart) + '-' + App.pad2(p.bbchEnd) + '">' + p.name + '</div>';
  });
  h += '</div>';
  h += '<table class="data-table" style="font-size:11px"><thead><tr><th>阶段</th><th>名称</th><th>BBCH</th><th>时间窗</th><th>持续</th></tr></thead><tbody>';
  m.phases.forEach(function(p, i) {
    h += '<tr style="border-left:3px solid '+App.phaseLb(i)+'"><td>'+p.id+'</td><td>'+p.name+'</td><td>'+App.pad2(p.bbchStart)+'-'+App.pad2(p.bbchEnd)+'</td><td>'+App.fmtTW(p)+'</td><td>'+(p.dur||'?')+'天</td></tr>';
  });
  h += '</tbody></table></div></div>';

  // 指标初始化
  if (!m.indicators || !m.indicators.length) { m.indicators = App.populateIndicators(m.variety, m.seedlingAge); state.saveAll(); }

  // 搜索
  h += '<div class="panel"><div class="panel-body" style="padding:8px 16px">';
  h += '<input type="text" id="globalIndSearch" placeholder="🔍 搜索全部指标..." style="min-width:400px;padding:8px 12px;font-size:14px">';
  h += ' <span style="font-size:12px;color:var(--muted)" id="searchResultHint"></span></div></div>';

  // 作业初始化
  if (!m.operations || !m.operations.length) m.operations = [];
  if (!m._operationsSeeded) { m._operationsSeeded = true; m.operations = m.operations.concat(App.defaultOperations()); state.saveAll(); }

  // 四个面板
  var panelDefs = [
    {id:'resPanel',title:'生育模型管理',desc:'树体生长、果实品质、产量',cat:'生育结果',icon:'🌳'},
    {id:'envPanel',title:'生育环境模型管理',desc:'温度、水分、光照、风速等',cat:'环境条件',icon:'🌤'},
    {id:'pestPanel',title:'病虫草害模型管理',desc:'病害、虫害、草害监测',cat:'病虫草害',icon:'🐛'},
    {id:'mgtPanel',title:'种植管理模型管理',desc:'施肥、灌溉、修剪、套袋等',cat:'农事管理',icon:'🔧'}
  ];

  panelDefs.forEach(function(pd) {
    var inds = m.indicators.map(function(ind, idx) { return {ind:ind,idx:idx}; }).filter(function(x) {
      return App.getPanelName([x.ind.id,x.ind.name,x.ind.category,x.ind.type]) === pd.cat;
    });
    var enabledCount = inds.filter(function(x) { return x.ind.enabled !== false; }).length;

    h += '<div class="panel"><div class="panel-header"><h2>'+pd.icon+' '+pd.title+' <span style="font-size:12px;color:var(--muted);font-weight:400">已启用 '+enabledCount+'/'+inds.length+'</span></h2>';
    h += '<div><button class="btn btn-sm '+(pd.cat==='农事管理'?'op-add-btn':'ind-add-btn')+'" data-cat="'+pd.cat+'">+ 添加'+(pd.cat==='农事管理'?'作业':'指标')+'</button></div></div>';
    h += '<div class="panel-body"><p style="font-size:12px;color:var(--muted);margin-bottom:6px">'+pd.desc+'</p>';

    // ── 农事管理：作业表格 ──
    if (pd.cat === '农事管理') {
      h += '<table class="data-table" style="font-size:12px"><thead><tr><th style="width:30px">启用</th><th>BBCH</th><th>类型</th><th>名称</th><th>目的</th><th>方式</th><th>物料(元/亩)</th><th>人工(元/亩)</th><th>设备(元/亩)</th><th>标准</th><th style="width:60px">操作</th></tr></thead><tbody>';
      (m.operations||[]).forEach(function(op, i) {
        h += '<tr style="'+(op.enabled===false?'opacity:.4':'')+'">';
        h += '<td><input type="checkbox" class="op-enable" data-idx="'+i+'"'+(op.enabled!==false?' checked':'')+'></td>';
        h += '<td>'+App.pad2(op.bbchStart)+'-'+App.pad2(op.bbchEnd)+'</td>';
        h += '<td style="font-size:11px">'+(op.category||'')+'</td>';
        h += '<td>'+op.name+'</td>';
        h += '<td style="font-size:11px;color:var(--muted)">'+(op.purpose||'')+'</td>';
        h += '<td style="font-size:11px">'+(op.methods||[]).join('+')+'</td>';
        h += '<td style="text-align:right">'+(op.materialCost||'—')+'</td>';
        h += '<td style="text-align:right">'+(op.laborCost||'—')+'</td>';
        h += '<td style="text-align:right">'+(op.equipCost||'—')+'</td>';
        h += '<td style="font-size:11px;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+(op.standard||'')+'">'+(op.standard||'—')+'</td>';
        h += '<td><button class="btn btn-sm op-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm op-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
      });
      h += '</tbody></table>';
      var tM=0,tL=0,tE=0;
      (m.operations||[]).forEach(function(op){if(op.enabled!==false){tM+=parseFloat(op.materialCost)||0;tL+=parseFloat(op.laborCost)||0;tE+=parseFloat(op.equipCost)||0;}});
      h += '<div style="margin-top:8px;padding:8px 12px;background:#fafaf7;border-radius:4px;font-size:12px;display:flex;gap:24px">';
      h += '<span>物料: <strong>'+tM.toFixed(0)+'</strong></span><span>人工: <strong>'+tL.toFixed(0)+'</strong></span><span>设备: <strong>'+tE.toFixed(0)+'</strong></span>';
      h += '<span style="color:var(--accent);font-weight:600">综合: <strong>'+(tM+tL+tE).toFixed(0)+' 元/亩</strong></span></div>';
      h += '</div></div>';
      return;
    }

    // ── 指标面板：按子分类分组 ──
    h += '<table class="data-table" style="font-size:12px" id="indTable_'+pd.id+'"><thead><tr><th style="width:30px">启用</th><th>指标名称</th><th>BBCH</th><th>单位</th><th>参考范围</th><th style="width:60px">操作</th></tr></thead><tbody>';

    // 分组
    var groups = {};
    var groupOrder = [];
    inds.forEach(function(x) {
      var gKey = x.ind.category || '其他';
      if (!groups[gKey]) { groups[gKey] = []; groupOrder.push(gKey); }
      groups[gKey].push(x);
    });

    groupOrder.forEach(function(gKey) {
      var gInds = groups[gKey];
      var gId = pd.id + '_' + gKey.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      // 分组标题行
      h += '<tr class="group-header" style="background:#fafaf7;border-left:3px solid var(--accent);cursor:pointer" data-gid="'+gId+'">';
      h += '<td colspan="6" style="font-weight:700;font-size:12px;padding:6px 8px;color:var(--accent)">';
      h += '<span class="group-arrow" style="display:inline-block;width:16px">▼</span> '+gKey+' <span style="font-size:11px;color:var(--muted);font-weight:400">('+gInds.length+'项)</span></td></tr>';
      // 指标行
      gInds.forEach(function(x) {
        var ind = x.ind, idx = x.idx;
        var tt = (ind.optLow||ind.optHigh||ind.alertLow||ind.alertHigh) ?
          '🟢'+(ind.optLow||'')+'-'+(ind.optHigh||'')+(ind.alertLow||ind.alertHigh?' 🟡'+(ind.alertLow||'')+'-'+(ind.alertHigh||''):'') :
          (ind.refRange||'—');
        if (!tt) tt = '—';
        h += '<tr data-panel="'+pd.id+'" data-bbch="'+ind.bbchStart+'-'+ind.bbchEnd+'" data-group="'+gId+'">';
        h += '<td><input type="checkbox" class="ind-enable" data-idx="'+idx+'"'+(ind.enabled!==false?' checked':'')+'></td>';
        h += '<td>'+ind.name+(ind.isCustom?' <span class="tag tag-ref">自定义</span>':'')+'</td>';
        h += '<td>'+App.pad2(ind.bbchStart)+'-'+App.pad2(ind.bbchEnd)+'</td>';
        h += '<td>'+ind.unit+'</td>';
        h += '<td style="font-size:11px;color:var(--muted)">'+tt+'</td>';
        h += '<td><button class="btn btn-sm ind-edit" data-idx="'+idx+'">编辑</button> <button class="btn btn-sm ind-del" data-idx="'+idx+'" style="color:var(--danger)">×</button></td></tr>';
      });
    });
    h += '</tbody></table></div></div>';
  });

  App.byId('mainView').innerHTML = h;

  // ── 事件绑定 ──
  App.byId('btnEditModel').addEventListener('click', App.showEditModelModal);
  App.byId('btnCloneModel').addEventListener('click', App.cloneModel);
  App.byId('btnDelModel').addEventListener('click', function() { App.deleteModel(state.currentModelId); });
  App.byId('btnEditPhases').addEventListener('click', App.showEditPhasesModal);

  // 搜索（联动分组标题）
  App.byId('globalIndSearch').addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    var allRows = App.qsa('tr[data-group]');
    var groupHeaders = App.qsa('.group-header');
    if (!q) {
      allRows.forEach(function(r){r.style.display='';});
      groupHeaders.forEach(function(r){r.style.display='';});
      App.byId('searchResultHint').textContent='';
      return;
    }
    var found = 0;
    groupHeaders.forEach(function(r){r.style.display='none';});
    allRows.forEach(function(r) {
      var show = (r.textContent||'').toLowerCase().indexOf(q)>=0;
      r.style.display = show?'':'none';
      if(show) {
        found++;
        var gid = r.dataset.group;
        if(gid) {
          var header = App.qs('tr.group-header[data-gid="'+gid+'"]');
          if(header) header.style.display='';
        }
      }
    });
    App.byId('searchResultHint').textContent = '找到 '+found+' 个指标';
  });

  // 分组折叠
  App.qsa('.group-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var gid = this.dataset.gid;
      var rows = App.qsa('tr[data-group="'+gid+'"]');
      var arrow = this.querySelector('.group-arrow');
      if (!rows.length) return;
      var isHidden = rows[0].style.display === 'none';
      rows.forEach(function(r) { r.style.display = isHidden ? '' : 'none'; });
      arrow.textContent = isHidden ? '▼' : '▶';
    });
  });

  // 添加指标/作业
  App.qsa('.ind-add-btn').forEach(function(btn) { btn.addEventListener('click', function() { App.showAddIndicatorModal(this.dataset.cat); }); });
  App.qsa('.op-add-btn').forEach(function(btn) { btn.addEventListener('click', function() { App.showAddOperationModal(); }); });
  App.qsa('.op-enable').forEach(function(cb) { cb.addEventListener('change', function() { m.operations[parseInt(this.dataset.idx)].enabled = this.checked; state.saveAll(); }); });
  App.qsa('.op-edit').forEach(function(btn) { btn.addEventListener('click', function() { App.showEditOperationModal(parseInt(this.dataset.idx)); }); });
  App.qsa('.op-del').forEach(function(btn) { btn.addEventListener('click', function() { m.operations.splice(parseInt(this.dataset.idx),1); state.saveAll(); App.renderMain(); App.showToast('作业已删除','info'); }); });
  App.qsa('.ind-edit').forEach(function(btn) { btn.addEventListener('click', function() { App.showEditIndicatorModal(parseInt(this.dataset.idx)); }); });
  App.qsa('.ind-del').forEach(function(btn) { btn.addEventListener('click', function() { m.indicators.splice(parseInt(this.dataset.idx),1); state.saveAll(); App.renderMain(); App.showToast('指标已删除','info'); }); });
  App.qsa('.ind-enable').forEach(function(cb) { cb.addEventListener('change', function() { m.indicators[parseInt(this.dataset.idx)].enabled = this.checked; state.saveAll(); }); });
};

// ============================================================
// 计划视图
// ============================================================
App.renderPlanView = function() {
  var state = App.appState;
  var p = state.plans[state.currentPlanId];
  if (!p) return;
  var m = state.models[p.modelId];
  var h = '';
  h += '<div class="panel"><div class="panel-header"><h2>种植计划: '+App.planTitle(p)+'</h2>';
  h += '<div><button class="btn btn-sm" id="btnEditPlan">编辑</button> <button class="btn btn-sm" id="btnExecutePlan">执行</button> <button class="btn btn-sm btn-danger" id="btnDelPlan">删除</button></div></div>';
  h += '<div class="panel-body">';
  h += '<div class="info-row"><span>年份: <strong>'+(p.year||'—')+'</strong></span><span>地块: <strong>'+(p.plot||'—')+'</strong></span><span>面积: <strong>'+(p.area||'—')+'亩</strong></span><span>密度: <strong>'+(p.density||'—')+'</strong></span></div>';
  if (p.description) h += '<div style="font-size:12px;color:var(--muted)">'+p.description+'</div>';
  if (m) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">关联模型: <a href="#" id="planModelLink" style="color:var(--accent)">'+App.modelTitle(m)+'</a></div>';
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>计划作业 <span class="ref-badge">'+(p.operations?p.operations.length:0)+' 项</span></h2>';
  h += '<button class="btn btn-sm" id="btnAddPlanOp">+ 添加作业</button></div><div class="panel-body">';
  if (!p.operations||!p.operations.length) {
    h += '<div style="font-size:12px;color:var(--muted);padding:12px 0">暂无计划作业</div>';
  } else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>作业名称</th><th>类型</th><th>日期</th><th>负责人</th><th>BBCH</th><th>状态</th><th>人工</th><th>物资</th><th>预算(元)</th><th style="width:100px">操作</th></tr></thead><tbody>';
    var si = {pending:'⏳',inProgress:'🔄',completed:'✅',cancelled:'❌'};
    var sl = {pending:'待执行',inProgress:'进行中',completed:'已完成',cancelled:'已取消'};
    p.operations.forEach(function(op, i) {
      var pers = op.personnel||{};
      var mats = op.materials||[];
      var budget = op.budgetSummary||{};
      var laborStr = pers.count ? pers.count+'人×'+(pers.days||1)+'天' : '—';
      var matStr = mats.length ? mats.map(function(m){return m.name+'×'+m.qty+m.unit;}).join(', ') : '—';
      h += '<tr>';
      h += '<td>'+op.name+'</td><td style="font-size:11px">'+(op.category||'—')+'</td>';
      h += '<td>'+(op.plannedDate||'—')+'</td><td>'+(op.assignee||'—')+'</td>';
      h += '<td>'+App.pad2(op.bbchStart||0)+'-'+App.pad2(op.bbchEnd||99)+'</td>';
      h += '<td style="font-size:11px">'+(si[op.status]||'')+' '+(sl[op.status]||op.status)+'</td>';
      h += '<td style="font-size:11px">'+laborStr+'</td>';
      h += '<td style="font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+matStr+'">'+matStr+'</td>';
      h += '<td style="font-weight:600;color:var(--accent)">'+(budget.grandTotal?budget.grandTotal.toFixed(0):'—')+'</td>';
      h += '<td><button class="btn btn-sm plan-op-edit" data-idx="'+i+'">编辑</button> <button class="btn btn-sm plan-op-wo" data-idx="'+i+'" style="color:var(--accent)">📋派工</button> <button class="btn btn-sm plan-op-del" data-idx="'+i+'" style="color:var(--danger)">×</button></td></tr>';
    });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  App.byId('mainView').innerHTML = h;
  App.byId('btnEditPlan').addEventListener('click', App.showEditPlanModal);
  App.byId('btnExecutePlan').addEventListener('click', App.executePlan);
  App.byId('btnDelPlan').addEventListener('click', function() { App.deletePlan(state.currentPlanId); });
  App.byId('btnAddPlanOp').addEventListener('click', App.showAddPlanOpModal);
  if (App.byId('planModelLink')) App.byId('planModelLink').addEventListener('click', function(e) { e.preventDefault(); if(p.modelId){state.currentModelId=p.modelId;state.currentPlanId=null;App.renderSidebar();App.renderMain();} });
  App.qsa('.plan-op-edit').forEach(function(btn) { btn.addEventListener('click', function() { App.showEditPlanOpModal(parseInt(this.dataset.idx)); }); });
  App.qsa('.plan-op-wo').forEach(function(btn) { btn.addEventListener('click', function() { App.createWorkOrderFromPlanOp(parseInt(this.dataset.idx)); }); });
  App.qsa('.plan-op-del').forEach(function(btn) { btn.addEventListener('click', function() { p.operations.splice(parseInt(this.dataset.idx),1); state.saveAll(); App.renderMain(); App.showToast('已删除','info'); }); });
};

// ============================================================
// 记录视图
// ============================================================
App.renderRecordView = function() {
  var state = App.appState;
  var r = state.records[state.currentRecordId];
  if (!r) return;
  var m = state.models[r.modelId];
  var h = '';
  h += '<div class="panel"><div class="panel-header"><h2>种植记录: '+App.recordTitle(r)+'</h2>';
  h += '<div><button class="btn btn-sm" id="btnEditRecord">编辑</button> <button class="btn btn-sm btn-danger" id="btnDelRecord">删除</button></div></div>';
  h += '<div class="panel-body">';
  h += '<div class="info-row"><span>年份: <strong>'+(r.year||'—')+'</strong></span><span>区划: <strong>'+(r.adminArea||'—')+'</strong></span></div>';
  if (m) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">模型: <a href="#" id="recModelLink" style="color:var(--accent)">'+App.modelTitle(m)+'</a></div>';
  if (r.planId && state.plans[r.planId]) h += '<div style="font-size:12px;color:var(--muted)">计划: <a href="#" id="recPlanLink" style="color:var(--accent)">'+App.planTitle(state.plans[r.planId])+'</a></div>';
  h += '</div></div>';

  if (m && m.phases) {
    h += '<div class="panel"><div class="panel-header"><h2>物候期实际日期</h2></div><div class="panel-body">';
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>阶段</th><th>名称</th><th>BBCH</th><th>理论</th><th>实际开始</th><th>实际结束</th><th>备注</th></tr></thead><tbody>';
    if (!r.phaseActuals) r.phaseActuals = {};
    m.phases.forEach(function(p, i) {
      var pa = r.phaseActuals[p.id]||{};
      h += '<tr style="border-left:3px solid '+App.phaseLb(i)+'"><td>'+p.id+'</td><td>'+p.name+'</td><td>'+App.pad2(p.bbchStart)+'-'+App.pad2(p.bbchEnd)+'</td><td>'+App.fmtTW(p)+'</td>';
      h += '<td><input type="date" class="pa-start" data-pid="'+p.id+'" value="'+(pa.start||'')+'" style="width:130px;font-size:11px"></td>';
      h += '<td><input type="date" class="pa-end" data-pid="'+p.id+'" value="'+(pa.end||'')+'" style="width:130px;font-size:11px"></td>';
      h += '<td><input type="text" class="pa-note" data-pid="'+p.id+'" value="'+(pa.note||'')+'" style="width:100px;font-size:11px"></td></tr>';
    });
    h += '</tbody></table>';
    h += '<div style="margin-top:8px"><button class="btn btn-sm" id="btnSavePhaseActuals">保存物候期日期</button></div></div></div>';
  }

  if (m && m.indicators) {
    h += '<div class="panel"><div class="panel-header"><h2>📊 观测数据录入</h2></div><div class="panel-body">';
    if (!r.observations) r.observations = {};
    var enabledInds = m.indicators.filter(function(i){return i.enabled!==false;});
    if (!enabledInds.length) {
      h += '<div style="font-size:12px;color:var(--muted)">当前模型未启用任何指标。</div>';
    } else {
      h += '<div style="margin-bottom:8px;display:flex;gap:4px;flex-wrap:wrap;align-items:center">';
      h += '<span style="font-size:11px;color:var(--muted);margin-right:4px">物候期:</span>';
      h += '<button class="btn btn-sm obs-phase-filter active" data-phase="all">全部('+enabledInds.length+')</button>';
      if (m.phases) m.phases.forEach(function(p,pi) {
        var cnt = enabledInds.filter(function(ind){return ind.bbchStart<=p.bbchEnd&&ind.bbchEnd>=p.bbchStart;}).length;
        if (cnt>0) h += '<button class="btn btn-sm obs-phase-filter" data-phase="'+p.id+'" data-bbs="'+p.bbchStart+'" data-bbe="'+p.bbchEnd+'" style="border-left:3px solid '+App.phaseLb(pi)+'">'+p.name+'('+cnt+')</button>';
      });
      h += '</div>';
      h += '<div id="obsStatusSummary" style="margin-bottom:8px;padding:8px 12px;background:#fafaf7;border-radius:4px;font-size:12px;display:flex;gap:16px">';
      h += '<span>🟢 正常: <strong id="obsNormalCount">0</strong></span><span>🟡 预警: <strong id="obsWarningCount">0</strong></span>';
      h += '<span>🟠 警报: <strong id="obsAlertCount">0</strong></span><span>🔴 危险: <strong id="obsDangerCount">0</strong></span>';
      h += '<span style="color:var(--muted)">已填: <strong id="obsFilledCount">0</strong>/'+enabledInds.length+'</span></div>';
      h += '<table class="data-table" style="font-size:12px" id="obsTable"><thead><tr><th>指标</th><th>单位</th><th>BBCH</th><th>参考</th><th>值</th><th>状态</th><th>日期</th><th>备注</th></tr></thead><tbody>';
      enabledInds.forEach(function(ind) {
        var obs = r.observations[ind.id]||{};
        var refStr = ind.refRange||'—';
        if (ind.optLow||ind.optHigh) refStr = '🟢'+(ind.optLow||'')+'-'+(ind.optHigh||'')+(ind.alertLow||ind.alertHigh?' 🟡'+(ind.alertLow||'')+'-'+(ind.alertHigh||''):'');
        h += '<tr data-bbch="'+ind.bbchStart+'-'+ind.bbchEnd+'">';
        h += '<td>'+ind.name+'</td><td>'+ind.unit+'</td><td>'+App.pad2(ind.bbchStart)+'-'+App.pad2(ind.bbchEnd)+'</td>';
        h += '<td style="font-size:10px;color:var(--muted)">'+refStr+'</td>';
        h += '<td><input type="text" class="obs-val" data-id="'+ind.id+'" value="'+(obs.value||'')+'" style="width:80px;font-size:11px"></td>';
        h += '<td class="obs-status-cell" data-id="'+ind.id+'" style="text-align:center">—</td>';
        h += '<td><input type="date" class="obs-date" data-id="'+ind.id+'" value="'+(obs.date||'')+'" style="width:130px;font-size:11px"></td>';
        h += '<td><input type="text" class="obs-note" data-id="'+ind.id+'" value="'+(obs.note||'')+'" style="width:100px;font-size:11px"></td></tr>';
      });
      h += '</tbody></table>';
      h += '<div style="margin-top:8px"><button class="btn btn-sm" id="btnSaveObservations">保存观测数据</button></div>';
    }
    h += '</div></div>';
  }

  App.byId('mainView').innerHTML = h;

  App.byId('btnEditRecord').addEventListener('click', App.showEditRecordModal);
  App.byId('btnDelRecord').addEventListener('click', function() { App.deleteRecord(state.currentRecordId); });
  if (App.byId('recModelLink')) App.byId('recModelLink').addEventListener('click', function(e){e.preventDefault();if(r.modelId){state.currentModelId=r.modelId;state.currentRecordId=null;App.renderSidebar();App.renderMain();}});
  if (App.byId('recPlanLink')) App.byId('recPlanLink').addEventListener('click', function(e){e.preventDefault();if(r.planId){state.currentPlanId=r.planId;state.currentRecordId=null;App.renderSidebar();App.renderMain();}});
  if (App.byId('btnSavePhaseActuals')) App.byId('btnSavePhaseActuals').addEventListener('click', function(){
    if(!r.phaseActuals)r.phaseActuals={};
    App.qsa('.pa-start').forEach(function(inp){var pid=inp.dataset.pid;if(!r.phaseActuals[pid])r.phaseActuals[pid]={};r.phaseActuals[pid].start=inp.value;});
    App.qsa('.pa-end').forEach(function(inp){var pid=inp.dataset.pid;if(!r.phaseActuals[pid])r.phaseActuals[pid]={};r.phaseActuals[pid].end=inp.value;});
    App.qsa('.pa-note').forEach(function(inp){var pid=inp.dataset.pid;if(!r.phaseActuals[pid])r.phaseActuals[pid]={};r.phaseActuals[pid].note=inp.value;});
    state.saveAll(); App.showToast('物候期日期已保存','success');
  });
  if (App.byId('btnSaveObservations')) App.byId('btnSaveObservations').addEventListener('click', App.saveObservations);

  App.qsa('.obs-phase-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      App.qsa('.obs-phase-filter').forEach(function(b){b.classList.remove('active');});
      this.classList.add('active');
      var phase = this.dataset.phase;
      App.qsa('#obsTable tbody tr').forEach(function(tr) {
        if (phase==='all') {tr.style.display='';return;}
        var bbs=parseInt(tr.dataset.bbch),bbe=parseInt(tr.dataset.bbch.split('-')[1]);
        var filterBbs=parseInt(btn.dataset.bbs),filterBbe=parseInt(btn.dataset.bbe);
        tr.style.display=(filterBbs<=bbe&&filterBbe>=bbs)?'':'none';
      });
    });
  });

  function updateObsStatus() {
    var counts={normal:0,warning:0,alert:0,danger:0}, filled=0;
    App.qsa('.obs-val').forEach(function(inp) {
      var id=inp.dataset.id, val=inp.value.trim();
      var ind=m.indicators.find(function(i){return i.id===id;});
      var cell=App.qs('.obs-status-cell[data-id="'+id+'"]');
      if(!ind||!cell)return;
      if(val){filled++;var st=App.judgeIndicatorStatus(val,ind);var cfg=App.statusConfig[st];cell.innerHTML=cfg.icon;cell.title=cfg.label;counts[st]++;}
      else{cell.innerHTML='—';cell.title='';}
    });
    var nc=App.byId('obsNormalCount'),wc=App.byId('obsWarningCount'),ac=App.byId('obsAlertCount'),dc=App.byId('obsDangerCount'),fc=App.byId('obsFilledCount');
    if(nc)nc.textContent=counts.normal;if(wc)wc.textContent=counts.warning;if(ac)ac.textContent=counts.alert;if(dc)dc.textContent=counts.danger;if(fc)fc.textContent=filled;
  }
  App.qsa('.obs-val').forEach(function(inp) {
    if(inp.value.trim()) {
      var ind=m.indicators.find(function(i){return i.id===inp.dataset.id;});
      if(ind){var st=App.judgeIndicatorStatus(inp.value,ind);var cfg=App.statusConfig[st];var cell=App.qs('.obs-status-cell[data-id="'+inp.dataset.id+'"]');if(cell){cell.innerHTML=cfg.icon;cell.title=cfg.label;}}
    }
    inp.addEventListener('input', updateObsStatus);
  });
  updateObsStatus();
};

// ============================================================
// 派工单视图
// ============================================================
App.renderWorkOrderView = function() {
  var state = App.appState;
  var wo = state.workOrders[state.currentWorkOrderId];
  if (!wo) return;
  var h = '';

  h += '<div class="panel"><div class="panel-header"><h2>📋 派工单: '+(wo.taskDescription||wo.id)+'</h2>';
  h += '<div>';
  if (wo.status!=='completed') h += '<button class="btn btn-sm" id="btnExecWO">▶ 执行</button> ';
  h += '<button class="btn btn-sm" id="btnEditWO">编辑</button> ';
  h += '<button class="btn btn-sm btn-danger" id="btnDelWO">删除</button>';
  h += '</div></div><div class="panel-body">';

  var sl = {pending:'⏳ 待执行',inProgress:'🔄 执行中',completed:'✅ 已完成',cancelled:'❌ 已取消'};
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">';
  h += '<div><span style="font-size:11px;color:var(--muted)">状态</span><div><span class="status-badge status-'+(wo.status==='completed'?'completed':wo.status==='inProgress'?'progress':'pending')+'">'+(sl[wo.status]||wo.status)+'</span></div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">签发日期</span><div style="font-weight:600">'+(wo.issueDate||'—')+'</div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">地点</span><div style="font-weight:600">'+(wo.location||'—')+'</div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">负责人</span><div style="font-weight:600">'+(wo.assignee||'—')+'</div></div>';
  h += '</div>';

  h += '<div style="background:#fafaf7;padding:12px;border-radius:4px;margin-bottom:16px">';
  h += '<div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px">任务描述</div>';
  h += '<div style="font-size:14px;font-weight:500">'+(wo.taskDescription||'—')+'</div>';
  if (wo.technicalParams) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">技术参数: '+wo.technicalParams+'</div>';
  if (wo.qualityStandard) h += '<div style="font-size:12px;color:var(--muted);margin-top:2px">质量标准: '+wo.qualityStandard+'</div>';
  h += '</div>';

  var df = wo.decisionFactors||{};
  h += '<div class="panel"><div class="panel-header"><h2>📋 决策因素</h2></div><div class="panel-body">';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';
  h += '<div><span style="font-size:11px;color:var(--muted)">天气影响</span><div style="font-size:13px">'+(df.weather||'—')+'</div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">人员安排</span><div style="font-size:13px">'+(df.personnel||'—')+'</div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">紧急程度</span><div style="font-size:13px">'+(df.urgency||'—')+'</div></div>';
  h += '<div><span style="font-size:11px;color:var(--muted)">资源调配</span><div style="font-size:13px">'+(df.resources||'—')+'</div></div>';
  h += '</div></div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>👷 人员配置</h2></div><div class="panel-body">';
  h += '<div style="font-size:13px">人员: <strong>'+(wo.totalWorkers||0)+'人</strong> | 工时: <strong>'+(wo.plannedHours||0)+'h</strong></div>';
  if (wo.workers && wo.workers.length) {
    h += '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">';
    wo.workers.forEach(function(w) { h += '<span class="tag tag-scope">'+w+'</span>'; });
    h += '</div>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>🔧 工具</h2></div><div class="panel-body">';
  if (!wo.tools || !wo.tools.length) { h += '<div style="font-size:12px;color:var(--muted)">未配置工具</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>来源</th><th>工时</th></tr></thead><tbody>';
    wo.tools.forEach(function(t) { h += '<tr><td>'+t.name+'</td><td>'+(t.source||'—')+'</td><td>'+(t.hours||0)+'h</td></tr>'; });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>📦 物资</h2></div><div class="panel-body">';
  if (!wo.materials || !wo.materials.length) { h += '<div style="font-size:12px;color:var(--muted)">未配置物资</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>规格</th><th>数量</th><th>单位</th></tr></thead><tbody>';
    wo.materials.forEach(function(m) { h += '<tr><td>'+m.name+'</td><td>'+(m.spec||'—')+'</td><td>'+(m.qty||0)+'</td><td>'+(m.unit||'')+'</td></tr>'; });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>🏗 设备</h2></div><div class="panel-body">';
  if (!wo.equipment || !wo.equipment.length) { h += '<div style="font-size:12px;color:var(--muted)">未配置设备</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>来源</th><th>工时</th><th>单价</th></tr></thead><tbody>';
    wo.equipment.forEach(function(e) { h += '<tr><td>'+e.name+'</td><td>'+(e.source||'—')+'</td><td>'+(e.hours||0)+'h</td><td>'+(e.cost||0)+'元/h</td></tr>'; });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  var ex = wo.execution||{};
  h += '<div class="panel"><div class="panel-header"><h2>📊 执行情况</h2></div><div class="panel-body">';
  if (!ex.actualStart && !ex.actualEnd) {
    h += '<div style="font-size:12px;color:var(--muted)">尚未开始执行。点击「执行」按钮开始记录。</div>';
  } else {
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';
    h += '<div><span style="font-size:11px;color:var(--muted)">实际开始</span><div>'+(ex.actualStart||'—')+'</div></div>';
    h += '<div><span style="font-size:11px;color:var(--muted)">实际结束</span><div>'+(ex.actualEnd||'—')+'</div></div>';
    h += '<div><span style="font-size:11px;color:var(--muted)">完成度</span><div style="font-weight:600;color:var(--accent)">'+(ex.completion||'—')+'</div></div>';
    h += '<div><span style="font-size:11px;color:var(--muted)">实际面积</span><div>'+(ex.actualArea||'—')+' 亩</div></div>';
    h += '</div>';
    if (ex.incompleteReason) h += '<div style="font-size:12px;color:var(--danger);margin-top:8px">未完成原因: '+ex.incompleteReason+'</div>';
    if (ex.signatory) h += '<div style="font-size:12px;color:var(--muted);margin-top:8px">签字: '+ex.signatory+' ('+ex.signDate+')</div>';
  }
  h += '</div></div>';

  if (wo.dataCollectionId || wo.planOpId) {
    h += '<div class="panel"><div class="panel-header"><h2>🔗 来源追溯</h2></div><div class="panel-body">';
    if (wo.dataCollectionId && state.dataCollections[wo.dataCollectionId]) {
      var dc = state.dataCollections[wo.dataCollectionId];
      h += '<div style="font-size:12px;color:var(--muted)">数据采集: <a href="#" id="woDCLink" style="color:var(--accent)">'+(dc.collectDate||'')+' '+(dc.phaseName||'')+'</a></div>';
    }
    if (wo.planOpId) h += '<div style="font-size:12px;color:var(--muted)">计划作业ID: '+wo.planOpId+'</div>';
    h += '</div></div>';
  }

  h += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
  if (wo.status === 'pending') h += '<button class="btn btn-sm" id="btnStartWO" style="color:var(--accent)">▶ 开始执行</button>';
  if (wo.status === 'inProgress') h += '<button class="btn btn-sm" id="btnCompleteWO" style="color:var(--accent)">✅ 标记完成</button>';
  h += '<button class="btn btn-sm" id="btnGenWR" style="color:var(--info)">📝 生成作业记录</button>';
  h += '</div></div></div>';

  App.byId('mainView').innerHTML = h;

  App.byId('btnEditWO').addEventListener('click', function() { App.showEditWorkOrderModal(state.currentWorkOrderId); });
  App.byId('btnDelWO').addEventListener('click', function() { App.deleteWorkOrder(state.currentWorkOrderId); });
  if (App.byId('btnExecWO')) App.byId('btnExecWO').addEventListener('click', function() { wo.status='inProgress'; state.saveAll(); App.renderMain(); App.showToast('已开始执行','success'); });
  if (App.byId('btnStartWO')) App.byId('btnStartWO').addEventListener('click', function() { wo.status='inProgress'; state.saveAll(); App.renderMain(); App.showToast('已开始执行','success'); });
  if (App.byId('btnCompleteWO')) App.byId('btnCompleteWO').addEventListener('click', function() { wo.status='completed'; state.saveAll(); App.renderMain(); App.showToast('已完成','success'); });
  if (App.byId('btnGenWR')) App.byId('btnGenWR').addEventListener('click', function() { App.createWorkRecordFromWorkOrder(); });
  if (App.byId('woDCLink')) App.byId('woDCLink').addEventListener('click', function(e) {
    e.preventDefault();
    if (wo.dataCollectionId) { state.currentDataCollectionId = wo.dataCollectionId; state.currentWorkOrderId = null; App.renderSidebar(); App.renderMain(); }
  });
};

// ============================================================
// 作业记录视图
// ============================================================
App.renderWorkRecordView = function() {
  var state = App.appState;
  var wr = state.workRecords[state.currentWorkRecordId];
  if (!wr) return;
  var h = '';

  h += '<div class="panel"><div class="panel-header"><h2>📝 作业记录: '+(wr.recordDate||wr.id)+'</h2>';
  h += '<div><button class="btn btn-sm" id="btnEditWR">编辑</button> <button class="btn btn-sm btn-danger" id="btnDelWR">删除</button></div></div>';
  h += '<div class="panel-body">';
  h += '<div class="info-row"><span>日期: <strong>'+(wr.recordDate||'—')+'</strong></span><span>类型: <strong>'+(wr.workType||'—')+'</strong></span><span>分区: <strong>'+(wr.workArea||'—')+'</strong></span><span>作物: <strong>'+(wr.crop||'—')+'</strong></span></div>';
  if (wr.operationNames && wr.operationNames.length) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">作业项目: '+wr.operationNames.join(', ')+'</div>';
  if (wr.workOrderId && state.workOrders[wr.workOrderId]) {
    var wo = state.workOrders[wr.workOrderId];
    h += '<div style="font-size:12px;color:var(--muted)">派工单: <a href="#" id="wrWOLink" style="color:var(--accent)">'+(wo.taskDescription||wo.id)+'</a></div>';
  }
  h += '</div></div>';

  var cs = wr.costSummary||{};
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px">';
  h += '<div style="padding:12px;background:#e8f5e9;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">👷 人工</div><div style="font-size:18px;font-weight:700;color:#2e7d32">'+(cs.laborTotal||0).toFixed(0)+' 元</div></div>';
  h += '<div style="padding:12px;background:#e3f2fd;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🔧 工具</div><div style="font-size:18px;font-weight:700;color:#1565c0">'+(cs.toolTotal||0).toFixed(0)+' 元</div></div>';
  h += '<div style="padding:12px;background:#fff3e0;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🏗 设备</div><div style="font-size:18px;font-weight:700;color:#e65100">'+(cs.equipmentTotal||0).toFixed(0)+' 元</div></div>';
  h += '<div style="padding:12px;background:#fce4ec;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">📦 物资</div><div style="font-size:18px;font-weight:700;color:#c62828">'+(cs.materialTotal||0).toFixed(0)+' 元</div></div>';
  h += '<div style="padding:12px;background:#f3e5f5;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🏢 外包</div><div style="font-size:18px;font-weight:700;color:#6a1b9a">'+(cs.outsourcingTotal||0).toFixed(0)+' 元</div></div>';
  h += '<div style="padding:12px;background:var(--accent-light);border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--accent)">💰 合计</div><div style="font-size:20px;font-weight:700;color:var(--accent)">'+(cs.grandTotal||0).toFixed(0)+' 元</div></div>';
  h += '</div>';

  var pers = wr.personnel||{};
  h += '<div class="panel"><div class="panel-header"><h2>👷 人员</h2></div><div class="panel-body">';
  h += '<div class="info-row"><span>人数: <strong>'+(pers.count||0)+'</strong></span><span>工时: <strong>'+(pers.hours?pers.hours.total:0)+'h</strong></span><span>工资: <strong>'+(pers.wages?pers.wages.total:0)+' 元</strong></span></div>';
  if (pers.names && pers.names.length) {
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
    pers.names.forEach(function(n){h+='<span class="tag tag-scope">'+n+'</span>';});
    h += '</div>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>🔧 工具</h2></div><div class="panel-body">';
  if (!wr.tools || !wr.tools.length) { h += '<div style="font-size:12px;color:var(--muted)">无工具记录</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>来源</th><th>工时</th><th>单价(元/h)</th><th>合计(元)</th></tr></thead><tbody>';
    wr.tools.forEach(function(t){h+='<tr><td>'+t.name+'</td><td>'+(t.source||'—')+'</td><td>'+(t.hours||0)+'</td><td>'+(t.cost||0)+'</td><td style="font-weight:600">'+(t.total||0).toFixed(0)+'</td></tr>';});
    h += '</tbody></table>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>🏗 设备</h2></div><div class="panel-body">';
  if (!wr.equipment || !wr.equipment.length) { h += '<div style="font-size:12px;color:var(--muted)">无设备记录</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>来源</th><th>工时</th><th>单价(元/h)</th><th>合计(元)</th></tr></thead><tbody>';
    wr.equipment.forEach(function(e){h+='<tr><td>'+e.name+'</td><td>'+(e.source||'—')+'</td><td>'+(e.hours||0)+'</td><td>'+(e.cost||0)+'</td><td style="font-weight:600">'+(e.total||0).toFixed(0)+'</td></tr>';});
    h += '</tbody></table>';
  }
  h += '</div></div>';

  h += '<div class="panel"><div class="panel-header"><h2>📦 物资</h2></div><div class="panel-body">';
  if (!wr.materials || !wr.materials.length) { h += '<div style="font-size:12px;color:var(--muted)">无物资记录</div>'; }
  else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>名称</th><th>规格</th><th>数量</th><th>单位</th><th>单价</th><th>合计(元)</th></tr></thead><tbody>';
    wr.materials.forEach(function(m){h+='<tr><td>'+m.name+'</td><td>'+(m.spec||'—')+'</td><td>'+(m.qty||0)+'</td><td>'+(m.unit||'')+'</td><td>'+(m.unitPrice||0)+'</td><td style="font-weight:600">'+(m.amount||0).toFixed(0)+'</td></tr>';});
    h += '</tbody></table>';
  }
  h += '</div></div>';

  var outs = wr.outsourcing||{};
  if (outs.projectName || outs.totalPrice) {
    h += '<div class="panel"><div class="panel-header"><h2>🏢 外包</h2></div><div class="panel-body">';
    h += '<div class="info-row"><span>项目: <strong>'+(outs.projectName||'—')+'</strong></span><span>计价: <strong>'+(outs.pricingUnit||'—')+'</strong></span><span>单价: <strong>'+(outs.unitPrice||0)+'</strong></span><span>合计: <strong style="color:var(--accent)">'+(outs.totalPrice||0).toFixed(0)+' 元</strong></span></div>';
    if (outs.description) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">'+outs.description+'</div>';
    h += '</div></div>';
  }

  if (wr.note) {
    h += '<div class="panel"><div class="panel-header"><h2>📝 备注</h2></div><div class="panel-body">';
    h += '<div style="font-size:13px;color:var(--muted)">'+wr.note+'</div>';
    h += '</div></div>';
  }

  App.byId('mainView').innerHTML = h;

  App.byId('btnEditWR').addEventListener('click', function() { App.showEditWorkRecordModal(state.currentWorkRecordId); });
  App.byId('btnDelWR').addEventListener('click', function() { App.deleteWorkRecord(state.currentWorkRecordId); });
  if (App.byId('wrWOLink')) App.byId('wrWOLink').addEventListener('click', function(e) {
    e.preventDefault();
    if (wr.workOrderId) { state.currentWorkOrderId = wr.workOrderId; state.currentWorkRecordId = null; App.renderSidebar(); App.renderMain(); }
  });
};

// ============================================================
// 成本分析视图
// ============================================================
App.renderCostAnalysisView = function() {
  var state = App.appState;
  var h = '<div class="panel"><div class="panel-header"><h2>💰 成本对比分析</h2></div><div class="panel-body">';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">对比计划预算与实际成本。</p>';
  var planData=[], recordData=[];
  Object.keys(state.plans).forEach(function(pid) {
    var p=state.plans[pid]; if(!p.operations||!p.operations.length)return;
    var total=0;p.operations.forEach(function(op){var bs=op.budgetSummary||{};total+=bs.grandTotal||0;});
    planData.push({id:pid,title:App.planTitle(p),budgetTotal:total,opCount:p.operations.length});
  });
  Object.keys(state.workRecords).forEach(function(wrid) {
    var wr=state.workRecords[wrid]; var cs=wr.costSummary||{};
    recordData.push({id:wrid,date:wr.recordDate||'',ops:(wr.operationNames||[]).join(', '),laborTotal:cs.laborTotal||0,equipmentTotal:cs.equipmentTotal||0,toolTotal:cs.toolTotal||0,materialTotal:cs.materialTotal||0,outsourcingTotal:cs.outsourcingTotal||0,grandTotal:cs.grandTotal||0});
  });
  var aL=0,aE=0,aT=0,aM=0,aO=0,aG=0;
  recordData.forEach(function(r){aL+=r.laborTotal;aE+=r.equipmentTotal;aT+=r.toolTotal;aM+=r.materialTotal;aO+=r.outsourcingTotal;aG+=r.grandTotal;});
  var totalBudget=0;planData.forEach(function(pd){totalBudget+=pd.budgetTotal;});
  var diff=aG-totalBudget;var diffColor=diff>0?'#c0392b':(diff<0?'#2e7d32':'var(--text)');
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">';
  h += '<div style="padding:16px;background:#e8f5e9;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">📋 计划预算</div><div style="font-size:24px;font-weight:700;color:var(--accent)">'+totalBudget.toFixed(0)+' 元</div></div>';
  h += '<div style="padding:16px;background:#fff3e0;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">📊 实际成本</div><div style="font-size:24px;font-weight:700;color:#e65100">'+aG.toFixed(0)+' 元</div></div>';
  h += '<div style="padding:16px;background:#f3e5f5;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">📈 差异</div><div style="font-size:24px;font-weight:700;color:'+diffColor+'">'+(diff>=0?'+':'')+diff.toFixed(0)+' 元</div></div>';
  h += '</div>';
  h += '<table class="data-table" style="font-size:13px"><thead><tr><th>成本项</th><th>预算</th><th>实际</th><th>差异</th></tr></thead><tbody>';
  var items=[{name:'人工',b:0,a:aL},{name:'设备',b:0,a:aE},{name:'工具',b:0,a:aT},{name:'物资',b:0,a:aM},{name:'外包',b:0,a:aO}];
  Object.keys(state.plans).forEach(function(pid){var p=state.plans[pid];if(!p.operations)return;p.operations.forEach(function(op){var bs=op.budgetSummary||{};items[0].b+=bs.laborTotal||0;items[1].b+=bs.equipmentTotal||0;items[2].b+=bs.toolTotal||0;items[3].b+=bs.materialTotal||0;items[4].b+=bs.outsourcingTotal||0;});});
  items.forEach(function(it){var d=it.a-it.b;var dc=d>0?'#c0392b':(d<0?'#2e7d32':'var(--text)');h+='<tr><td>'+it.name+'</td><td>'+it.b.toFixed(0)+'</td><td>'+it.a.toFixed(0)+'</td><td style="color:'+dc+';font-weight:600">'+(d>=0?'+':'')+d.toFixed(0)+'</td></tr>';});
  h += '<tr style="font-weight:700;background:#f5f5f0"><td>合计</td><td>'+totalBudget.toFixed(0)+'</td><td>'+aG.toFixed(0)+'</td><td style="color:'+diffColor+'">'+(diff>=0?'+':'')+diff.toFixed(0)+'</td></tr>';
  h += '</tbody></table></div></div>';
  App.byId('mainView').innerHTML = h;
};

// ============================================================
// 数据采集详情视图
// ============================================================
App.renderDataCollectionView = function() {
  var state = App.appState;
  var dc = state.dataCollections[state.currentDataCollectionId];
  if (!dc) return;
  var model = state.models[dc.modelId];
  var plan = state.plans[dc.planId];
  var h = '';

  h += '<div class="panel"><div class="panel-header"><h2>📊 数据采集: '+(dc.collectDate||'')+' '+(dc.phaseName||'')+'</h2>';
  h += '<div><button class="btn btn-sm" id="btnSaveDCItems">💾 保存采集数据</button> <button class="btn btn-sm btn-danger" id="btnDelDC">删除</button></div></div>';
  h += '<div class="panel-body">';
  h += '<div class="info-row"><span>日期: <strong>'+(dc.collectDate||'—')+'</strong></span><span>采集人: <strong>'+(dc.collector||'—')+'</strong></span><span>天气: <strong>'+(dc.weather||'—')+'</strong></span><span>地块: <strong>'+(dc.location||'—')+'</strong></span></div>';
  if (plan) h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">计划: <a href="#" id="dcPlanLink" style="color:var(--accent)">'+App.planTitle(plan)+'</a></div>';
  if (model) h += '<div style="font-size:12px;color:var(--muted)">模型: <a href="#" id="dcModelLink" style="color:var(--accent)">'+App.modelTitle(model)+'</a></div>';
  h += '</div></div>';

  var items = dc.items||[];
  var counts = {total:items.length,normal:0,warning:0,alert:0,danger:0,filled:0};
  items.forEach(function(it){if(it.value)counts.filled++;counts[it.status]=(counts[it.status]||0)+1;});
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px">';
  h += '<div style="padding:12px;background:#e8f5e9;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🟢 正常</div><div style="font-size:20px;font-weight:700;color:#2e7d32">'+counts.normal+'</div></div>';
  h += '<div style="padding:12px;background:#fff8e1;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🟡 预警</div><div style="font-size:20px;font-weight:700;color:#f57f17">'+counts.warning+'</div></div>';
  h += '<div style="padding:12px;background:#fff3e0;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🟠 警报</div><div style="font-size:20px;font-weight:700;color:#e65100">'+counts.alert+'</div></div>';
  h += '<div style="padding:12px;background:#fce4ec;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">🔴 危险</div><div style="font-size:20px;font-weight:700;color:#c62828">'+counts.danger+'</div></div>';
  h += '<div style="padding:12px;background:#f5f5f0;border-radius:6px;text-align:center"><div style="font-size:11px;color:var(--muted)">已采集</div><div style="font-size:20px;font-weight:700">'+counts.filled+'/'+counts.total+'</div></div>';
  h += '</div>';

  h += '<div class="panel"><div class="panel-header"><h2>📋 指标采集明细</h2></div><div class="panel-body">';
  if (!items.length) {
    h += '<p style="font-size:12px;color:var(--muted)">暂无采集指标</p>';
  } else {
    h += '<div style="margin-bottom:8px;display:flex;gap:4px;flex-wrap:wrap;align-items:center">';
    h += '<span style="font-size:11px;color:var(--muted);margin-right:4px">状态筛选:</span>';
    h += '<button class="btn btn-sm dc-status-filter active" data-status="all">全部('+counts.total+')</button>';
    if(counts.normal)h+='<button class="btn btn-sm dc-status-filter" data-status="normal">🟢正常('+counts.normal+')</button>';
    if(counts.warning)h+='<button class="btn btn-sm dc-status-filter" data-status="warning">🟡预警('+counts.warning+')</button>';
    if(counts.alert)h+='<button class="btn btn-sm dc-status-filter" data-status="alert">🟠警报('+counts.alert+')</button>';
    if(counts.danger)h+='<button class="btn btn-sm dc-status-filter" data-status="danger">🔴危险('+counts.danger+')</button>';
    h += '</div>';
    h += '<table class="data-table" style="font-size:12px" id="dcItemTable"><thead><tr><th>指标</th><th>单位</th><th>BBCH</th><th>参考</th><th>值</th><th>状态</th><th>备注</th></tr></thead><tbody>';
    items.forEach(function(item) {
      var ind=model?model.indicators.find(function(i){return i.id===item.indicatorId;}):null;
      var refStr=item.refRange||'—';
      if(ind&&(ind.optLow||ind.optHigh))refStr='🟢'+(ind.optLow||'')+'-'+(ind.optHigh||'')+(ind.alertLow||ind.alertHigh?' 🟡'+(ind.alertLow||'')+'-'+(ind.alertHigh||''):'');
      var cfg=App.statusConfig[item.status]||App.statusConfig.normal;
      h += '<tr data-status="'+item.status+'">';
      h += '<td>'+item.indicatorName+'</td><td>'+item.unit+'</td><td>'+App.pad2(item.bbchStart)+'-'+App.pad2(item.bbchEnd)+'</td>';
      h += '<td style="font-size:10px;color:var(--muted)">'+refStr+'</td>';
      h += '<td><input type="text" class="dc-val" data-id="'+item.indicatorId+'" data-name="'+item.indicatorName+'" data-unit="'+item.unit+'" data-ref="'+(item.refRange||'')+'" data-bs="'+item.bbchStart+'" data-be="'+item.bbchEnd+'" value="'+(item.value||'')+'" style="width:80px;font-size:11px"></td>';
      h += '<td class="dc-status-cell" data-id="'+item.indicatorId+'" style="text-align:center;font-size:14px" title="'+cfg.label+'">'+cfg.icon+'</td>';
      h += '<td><input type="text" class="dc-note" data-id="'+item.indicatorId+'" value="'+(item.note||'')+'" style="width:100px;font-size:11px"></td></tr>';
    });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  var adjustments = dc.adjustments||[];
  h += '<div class="panel"><div class="panel-header"><h2>🔧 调整措施建议 <span class="ref-badge">'+adjustments.length+' 项</span></h2></div><div class="panel-body">';
  if (!adjustments.length) {
    h += '<div style="padding:12px;background:#e8f5e9;border-radius:4px;font-size:13px">✅ 所有指标正常，无需调整。</div>';
  } else {
    h += '<table class="data-table" style="font-size:12px"><thead><tr><th>触发指标</th><th>异常摘要</th><th>建议措施</th><th>关联作业</th><th>优先级</th><th>状态</th><th style="width:180px">操作</th></tr></thead><tbody>';
    adjustments.forEach(function(adj) {
      var pri=adj.priority==='urgent'?'<span style="color:var(--danger);font-weight:600">🔴 紧急</span>':'<span style="color:var(--warning)">🟡 常规</span>';
      var stMap={pending:'⏳ 待处理',accepted:'✅ 已接受',rejected:'❌ 已拒绝',completed:'✅ 已完成'};
      h += '<tr><td style="font-size:11px">'+(adj.triggerIndicators||[]).join(', ')+'</td>';
      h += '<td style="font-size:11px;color:var(--danger)">'+(adj.triggerSummary||'')+'</td>';
      h += '<td style="font-size:11px;max-width:250px;white-space:normal;line-height:1.6">'+(adj.description||'')+'</td>';
      h += '<td style="font-size:11px">'+(adj.relatedOpNames||[]).join(', ')+'</td>';
      h += '<td>'+pri+'</td><td style="font-size:11px">'+(stMap[adj.status]||adj.status)+'</td>';
      h += '<td>';
      if(adj.status==='pending'){h+='<button class="btn btn-sm adj-accept" data-adj-id="'+adj.id+'" style="color:var(--accent)">✅接受</button> ';h+='<button class="btn btn-sm adj-reject" data-adj-id="'+adj.id+'" style="color:var(--danger)">❌拒绝</button>';}
      if(adj.status==='accepted'&&!adj.workOrderId){h+='<button class="btn btn-sm adj-gen-wo" data-adj-id="'+adj.id+'" style="color:var(--accent)">📋生成派工单</button>';}
      if(adj.workOrderId){h+='<span style="font-size:11px;color:var(--accent)">已派工</span>';}
      h += '</td></tr>';
    });
    h += '</tbody></table>';
  }
  h += '</div></div>';

  App.byId('mainView').innerHTML = h;

  App.byId('btnDelDC').addEventListener('click',function(){App.deleteDataCollection(state.currentDataCollectionId);});
  App.byId('btnSaveDCItems').addEventListener('click',function(){App.saveDataCollectionItems(state.currentDataCollectionId);});
  if(App.byId('dcPlanLink'))App.byId('dcPlanLink').addEventListener('click',function(e){e.preventDefault();if(dc.planId){state.currentPlanId=dc.planId;state.currentDataCollectionId=null;App.renderSidebar();App.renderMain();}});
  if(App.byId('dcModelLink'))App.byId('dcModelLink').addEventListener('click',function(e){e.preventDefault();if(dc.modelId){state.currentModelId=dc.modelId;state.currentDataCollectionId=null;App.renderSidebar();App.renderMain();}});

  App.qsa('.dc-status-filter').forEach(function(btn){
    btn.addEventListener('click',function(){
      App.qsa('.dc-status-filter').forEach(function(b){b.classList.remove('active');});this.classList.add('active');
      var st=this.dataset.status;
      App.qsa('#dcItemTable tbody tr').forEach(function(r){r.style.display=(st==='all'||r.dataset.status===st)?'':'none';});
    });
  });

  App.qsa('.dc-val').forEach(function(inp){
    inp.addEventListener('input',function(){
      var id=this.dataset.id,val=this.value.trim();
      var ind=model?model.indicators.find(function(i){return i.id===id;}):null;
      var cell=App.qs('.dc-status-cell[data-id="'+id+'"]');
      if(!cell||!ind)return;
      if(val){var st=App.judgeIndicatorStatus(val,ind);var cfg=App.statusConfig[st];cell.innerHTML=cfg.icon;cell.title=cfg.label;this.closest('tr').dataset.status=st;}
      else{cell.innerHTML='—';cell.title='';this.closest('tr').dataset.status='normal';}
    });
  });

  App.qsa('.adj-accept').forEach(function(btn){btn.addEventListener('click',function(){App.updateAdjustmentStatus(state.currentDataCollectionId,this.dataset.adjId,'accepted');});});
  App.qsa('.adj-reject').forEach(function(btn){btn.addEventListener('click',function(){App.updateAdjustmentStatus(state.currentDataCollectionId,this.dataset.adjId,'rejected');});});
  App.qsa('.adj-gen-wo').forEach(function(btn){btn.addEventListener('click',function(){App.createWorkOrderFromAdjustment(state.currentDataCollectionId,this.dataset.adjId);});});
};
