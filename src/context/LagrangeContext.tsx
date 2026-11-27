import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  INITIAL_ASSETS,
  INITIAL_AUDIT_SAMPLES,
  INITIAL_DOCS,
  INITIAL_EVENTS,
  INITIAL_MODELS,
  INITIAL_PIPELINES,
  INITIAL_THROUGHPUT,
} from '../data/seedData';
import {
  probeModelRuntime,
  probePipelineHealth,
  syncBindAssetToDoc,
  syncCreateDocFromImage,
  syncSubmitAuditVerdict,
} from '../services/pipelineAdapter';
import type {
  ActivityEvent,
  AssetUsage,
  AuditStatus,
  DocPriority,
  GenAuditSample,
  ImageAsset,
  ModelRuntime,
  ModelRuntimeStatus,
  NavTab,
  PipelineEndpointConfig,
  PipelineId,
  ProbeResult,
  RagDoc,
  SignalStatus,
  ThroughputPoint,
  ToastItem,
} from '../types/lagrange';

const STORAGE_KEY = 'lagrange_console_state_v1';

interface PersistedState {
  pipelines: PipelineEndpointConfig[];
  assets: ImageAsset[];
  docs: RagDoc[];
  samples: GenAuditSample[];
  models: ModelRuntime[];
  events: ActivityEvent[];
}

interface CreateDocPayload {
  id: string;
  title: string;
  domain: string;
  priority: DocPriority;
  summary: string;
  rules: string[];
  aliases: string[];
  assetIds: string[];
  primaryAssetId: string | null;
}

interface UploadAssetPayload {
  nameZh: string;
  nameEn: string;
  category: string;
  usage: AssetUsage;
  tags: string[];
  width: number;
  height: number;
  format: 'PNG' | 'JPG' | 'SVG' | 'WEBP';
  previewUrl: string;
}

interface LagrangeContextValue {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pipelines: PipelineEndpointConfig[];
  assets: ImageAsset[];
  docs: RagDoc[];
  samples: GenAuditSample[];
  models: ModelRuntime[];
  events: ActivityEvent[];
  throughput: ThroughputPoint[];
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;

  selectedDocId: string;
  setSelectedDocId: (id: string) => void;
  selectedSampleId: string;
  setSelectedSampleId: (id: string) => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;

  // Cross-view contextual navigation
  inspectAssetInHub: (assetId: string) => void;
  inspectSampleInAudit: (sampleId: string) => void;
  inspectDocInRag: (docId: string) => void;

  createDocModalOpen: boolean;
  createDocPresetAssetIds: string[];
  openCreateDocModal: (presetAssetIds?: string[]) => void;
  closeCreateDocModal: () => void;

  // Pipeline controls
  updatePipelineConfig: (id: PipelineId, patch: Partial<PipelineEndpointConfig>) => void;
  setPipelineStatus: (id: PipelineId, status: SignalStatus) => void;
  pingPipeline: (id: PipelineId) => Promise<ProbeResult>;
  pingAllPipelines: () => Promise<void>;
  isPingingAll: boolean;

  // Asset Hub actions
  uploadImageAsset: (payload: UploadAssetPayload) => ImageAsset;
  updateAssetUsage: (assetId: string, usage: AssetUsage) => void;

  // RAG Doc actions
  bindAssetToDoc: (docId: string, assetId: string, makePrimary?: boolean) => Promise<void>;
  unbindAssetFromDoc: (docId: string, assetId: string) => Promise<void>;
  setDocPrimaryAsset: (docId: string, assetId: string) => Promise<void>;
  createDocFromImages: (payload: CreateDocPayload) => Promise<RagDoc>;

  // Gen Audit actions
  submitAuditVerdict: (
    sampleId: string,
    status: AuditStatus,
    defectTags: string[],
    auditorNote: string
  ) => Promise<void>;

  // Model runtime actions
  pingModel: (modelId: string) => Promise<void>;
  setModelStatus: (modelId: string, status: ModelRuntimeStatus) => void;

  // State reset
  resetWorkspaceData: () => void;
}

const LagrangeContext = createContext<LagrangeContextValue | null>(null);

function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function nowDateTimeStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.pipelines) &&
        Array.isArray(parsed.assets) &&
        Array.isArray(parsed.docs) &&
        Array.isArray(parsed.samples) &&
        Array.isArray(parsed.models)
      ) {
        return {
          pipelines: parsed.pipelines,
          assets: parsed.assets,
          docs: parsed.docs,
          samples: parsed.samples,
          models: parsed.models,
          events: Array.isArray(parsed.events) ? parsed.events : INITIAL_EVENTS,
        };
      }
    }
  } catch {
    // Fallback to initial seed data
  }
  return {
    pipelines: INITIAL_PIPELINES,
    assets: INITIAL_ASSETS,
    docs: INITIAL_DOCS,
    samples: INITIAL_AUDIT_SAMPLES,
    models: INITIAL_MODELS,
    events: INITIAL_EVENTS,
  };
}

