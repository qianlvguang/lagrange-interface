import type {
  AuditStatus,
  ModelRuntime,
  PipelineEndpointConfig,
  ProbeResult,
  RagDoc,
} from '../types/lagrange';

function buildHeaders(config: PipelineEndpointConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.authType === 'bearer' && config.tokenPreview) {
    headers[config.apiKeyHeader || 'Authorization'] = `Bearer ${config.tokenPreview}`;
  } else if (config.authType === 'api-key' && config.tokenPreview) {
    headers[config.apiKeyHeader || 'X-Lagrange-Key'] = config.tokenPreview;
  }
  return headers;
}

function normalizeUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function probePipelineHealth(
  config: PipelineEndpointConfig
): Promise<ProbeResult> {
  if (config.mode === 'mock') {
    const jitter = 18 + Math.floor(Math.random() * 44);
    await wait(140 + jitter);
    if (config.status === 'disconnected') {
      return {
        ok: false,
        status: 'disconnected',
        latencyMs: null,
        message: `[Mock 沙盒] ${config.shortName} 当前处于手动断开状态`,
      };
    }
    const simulatedLatency =
      config.status === 'degraded' ? 110 + Math.floor(Math.random() * 65) : jitter;
    return {
      ok: true,
      status: config.status === 'degraded' ? 'degraded' : 'connected',
      latencyMs: simulatedLatency,
      httpStatus: 200,
      message: `[Mock 沙盒] ${config.healthPath} 响应正常 (${simulatedLatency}ms)`,
    };
  }

  const target = normalizeUrl(config.baseUrl, config.healthPath);
  const start = performance.now();
  try {
    const res = await fetchWithTimeout(
      target,
      { method: 'GET', headers: buildHeaders(config) },
      config.timeoutMs
    );
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status >= 500 ? 'degraded' : 'disconnected',
        latencyMs: latency,
        httpStatus: res.status,
        message: `HTTP ${res.status} (${latency}ms) — ${target}`,
      };
    }
    return {
      ok: true,
      status: latency > 800 ? 'degraded' : 'connected',
      latencyMs: latency,
      httpStatus: res.status,
      message: `Live 探活成功 HTTP ${res.status} (${latency}ms)`,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `请求超时 (>${config.timeoutMs}ms)`
          : err.message
        : '未知网络异常';
    return {
      ok: false,
      status: 'disconnected',
      latencyMs: null,
      message: `Live 探测失败：${msg}`,
    };
  }
}

export async function probeModelRuntime(
  model: ModelRuntime,
  clusterConfig: PipelineEndpointConfig
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  if (clusterConfig.mode === 'mock') {
    await wait(160);
    if (model.status === 'offline') {
      return {
        ok: false,
        latencyMs: 0,
        message: `${model.name} 当前已离线，未响应心跳探针`,
      };
    }
    const base = model.status === 'degraded' ? 760 : model.latencyMs;
    const nextLatency = Math.max(18, Math.round(base + (Math.random() - 0.5) * 28));
    return {
      ok: true,
      latencyMs: nextLatency,
      message: `${model.name} 心跳探活成功 (${nextLatency}ms)`,
    };
  }

  const target = normalizeUrl(clusterConfig.baseUrl, `/${model.id}/ping`);
  const start = performance.now();
  try {
    const res = await fetchWithTimeout(
      target,
      {
        method: 'POST',
        headers: buildHeaders(clusterConfig),
        body: JSON.stringify({ probe_type: 'lightweight_echo' }),
      },
      clusterConfig.timeoutMs
    );
    const latency = Math.round(performance.now() - start);
    return {
      ok: res.ok,
      latencyMs: latency,
      message: res.ok
        ? `Live 模型探活成功 HTTP ${res.status} (${latency}ms)`
        : `模型端点返回 HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: 0,
      message: err instanceof Error ? err.message : '模型探测失败',
    };
  }
}

export async function syncBindAssetToDoc(
  ragConfig: PipelineEndpointConfig,
  docId: string,
  assetIds: string[],
  primaryAssetId: string | null
): Promise<{ ok: boolean; note: string }> {
  if (ragConfig.mode === 'mock') {
    await wait(110);
    return { ok: true, note: 'Mock 沙盒已同步绑定关系' };
  }
  try {
    const target = normalizeUrl(ragConfig.baseUrl, `/docs/${docId}/assets`);
    const res = await fetchWithTimeout(
      target,
      {
        method: 'POST',
        headers: buildHeaders(ragConfig),
        body: JSON.stringify({ asset_ids: assetIds, primary_asset_id: primaryAssetId }),
      },
      ragConfig.timeoutMs
    );
    return {
      ok: res.ok,
      note: res.ok ? `已回传 RAG 接口 (${res.status})` : `RAG 接口返回 HTTP ${res.status}，已暂存本地`,
    };
  } catch {
    return { ok: false, note: 'RAG Live 接口不可达，变更已保存至本地状态' };
  }
}

export async function syncCreateDocFromImage(
  ragConfig: PipelineEndpointConfig,
  doc: RagDoc
): Promise<{ ok: boolean; note: string }> {
  if (ragConfig.mode === 'mock') {
    await wait(140);
    return { ok: true, note: 'Mock 沙盒已完成新建 Doc 与双向关联' };
  }
  try {
    const target = normalizeUrl(ragConfig.baseUrl, '/docs/from-image');
    const res = await fetchWithTimeout(
      target,
      {
        method: 'POST',
        headers: buildHeaders(ragConfig),
        body: JSON.stringify({
          doc_id: doc.id,
          title: doc.title,
          domain: doc.domain,
          priority: doc.priority,
          summary: doc.summary,
          rules: doc.rules,
          aliases: doc.aliases,
          asset_ids: doc.boundAssetIds,
          primary_asset_id: doc.primaryAssetId,
        }),
      },
      ragConfig.timeoutMs
    );
    return {
      ok: res.ok,
      note: res.ok ? `已创建并写入远端 RAG (${res.status})` : `远端返回 HTTP ${res.status}，本地已建档`,
    };
  } catch {
    return { ok: false, note: 'RAG Live 接口不可达，已在本地建档' };
  }
}

export async function syncSubmitAuditVerdict(
  genConfig: PipelineEndpointConfig,
  sampleId: string,
  status: AuditStatus,
  defectTags: string[],
  auditorNote: string
): Promise<{ ok: boolean; note: string }> {
  if (genConfig.mode === 'mock') {
    await wait(90);
    return { ok: true, note: 'Mock 沙盒已记录审计结论' };
  }
  try {
    const target = normalizeUrl(genConfig.baseUrl, `/audit/samples/${sampleId}/verdict`);
    const res = await fetchWithTimeout(
      target,
      {
        method: 'POST',
        headers: buildHeaders(genConfig),
        body: JSON.stringify({ status, defect_tags: defectTags, auditor_note: auditorNote }),
      },
      genConfig.timeoutMs
    );
    return {
      ok: res.ok,
      note: res.ok ? `审计结论已同步 (${res.status})` : `生图接口返回 HTTP ${res.status}，结论已本地暂存`,
    };
  } catch {
    return { ok: false, note: '生图 Live 接口不可达，审计结论已本地暂存' };
  }
}
