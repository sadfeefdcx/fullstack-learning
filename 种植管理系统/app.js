// ============================================================
// app.js - 入口层 (v2.2)
// 数据采集、措施→派工、作业记录→成本回填
// ============================================================

var App = App || {};

App.init = function() {
  App.appState.init();
  var state = App.appState;
  var DATA_VERSION = '2.2';
  if (state._dataVersion !== DATA_VERSION) {
    localStorage.removeItem('apple_v5');
    state.init();
    state._dataVersion = DATA_VERSION;
  }
  if (Object.keys(state.models).length === 0) App.seedDefaultData();
  if (!state.base || !state.base.plots || !state.base.plots.length) App.seedBaseData();
  if (Object.keys(state.workOrders).length === 0) App.seedWorkOrderData();
  if (Object.keys(state.dataCollections).length === 0) App.seedDataCollectionData();
  App.upgradeExistingModels();

  App.renderSidebar();
  App.renderMain();

  App.byId('btnNewModel').addEventListener('click', App.showNewModelModal);
  App.byId('btnNewPlan').addEventListener('click', App.showNewPlanModal);
  App.byId('btnNewRecord').addEventListener('click', App.showNewRecordModal);
  App.byId('btnNewDataCollection').addEventListener('click', App.showNewDataCollectionModal);
  App.byId('btnNewWorkOrder').addEventListener('click', App.showNewWorkOrderModal);
  App.byId('btnNewWorkRecord').addEventListener('click', App.showNewWorkRecordModal);
  App.byId('btnExport').addEventListener('click', App.showExportModal);

  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'n' || e.key === 'N') App.showNewModelModal();
    if (e.key === 'e' || e.key === 'E') App.showExportModal();
    if (e.key === 'Escape') {
      var modals = document.querySelectorAll('.modal-overlay');
      if (modals.length) modals[modals.length - 1].remove();
    }
  });
};

// ============================================================
// 升级已有模型（作业成本预填 + 品种指标适配）
// ============================================================
App.upgradeExistingModels = function() {
  var state = App.appState;
  var changed = false;
  var defaultOps = App.defaultOperations();

  Object.keys(state.models).forEach(function(mid) {
    var m = state.models[mid];

    // 作业成本预填
    if (m.operations && m.operations.length) {
      m.operations.forEach(function(op) {
        if (op.materialCost === undefined || op.materialCost === '' || op.materialCost === null) {
          var def = defaultOps.find(function(d) { return d.id === op.id; });
          if (def) { op.materialCost = def.materialCost; op.laborCost = def.laborCost; op.equipCost = def.equipCost; changed = true; }
        }
      });
    }

    // 品种指标适配
    if (m.indicators && m.indicators.length && m.variety) {
      var oldRefs = m.indicators.map(function(ind) { return ind.refRange; });
      App.applyVarietyRefRanges(m.indicators, m.variety, m.seedlingAge);
      var newRefs = m.indicators.map(function(ind) { return ind.refRange; });
      if (oldRefs.join('|') !== newRefs.join('|')) changed = true;
    }
  });

  if (changed) state.saveAll();
};

// ============================================================
// 种子数据：派工单示例
// ============================================================
App.seedWorkOrderData = function() {
  var state = App.appState;
  var firstPlanId = Object.keys(state.plans)[0];
  state.workOrders = {
    'WO_SAMPLE_001': {
      id: 'WO_SAMPLE_001', planId: firstPlanId, planOpId: null,
      status: 'completed', issueDate: '2026-04-10', location: '东区1号',
      taskDescription: '疏花疏果(秦脆/瑞雪)', technicalParams: '秦脆花序间距25cm(疏除>90%)',
      qualityStandard: '瑞雪=秦脆的50-60%',
      assignee: '张建国', workers: ['李明','王芳','赵强'], totalWorkers: 3, plannedHours: 6,
      decisionFactors: { weather:'晴，15-22℃，无降水', personnel:'熟练工人3人', urgency:'正常', resources:'人工操作' },
      tools: [{name:'疏花剪',source:'自有',hours:18},{name:'采果梯',source:'自有',hours:18},{name:'周转筐',source:'自有',hours:18}],
      materials: [],
      equipment: [],
      execution: { actualStart:'2026-04-10T07:30', actualEnd:'2026-04-10T17:30', completion:'100%', incompleteReason:'', actualArea:'2.1', actualMaterials:[], toolReturn:'已归还/已保养', equipmentReturn:'', signatory:'张建国', signDate:'2026-04-10' },
      createdAt: '2026-04-09T08:00:00.000Z'
    },
    'WO_SAMPLE_002': {
      id: 'WO_SAMPLE_002', planId: firstPlanId, planOpId: null,
      status: 'completed', issueDate: '2026-04-12', location: '东区1号',
      taskDescription: '防鸟网布置', technicalParams: '20目尼龙网，覆盖≥95%果穗',
      qualityStandard: '≤3%果穗暴露',
      assignee: '刘工', workers: ['李明','王芳','张伟','陈华','赵强','孙丽'], totalWorkers: 6, plannedHours: 8,
      decisionFactors: { weather:'阴，14-19℃', personnel:'6人', urgency:'正常', resources:'物资已领' },
      tools: [{name:'修枝剪',source:'自有',hours:48},{name:'高枝剪',source:'自有',hours:24},{name:'手锯',source:'自有',hours:48}],
      materials: [{name:'遮阳网',spec:'75%遮光率',qty:5,unit:'卷',unitPrice:120,amount:600},{name:'遮阳网',spec:'50%遮光率',qty:3,unit:'卷',unitPrice:80,amount:240}],
      equipment: [{name:'运输车',source:'自有',hours:4,cost:30,total:120},{name:'打药机',source:'自有',hours:2,cost:50,total:100}],
      execution: { actualStart:'2026-04-12T07:00', actualEnd:'2026-04-12T17:00', completion:'100%', incompleteReason:'', actualArea:'5', actualMaterials:[], toolReturn:'已归还/已保养', equipmentReturn:'已归还/已检查', signatory:'刘工', signDate:'2026-04-12' },
      createdAt: '2026-04-11T10:00:00.000Z'
    }
  };
  state.saveAll();
};

