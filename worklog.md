---
Task ID: 1
Agent: Main Agent
Task: 修复侧边栏折叠三角形不旋转 + 优化查看详情侧边栏样式布局

Work Log:
- 修复 Sidebar.tsx 中 Collapsible 的 CSS 选择器错误，改为直接使用 open 状态控制旋转
- 创建共享组件 DetailSheet.tsx
- 更新 7 个管理页面使用 DetailSheet 组件
- 构建验证通过

Stage Summary:
- 侧边栏折叠三角形正确旋转
- 所有查看详情侧边栏统一使用 DetailSheet 共享组件

---
Task ID: 2
Agent: Super Z (main)
Task: 统一进货管理搜索行按钮高度 + 优化订单详情页面

Work Log:
- 将 DateRangePicker 触发按钮高度从 h-8 改为 h-7，与搜索框、Select、新建/导出按钮一致
- 根据 VLM 分析参考图片，重新设计进货单详情页布局：
  - 财务摘要：单个纵向卡片（总金额大号字体、运费、已付款绿色、待付款红色、付款状态徽章），带分隔线
  - 基本信息：双列网格卡片（供应商/日期一行、订单编号/创建人一行、备注），带分隔线
  - 货品明细：带计数标签和空状态提示
  - 付款记录：带笔数统计和空状态提示，记录卡片带绿色金额
  - 底部添加黑色"打印进货单"按钮
- 清理未使用的 DetailSheet 导入（InfoSection, InfoRow, SummaryCards, RecordList）
- 构建验证通过

Stage Summary:
- 修改文件: DateRangePicker.tsx, PurchaseManagement.tsx
- 工具栏所有控件高度统一为 h-7
- 详情页布局与参考图片匹配

---
Task ID: 3
Agent: Super Z (main)
Task: 进货管理四项优化 — 货品明细/Calendar日期选择器/进货分类选择/分页器

Work Log:
- 货品明细表格：列名简化（名称/规格/重量/单价/金额），重量输入框空值提示"0 KG"，单价输入框空值提示"0.00 元"
- 订单日期：将原生 Input type="date" 替换为 Calendar + Popover 组件，支持中文日历显示（zhCN locale）
- 产品名称：从自由输入改为 Select 下拉选择，选项来自 dbProductCategories.getByCategory('purchase') 进货分类
- 选择分类后自动填入该分类的规格（readOnly 防误改）
- 列表分页：每页10条，底部显示分页器（上一页/页码/下一页），含省略号和总数统计
- 筛选条件变化时自动重置到第1页

Stage Summary:
- 修改文件: PurchaseManagement.tsx
- 新增依赖组件: Calendar, Popover, Pagination
- 新增数据加载: dbProductCategories (进货分类)
- 新增状态: categories, currentPage, pageSize
- 构建验证通过（0 errors）

---
Task ID: 4
Agent: Super Z (main)
Task: 进货单货品明细优化 — 占位符精简 + 卡片式布局

Work Log:
- 重量输入框占位符从"0 KG"改为"KG"，单价从"0.00 元"改为"元"
- 金额列：未填时显示"-"，已填时显示加粗金额
- 货品明细从紧凑 Table 行改为卡片式布局（rounded-lg border + hover 效果）
- 名称和规格合并为一列：上方 Select 下拉选择分类，下方自动显示规格
- 重量/单价输入框未填时右侧固定显示半透明单位标识（KG/元）
- 合计行改为右对齐，金额加大加粗显示

Stage Summary:
- 修改文件: PurchaseManagement.tsx
- 货品明细改为卡片式展示，交互体验更佳
- 构建验证通过（0 errors）
