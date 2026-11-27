# Lagrange 前端系统接口接入配置方案

Lagrange 前端采用 **双模式适配层 (`src/services/pipelineAdapter.ts`)** 对接四类上游后端管线，在不依赖三条后端服务提前改造的前提下，支持无缝在 `Mock 沙盒` 与 `Live REST` 模式之间切换。

---

## 一、管线接入端点与信号灯语义

| 管线 ID | 管线名称 | 默认 Base URL | 健康探测路径 | 信号灯判定规则 |
|---|---|---|---|---|
| `asset` | 图片资产管理管线 | `http://127.0.0.1:8100/api/v1/assets` | `GET /health` | 2xx 且 <800ms 为 `connected`；>=800ms 或 5xx 为 `degraded`；超时/异常为 `disconnected` |
| `rag` | RAG 知识检索管线 | `http://127.0.0.1:8200/api/v1/rag` | `GET /health` | 同上 |
| `imggen` | 程序化生图管线 | `http://127.0.0.1:8300/api/v1/imggen` | `GET /health` | 同上 |
| `model` | 模型推理集群 | `http://127.0.0.1:8400/api/v1/models` | `GET /status` | 聚合子模型在线度，任意主模型 `offline` 或延迟告警则置为 `degraded` |

---

## 二、核心业务接口契约汇总

### 1. 图片资产管理管线 (`/api/v1/assets`)
- `GET /health`：返回管线连通状态、版本及总资产数量。
- `GET /items?usage=&review_status=&q=`：拉取全库图片资产，区分 `imggen`（生图素材）、`rag`（RAG 素材）与 `both`（双管线共享）。
- `POST /items`：新素材入库注册（含 SHA-256 指纹与用途声明）。
- `PATCH /items/:assetId/usage`：动态切换资产在生图与 RAG 管线间的归属用途。

### 2. RAG 管线 (`/api/v1/rag`)
- `GET /health`：探测知识库索引与向量检索服务健康度。
- `GET /docs?match_status=&domain=&q=`：拉取 Doc 实体列表、规则与当前匹配/候选资产。
- `POST /docs/:docId/assets`：将资产库中的图片匹配并绑定到指定 Doc（支持设置 `primary_asset_id`）。
- `POST /docs/from-image`：**根据图片直接创建新 Doc**，单次请求完成建档、规则初始化与双向资产绑定。

### 3. 生图管线 (`/api/v1/imggen`)
- `GET /health`：探测程序化合成队列与渲染节点。
- `GET /audit/samples?batch=&status=`：拉取生图产出样本，包含归一化坐标 `bbox: [ymin, xmin, ymax, xmax]`（0–1000）、源资产 `source_asset_id` 及自动质检指标。
- `POST /audit/samples/:sampleId/verdict`：提交人工审计判责（`approved` / `rejected` / `flagged`）、缺陷标签与备注。

### 4. 模型推理集群 (`/api/v1/models`)
- `GET /status`：轮询各运行模型（VLM 审计、Embedding、Reranker、生图引擎）的 GPU 节点、显存占用、延迟与 QPS。
- `POST /:modelId/ping`：触发单模型实时心跳探活并更新延迟历史折线。

---

## 三、降级与本地持久化策略

1. 所有管线在前端「接口与接入配置」页均支持单独切换 `Mock` / `Live` 模式，也可在顶部信号灯胶囊处手动测试故障态联动。
2. 当处于 `Live` 模式但后端尚未启动或跨域未放开时，适配器会自动返回明确诊断日志并回退本地状态，不阻塞前端建档、绑定与审计交互。
3. 业务数据变更与接口配置自动持久化至 `localStorage`（key: `lagrange_console_state_v1`），可在配置中心一键恢复默认演示数据。