// ============================================================
// 种子数据：数据采集示例（v2.2 新增）
// ============================================================
App.seedDataCollectionData = function() {
  var state = App.appState;
  var firstPlanId = Object.keys(state.plans)[0];
  if (!firstPlanId) return;
  var plan = state.plans[firstPlanId];
  var model = state.models[plan.modelId];

  state.dataCollections = {
    'DC_SAMPLE_001': {
      id: 'DC_SAMPLE_001', planId: firstPlanId, modelId: plan.modelId,
      phaseId: 'P5', phaseName: '花芽分化及果实膨大期',
      collectDate: '2026-07-15', collector: '张建国', weather: '晴转多云 26-33℃', location: '东区1号',
      items: [
        {indicatorId:'GRI-028',indicatorName:'果实横径(7月中旬)',value:'62',unit:'mm',refRange:'55-70',bbchStart:75,bbchEnd:77,status:'normal',note:'正常膨大'},
        {indicatorId:'GRI-030',indicatorName:'新梢停长率(8月下旬)',value:'72',unit:'%',refRange:'≥85%',bbchStart:75,bbchEnd:79,status:'warning',note:'偏低，旺长趋势'},
        {indicatorId:'GRI-031',indicatorName:'叶片SPAD值',value:'48',unit:'—',refRange:'42-55',bbchStart:71,bbchEnd:79,status:'normal',note:''},
        {indicatorId:'GRI-034',indicatorName:'早期落叶病病叶率',value:'6.2',unit:'%',refRange:'<5%',bbchStart:75,bbchEnd:79,status:'alert',note:'超标需防治'},
        {indicatorId:'GRI-035',indicatorName:'叶螨活动螨量',value:'3',unit:'头/叶',refRange:'<5(7月前)',bbchStart:75,bbchEnd:79,status:'normal',note:''},
        {indicatorId:'ENV-014',indicatorName:'土壤含水量0-60cm',value:'55',unit:'%FC',refRange:'60-75',bbchStart:71,bbchEnd:79,status:'warning',note:'偏低'},
        {indicatorId:'ENV-016',indicatorName:'旬均温(膨大期)',value:'28.5',unit:'℃',refRange:'22-26',bbchStart:75,bbchEnd:79,status:'warning',note:'偏高'},
        {indicatorId:'ENV-017',indicatorName:'极端最高温(膨大期)',value:'35.2',unit:'℃',refRange:'<34',bbchStart:75,bbchEnd:79,status:'alert',note:'日灼高危'},
        {indicatorId:'ENV-019',indicatorName:'空气相对湿度',value:'62',unit:'%',refRange:'55-70',bbchStart:75,bbchEnd:79,status:'normal',note:''}
      ],
      adjustments: [
        {id:'ADJ_001',triggerIndicators:['GRI-034'],triggerSummary:'早期落叶病病叶率6.2%(阈值<5%)',description:'1.喷施代森锰锌+戊唑醇 2.清除病叶 3.叶面追肥',relatedOpIds:['OP_DEF_17'],relatedOpNames:['保叶防治(6-8月)'],priority:'urgent',status:'pending',workOrderId:null},
        {id:'ADJ_002',triggerIndicators:['ENV-017'],triggerSummary:'极端最高温35.2℃(阈值<34℃)',description:'1.启用遮阳网 2.保留遮阴叶片 3.树冠微喷降温',relatedOpIds:['OP_DEF_19'],relatedOpNames:['日灼防控'],priority:'urgent',status:'pending',workOrderId:null},
        {id:'ADJ_003',triggerIndicators:['ENV-014','ENV-016'],triggerSummary:'土壤含水量55%FC(偏低) + 旬均温28.5℃(偏高)',description:'增加灌溉频次至每3-5天一次',relatedOpIds:['OP_DEF_18'],relatedOpNames:['灌溉(膨大期)'],priority:'normal',status:'accepted',workOrderId:null}
      ],
      createdAt: '2026-07-15T10:30:00.000Z'
    }
  };
  state.saveAll();
};

