export type NavTab =
  | 'dashboard'
  | 'rag-match'
  | 'gen-audit'
  | 'assets'
  | 'models'
  | 'api-config';

export type PipelineId = 'asset' | 'rag' | 'imggen' | 'model';

export type SignalStatus = 'connected' | 'degraded' | 'disconnected' | 'syncing';

export type ConnectionMode = 'mock' | 'live';

export interface PipelineEndpointConfig {
  id: PipelineId;
  name: string;
  shortName: string;
  description: string;
  mode: ConnectionMode;
  status: SignalStatus;
  baseUrl: string;
  healthPath: string;
  authType: 'none' | 'bearer' | 'api-key';
  apiKeyHeader: string;
  tokenPreview: string;
  timeoutMs: number;
  pollIntervalSec: number;
  latencyMs: number | null;
  lastCheckedAt: string;
  version: string;
  endpointCount: number;
}

export type AssetUsage = 'imggen' | 'rag' | 'both';

export type AssetReviewStatus = 'approved' | 'pending_review' | 'rejected';

export interface ImageAsset {
  id: string;
  sha256: string;
  nameZh: string;
  nameEn: string;
  category: string;
  usage: AssetUsage;
  tags: string[];
  width: number;
  height: number;
  format: 'PNG' | 'JPG' | 'SVG' | 'WEBP';
  previewUrl: string;
  sourceTier: string;
  reviewStatus: AssetReviewStatus;
  boundDocIds: string[];
  genReferenceCount: number;
  createdAt: string;
}

export type DocPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type DocMatchStatus = 'matched' | 'pending' | 'unmatched';

export interface RagDoc {
  id: string;
  title: string;
  domain: string;
  priority: DocPriority;
  summary: string;
  rules: string[];
  aliases: string[];
  primaryAssetId: string | null;
  boundAssetIds: string[];
  candidateAssetIds: string[];
  matchStatus: DocMatchStatus;
  updatedAt: string;
  createdFromImage?: boolean;
}

/** [ymin, xmin, ymax, xmax] normalized 0-1000 */
export type BBoxNorm = [number, number, number, number];

export type AuditStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface GenAuditSample {
  id: string;
  batchName: string;
  stage: string;
  prompt: string;
  qaQuestion: string;
  qaAnswer: string;
  imageUrl: string;
  sourceAssetId: string;
  bbox: BBoxNorm;
  metrics: {
    bboxAlign: number;
    alphaBlend: number;
    promptConsistency: number;
    hallucinationRisk: number;
  };
  status: AuditStatus;
  defectTags: string[];
  auditorNote: string;
  createdAt: string;
  modelUsed: string;
}

export type ModelRole = 'vlm_audit' | 'embedding' | 'reranker' | 'image_gen';

export type ModelRuntimeStatus = 'running' | 'loading' | 'degraded' | 'offline';

export interface ModelRuntime {
  id: string;
  name: string;
  family: string;
  role: ModelRole;
  status: ModelRuntimeStatus;
  endpoint: string;
  gpuNode: string;
  vramUsedGb: number;
  vramTotalGb: number;
  latencyMs: number;
  qps: number;
  uptime: string;
  latencyHistory: number[];
  lastHeartbeat: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  pipeline: PipelineId;
  title: string;
  detail: string;
  tone: 'success' | 'warning' | 'info' | 'danger';
}

export interface ThroughputPoint {
  hour: string;
  genCount: number;
  matchCount: number;
  auditCount: number;
}

export interface ApiEndpointSpec {
  id: string;
  pipeline: PipelineId;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  queryOrParams?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  responseSample: Record<string, unknown>;
  fieldMapping: string[];
  fallbackPolicy: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'warning' | 'info' | 'danger';
}

export interface ProbeResult {
  ok: boolean;
  status: SignalStatus;
  latencyMs: number | null;
  message: string;
  httpStatus?: number;
}
