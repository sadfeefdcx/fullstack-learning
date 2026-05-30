// ============================================================
// state.js - 状态管理层 (v2.2)
// 品种指标自动适配、作业成本预填、数据采集、人员工资
// ============================================================

var App = App || {};

// ============================================================
// 品种 → 指标参考范围自动映射
// ============================================================
App.VARIETY_INDICATOR_MAP = {
  '秦脆': {
    'GRI-046': '200-260g', 'GRI-038': '≥14.0°Brix', 'GRI-048': '高风险(钙敏感性极高)',
    'GRI-025': '高风险品种，套袋前必须补钙', 'GRI-036': '≥80%(片红)', 'GRI-026': '中等风险',
    'GRI-020': '120-160个/株(盛果期)', 'GRI-045': '2500-3500kg/亩(盛果期矮化密植)', 'GRI-043': '<0.3%/d'
  },
  '瑞雪': {
    'GRI-046': '180-240g', 'GRI-038': '≥15.5°Brix', 'GRI-037': '≥35(b*≥35为转黄标准)',
    'GRI-048': '中感(中等钙敏感)', 'GRI-042': '高风险(易发日灼，核心防控品种)',
    'GRI-026': '高风险(易发日灼)', 'GRI-049': '高风险(易发果锈)',
    'GRI-020': '100-140个/株(盛果期)', 'GRI-045': '3000-4000kg/亩(盛果期矮化密植)', 'GRI-043': '<0.2%/d'
  },
  '福布拉斯': {
    'GRI-046': '280-340g', 'GRI-038': '≥16.0°Brix', 'GRI-043': '<0.3%/d(采前落果是首要风险)',
    'GRI-048': '低-中风险', 'GRI-036': '≥85%(条红，着色优势)',
    'GRI-020': '80-120个/株(盛果期)', 'GRI-045': '3000-4000kg/亩(盛果期矮化密植)'
  },
  '蜜脆': {
    'GRI-046': '250-350g', 'GRI-038': '≥14.5°Brix', 'GRI-048': '极高风险(钙需求最高)',
    'GRI-025': '极高风险品种，苦痘病极其严重',
    'GRI-020': '100-140个/株(盛果期)', 'GRI-045': '2500-3500kg/亩(盛果期矮化密植)'
  },
  '富士冠军': {
    'GRI-046': '250-320g', 'GRI-038': '≥15.0°Brix', 'GRI-043': '<0.3%/d',
    'GRI-048': '中等风险', 'GRI-020': '100-150个/株(盛果期)', 'GRI-045': '3000-4000kg/亩(盛果期矮化密植)'
  },
  '红思尼克': {
    'GRI-046': '220-280g', 'GRI-038': '≥14.0°Brix', 'GRI-048': '中等风险',
    'GRI-020': '100-150个/株(盛果期)', 'GRI-045': '2500-3500kg/亩(盛果期矮化密植)'
  },
  '爱妃': {
    'GRI-046': '220-300g', 'GRI-038': '≥15.0°Brix', 'GRI-048': '中等风险',
    'GRI-020': '100-140个/株(盛果期)', 'GRI-045': '3000-4000kg/亩(盛果期矮化密植)'
  }
};

App.AGE_INDICATOR_MAP = {
  'GRI-001': {1:'1.5-2.0m', 2:'2.0-2.5m', 3:'2.5-3.0m', 5:'3.0-3.5m', 8:'3.0-3.5m(控高)'},
  'GRI-002': {1:'2-3cm', 2:'3-4cm', 3:'4-6cm', 5:'6-8cm', 8:'8-12cm'},
  'GRI-003': {1:'3-5个', 2:'8-12个', 3:'12-18个', 5:'18-25个', 8:'20-30个'},
  'GRI-004': {1:'0', 2:'5-15个', 3:'30-60个', 5:'60-100个', 8:'80-150个'},
  'GRI-014': {3:'20-40个/株', 5:'50-80个/株', 8:'80-150个/株'}
};