// ============================================================
// 种子数据：默认模型
// ============================================================
App.seedDefaultData = function() {
  var state = App.appState;
  state.models = {};
  var defaults = [
    {name:'', variety:'秦脆', seedlingAge:3, rootstockType:'矮化中间砧', rootstockVar:'青砧1号', densityType:'矮化密植', trellis:'V型架'},
    {name:'', variety:'瑞雪', seedlingAge:4, rootstockType:'矮化中间砧', rootstockVar:'青砧1号', densityType:'矮化密植', trellis:'V型架'},
    {name:'', variety:'福布拉斯', seedlingAge:2, rootstockType:'矮化自根砧', rootstockVar:'M9-T337', densityType:'矮化密植', trellis:'篱架/网架'},
    {name:'', variety:'蜜脆', seedlingAge:3, rootstockType:'矮化中间砧', rootstockVar:'青砧1号', densityType:'矮化密植', trellis:'V型架'},
    {name:'', variety:'富士冠军', seedlingAge:8, rootstockType:'矮化中间砧', rootstockVar:'M26', densityType:'矮化密植', trellis:'篱架/网架'},
    {name:'', variety:'红思尼克', seedlingAge:3, rootstockType:'矮化自根砧', rootstockVar:'M9-T337', densityType:'矮化密植', trellis:'篱架/网架'},
    {name:'', variety:'爱妃', seedlingAge:5, rootstockType:'矮化中间砧', rootstockVar:'JM7', densityType:'矮化密植', trellis:'篱架/网架'}
  ];
  defaults.forEach(function(d) {
    var id = 'M_' + d.variety + '_' + d.seedlingAge;
    d.id = id; d.phases = App.makeDefaultPhases();
    d.indicators = App.populateIndicators(d.variety, d.seedlingAge);
    d.operations = App.defaultOperations(); d._operationsSeeded = true;
    d.note = ''; d.createdAt = new Date().toISOString();
    state.models[id] = d;
  });
  state.saveAll();
};