export const LagrangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [pipelines, setPipelines] = useState<PipelineEndpointConfig[]>(initial.pipelines);
  const [assets, setAssets] = useState<ImageAsset[]>(initial.assets);
  const [docs, setDocs] = useState<RagDoc[]>(initial.docs);
  const [samples, setSamples] = useState<GenAuditSample[]>(initial.samples);
  const [models, setModels] = useState<ModelRuntime[]>(initial.models);
  const [events, setEvents] = useState<ActivityEvent[]>(initial.events);
  const [throughput] = useState<ThroughputPoint[]>(INITIAL_THROUGHPUT);

  const [selectedDocId, setSelectedDocId] = useState<string>(
    initial.docs[3]?.id ?? initial.docs[0]?.id ?? ''
  );
  const [selectedSampleId, setSelectedSampleId] = useState<string>(
    initial.samples[0]?.id ?? ''
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);
  const [createDocPresetAssetIds, setCreateDocPresetAssetIds] = useState<string[]>([]);
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        pipelines,
        assets,
        docs,
        samples,
        models,
        events: events.slice(0, 24),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [pipelines, assets, docs, samples, models, events]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const appendEvent = useCallback(
    (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
      const entry: ActivityEvent = {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowTimeStr(),
      };
      setEvents((prev) => [entry, ...prev].slice(0, 24));
    },
    []
  );

  const openCreateDocModal = useCallback((presetAssetIds: string[] = []) => {
    setCreateDocPresetAssetIds(presetAssetIds);
    setCreateDocModalOpen(true);
  }, []);

  const inspectAssetInHub = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
    setActiveTab('assets');
  }, []);

  const inspectSampleInAudit = useCallback((sampleId: string) => {
    setSelectedSampleId(sampleId);
    setActiveTab('gen-audit');
  }, []);

  const inspectDocInRag = useCallback((docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('rag-match');
  }, []);

  const closeCreateDocModal = useCallback(() => {
    setCreateDocModalOpen(false);
  }, []);

  const updatePipelineConfig = useCallback(
    (id: PipelineId, patch: Partial<PipelineEndpointConfig>) => {
      setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    []
  );

  const setPipelineStatus = useCallback(
    (id: PipelineId, status: SignalStatus) => {
      setPipelines((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                latencyMs:
                  status === 'disconnected'
                    ? null
                    : status === 'degraded'
                      ? Math.max(p.latencyMs ?? 120, 118)
                      : Math.min(p.latencyMs ?? 28, 48),
                lastCheckedAt: nowTimeStr(),
              }
            : p
        )
      );
      const targetName =
        pipelines.find((p) => p.id === id)?.name ?? id;
      const statusLabel =
        status === 'connected'
          ? '已接入'
          : status === 'degraded'
            ? '降级延迟'
            : status === 'syncing'
              ? '同步中'
              : '已断开';
      appendEvent({
        pipeline: id,
        title: `${targetName}信号灯切换为「${statusLabel}」`,
        detail: `由控制台状态栏触发信号灯联调切换，拓扑图流光已实时同步。`,
        tone:
          status === 'connected'
            ? 'success'
            : status === 'disconnected'
              ? 'danger'
              : 'warning',
      });
    },
    [appendEvent, pipelines]
  );

  const pingPipeline = useCallback(
    async (id: PipelineId): Promise<ProbeResult> => {
      const current = pipelines.find((p) => p.id === id);
      if (!current) {
        return { ok: false, status: 'disconnected', latencyMs: null, message: '未找到管线' };
      }
      setPipelines((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'syncing' } : p))
      );
      const res = await probePipelineHealth(current);
      setPipelines((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: res.status,
                latencyMs: res.latencyMs,
                lastCheckedAt: nowTimeStr(),
              }
            : p
        )
      );
      return res;
    },
    [pipelines]
  );

  const pingAllPipelines = useCallback(async () => {
    setIsPingingAll(true);
    try {
      const results = await Promise.all(pipelines.map((p) => pingPipeline(p.id)));
      const okCount = results.filter((r) => r.ok).length;
      pushToast({
        title: `全量管线探测完成 (${okCount}/${pipelines.length} 响应正常)`,
        description: '各管线信号灯与实时延迟已更新。',
        tone: okCount === pipelines.length ? 'success' : 'warning',
      });
    } finally {
      setIsPingingAll(false);
    }
  }, [pingPipeline, pipelines, pushToast]);

  const uploadImageAsset = useCallback(
    (payload: UploadAssetPayload): ImageAsset => {
      const num = assets.length + 1;
      const id = `ast_${String(num).padStart(3, '0')}`;
      const pseudoHash = Array.from({ length: 64 }, (_, i) =>
        ((payload.nameZh.charCodeAt(i % payload.nameZh.length) + i * 17 + num * 31) % 16).toString(16)
      ).join('');
      const newAsset: ImageAsset = {
        id,
        sha256: pseudoHash,
        nameZh: payload.nameZh,
        nameEn: payload.nameEn || payload.nameZh,
        category: payload.category,
        usage: payload.usage,
        tags: payload.tags,
        width: payload.width,
        height: payload.height,
        format: payload.format,
        previewUrl: payload.previewUrl,
        sourceTier: 'console_upload',
        reviewStatus: 'pending_review',
        boundDocIds: [],
        genReferenceCount: 0,
        createdAt: nowDateTimeStr(),
      };
      setAssets((prev) => [newAsset, ...prev]);
      appendEvent({
        pipeline: 'asset',
        title: `新图片资产入库：${newAsset.nameZh}`,
        detail: `ID ${newAsset.id} · 用途 ${newAsset.usage} · 已写入统一图片资产台账。`,
        tone: 'success',
      });
      pushToast({
        title: `已入库图片资产「${newAsset.nameZh}」`,
        description: '可直接用于生图或点击「以此图新建 Doc」建档。',
        tone: 'success',
      });
      return newAsset;
    },
    [appendEvent, assets.length, pushToast]
  );

  const updateAssetUsage = useCallback(
    (assetId: string, usage: AssetUsage) => {
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, usage } : a))
      );
      pushToast({
        title: '资产管线用途已更新',
        description: `资产 ${assetId} 已标记为 ${usage === 'both' ? '生图 + RAG 双管线共享' : usage === 'imggen' ? '仅生图管线' : '仅 RAG 管线'}`,
        tone: 'info',
      });
    },
    [pushToast]
  );

  const bindAssetToDoc = useCallback(
    async (docId: string, assetId: string, makePrimary = false) => {
      const targetDoc = docs.find((d) => d.id === docId);
      if (!targetDoc) return;
      const nextBound = targetDoc.boundAssetIds.includes(assetId)
        ? targetDoc.boundAssetIds
        : [...targetDoc.boundAssetIds, assetId];
      const nextPrimary = makePrimary || !targetDoc.primaryAssetId ? assetId : targetDoc.primaryAssetId;

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                boundAssetIds: nextBound,
                primaryAssetId: nextPrimary,
                candidateAssetIds: d.candidateAssetIds.filter((c) => c !== assetId),
                matchStatus: 'matched',
                updatedAt: nowDateTimeStr(),
              }
            : d
        )
      );
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                boundDocIds: a.boundDocIds.includes(docId) ? a.boundDocIds : [...a.boundDocIds, docId],
                usage: a.usage === 'imggen' ? 'both' : a.usage,
              }
            : a
        )
      );

      const ragConfig = pipelines.find((p) => p.id === 'rag') ?? INITIAL_PIPELINES[1];
      const sync = await syncBindAssetToDoc(ragConfig, docId, nextBound, nextPrimary);
      const assetName = assets.find((a) => a.id === assetId)?.nameZh ?? assetId;
      appendEvent({
        pipeline: 'rag',
        title: `Doc 匹配绑定：${targetDoc.title}`,
        detail: `已绑定资产「${assetName}」(${assetId})。${sync.note}`,
        tone: 'success',
      });
      pushToast({
        title: `已为 Doc 绑定资产「${assetName}」`,
        description: sync.note,
        tone: 'success',
      });
    },
    [appendEvent, assets, docs, pipelines, pushToast]
  );

  const unbindAssetFromDoc = useCallback(
    async (docId: string, assetId: string) => {
      const targetDoc = docs.find((d) => d.id === docId);
      if (!targetDoc) return;
      const nextBound = targetDoc.boundAssetIds.filter((id) => id !== assetId);
      const nextPrimary =
        targetDoc.primaryAssetId === assetId ? nextBound[0] ?? null : targetDoc.primaryAssetId;
      const nextStatus =
        nextBound.length > 0
          ? 'matched'
          : targetDoc.candidateAssetIds.length > 0
            ? 'pending'
            : 'unmatched';

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                boundAssetIds: nextBound,
                primaryAssetId: nextPrimary,
                matchStatus: nextStatus,
                updatedAt: nowDateTimeStr(),
              }
            : d
        )
      );
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, boundDocIds: a.boundDocIds.filter((d) => d !== docId) }
            : a
        )
      );
      const ragConfig = pipelines.find((p) => p.id === 'rag') ?? INITIAL_PIPELINES[1];
      await syncBindAssetToDoc(ragConfig, docId, nextBound, nextPrimary);
      pushToast({
        title: '已解除资产与 Doc 的绑定',
        tone: 'info',
      });
    },
    [docs, pipelines, pushToast]
  );

  const setDocPrimaryAsset = useCallback(
    async (docId: string, assetId: string) => {
      const targetDoc = docs.find((d) => d.id === docId);
      if (!targetDoc) return;
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, primaryAssetId: assetId, updatedAt: nowDateTimeStr() }
            : d
        )
      );
      const ragConfig = pipelines.find((p) => p.id === 'rag') ?? INITIAL_PIPELINES[1];
      await syncBindAssetToDoc(ragConfig, docId, targetDoc.boundAssetIds, assetId);
      pushToast({
        title: '已设为主参考图',
        tone: 'success',
      });
    },
    [docs, pipelines, pushToast]
  );

  const createDocFromImages = useCallback(
    async (payload: CreateDocPayload): Promise<RagDoc> => {
      const cleanId =
        payload.id.trim() ||
        `kb_custom_${Date.now().toString(36)}`;
      const newDoc: RagDoc = {
        id: cleanId,
        title: payload.title.trim(),
        domain: payload.domain,
        priority: payload.priority,
        summary: payload.summary.trim(),
        rules: payload.rules.filter(Boolean),
        aliases: payload.aliases.filter(Boolean),
        primaryAssetId: payload.primaryAssetId ?? payload.assetIds[0] ?? null,
        boundAssetIds: payload.assetIds,
        candidateAssetIds: [],
        matchStatus: payload.assetIds.length > 0 ? 'matched' : 'unmatched',
        updatedAt: nowDateTimeStr(),
        createdFromImage: true,
      };

      setDocs((prev) => [newDoc, ...prev]);
      if (payload.assetIds.length > 0) {
        setAssets((prev) =>
          prev.map((a) =>
            payload.assetIds.includes(a.id)
              ? {
                  ...a,
                  boundDocIds: a.boundDocIds.includes(newDoc.id)
                    ? a.boundDocIds
                    : [...a.boundDocIds, newDoc.id],
                  usage: a.usage === 'imggen' ? 'both' : a.usage,
                }
              : a
          )
        );
      }

      const ragConfig = pipelines.find((p) => p.id === 'rag') ?? INITIAL_PIPELINES[1];
      const sync = await syncCreateDocFromImage(ragConfig, newDoc);

      setSelectedDocId(newDoc.id);
      appendEvent({
        pipeline: 'rag',
        title: `从图片新建 Doc：${newDoc.title}`,
        detail: `实体 ${newDoc.id} 已建档并绑定 ${newDoc.boundAssetIds.length} 张资产图。${sync.note}`,
        tone: 'success',
      });
      pushToast({
        title: `已根据图片创建新 Doc「${newDoc.title}」`,
        description: `${newDoc.id} · ${sync.note}`,
        tone: 'success',
      });
      return newDoc;
    },
    [appendEvent, pipelines, pushToast]
  );

  const submitAuditVerdict = useCallback(
    async (
      sampleId: string,
      status: AuditStatus,
      defectTags: string[],
      auditorNote: string
    ) => {
      setSamples((prev) =>
        prev.map((s) =>
          s.id === sampleId ? { ...s, status, defectTags, auditorNote } : s
        )
      );
      const genConfig = pipelines.find((p) => p.id === 'imggen') ?? INITIAL_PIPELINES[2];
      const sync = await syncSubmitAuditVerdict(
        genConfig,
        sampleId,
        status,
        defectTags,
        auditorNote
      );

      const labelMap: Record<AuditStatus, string> = {
        approved: '审计通过',
        rejected: '审计驳回',
        flagged: '标记复核',
        pending: '重置待审',
      };
      appendEvent({
        pipeline: 'imggen',
        title: `${sampleId} ${labelMap[status]}`,
        detail: defectTags.length
          ? `缺陷标签：${defectTags.join('、')}。${sync.note}`
          : sync.note,
        tone:
          status === 'approved'
            ? 'success'
            : status === 'rejected'
              ? 'danger'
              : 'warning',
      });
      pushToast({
        title: `${sampleId} 已标记为「${labelMap[status]}」`,
        description: sync.note,
        tone:
          status === 'approved'
            ? 'success'
            : status === 'rejected'
              ? 'danger'
              : 'info',
      });
    },
    [appendEvent, pipelines, pushToast]
  );

  const pingModel = useCallback(
    async (modelId: string) => {
      const target = models.find((m) => m.id === modelId);
      if (!target) return;
      const clusterConfig = pipelines.find((p) => p.id === 'model') ?? INITIAL_PIPELINES[3];
      const res = await probeModelRuntime(target, clusterConfig);
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelId
            ? {
                ...m,
                latencyMs: res.ok ? res.latencyMs : m.latencyMs,
                latencyHistory: res.ok
                  ? [...m.latencyHistory.slice(1), res.latencyMs]
                  : m.latencyHistory,
                lastHeartbeat: res.ok ? '刚刚' : '超时',
              }
            : m
        )
      );
      pushToast({
        title: res.ok ? '模型心跳探活成功' : '模型探活失败',
        description: res.message,
        tone: res.ok ? 'success' : 'danger',
      });
    },
    [models, pipelines, pushToast]
  );

  const setModelStatus = useCallback(
    (modelId: string, status: ModelRuntimeStatus) => {
      setModels((prev) => {
        const updated = prev.map((m) =>
          m.id === modelId
            ? {
                ...m,
                status,
                qps: status === 'offline' ? 0 : m.qps || 8.5,
                lastHeartbeat: status === 'offline' ? '已离线' : '刚刚',
              }
            : m
        );
        const hasOfflineOrDegraded = updated.some(
          (m) => m.status === 'offline' || m.status === 'degraded'
        );
        const allOffline = updated.every((m) => m.status === 'offline');
        setPipelines((pList) =>
          pList.map((p) =>
            p.id === 'model'
              ? {
                  ...p,
                  status: allOffline
                    ? 'disconnected'
                    : hasOfflineOrDegraded
                      ? 'degraded'
                      : 'connected',
                  lastCheckedAt: nowTimeStr(),
                }
              : p
          )
        );
        return updated;
      });
      const target = models.find((m) => m.id === modelId);
      appendEvent({
        pipeline: 'model',
        title: `模型 ${target?.name ?? modelId} 状态变更为 ${status}`,
        detail: '模型集群运行信号灯已随节点健康度同步刷新。',
        tone: status === 'running' ? 'success' : status === 'offline' ? 'danger' : 'warning',
      });
    },
    [appendEvent, models]
  );

  const resetWorkspaceData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setPipelines(INITIAL_PIPELINES);
    setAssets(INITIAL_ASSETS);
    setDocs(INITIAL_DOCS);
    setSamples(INITIAL_AUDIT_SAMPLES);
    setModels(INITIAL_MODELS);
    setEvents(INITIAL_EVENTS);
    setSelectedDocId(INITIAL_DOCS[3].id);
    setSelectedSampleId(INITIAL_AUDIT_SAMPLES[0].id);
    pushToast({
      title: '已重置为初始演示数据',
      description: '本地缓存的修改已清空。',
      tone: 'info',
    });
  }, [pushToast]);

  const value: LagrangeContextValue = {
    activeTab,
    setActiveTab,
    pipelines,
    assets,
    docs,
    samples,
    models,
    events,
    throughput,
    toasts,
    dismissToast,
    pushToast,
    selectedDocId,
    setSelectedDocId,
    selectedSampleId,
    setSelectedSampleId,
    selectedAssetId,
    setSelectedAssetId,
    inspectAssetInHub,
    inspectSampleInAudit,
    inspectDocInRag,
    createDocModalOpen,
    createDocPresetAssetIds,
    openCreateDocModal,
    closeCreateDocModal,
    updatePipelineConfig,
    setPipelineStatus,
    pingPipeline,
    pingAllPipelines,
    isPingingAll,
    uploadImageAsset,
    updateAssetUsage,
    bindAssetToDoc,
    unbindAssetFromDoc,
    setDocPrimaryAsset,
    createDocFromImages,
    submitAuditVerdict,
    pingModel,
    setModelStatus,
    resetWorkspaceData,
  };

  return <LagrangeContext.Provider value={value}>{children}</LagrangeContext.Provider>;
};

export function useLagrange(): LagrangeContextValue {
  const ctx = useContext(LagrangeContext);
  if (!ctx) {
    throw new Error('useLagrange must be used within LagrangeProvider');
  }
  return ctx;
}