App.applyVarietyRefRanges = function(indicators, variety, seedlingAge) {
  if (!indicators || !indicators.length) return;
  var vMap = App.VARIETY_INDICATOR_MAP[variety] || {};
  var aMap = App.AGE_INDICATOR_MAP;
  indicators.forEach(function(ind) {
    if (vMap[ind.id] && !ind.isCustom) ind.refRange = vMap[ind.id];
    if (aMap[ind.id] && seedlingAge && !ind.isCustom) {
      var ageKeys = Object.keys(aMap[ind.id]).map(Number).sort(function(a,b){return a-b;});
      var bestKey = ageKeys[0];
      for (var i = 0; i < ageKeys.length; i++) { if (ageKeys[i] <= seedlingAge) bestKey = ageKeys[i]; }
      ind.refRange = aMap[ind.id][bestKey];
    }
  });
};

// ============================================================
// 默认物候期
// ============================================================
App.makeDefaultPhases = function() {
  return [
    {id:'P1',name:'休眠期',bbchStart:0,bbchEnd:3,sm:12,sp:'中旬',em:3,ep:'上旬',dur:55},
    {id:'P2',name:'萌芽现蕾期',bbchStart:7,bbchEnd:59,sm:3,sp:'中旬',em:4,ep:'上旬',dur:25},
    {id:'P3',name:'开花结果期',bbchStart:55,bbchEnd:69,sm:4,sp:'上旬',em:4,ep:'下旬',dur:12},
    {id:'P4',name:'幼果及春梢生长期',bbchStart:71,bbchEnd:74,sm:4,sp:'下旬',em:5,ep:'下旬',dur:28},
    {id:'P5',name:'花芽分化及果实膨大期',bbchStart:75,bbchEnd:79,sm:5,sp:'下旬',em:9,ep:'上旬',dur:55},
    {id:'P6',name:'着色成熟采收期',bbchStart:81,bbchEnd:87,sm:9,sp:'上旬',em:10,ep:'下旬',dur:35},
    {id:'P7',name:'采后恢复期',bbchStart:87,bbchEnd:91,sm:10,sp:'中旬',em:11,ep:'中旬',dur:20},
    {id:'P8',name:'落叶期',bbchStart:91,bbchEnd:97,sm:11,sp:'中旬',em:12,ep:'上旬',dur:40}
  ];
};

// ============================================================
// 默认基地信息
// ============================================================
App.defaultBase = function() {
  return {
    basicInfo:{ name:'',region:'',adminArea:'',altitude:'',avgTemp:'',rainfall:'',frostDays:'',sunshineHours:'',soilType:'',soilPh:'',organicMatter:'',irrigation:'',description:'' },
    plots:[], personnel:[], tools:[], equipment:[], materials:[]
  };
};

// ============================================================
// 生成默认指标（支持品种和树龄自动适配）
// ============================================================
App.populateIndicators = function(variety, seedlingAge) {
  var inds = App.INDICATORS.map(function(ind){
    return {
      id:ind[0], name:ind[1], category:ind[2], type:ind[3], unit:ind[4],
      bbchStart:ind[5], bbchEnd:ind[6], scope:ind[7], refRange:ind[8]||'',
      optLow:'', optHigh:'', alertLow:'', alertHigh:'',
      actionLow:'', actionHigh:'', damageLow:'', damageHigh:'',
      enabled:true, isCustom:false
    };
  });
  if (variety) App.applyVarietyRefRanges(inds, variety, seedlingAge);
  return inds;
};