// ============================================================
// 种子数据：基地信息
// ============================================================
App.seedBaseData = function() {
  var state = App.appState;
  state.base = state.base || {};
  if (!state.base.basicInfo) state.base.basicInfo = {
    name: '杨凌秦脆苹果示范园', region: '陕西·杨凌', adminArea: '杨陵区五泉镇',
    altitude: '450', avgTemp: '12.9', rainfall: '635', frostDays: '210', sunshineHours: '2164',
    soilType: '垆土', soilPh: '7.8', organicMatter: '14.5', irrigation: '滴灌',
    description: '西北农林科技大学苹果试验示范基地'
  };
  if (!state.base.plots || !state.base.plots.length) {
    state.base.plots = [
      { code:'P001', name:'东区1号', area:'示范区', acres:'2.1', soilType:'垆土', irrigation:'滴灌',
        facility:'钢架大棚', status:'在种', currentCrop:'秦脆(矮化中间砧)', prevCrop:'—',
        manager:'张建国', landGrade:'高产田', rating:'A级',
        notes:'土层深厚，有机质含量高，保水保肥能力强。近3年无重大病虫害发生。已安装防雹网和防鸟网。滴灌系统运行良好。' },
      { code:'P002', name:'东区2号', area:'示范区', acres:'2.8', soilType:'垆土', irrigation:'滴灌',
        facility:'露地', status:'在种', currentCrop:'瑞雪(矮化自根砧)', prevCrop:'—',
        manager:'李明', landGrade:'高产田', rating:'A级',
        notes:'与P001相邻，土壤条件一致。行间生草栽培，树势中庸。' },
      { code:'P003', name:'西区1号', area:'示范区', acres:'3.2', soilType:'黄绵土', irrigation:'滴灌',
        facility:'露地', status:'空闲', currentCrop:'—', prevCrop:'富士冠军(2023-2025)',
        manager:'张建国', landGrade:'中产田', rating:'B级',
        notes:'前茬富士冠军因腐烂病严重淘汰。计划秋季定植新品种。土壤需补充有机质。' }
    ];
  }
  if (!state.base.personnel || !state.base.personnel.length) {
    state.base.personnel = [
      { code:'E001', name:'张建国', gender:'男', phone:'138****5678', position:'技术主管',
        employType:'长期工', hireDate:'2020-03-15', dailyWage:'200',
        skills:'修剪,病虫害防治,水肥管理,套袋,采收', responsiblePlots:'东区1号,西区1号', health:'健康',
        notes:'20年苹果种植经验，负责技术方案制定和现场指导。擅长秦脆品种管理。' },
      { code:'E002', name:'李明', gender:'男', phone:'139****1234', position:'果园工人',
        employType:'长期工', hireDate:'2021-03-01', dailyWage:'150',
        skills:'修剪,疏花疏果,套袋', responsiblePlots:'东区1号', health:'健康',
        notes:'5年果园工作经验，技术熟练。' },
      { code:'E003', name:'王芳', gender:'女', phone:'137****5678', position:'果园工人',
        employType:'长期工', hireDate:'2022-03-01', dailyWage:'150',
        skills:'疏花疏果,套袋,采收', responsiblePlots:'东区2号', health:'健康',
        notes:'3年果园工作经验，套袋技术好。' },
      { code:'E004', name:'赵强', gender:'男', phone:'136****9012', position:'季节工',
        employType:'季节工', hireDate:'2025-03-01', dailyWage:'120',
        skills:'疏花疏果,采收,搬运', responsiblePlots:'东区1号,东区2号', health:'健康',
        notes:'春季至秋季雇佣，主要负责体力劳动。' }
    ];
  }
  if (!state.base.tools || !state.base.tools.length) {
  state.base.tools = [
    {code:'T001',name:'疏花剪',spec:'不锈钢弯头',brand:'SHARP',quantity:20,unit:'把',location:'工具房A柜',keeper:'张建国',status:'可借用',efficiency:'每人每天疏花80-100序',cost:'15',notes:'刀口需每周打磨，春季疏花期使用频率最高。'},
    {code:'T002',name:'采果梯',spec:'1.5m人字梯',brand:'稳固牌',quantity:15,unit:'架',location:'工具房A区',keeper:'张建国',status:'可借用',efficiency:'适配3-3.5m矮化树体',cost:'120',notes:'铝合金材质，轻便耐用。使用前检查铰链是否松动。'},
    {code:'T003',name:'修枝剪',spec:'中号直刃',brand:'ARS',quantity:25,unit:'把',location:'工具房A柜',keeper:'张建国',status:'可借用',efficiency:'冬季修剪主力工具',cost:'60',notes:'日本进口，刃口锋利。每月涂防锈油保养。'},
    {code:'T004',name:'高枝剪',spec:'伸缩杆3-5m',brand:'SHARP',quantity:8,unit:'把',location:'工具房A柜',keeper:'李明',status:'可借用',efficiency:'用于高处枝条修剪',cost:'85',notes:'配合修枝剪使用，适合中心干延长头修剪。'},
    {code:'T005',name:'手锯',spec:'折叠式手锯',brand:'ARS',quantity:15,unit:'把',location:'工具房A柜',keeper:'张建国',status:'可借用',efficiency:'用于粗枝锯除(>3cm)',cost:'45',notes:'锯除竞争枝、过粗侧枝专用。'},
    {code:'T006',name:'套袋器',spec:'手持弹簧式',brand:'国产',quantity:30,unit:'把',location:'工具房B柜',keeper:'王芳',status:'可借用',efficiency:'每人每天套袋800-1200个',cost:'8',notes:'套袋期集中使用，高峰期需备足数量。袋口铁丝需配套。'},
    {code:'T007',name:'周转筐',spec:'50×40×30cm塑料',brand:'中型',quantity:100,unit:'个',location:'仓库C区',keeper:'李明',status:'可借用',efficiency:'采收运输用',cost:'25',notes:'底部需垫软布防止碰伤果实。采收季前清洗消毒。'},
    {code:'T008',name:'喷雾器',spec:'背负式电动16L',brand:'卫士',quantity:10,unit:'台',location:'药械库',keeper:'张建国',status:'可借用',efficiency:'每台覆盖2-3亩/次',cost:'280',notes:'喷头需定期更换，药液残留需彻底清洗。'},
    {code:'T009',name:'量杯/量筒',spec:'100-1000ml',brand:'国产',quantity:20,unit:'个',location:'药械库',keeper:'张建国',status:'可借用',efficiency:'配药计量用',cost:'5',notes:'不同药剂需专用量杯，避免交叉污染。'},
    {code:'T010',name:'土壤取样器',spec:'T型土钻60cm',brand:'国产',quantity:3,unit:'把',location:'检测室',keeper:'张建国',status:'可借用',efficiency:'土壤采样专用',cost:'120',notes:'取样后清洁钻头，防止交叉污染。'}
  ];
}
if (!state.base.equipment || !state.base.equipment.length) {
  state.base.equipment = [
    {code:'EQ001',name:'运输车',model:'五菱荣光小卡',assetCategory:'运输设备',purchaseDate:'2022-03-15',originalValue:'45000',lifeYears:'10',status:'运行',location:'车库',manager:'李明',efficiency:'日常农资和果实运输',cost:'30',notes:'年检合格，保险有效期至2026-12。每5000km保养一次。'},
    {code:'EQ002',name:'打药机',model:'自走式风送喷雾机3WF-600',assetCategory:'植保设备',purchaseDate:'2021-04-01',originalValue:'28000',lifeYears:'8',status:'运行',location:'药械库',manager:'张建国',efficiency:'600L药箱，覆盖10-15亩/小时',cost:'50',notes:'喷头4个/组，需定期检查雾化效果。药箱每次用后冲洗。'},
    {code:'EQ003',name:'割草机',model:'本田GX35自走式',assetCategory:'田间管理设备',purchaseDate:'2023-05-10',originalValue:'6800',lifeYears:'6',status:'运行',location:'工具房',manager:'赵强',efficiency:'行间割草，每小时1-2亩',cost:'15',notes:'刀片每月检查磨损。火花塞每季度更换。机油每50h更换。'},
    {code:'EQ004',name:'拖拉机',model:'东方红ME304',assetCategory:'动力设备',purchaseDate:'2020-01-20',originalValue:'52000',lifeYears:'12',status:'运行',location:'车库',manager:'李明',efficiency:'旋耕、开沟、施肥等综合作业',cost:'60',notes:'30马力，配旋耕机和开沟机。年保养一次。'},
    {code:'EQ005',name:'滴灌系统',model:'以色列耐特菲姆内镶式',assetCategory:'灌溉设备',purchaseDate:'2021-03-01',originalValue:'35000',lifeYears:'8',status:'运行',location:'全园覆盖',manager:'张建国',efficiency:'主管+支管+滴灌带，覆盖全园5.1亩',cost:'15',notes:'每季度检查过滤器，冬季排空管道防冻。滴灌带2-3年更换一次。'},
    {code:'EQ006',name:'气象站',model:'Davis Vantage Pro2',assetCategory:'监测设备',purchaseDate:'2022-06-15',originalValue:'12000',lifeYears:'10',status:'运行',location:'园区中心',manager:'张建国',efficiency:'实时监测温度/湿度/风速/降雨/光照',cost:'5',notes:'太阳能供电，数据无线传输至手机。雨量计每月清洁。'},
    {code:'EQ007',name:'防鸟网',model:'20目尼龙网',assetCategory:'防护设施',purchaseDate:'2024-08-01',originalValue:'8000',lifeYears:'3',status:'运行',location:'东区1号+2号',manager:'张建国',efficiency:'覆盖5亩果园，防鸟啄果',cost:'0',notes:'采收后拆除清洗晾干保存，来年重复使用。破损处及时修补。'},
    {code:'EQ008',name:'防雹网',model:'圆形丝PE网',assetCategory:'防护设施',purchaseDate:'2023-04-15',originalValue:'15000',lifeYears:'5',status:'运行',location:'东区1号',manager:'张建国',efficiency:'覆盖2.1亩，防冰雹+部分遮阳',cost:'0',notes:'4-10月张挂，11月收起。检查钢丝绳张力。'}
  ];
}
if (!state.base.materials || !state.base.materials.length) {
  state.base.materials = [
    {code:'M001',name:'尿素',category:'肥料',spec:'含N 46%',stock:200,unit:'kg',minStock:50,location:'肥料库',expiry:'2027-06-01',supplier:'杨凌农资',unitPrice:'2.5',notes:'萌芽肥+采后追肥用。注意防潮储存。'},
    {code:'M002',name:'磷酸二氢钾',category:'肥料',spec:'P2O5≥52% K2O≥34%',stock:100,unit:'kg',minStock:30,location:'肥料库',expiry:'2027-12-01',supplier:'杨凌农资',unitPrice:'8',notes:'叶面喷施0.2-0.3%溶液，膨大期至着色期使用。'},
    {code:'M003',name:'过磷酸钙',category:'肥料',spec:'P2O5≥16%',stock:300,unit:'kg',minStock:100,location:'肥料库',expiry:'2027-06-01',supplier:'杨凌农资',unitPrice:'1.2',notes:'秋施基肥用，与有机肥混合施入。'},
    {code:'M004',name:'硫酸钾',category:'肥料',spec:'K2O≥52%',stock:150,unit:'kg',minStock:50,location:'肥料库',expiry:'2027-06-01',supplier:'杨凌农资',unitPrice:'4.5',notes:'膨大期追肥用，控氮增钾。'},
    {code:'M005',name:'氯化钙',category:'肥料',spec:'CaCl2≥95%',stock:50,unit:'kg',minStock:20,location:'肥料库',expiry:'2027-03-01',supplier:'杨凌农资',unitPrice:'5',notes:'叶面补钙用，0.3-0.5%溶液。花后4-6周开始，连续3-4次。'},
    {code:'M006',name:'有机肥(商品)',category:'肥料',spec:'有机质≥45% N+P2O5+K2O≥5%',stock:2000,unit:'kg',minStock:500,location:'肥料库',expiry:'2027-12-01',supplier:'本地有机肥厂',unitPrice:'0.8',notes:'秋施基肥主力。每亩施入1000-1500kg。'},
    {code:'M007',name:'代森锰锌',category:'农药',spec:'80%可湿性粉剂',stock:30,unit:'kg',minStock:10,location:'药械库(锁柜)',expiry:'2026-08-01',supplier:'先正达',unitPrice:'35',notes:'广谱保护性杀菌剂。防治落叶病、炭疽病。安全间隔期14天。'},
    {code:'M008',name:'戊唑醇',category:'农药',spec:'25%乳油',stock:15,unit:'L',minStock:5,location:'药械库(锁柜)',expiry:'2026-10-01',supplier:'拜耳',unitPrice:'60',notes:'三唑类内吸杀菌剂。与代森锰锌轮换使用。安全间隔期21天。'},
    {code:'M009',name:'苯醚甲环唑',category:'农药',spec:'10%水分散粒剂',stock:10,unit:'kg',minStock:5,location:'药械库(锁柜)',expiry:'2027-03-01',supplier:'先正达',unitPrice:'80',notes:'防治白粉病、斑点落叶病。安全间隔期14天。'},
    {code:'M010',name:'硫磺悬浮剂',category:'农药',spec:'80%水分散粒剂',stock:20,unit:'kg',minStock:10,location:'药械库(锁柜)',expiry:'2027-06-01',supplier:'国产',unitPrice:'18',notes:'防治白粉病。萌芽现蕾期使用500-800倍液。安全间隔期7天。'},
    {code:'M011',name:'哒螨灵',category:'农药',spec:'15%乳油',stock:10,unit:'L',minStock:3,location:'药械库(锁柜)',expiry:'2026-12-01',supplier:'国产',unitPrice:'25',notes:'防治叶螨(红蜘蛛)。叶螨达阈值时喷施。安全间隔期14天。'},
    {code:'M012',name:'阿维菌素',category:'农药',spec:'1.8%乳油',stock:10,unit:'L',minStock:3,location:'药械库(锁柜)',expiry:'2026-12-01',supplier:'国产',unitPrice:'30',notes:'防治叶螨+鳞翅目害虫。与哒螨灵轮换使用。安全间隔期14天。'},
    {code:'M013',name:'石硫合剂',category:'农药',spec:'45%结晶',stock:50,unit:'kg',minStock:20,location:'药械库(锁柜)',expiry:'2027-03-01',supplier:'国产',unitPrice:'8',notes:'清园专用。休眠期喷施3-5波美度。萌芽前全园喷施。'},
    {code:'M014',name:'套袋(双层纸袋)',category:'包装材料',spec:'红色品种专用19.5×16cm',stock:5000,unit:'个',minStock:2000,location:'仓库B区',expiry:'',supplier:'山东龙口袋业',unitPrice:'0.12',notes:'秦脆、福布拉斯等红色品种使用。外黄内黑，遮光率≥95%。'},
    {code:'M015',name:'套袋(单层袋)',category:'包装材料',spec:'瑞雪专用黄色袋19.5×16cm',stock:3000,unit:'个',minStock:1000,location:'仓库B区',expiry:'',supplier:'山东龙口袋业',unitPrice:'0.08',notes:'瑞雪品种使用。透光率较高，促转黄。可带袋采收。'},
    {code:'M016',name:'反光膜',category:'种植材料',spec:'PET镀铝膜宽1m',stock:20,unit:'卷',minStock:5,location:'仓库B区',expiry:'',supplier:'国产',unitPrice:'45',notes:'摘袋后铺设于树盘下，促进果实着色均匀。每卷100m。'},
    {code:'M017',name:'遮阳网',category:'种植材料',spec:'75%遮光率 宽2m',stock:5,unit:'卷',minStock:2,location:'仓库B区',expiry:'',supplier:'国产',unitPrice:'120',notes:'日灼防控用。极端高温(>34℃)时张挂于树冠上方。每卷50m。'},
    {code:'M018',name:'防草布',category:'种植材料',spec:'PP编织布 宽1m 黑色',stock:10,unit:'卷',minStock:3,location:'仓库B区',expiry:'',supplier:'国产',unitPrice:'60',notes:'树盘覆盖用，抑制杂草+保墒。使用寿命2-3年。每卷100m。'},
    {code:'M019',name:'涂白剂',category:'种植材料',spec:'石灰:硫磺:水=10:1:40',stock:100,unit:'kg',minStock:30,location:'肥料库',expiry:'',supplier:'自配',unitPrice:'2',notes:'树干涂白防冻+防日灼+防兽啃。涂刷主干≥80cm。11月上旬完成。'},
    {code:'M020',name:'愈合剂',category:'农药',spec:'甲基托布津糊剂',stock:10,unit:'kg',minStock:3,location:'药械库(锁柜)',expiry:'2027-06-01',supplier:'国产',unitPrice:'20',notes:'腐烂病刮除后涂抹伤口。促进愈合组织形成。'}
  ];
}
state.saveAll();
}

