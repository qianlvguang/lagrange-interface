# lagrange-interface

**Lagrange 多模态管线集成前端系统** — 面向「图片资产管理管线」「RAG 知识检索管线」「程序化生图管线」与「模型推理集群」的统一交互控制台，采用 **Claude 暖羊皮纸风格 × 雾面毛玻璃质感 × 动态拓扑流光** 设计。

> 本仓库聚焦前端控制台与双模式接口适配层（`Mock` 沙盒 + `Live REST`），三条后端管线本身独立部署接入，不耦合后端源码。

---

## 核心能力模块

1. **集成化大盘与动态管线拓扑 (`DashboardView` + `PipelineTopology`)**
   - 呈现图片资产总量、RAG 配图覆盖率、生图审计通过率、模型集群显存与在线状态等核心 KPI。
   - SVG 动态贝塞尔粒子拓扑图：中心「图片资产管理管线」向「RAG 管线」「生图管线」及「模型推理集群」双向流转，信号灯状态实时联动流光速率与连线形态。
   - 集成吞吐趋势图与实时管线动态事件流。

2. **全局管线信号灯控制 (`TopSignalBar` + `SignalLight`)**
   - 悬浮顶部信号灯胶囊实时标明 `Asset Hub`、`RAG Engine`、`ImageGen`、`Model Cluster` 是否接入（`connected` / `degraded` / `syncing` / `disconnected`）。
   - 支持点击展开快速联调状态、单条探测或全量探测（`Ping All`）。

3. **RAG 资产匹配与从图片新建 Doc (`RagMatchView` + `CreateDocFromImageModal`)**
   - 为 RAG 系统中的每条 Doc 检索、推荐并绑定图片资产库中的标准图元，支持设置主参考图与解绑。
   - 支持直接**根据图片创建新 Doc**，自动预填实体信息并完成双向索引绑定。

4. **生图产出审计工作台 (`GenAuditView`)**
   - 支持归一化 BBox `[ymin, xmin, ymax, xmax]` 坐标叠加层开关、资产库源参考图左右对照、缩放检视与自动质检指标条。
   - 支持缺陷标签、备注与快捷键连续判责（`A` 通过 / `R` 驳回 / `F` 复核 / `B` 开关框线 / `↑↓` 切图）。

5. **统一图片资产库 (`AssetHubView`)**
   - 汇集生图素材与 RAG 素材，支持按用途（`both` / `imggen` / `rag` / 未绑定 Doc）筛选、本地上传图片入库及详情抽屉溯源。

6. **模型运行状态监控 (`ModelMonitorView`)**
   - 展示 VLM 审计、Embedding、Reranker 与生图模型的在线信号灯、GPU 节点、VRAM 占用、QPS 与近 10 次延迟趋势折线图，支持单模型心跳 `Ping`。

7. **接口接入与配置中心 (`ApiConfigView`)**
   - 完整内置 4 条管线共 13 个 REST 接口契约方案（参见 [docs/API_INTEGRATION_SPEC.md](docs/API_INTEGRATION_SPEC.md)），支持 `Mock` / `Live` 模式切换、端点参数编辑与一键导出 `lagrange-api-config.json`。

---

## 技术栈

- **React 19** + **TypeScript 5.7** + **Vite 6**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Framer Motion 12** + **Lucide React**

---

## 快速启动

```bash
npm install
npm run dev
```

生产构建与类型检查：

```bash
npm run build
```
