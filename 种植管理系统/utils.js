// ============================================================
// utils.js - 工具函数层 (v2.2)
// ============================================================

var App = App || {};

// ============================================================
// DOM 工具
// ============================================================
App.byId = function(id) { return document.getElementById(id); };
App.qsa = function(sel) { return document.querySelectorAll(sel); };
App.qs = function(sel) { return document.querySelector(sel); };

// ============================================================
// Toast 提示
// ============================================================
App.showToast = function(msg, type) {
  var t = App.byId('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' toast-' + type : '');
  t.classList.remove('hidden');
  clearTimeout(App._toastTimer);
  App._toastTimer = setTimeout(function() { t.classList.add('hidden'); }, 2500);
};

// ============================================================
// 弹窗关闭
// ============================================================
App.closeModal = function(id) {
  var m = App.byId(id);
  if (m) m.remove();
};

// ============================================================
// 下拉选项生成
// ============================================================
App.selOpts = function(arr, selected) {
  return arr.map(function(v) {
    return '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + v + '</option>';
  }).join('');
};

// ============================================================
// 零填充
// ============================================================
App.pad2 = function(n) {
  n = parseInt(n) || 0;
  return n < 10 ? '0' + n : '' + n;
};

// ============================================================
// 标题生成
// ============================================================
App.modelTitle = function(m) {
  if (!m) return '';
  return m.name || (m.variety + '·' + m.rootstockVar + '·' + m.seedlingAge + '年生');
};

App.planTitle = function(p) {
  if (!p) return '';
  return p.name || ((p.year || '') + '年种植计划');
};

App.recordTitle = function(r) {
  if (!r) return '';
  return r.name || ((r.year || '') + '年种植记录');
};

// ============================================================
// 品种信息
// ============================================================
App.VARIETIES = {
  '秦脆': {color:'片红',mature:'中早熟(9月中下旬)',ca:'极高风险',caT:'花后必须补钙4次',rust:'低风险',burn:'低风险',n:'控氮=富士70%',tss:'≥13.5°Brix',note:'秦脆为西北农林科技大学选育的矮化品种，果肉脆，汁液多，糖度高，但钙需求极高，苦痘病是首要风险。'},
  '瑞雪': {color:'绿黄(转黄)',mature:'晚熟(10月中旬)',ca:'中感',caT:'常规补钙',rust:'高风险(果锈)',burn:'高风险(日灼)',n:'氮=富士80%',tss:'≥15.0°Brix',note:'瑞雪为白肉苹果新品种，果皮绿色转黄。日灼和果锈是核心风险，需全程遮阴防护。'},
  '福布拉斯': {color:'条红',mature:'中晚熟(10月上旬)',ca:'低-中风险',caT:'常规补钙',rust:'低风险',burn:'低风险',n:'控氮',tss:'≥15.5°Brix',note:'福布拉斯着色优势明显，采前落果是首要风险，需分批采收。'},
  '蜜脆': {color:'条红',mature:'中熟(9月下旬)',ca:'极高风险',caT:'补钙需求最高，苦痘病极其严重',rust:'低风险',burn:'低风险',n:'严格控氮',tss:'≥14.0°Brix',note:'蜜脆钙需求在所有品种中最高，苦痘病极其严重，需从花后持续补钙至采前。'},
  '富士冠军': {color:'片红/条红',mature:'晚熟(10月中下旬)',ca:'中等风险',caT:'常规补钙',rust:'低风险',burn:'低风险',n:'常规控氮',tss:'≥14.5°Brix',note:'富士系主栽品种，综合性状优良。'},
  '红思尼克': {color:'片红',mature:'早熟(8月下旬)',ca:'中等风险',caT:'常规补钙',rust:'低风险',burn:'低风险',n:'控氮',tss:'≥13.5°Brix',note:'早熟品种，上市早，经济价值高。'},
  '爱妃': {color:'条红/片红',mature:'中晚熟(10月上旬)',ca:'中等风险',caT:'常规补钙',rust:'低风险',burn:'低风险',n:'控氮',tss:'≥14.5°Brix',note:'高端品种，果肉紧实，耐储藏。'}
};

App.getVInfo = function(variety) {
  return App.VARIETIES[variety] || {};
};

// ============================================================
// 物候期样式
// ============================================================
App.phaseClass = function(i) {
  var classes = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12'];
  return classes[i % classes.length];
};

App.phaseLb = function(i) {
  var colors = ['#5c6bc0','#26a69a','#66bb6a','#ffa726','#ef5350','#ab47bc','#42a5f5','#8d6e63','#5c6bc0','#26a69a','#66bb6a','#ffa726'];
  return colors[i % colors.length];
};

App.fmtTW = function(p) {
  return p.sm + '月' + p.sp + ' ~ ' + p.em + '月' + p.ep;
};

// ============================================================
// 指标分类（核心函数）
// ============================================================
App.getPanelName = function(args) {
  // args = [id, name, category, type]
  var id = (args[0] || '').toUpperCase();
  var name = args[1] || '';
  var cat = args[2] || '';

  // 按ID前缀分类
  if (id.indexOf('GRI-') === 0) {
    // 生育结果类指标
    var resultIds = ['GRI-001','GRI-002','GRI-003','GRI-004','GRI-005','GRI-006','GRI-007',
      'GRI-008','GRI-009','GRI-010','GRI-011','GRI-012','GRI-013','GRI-014','GRI-015',
      'GRI-016','GRI-017','GRI-018','GRI-019','GRI-020','GRI-021','GRI-022','GRI-023',
      'GRI-024','GRI-025','GRI-026','GRI-027','GRI-028','GRI-029','GRI-030','GRI-031',
      'GRI-032','GRI-033','GRI-036','GRI-037','GRI-038','GRI-039','GRI-040','GRI-041',
      'GRI-042','GRI-043','GRI-044','GRI-045','GRI-046','GRI-047','GRI-048','GRI-049'];
    if (resultIds.indexOf(id) >= 0) return '生育结果';
    // 其余GRI归入农事管理相关
    if (id === 'GRI-034' || id === 'GRI-035') return '病虫草害';
    return '生育结果';
  }

  if (id.indexOf('ENV-') === 0) return '环境条件';

  if (id.indexOf('PDW-') === 0) return '病虫草害';

  if (id.indexOf('OP_') === 0 || id.indexOf('MGT-') === 0) return '农事管理';

  // 按名称关键词分类
  if (name.indexOf('病') >= 0 || name.indexOf('虫') >= 0 || name.indexOf('害') >= 0 || name.indexOf('螨') >= 0) return '病虫草害';
  if (name.indexOf('温') >= 0 || name.indexOf('水') >= 0 || name.indexOf('光') >= 0 || name.indexOf('风') >= 0 || name.indexOf('土壤') >= 0 || name.indexOf('湿度') >= 0) return '环境条件';

  // 按category字段分类
  if (cat === '生育结果' || cat === '环境条件' || cat === '病虫草害' || cat === '农事管理') return cat;

  return '生育结果';
};

// ============================================================
// 指标状态判定（核心函数）
// ============================================================
App.statusConfig = {
  normal:  { icon: '🟢', label: '正常',  color: '#2e7d32' },
  warning: { icon: '🟡', label: '预警',  color: '#f57f17' },
  alert:   { icon: '🟠', label: '警报',  color: '#e65100' },
  danger:  { icon: '🔴', label: '危险',  color: '#c62828' }
};

App.judgeIndicatorStatus = function(val, ind) {
  if (!val || !ind) return 'normal';
  var v = parseFloat(val);
  if (isNaN(v)) return 'normal';

  // 优先使用精确阈值
  // 危害阈值
  if (ind.damageLow && v < parseFloat(ind.damageLow)) return 'danger';
  if (ind.damageHigh && v > parseFloat(ind.damageHigh)) return 'danger';

  // 行动阈值
  if (ind.actionLow && v < parseFloat(ind.actionLow)) return 'alert';
  if (ind.actionHigh && v > parseFloat(ind.actionHigh)) return 'alert';

  // 预警阈值
  if (ind.alertLow && v < parseFloat(ind.alertLow)) return 'warning';
  if (ind.alertHigh && v > parseFloat(ind.alertHigh)) return 'warning';

  // 如果设置了适宜范围，在适宜范围内为正常
  if (ind.optLow || ind.optHigh) {
    var inOpt = true;
    if (ind.optLow && v < parseFloat(ind.optLow)) inOpt = false;
    if (ind.optHigh && v > parseFloat(ind.optHigh)) inOpt = false;
    if (inOpt) return 'normal';
    // 超出适宜范围但未触发其他阈值，标记为warning
    return 'warning';
  }

  // 回退：基于参考范围文本解析
  var ref = ind.refRange || '';
  if (!ref) return 'normal';

  // 处理 "≥85%" 格式
  var geMatch = ref.match(/[≥>]\s*(\d+\.?\d*)/);
  if (geMatch) {
    var threshold = parseFloat(geMatch[1]);
    if (v < threshold) return 'warning';
    return 'normal';
  }

  // 处理 "<5%" 格式
  var ltMatch = ref.match(/[<≤]\s*(\d+\.?\d*)/);
  if (ltMatch) {
    var threshold = parseFloat(ltMatch[1]);
    if (v >= threshold) return 'alert';
    return 'normal';
  }

  // 处理 "55-70" 格式
  var rangeMatch = ref.match(/(\d+\.?\d*)\s*[-~]\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    var low = parseFloat(rangeMatch[1]);
    var high = parseFloat(rangeMatch[2]);
    if (v < low || v > high) return 'warning';
    return 'normal';
  }

  return 'normal';
};

// ============================================================
// 指标类别/单位选项（用于弹窗下拉）
// ============================================================
App.IND_CATEGORIES = {
  '生育结果': ['树体生长指标','物候发育指标','花器指标','果实品质指标','产量指标','叶片指标','越冬指标'],
  '环境条件': ['温度指标','水分指标','光照指标','风速指标','土壤指标','空气指标'],
  '病虫草害': ['病害指标','虫害指标','草害指标','综合指标'],
  '农事管理': ['施肥指标','灌溉指标','修剪指标','套袋指标','采收指标']
};

App.IND_UNITS = {
  '生育结果': ['cm','mm','g','kg','个','%','°Brix','kg/株','kg/亩','mm','—'],
  '环境条件': ['℃','%','%FC','h/d','mm','m/s','kLux','—'],
  '病虫草害': ['%','头/叶','头/百叶','个/m²','级','—'],
  '农事管理': ['kg/亩','m³/亩','次','h','—']
};

App.indCatOptions = function(panelCat, selected) {
  var cats = App.IND_CATEGORIES[panelCat] || ['其他'];
  return '<option value="">请选择</option>' + cats.map(function(c) {
    return '<option value="' + c + '"' + (c === selected ? ' selected' : '') + '>' + c + '</option>';
  }).join('');
};

App.indUnitOptions = function(panelCat, selected) {
  var units = App.IND_UNITS[panelCat] || ['—'];
  return units.map(function(u) {
    return '<option value="' + u + '"' + (u === selected ? ' selected' : '') + '>' + u + '</option>';
  }).join('');
};

// ============================================================
// 农事作业分类/方式
// ============================================================
App.OP_CATEGORIES = ['花果与树体管理','养分管理','水分管理','植保管理','灾害与应急管理','设备设施管理','采后与储存管理'];
App.OP_METHODS = ['人工','工具/设备','设施','物料','外包'];

// ============================================================
// 导入导出（兼容旧版）
// ============================================================
App.showExportModal = App.showExportModal || function() {};
App.showImportModal = App.showImportModal || function() {};