// ============================================================
// 数据采集 - CRUD
// ============================================================
App.createDataCollection = function(data) {
  var state = App.appState;
  var id = 'DC_' + Date.now();
  data.id = id; data.createdAt = new Date().toISOString();
  state.dataCollections[id] = data;
  state.currentDataCollectionId = id;
  state.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('数据采集创建成功', 'success');
};

App.saveDataCollectionItems = function(dcId) {
  var state = App.appState;
  var dc = state.dataCollections[dcId]; if (!dc) return;
  var model = state.models[dc.modelId];

  var items = [];
  App.qsa('.dc-val').forEach(function(inp) {
    var indId = inp.dataset.id, val = inp.value.trim();
    var noteInp = App.qs('.dc-note[data-id="' + indId + '"]');
    var note = noteInp ? noteInp.value.trim() : '';
    var ind = model ? model.indicators.find(function(i) { return i.id === indId; }) : null;
    var status = 'normal';
    if (val && ind) status = App.judgeIndicatorStatus(val, ind);
    items.push({indicatorId:indId,indicatorName:inp.dataset.name||'',value:val,unit:inp.dataset.unit||'',refRange:inp.dataset.ref||'',bbchStart:parseInt(inp.dataset.bs)||0,bbchEnd:parseInt(inp.dataset.be)||0,status:status,note:note});
  });
  dc.items = items;

  // 自动推荐调整措施
  var existingTriggers = {};
  (dc.adjustments || []).forEach(function(adj) {
    (adj.triggerIndicators || []).forEach(function(tid) { existingTriggers[tid] = true; });
  });
  if (!dc.adjustments) dc.adjustments = [];

  items.forEach(function(item) {
    if (item.status === 'normal' || existingTriggers[item.indicatorId]) return;
    var action = App.INDICATOR_ACTION_MAP[item.indicatorId]; if (!action) return;
    var matchedOps = (action.ops || []).map(function(opId) {
      var op = model ? (model.operations || []).find(function(o) { return o.id === opId; }) : null;
      return {id:opId, name:op ? op.name : opId};
    });
    dc.adjustments.push({id:'ADJ_'+Date.now()+'_'+item.indicatorId,triggerIndicators:[item.indicatorId],triggerSummary:item.indicatorName+' = '+item.value+item.unit+' ('+App.statusConfig[item.status].label+')',description:action.suggestion,relatedOpIds:matchedOps.map(function(o){return o.id;}),relatedOpNames:matchedOps.map(function(o){return o.name;}),priority:item.status==='danger'||item.status==='alert'?'urgent':'normal',status:'pending',workOrderId:null});
  });

  state.saveAll(); App.renderMain();
  App.showToast('采集数据已保存，异常指标已自动推荐措施', 'success');
};

