import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  PlugZap,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import { API_ENDPOINT_SPECS } from '../../services/apiContracts';
import type { PipelineId, SignalStatus } from '../../types/lagrange';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';

export const ApiConfigView: React.FC = () => {
  const {
    pipelines,
    updatePipelineConfig,
    setPipelineStatus,
    pingPipeline,
    pushToast,
    resetWorkspaceData,
  } = useLagrange();

  const [activePipelineTab, setActivePipelineTab] = useState<'all' | PipelineId>('all');
  const [expandedApiId, setExpandedApiId] = useState<string | null>(
    API_ENDPOINT_SPECS[0]?.id ?? null
  );
  const [probeLogs, setProbeLogs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleProbe = async (id: PipelineId) => {
    const res = await pingPipeline(id);
    setProbeLogs((prev) => ({ ...prev, [id]: res.message }));
    pushToast({
      title: res.ok ? '接口探活成功' : '接口探测未通过',
      description: res.message,
      tone: res.ok ? 'success' : 'warning',
    });
  };

  const handleExportConfig = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      pipelines,
      endpoints: API_ENDPOINT_SPECS,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lagrange-api-config.json';
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      title: '已导出 lagrange-api-config.json',
      description: '包含 4 条管线连接配置与全部接口契约方案。',
      tone: 'success',
    });
  };

  const copyJson = (id: string, obj: unknown) => {
    navigator.clipboard?.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const visibleSpecs =
    activePipelineTab === 'all'
      ? API_ENDPOINT_SPECS
      : API_ENDPOINT_SPECS.filter((s) => s.pipeline === activePipelineTab);

  const methodBadge = (m: string) => {
    const map: Record<string, string> = {
      GET: 'bg-[#2F855A]/14 text-[#246A47]',
      POST: 'bg-[#D97757]/16 text-[#B85B3B]',
      PATCH: 'bg-[#C07A28]/16 text-[#9C611B]',
      PUT: 'bg-[#2B5B84]/14 text-[#2B5B84]',
      DELETE: 'bg-[#C54B38]/14 text-[#B33D2B]',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold ${
          map[m] ?? 'bg-[#1C1B18]/10 text-[#1C1B18]'
        }`}
      >
        {m}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full glass-pill text-[11px] font-medium text-[#5F5C55] mb-1.5">
            <PlugZap className="w-3.5 h-3.5 text-[#D97757]" />
            <span>前端接口适配方案与端点配置中心</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
            管线接入与接口方案配置
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            无需等待三条后端管线实装即可完成契约绑定；支持 Mock / Live 实时切换、信号灯联调与配置导出
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetWorkspaceData}
            className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-[#5F5C55] hover:text-[#1C1B18] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复默认演示数据
          </button>
          <button
            type="button"
            onClick={handleExportConfig}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1C1B18] hover:bg-[#32302B] text-white flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            导出接口配置 JSON
          </button>
        </div>
      </div>

      {/* Pipeline Endpoint Config Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pipelines.map((p) => (
          <GlassCard key={p.id} padding="lg" className="flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SignalLight status={p.status} size="md" />
                  <h2 className="text-base font-semibold text-[#1C1B18]">{p.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C1B18]/6 text-[#5F5C55]">
                    {p.version}
                  </span>
                </div>
                <p className="text-xs text-[#5F5C55] mt-1">{p.description}</p>
              </div>
              <div className="flex items-center rounded-xl bg-white/65 p-0.5 border border-white shrink-0">
                {(['mock', 'live'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updatePipelineConfig(p.id, { mode: m })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium uppercase transition-colors ${
                      p.mode === m
                        ? 'bg-[#D97757] text-white'
                        : 'text-[#5F5C55] hover:text-[#1C1B18]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#8C887F] mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={p.baseUrl}
                  onChange={(e) => updatePipelineConfig(p.id, { baseUrl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl glass-inset text-xs font-mono text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8C887F] mb-1">
                  健康探测路径
                </label>
                <input
                  type="text"
                  value={p.healthPath}
                  onChange={(e) => updatePipelineConfig(p.id, { healthPath: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl glass-inset text-xs font-mono text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#8C887F] mb-1">
                  鉴权头
                </label>
                <input
                  type="text"
                  value={p.apiKeyHeader}
                  onChange={(e) =>
                    updatePipelineConfig(p.id, { apiKeyHeader: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl glass-inset text-xs font-mono text-[#1C1B18]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8C887F] mb-1">
                  超时 (ms)
                </label>
                <input
                  type="number"
                  value={p.timeoutMs}
                  onChange={(e) =>
                    updatePipelineConfig(p.id, {
                      timeoutMs: Number(e.target.value) || 3000,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl glass-inset text-xs font-mono text-[#1C1B18]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8C887F] mb-1">
                  轮询间隔 (s)
                </label>
                <input
                  type="number"
                  value={p.pollIntervalSec}
                  onChange={(e) =>
                    updatePipelineConfig(p.id, {
                      pollIntervalSec: Number(e.target.value) || 15,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl glass-inset text-xs font-mono text-[#1C1B18]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C1B18]/8">
              {p.mode === 'mock' ? (
                <div className="flex items-center gap-1">
                  {(['connected', 'degraded', 'disconnected'] as SignalStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPipelineStatus(p.id, st)}
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-medium transition-colors ${
                          p.status === st
                            ? 'bg-[#1C1B18] text-white'
                            : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                        }`}
                      >
                        {st === 'connected' ? '接通' : st === 'degraded' ? '降级' : '断开'}
                      </button>
                    )
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-[#8C887F]">
                  Live 模式下状态由真实探活驱动
                </span>
              )}
              <button
                type="button"
                onClick={() => handleProbe(p.id)}
                className="px-3 py-1.5 rounded-xl bg-white/85 hover:bg-white text-xs font-medium text-[#1C1B18] border border-[#1C1B18]/10 flex items-center gap-1.5 ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                测试连通性
              </button>
            </div>

            {probeLogs[p.id] && (
              <div className="px-3 py-2 rounded-xl bg-[#1C1B18]/5 text-[11px] font-mono text-[#5F5C55]">
                {probeLogs[p.id]}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Full Endpoint Contract Matrix */}
      <GlassCard padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1C1B18]">
              全量接口配置方案矩阵 ({visibleSpecs.length} Endpoints)
            </h2>
            <p className="text-xs text-[#5F5C55] mt-0.5">
              展开任意接口可查看参数契约、响应 Schema、前端字段映射与离线降级策略
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: '全部管线' },
              { id: 'asset', label: '图片资产' },
              { id: 'rag', label: 'RAG 管线' },
              { id: 'imggen', label: '生图管线' },
              { id: 'model', label: '模型集群' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePipelineTab(tab.id as typeof activePipelineTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activePipelineTab === tab.id
                    ? 'bg-[#1C1B18] text-white'
                    : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {visibleSpecs.map((spec) => {
            const expanded = expandedApiId === spec.id;
            return (
              <div
                key={spec.id}
                className="rounded-2xl bg-white/62 border border-white/85 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedApiId(expanded ? null : spec.id)}
                  className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-white/60 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-[#8C887F]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8C887F]" />
                    )}
                    {methodBadge(spec.method)}
                    <code className="text-xs font-mono font-semibold text-[#1C1B18]">
                      {spec.path}
                    </code>
                    <span className="text-xs font-medium text-[#5F5C55]">
                      {spec.name}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono uppercase text-[#8C887F]">
                    {spec.pipeline}
                  </span>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#1C1B18]/7 space-y-3 text-xs">
                    <p className="text-[#5F5C55] leading-relaxed">{spec.summary}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {spec.queryOrParams && (
                        <div className="p-3 rounded-xl glass-inset">
                          <div className="font-semibold text-[#1C1B18] mb-1.5">
                            Query / Path 参数
                          </div>
                          <pre className="font-mono text-[11px] text-[#5F5C55] overflow-x-auto">
                            {JSON.stringify(spec.queryOrParams, null, 2)}
                          </pre>
                        </div>
                      )}
                      {spec.requestBody && (
                        <div className="p-3 rounded-xl glass-inset">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-[#1C1B18]">
                              Request Body 示例
                            </span>
                            <button
                              type="button"
                              onClick={() => copyJson(`${spec.id}_req`, spec.requestBody)}
                              className="text-[10.5px] text-[#D97757] flex items-center gap-1"
                            >
                              {copiedId === `${spec.id}_req` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              复制
                            </button>
                          </div>
                          <pre className="font-mono text-[11px] text-[#5F5C55] overflow-x-auto">
                            {JSON.stringify(spec.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="p-3 rounded-xl glass-inset">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-[#1C1B18]">
                            Response Schema 示例
                          </span>
                          <button
                            type="button"
                            onClick={() => copyJson(`${spec.id}_res`, spec.responseSample)}
                            className="text-[10.5px] text-[#D97757] flex items-center gap-1"
                          >
                            {copiedId === `${spec.id}_res` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            复制
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] text-[#5F5C55] overflow-x-auto">
                          {JSON.stringify(spec.responseSample, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <div className="flex flex-wrap gap-1.5">
                        {spec.fieldMapping.map((fm) => (
                          <span
                            key={fm}
                            className="px-2 py-0.5 rounded-md bg-white text-[#5F5C55] font-mono border border-[#1C1B18]/8"
                          >
                            {fm}
                          </span>
                        ))}
                      </div>
                      <span className="text-[#8C887F]">
                        降级策略：{spec.fallbackPolicy}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};