// ============================================================
// 异常指标 → 建议措施映射
// ============================================================
App.INDICATOR_ACTION_MAP = {
  'ENV-006': { check:function(v){return parseFloat(v)<60;}, level:'warning', desc:'土壤含水量低于适宜范围(60-75%FC)', suggestion:'立即启动灌溉，灌至40-60cm土层湿润。', ops:['OP_DEF_18'] },
  'ENV-016': { check:function(v){return parseFloat(v)>26;}, level:'warning', desc:'膨大期旬均温偏高', suggestion:'增加灌溉频次至每3-5天一次，树盘覆草降温。', ops:['OP_DEF_18','OP_DEF_19'] },
  'ENV-017': { check:function(v){return parseFloat(v)>34;}, level:'alert', desc:'极端高温>34℃，日灼高危', suggestion:'启用遮阳网(遮光率30-40%)，树冠微喷降温，严禁疏除遮阴叶片。', ops:['OP_DEF_19'] },
  'ENV-019': { check:function(v){return parseFloat(v)>85;}, level:'warning', desc:'空气湿度>85%，病害高危', suggestion:'加强通风透光，预防性喷施杀菌剂，雨后24h内补喷。', ops:['OP_DEF_17'] },
  'ENV-008': { check:function(v){return parseFloat(v)<-1.5;}, level:'danger', desc:'花期温度低于-1.5℃，冻害', suggestion:'立即启动防冻：熏烟+树冠微喷联合。', ops:['OP_DEF_10'] },
  'GRI-017': { check:function(v){return parseFloat(v)>0;}, level:'danger', desc:'花器已发生冻害', suggestion:'调整留果量，加强花后管理，辅助授粉弥补坐果不足。', ops:['OP_DEF_11','OP_DEF_09'] },
  'GRI-030': { check:function(v){return parseFloat(v)<85;}, level:'warning', desc:'新梢停长率偏低，旺长趋势', suggestion:'严格控水控氮，夏季修剪疏除旺枝。', ops:['OP_DEF_14'] },
  'GRI-034': { check:function(v){return parseFloat(v)>=5;}, level:'alert', desc:'早期落叶病病叶率≥5%', suggestion:'喷施杀菌剂(代森锰锌+戊唑醇轮换)，清除病叶，叶面追肥。', ops:['OP_DEF_17'] },
  'GRI-035': { check:function(v){var m=new Date().getMonth()+1;return parseFloat(v)>=(m<=7?5:10);}, level:'alert', desc:'叶螨超过防治阈值', suggestion:'喷施哒螨灵或阿维菌素防治。', ops:['OP_DEF_17'] },
  'GRI-043': { check:function(v){return parseFloat(v)>=0.3;}, level:'alert', desc:'采前落果率≥0.3%/d', suggestion:'尽快分批采收，喷施NAA防落。', ops:['OP_DEF_25','OP_DEF_22'] },
  'PDW-004': { check:function(v){return parseFloat(v)>=2;}, level:'alert', desc:'白粉病病梢率≥2%', suggestion:'剪除病梢销毁，喷施80%硫磺WG 500-800倍液。', ops:['OP_DEF_07'] },
  'PDW-009': { check:function(v){return parseFloat(v)>0;}, level:'danger', desc:'轮纹病已侵染幼果', suggestion:'摘除病果深埋，全园喷施杀菌剂。', ops:['OP_DEF_13'] },
  'PDW-010': { check:function(v){return parseFloat(v)>0;}, level:'alert', desc:'苦痘病早期症状(钙缺乏)', suggestion:'叶面补钙(氯化钙0.3-0.5%，连续3-4次)，控氮。', ops:['OP_DEF_12'] },
  'PDW-012': { check:function(v){return parseFloat(v)>=5;}, level:'alert', desc:'落叶病病叶率≥5%', suggestion:'喷施杀菌剂，雨后24h内补喷。', ops:['OP_DEF_17'] },
  'PDW-013': { check:function(v){var m=new Date().getMonth()+1;return parseFloat(v)>=(m<=7?5:10);}, level:'alert', desc:'叶螨(盛发期)超阈值', suggestion:'喷施哒螨灵或阿维菌素，轮换用药。', ops:['OP_DEF_17'] },
  'PDW-021': { check:function(v){return parseFloat(v)>0;}, level:'alert', desc:'越冬前腐烂病新病斑', suggestion:'刮除病斑涂药，增强树势越冬。', ops:['OP_DEF_02'] }
};