App.deleteDataCollection = function(id) {
  if (!confirm('确定删除此次采集？')) return;
  delete App.appState.dataCollections[id];
  if (App.appState.currentDataCollectionId === id) App.appState.currentDataCollectionId = null;
  App.appState.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已删除', 'info');
};

App.updateAdjustmentStatus = function(dcId, adjId, newStatus) {
  var dc = App.appState.dataCollections[dcId]; if (!dc || !dc.adjustments) return;
  var adj = dc.adjustments.find(function(a) { return a.id === adjId; }); if (!adj) return;
  adj.status = newStatus; App.appState.saveAll(); App.renderMain();
  App.showToast('状态已更新', 'success');
};

App.createWorkOrderFromAdjustment = function(dcId, adjId) {
  var state = App.appState;
  var dc = state.dataCollections[dcId]; if (!dc) return;
  var adj = (dc.adjustments || []).find(function(a) { return a.id === adjId; }); if (!adj) return;

  var id = 'WO_' + Date.now();
  state.workOrders[id] = {
    id:id, planId:dc.planId||null, planOpId:null,
    dataCollectionId:dcId, adjustmentId:adjId,
    status:'pending', issueDate:new Date().toISOString().slice(0,10), location:dc.location||'',
    taskDescription:'[采集驱动] '+(adj.relatedOpNames||[]).join('+'),
    technicalParams:adj.description,
    qualityStandard:'异常指标: '+(adj.triggerSummary||''),
    assignee:dc.collector||'', workers:[], totalWorkers:0, plannedHours:0,
    decisionFactors:{weather:dc.weather||'',personnel:'',urgency:adj.priority==='urgent'?'紧急':'正常',resources:'数据采集驱动'},
    tools:[], materials:[], equipment:[],
    execution:{actualStart:'',actualEnd:'',completion:'',incompleteReason:'',actualArea:'',actualMaterials:[],toolReturn:'',equipmentReturn:'',signatory:'',signDate:''},
    createdAt:new Date().toISOString()
  };
  adj.status = 'accepted'; adj.workOrderId = id;
  state.currentWorkOrderId = id;
  state.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已从措施生成派工单', 'success');
};

