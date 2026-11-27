import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, RefreshCw, Server } from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { ModelRuntimeStatus } from '../../types/lagrange';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';

const ROLE_LABEL: Record<string, string> = {
  vlm_audit: 'VLM 视觉审计',
  embedding: '多模态向量化',
  reranker: '检索重排',
  image_gen: '程序化/扩散生图',
};

export const ModelMonitorView: React.FC = () => {
  const { models, pipelines, pingModel, setModelStatus } = useLagrange();

  const modelPipeline = pipelines.find((p) => p.id === 'model')!;
  const runningCount = models.filter((m) => m.status === 'running').length;
  const avgLatency = Math.round(
    models.reduce((acc, m) => acc + m.latencyMs, 0) / Math.max(1, models.length)
  );
  const totalQps = models.reduce((acc, m) => acc + (m.status === 'offline' ? 0 : m.qps), 0);

  const renderSparkline = (values: number[], stroke: string) => {
    const w = 180;
    const h = 44;
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const span = Math.max(10, max - min);
    const pts = values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * w;
        const y = h - 6 - ((v - min) / span) * (h - 12);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11 overflow-visible">
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <SignalLight
              status={modelPipeline.status}
              size="sm"
              showText
              label={`模型集群 · ${modelPipeline.status === 'connected' ? '全节点健康' : modelPipeline.status === 'degraded' ? '存在降级节点' : '离线'}`}
            />
            <span className="text-xs font-mono text-[#8C887F]">
              {modelPipeline.version}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
            模型运行状态监控
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            实时查看 VLM、Embedding、Reranker 与生图渲染模型的运行存活、显存占用及 P95 推理延迟
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="text-xs text-[#5F5C55] flex items-center justify-between">
            <span>在线运行模型</span>
            <Cpu className="w-4 h-4 text-[#2F855A]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-semibold text-[#1C1B18]">
            <AnimatedNumber value={runningCount} /> / {models.length}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-[#5F5C55] flex items-center justify-between">
            <span>集群聚合吞吐</span>
            <Activity className="w-4 h-4 text-[#D97757]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-semibold text-[#1C1B18]">
            <AnimatedNumber value={totalQps} decimals={1} suffix=" QPS" />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs text-[#5F5C55] flex items-center justify-between">
            <span>平均响应延迟</span>
            <Server className="w-4 h-4 text-[#C07A28]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-semibold text-[#1C1B18]">
            <AnimatedNumber value={avgLatency} suffix=" ms" />
          </div>
        </GlassCard>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {models.map((m) => {
          const signal =
            m.status === 'running'
              ? 'connected'
              : m.status === 'offline'
                ? 'disconnected'
                : 'degraded';
          const vramPct = Math.round((m.vramUsedGb / m.vramTotalGb) * 100);
          const stroke =
            m.status === 'running'
              ? '#2F855A'
              : m.status === 'offline'
                ? '#9E9A90'
                : '#C07A28';

          return (
            <GlassCard key={m.id} padding="lg" className="flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SignalLight status={signal} size="md" />
                    <h3 className="text-sm font-semibold text-[#1C1B18] truncate">
                      {m.name}
                    </h3>
                  </div>
                  <div className="text-[11px] text-[#5F5C55] mt-1">
                    {ROLE_LABEL[m.role] ?? m.role} · {m.family}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => pingModel(m.id)}
                  className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-[11px] font-medium text-[#1C1B18] border border-[#1C1B18]/10 flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ping
                </button>
              </div>

              <div className="p-2.5 rounded-xl glass-inset text-[11px] font-mono text-[#5F5C55] space-y-1">
                <div className="truncate">{m.endpoint}</div>
                <div className="flex justify-between text-[#8C887F]">
                  <span>{m.gpuNode}</span>
                  <span>心跳 {m.lastHeartbeat}</span>
                </div>
              </div>

              {/* VRAM Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#5F5C55]">显存占用</span>
                  <span className="font-mono text-[#1C1B18]">
                    {m.vramUsedGb} / {m.vramTotalGb} GB ({vramPct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1C1B18]/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      vramPct > 88 ? 'bg-[#C54B38]' : 'bg-[#D97757]'
                    }`}
                    style={{ width: `${vramPct}%` }}
                  />
                </div>
              </div>

              {/* Latency Sparkline */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#5F5C55]">近 10 次延迟趋势</span>
                  <span className="font-mono font-semibold text-[#1C1B18]">
                    {m.latencyMs}ms · {m.status === 'offline' ? '0' : m.qps} QPS
                  </span>
                </div>
                {renderSparkline(m.latencyHistory, stroke)}
              </div>

              {/* Simulation Status Controls (only shown in mock mode) */}
              {modelPipeline.mode === 'mock' ? (
                <div className="pt-2 border-t border-[#1C1B18]/8 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8C887F]">Mock 运行态模拟</span>
                  <div className="flex items-center gap-1">
                    {(['running', 'degraded', 'offline'] as ModelRuntimeStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setModelStatus(m.id, st)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                            m.status === st
                              ? 'bg-[#1C1B18] text-white'
                              : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                          }`}
                        >
                          {st === 'running' ? '运行' : st === 'degraded' ? '降级' : '停止'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#1C1B18]/8 text-[11px] text-[#8C887F]">
                  LIVE 模式 · 由远端集群心跳实时同步
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
};