// ============================================================
// 默认农事作业（30项，预填参考成本 元/亩）
// ============================================================
App.defaultOperations = function() {
  return [
    {id:'OP_DEF_01',category:'花果与树体管理',name:'冬季修剪',purpose:'完成树形骨架年度调整',methods:['人工'],standard:'中心干延长头不短截保持顶端优势；侧枝角度拉至90-110度；疏除粗度>着生处1/3的竞争枝',bbchStart:0,bbchEnd:3,materialCost:'0',laborCost:'100',equipCost:'5',enabled:true},
    {id:'OP_DEF_02',category:'花果与树体管理',name:'清园',purpose:'降低病虫越冬基数',methods:['人工','工具/设备'],standard:'清除枯枝落叶；刮除腐烂病斑；全园喷3-5波美度石硫合剂',bbchStart:0,bbchEnd:3,materialCost:'15',laborCost:'60',equipCost:'10',enabled:true},
    {id:'OP_DEF_03',category:'水分管理',name:'封冻水',purpose:'提高土壤热容量防根系冻害',methods:['设施'],standard:'土壤封冻前灌透水，灌至50-60cm土层湿润',bbchStart:0,bbchEnd:3,materialCost:'0',laborCost:'20',equipCost:'15',enabled:true},
    {id:'OP_DEF_04',category:'养分管理',name:'萌芽肥',purpose:'促进萌芽整齐与展叶迅速',methods:['工具/设备','设施','物料'],standard:'水肥一体化滴灌施入。秦脆控氮=富士70%；瑞雪=富士80%',bbchStart:7,bbchEnd:19,materialCost:'60',laborCost:'40',equipCost:'20',enabled:true},
    {id:'OP_DEF_05',category:'花果与树体管理',name:'刻芽促分枝',purpose:'促发侧枝填补空间',methods:['人工'],standard:'芽上方0.5cm处刀横切至木质部，弧长为干周1/3',bbchStart:7,bbchEnd:19,materialCost:'0',laborCost:'60',equipCost:'0',enabled:true},
    {id:'OP_DEF_06',category:'花果与树体管理',name:'抹芽定梢',purpose:'精准控制留芽量与着生方向',methods:['人工'],standard:'抹除主干基部萌芽(距地面60cm以下)；保留芽间距≥15cm螺旋状分布',bbchStart:7,bbchEnd:19,materialCost:'0',laborCost:'50',equipCost:'0',enabled:true},
    {id:'OP_DEF_07',category:'植保管理',name:'白粉病预防',purpose:'防控白粉病侵染嫩梢和花器',methods:['工具/设备','物料'],standard:'80%硫磺WG500-800倍液或10%苯醚甲环唑WG2000-3000倍液',bbchStart:7,bbchEnd:59,materialCost:'20',laborCost:'30',equipCost:'15',enabled:true},
    {id:'OP_DEF_08',category:'花果与树体管理',name:'疏花定产',purpose:'调控花量至目标负载',methods:['人工'],standard:'秦脆疏除>90%；瑞雪=秦脆50-60%',bbchStart:55,bbchEnd:59,materialCost:'0',laborCost:'80',equipCost:'0',enabled:true},
    {id:'OP_DEF_09',category:'花果与树体管理',name:'辅助授粉',purpose:'确保充分授粉，提高坐果率',methods:['人工','工具/设备'],standard:'每5-8亩1箱蜜蜂。自花不育品种必须放蜂+人工点授',bbchStart:60,bbchEnd:65,materialCost:'30',laborCost:'40',equipCost:'0',enabled:true},
    {id:'OP_DEF_10',category:'灾害与应急管理',name:'霜冻预防',purpose:'防御晚霜冻害保护花器',methods:['人工','物料'],standard:'降温前夜熏烟堆(秸秆+锯末每3-5m一堆)。<-1.5℃→熏烟+微喷联合',bbchStart:60,bbchEnd:69,materialCost:'20',laborCost:'30',equipCost:'0',enabled:true},
    {id:'OP_DEF_11',category:'花果与树体管理',name:'疏果定产',purpose:'确定最终负载量',methods:['人工'],standard:'果间距大果型≥20cm/中果型≥15cm。叶果比≥40:1',bbchStart:71,bbchEnd:74,materialCost:'0',laborCost:'80',equipCost:'0',enabled:true},
    {id:'OP_DEF_12',category:'养分管理+水分管理',name:'钙肥灌根',purpose:'满足果实钙素需求',methods:['工具/设备','设施','物料'],standard:'花后4-6周是钙吸收关键窗口。秦脆株施Ca10-15g+叶面4次',bbchStart:71,bbchEnd:75,materialCost:'45',laborCost:'20',equipCost:'15',enabled:true},
    {id:'OP_DEF_13',category:'花果与树体管理',name:'套袋',purpose:'保护果面+防病虫+防日灼',methods:['人工','物料'],standard:'花后30-40天开始。红色品种双层纸袋；瑞雪专用单层袋',bbchStart:71,bbchEnd:74,materialCost:'40',laborCost:'80',equipCost:'0',enabled:true},
    {id:'OP_DEF_14',category:'花果与树体管理',name:'夏季修剪控旺',purpose:'控制旺长维持树形结构',methods:['人工'],standard:'疏除竞争枝；背上枝不留(秦脆)；保留遮阳枝(瑞雪)',bbchStart:75,bbchEnd:79,materialCost:'0',laborCost:'60',equipCost:'0',enabled:true},
    {id:'OP_DEF_15',category:'养分管理',name:'追肥(膨果启动肥)',purpose:'匹配果实膨大期养分需求',methods:['工具/设备','设施','物料'],standard:'7月中旬后富士系绝对禁氮。中氮高钾水溶肥(12-6-32+TE)滴灌',bbchStart:75,bbchEnd:78,materialCost:'50',laborCost:'20',equipCost:'15',enabled:true},
    {id:'OP_DEF_16',category:'养分管理',name:'品质肥(7月中旬)',purpose:'钾促糖分积累+果实硬度',methods:['工具/设备','设施','物料'],standard:'株施K2O20-25g+Mg4-6g。绝对禁止氮肥',bbchStart:76,bbchEnd:78,materialCost:'40',laborCost:'15',equipCost:'10',enabled:true},
    {id:'OP_DEF_17',category:'植保管理',name:'保叶防治(6-8月)',purpose:'保护叶片至10月底',methods:['工具/设备','物料'],standard:'代森锰锌与苯醚甲环唑/戊唑醇轮换。雨后24h内补喷',bbchStart:75,bbchEnd:79,materialCost:'25',laborCost:'30',equipCost:'20',enabled:true},
    {id:'OP_DEF_18',category:'水分管理',name:'灌溉(膨大期)',purpose:'满足膨大期高需水+后期控水促着色',methods:['设施'],standard:'每5-7天一次。8月下旬起间隔延长至10-12天',bbchStart:75,bbchEnd:79,materialCost:'0',laborCost:'10',equipCost:'15',enabled:true},
    {id:'OP_DEF_19',category:'灾害与应急管理',name:'日灼防控',purpose:'防止日灼斑降低商品率',methods:['物料','设施'],standard:'>34℃→遮阳网(遮光率30-40%)。瑞雪严禁疏除遮阴叶片',bbchStart:75,bbchEnd:79,materialCost:'15',laborCost:'20',equipCost:'0',enabled:true},
    {id:'OP_DEF_20',category:'植保管理',name:'行间割草',purpose:'保持行间通风透光',methods:['工具/设备'],standard:'草高30-40cm时留茬10-15cm刈割',bbchStart:71,bbchEnd:79,materialCost:'0',laborCost:'20',equipCost:'15',enabled:true},
    {id:'OP_DEF_21',category:'花果与树体管理',name:'摘袋',purpose:'促进着色',methods:['人工'],standard:'红色品种双层袋分两次摘。瑞雪可带袋采收',bbchStart:81,bbchEnd:85,materialCost:'0',laborCost:'60',equipCost:'0',enabled:true},
    {id:'OP_DEF_22',category:'花果与树体管理',name:'摘叶+转果+铺反光膜',purpose:'促进均匀着色',methods:['人工','物料'],standard:'福布拉斯摘叶量<8%；秦脆10-15%',bbchStart:81,bbchEnd:87,materialCost:'10',laborCost:'50',equipCost:'0',enabled:true},
    {id:'OP_DEF_23',category:'水分管理',name:'控水增糖',purpose:'适度水分胁迫促糖分积累',methods:['设施'],standard:'9月中旬起减少灌溉(45-55%FC)',bbchStart:81,bbchEnd:87,materialCost:'0',laborCost:'10',equipCost:'5',enabled:true},
    {id:'OP_DEF_24',category:'植保管理',name:'防鸟',purpose:'防止鸟类啄食成熟果实',methods:['物料','工具/设备'],standard:'防鸟网+声波驱鸟器+反光带',bbchStart:81,bbchEnd:87,materialCost:'15',laborCost:'10',equipCost:'0',enabled:true},
    {id:'OP_DEF_25',category:'采后与储存管理',name:'分批采收',purpose:'在最佳成熟度窗口完成采收',methods:['人工'],standard:'按成熟度分2-3批。采前7天停止药剂',bbchStart:87,bbchEnd:89,materialCost:'0',laborCost:'100',equipCost:'20',enabled:true},
    {id:'OP_DEF_26',category:'养分管理',name:'采后叶面追肥',purpose:'促氮素回流',methods:['工具/设备','物料'],standard:'采后喷施3-5%尿素溶液1次',bbchStart:87,bbchEnd:91,materialCost:'10',laborCost:'15',equipCost:'10',enabled:true},
    {id:'OP_DEF_27',category:'养分管理',name:'秋施基肥',purpose:'培肥地力，为来年储备养分',methods:['人工','物料'],standard:'有机肥+过磷酸钙+硫酸钾。基肥占全年60-75%',bbchStart:87,bbchEnd:93,materialCost:'120',laborCost:'60',equipCost:'15',enabled:true},
    {id:'OP_DEF_28',category:'设备设施管理',name:'支架冬前检修',purpose:'确保支架系统稳固',methods:['人工','工具/设备'],standard:'检查水泥柱/钢丝/竹竿。紧固花篮螺丝',bbchStart:91,bbchEnd:97,materialCost:'10',laborCost:'30',equipCost:'0',enabled:true},
    {id:'OP_DEF_29',category:'灾害与应急管理',name:'树干涂白+防寒',purpose:'防止冻伤+日灼+兽啃',methods:['人工','物料'],standard:'涂白剂涂刷主干≥80cm。根颈培土30-40cm',bbchStart:91,bbchEnd:97,materialCost:'15',laborCost:'40',equipCost:'0',enabled:true},
    {id:'OP_DEF_30',category:'采后与储存管理',name:'清园',purpose:'降低来年病虫初侵染源',methods:['人工','工具/设备'],standard:'落叶堆沤腐熟(≥60℃/7天)后还田',bbchStart:91,bbchEnd:97,materialCost:'0',laborCost:'30',equipCost:'10',enabled:true}
  ];
};