// ============================================================
// 派工单 → 计划作业关联
// ============================================================
App.createWorkOrderFromPlanOp = function(idx) {
  var state = App.appState;
  var p = state.plans[state.currentPlanId]; if (!p || !p.operations) return;
  var op = p.operations[idx]; if (!op) return;

  var id = 'WO_' + Date.now();
  var pers = op.personnel || {};
  state.workOrders[id] = {
    id:id, planId:state.currentPlanId, planOpId:op.id,
    dataCollectionId:null, adjustmentId:null,
    status:'pending', issueDate:op.plannedDate||new Date().toISOString().slice(0,10),
    location:p.plot||'', taskDescription:op.name, technicalParams:op.note||'',
    qualityStandard:'', assignee:op.assignee||'',
    workers:[], totalWorkers:pers.count||0, plannedHours:pers.days||0,
    decisionFactors:{weather:'',personnel:'',urgency:'',resources:'计划作业: '+op.name},
    tools:[], materials:(op.materials||[]).map(function(m){return{name:m.name,spec:m.spec||'',qty:m.qty||0,unit:m.unit||''};}),
    equipment:[],
    execution:{actualStart:'',actualEnd:'',completion:'',incompleteReason:'',actualArea:'',actualMaterials:[],toolReturn:'',equipmentReturn:'',signatory:'',signDate:''},
    createdAt:new Date().toISOString()
  };
  state.currentWorkOrderId = id;
  state.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已从计划作业生成派工单', 'success');
};

App.deleteWorkOrder = function(id) {
  if (!confirm('确定？')) return;
  delete App.appState.workOrders[id];
  if (App.appState.currentWorkOrderId === id) App.appState.currentWorkOrderId = null;
  App.appState.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已删除', 'info');
};

// ============================================================
// 作业记录 - CRUD（v2.2: 自动回填单价）
// ============================================================
App.createWorkRecordFromWorkOrder = function() {
  var state = App.appState;
  var wo = state.workOrders[state.currentWorkOrderId]; if (!wo) return;

  var id = 'WR_' + Date.now();
  var personnel = {count:wo.totalWorkers||0, names:wo.workers||[], hours:{total:0}, wages:{total:0}};

  // 自动回填工具单价
  var tools = (wo.tools||[]).map(function(t) {
    var baseTool = (state.base||{}).tools ? state.base.tools.find(function(bt){return bt.name===t.name;}) : null;
    var unitCost = 0;
    if (baseTool && baseTool.cost) { var parsed = parseFloat(baseTool.cost); if (!isNaN(parsed)) unitCost = parsed; }
    return {name:t.name, source:t.source||'自有', hours:t.hours||0, cost:unitCost, total:unitCost*(t.hours||0)};
  });

  // 自动回填设备单价
  var equipment = (wo.equipment||[]).map(function(e) {
    var baseEquip = (state.base||{}).equipment ? state.base.equipment.find(function(be){return be.name===e.name;}) : null;
    var unitCost = e.cost||0;
    if (baseEquip && baseEquip.cost) { var parsed = parseFloat(baseEquip.cost); if (!isNaN(parsed)) unitCost = parsed; }
    return {name:e.name, source:e.source||'自有', hours:e.hours||0, cost:unitCost, total:unitCost*(e.hours||0)};
  });

  // 自动回填物资单价
  var materials = (wo.materials||[]).map(function(m) {
    var baseMat = (state.base||{}).materials ? state.base.materials.find(function(bm){return bm.name===m.name;}) : null;
    var unitPrice = m.unitPrice||0;
    if (baseMat && baseMat.unitPrice) { var parsed = parseFloat(baseMat.unitPrice); if (!isNaN(parsed)) unitPrice = parsed; }
    return {name:m.name, spec:m.spec||'', qty:m.qty||0, unit:m.unit||'', unitPrice:unitPrice, amount:unitPrice*(m.qty||0)};
  });

  // 汇总成本
  var toolTotal = 0; tools.forEach(function(t){toolTotal+=t.total;});
  var equipmentTotal = 0; equipment.forEach(function(e){equipmentTotal+=e.total;});
  var materialTotal = 0; materials.forEach(function(m){materialTotal+=m.amount;});

  var wr = {
    id:id, workOrderId:state.currentWorkOrderId, recordDate:wo.issueDate||new Date().toISOString().slice(0,10),
    workType:'自己作业', workArea:'', crop:'', operationNames:[wo.taskDescription||''],
    workCondition:'合适', conditionNote:'',
    personnel:personnel, equipment:equipment, tools:tools, materials:materials,
    outsourcing:{projectName:'',description:'',pricingUnit:'亩',unitPrice:0,totalPrice:0},
    costSummary:{laborTotal:0,equipmentTotal:equipmentTotal,toolTotal:toolTotal,materialTotal:materialTotal,outsourcingTotal:0,grandTotal:equipmentTotal+toolTotal+materialTotal},
    note:'', createdAt:new Date().toISOString()
  };
  state.workRecords[id] = wr;
  state.currentWorkRecordId = id;
  state.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已从派工单生成作业记录（单价已自动回填）', 'success');
};

App.deleteWorkRecord = function(id) {
  if (!confirm('确定？')) return;
  delete App.appState.workRecords[id];
  if (App.appState.currentWorkRecordId === id) App.appState.currentWorkRecordId = null;
  App.appState.saveAll(); App.renderSidebar(); App.renderMain();
  App.showToast('已删除', 'info');
};

App.saveWorkRecord = function() {
  var state = App.appState;
  var wr = state.workRecords[state.currentWorkRecordId]; if (!wr) return;

  wr.recordDate = App.byId('wrDate').value;
  wr.workType = App.byId('wrType').value;
  wr.workCondition = App.byId('wrCondition').value;
  wr.conditionNote = App.byId('wrCondNote').value;

  // 人员
  wr.personnel.count = parseInt(App.byId('wrPersonnelCount').value)||0;
  var pNames = App.byId('wrPersonnelNames').value.trim();
  wr.personnel.names = pNames ? pNames.split(/[,，]/).map(function(s){return s.trim();}).filter(Boolean) : [];
  wr.personnel.hours.total = parseFloat(App.byId('wrPersonnelHours').value)||0;
  wr.personnel.wages.total = parseFloat(App.byId('wrPersonnelWages').value)||0;

  // 设备
  wr.equipment = [];
  App.qsa('#wrEquipBody tr').forEach(function(tr) {
    var name = tr.querySelector('.wre-name').value.trim(); if (!name) return;
    var hours = parseFloat(tr.querySelector('.wre-hours').value)||0;
    var cost = parseFloat(tr.querySelector('.wre-cost').value)||0;
    var total = parseFloat(tr.querySelector('.wre-total').textContent)||0;
    wr.equipment.push({name:name, source:'自有', hours:hours, cost:cost, total:total});
  });

  // 工具
  wr.tools = [];
  App.qsa('#wrToolBody tr').forEach(function(tr) {
    var name = tr.querySelector('.wrt-name').value.trim(); if (!name) return;
    var hours = parseFloat(tr.querySelector('.wrt-hours').value)||0;
    var cost = parseFloat(tr.querySelector('.wrt-cost').value)||0;
    var total = parseFloat(tr.querySelector('.wrt-total').textContent)||0;
    wr.tools.push({name:name, source:'自有', hours:hours, cost:cost, total:total});
  });

  // 物资
  wr.materials = [];
  App.qsa('#wrMatBody tr').forEach(function(tr) {
    var name = tr.querySelector('.wrm-name').value.trim(); if (!name) return;
    var spec = tr.querySelector('.wrm-spec').value.trim();
    var qty = parseFloat(tr.querySelector('.wrm-qty').value)||0;
    var unit = tr.querySelector('.wrm-unit').value.trim();
    var unitPrice = parseFloat(tr.querySelector('.wrm-price').value)||0;
    var amount = parseFloat(tr.querySelector('.wrm-amount').textContent)||0;
    wr.materials.push({name:name, spec:spec, qty:qty, unit:unit, unitPrice:unitPrice, amount:amount});
  });

  // 外包
  wr.outsourcing.projectName = App.byId('wrOutName').value;
  wr.outsourcing.pricingUnit = App.byId('wrOutUnit').value;
  wr.outsourcing.totalPrice = parseFloat(App.byId('wrOutPrice').value)||0;

  // 汇总
  wr.costSummary.laborTotal = wr.personnel.wages.total||0;
  wr.costSummary.toolTotal = 0; wr.tools.forEach(function(t){wr.costSummary.toolTotal+=t.total||0;});
  wr.costSummary.equipmentTotal = 0; wr.equipment.forEach(function(e){wr.costSummary.equipmentTotal+=e.total||0;});
  wr.costSummary.materialTotal = 0; wr.materials.forEach(function(m){wr.costSummary.materialTotal+=m.amount||0;});
  wr.costSummary.outsourcingTotal = wr.outsourcing.totalPrice||0;
  wr.costSummary.grandTotal = wr.costSummary.laborTotal+wr.costSummary.toolTotal+wr.costSummary.equipmentTotal+wr.costSummary.materialTotal+wr.costSummary.outsourcingTotal;

  wr.note = App.byId('wrNote').value;

  state.saveAll(); App.renderMain();
  App.showToast('已保存（合计: '+wr.costSummary.grandTotal.toFixed(0)+' 元）', 'success');
};

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', App.init);