// ============================================================
// 状态管理对象
// ============================================================
App.appState = {
  models: {}, plans: {}, records: {}, workOrders: {}, workRecords: {},
  dataCollections: {}, observations: {}, base: null,
  currentModelId: null, currentPlanId: null, currentRecordId: null,
  currentWorkOrderId: null, currentCostView: null, currentWorkRecordId: null,
  currentObservationId: null, currentBaseTab: 'basic', currentDataCollectionId: null,
  MK: 'apple_v5',

    loadAll: function() {
    try {
      var d = JSON.parse(localStorage.getItem(this.MK) || '{}');
      this.models = d.models || {}; this.plans = d.plans || {}; this.records = d.records || {};
      this.workOrders = d.workOrders || {}; this.workRecords = d.workRecords || {};
      this.dataCollections = d.dataCollections || {}; this.observations = d.observations || {};
      this.base = d.base || null;
      this._dataVersion = d._dataVersion || null;
    } catch(e) {
      this.models = {}; this.plans = {}; this.records = {};
      this.workOrders = {}; this.workRecords = {}; this.dataCollections = {};
      this.observations = {}; this.base = null;
      this._dataVersion = null;
    }
    if (!this.base || !this.base.basicInfo) this.base = App.defaultBase();
    if (!this.base.tools) this.base.tools = [];
    if (!Object.keys(this.models).length && !Object.keys(this.records).length) {
      try {
        var old = JSON.parse(localStorage.getItem('apple_v4') || '{}');
        if (old.models) this.models = old.models;
        if (old.records) this.records = old.records;
        if (old.plans) this.plans = old.plans;
        if (Object.keys(this.models).length || Object.keys(this.records).length) this.saveAll();
      } catch(e) {}
    }
  },

  saveAll: function() {
    localStorage.setItem(this.MK, JSON.stringify({
      models:this.models, plans:this.plans, records:this.records,
      workOrders:this.workOrders, workRecords:this.workRecords,
      dataCollections:this.dataCollections, observations:this.observations, base:this.base,
      _dataVersion:this._dataVersion
    }));
  },


  init: function() { this.loadAll(); }
};
