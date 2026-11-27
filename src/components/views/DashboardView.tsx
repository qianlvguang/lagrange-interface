import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FilePlus2,
  FileSearch,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';
import { PipelineTopology } from './PipelineTopology';

export const DashboardView: React.FC = () => {
  const {
    assets,
    docs,
    samples,
    models,
    events,
    throughput,
    setActiveTab,
    openCreateDocModal,
    pingModel,
  } = useLagrange();

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const bothAssets = assets.filter((a) => a.usage === 'both').length;
  const genOnlyAssets = assets.filter((a) => a.usage === 'imggen').length;
  const ragOnlyAssets = assets.filter((a) => a.usage === 'rag').length;

  const matchedDocs = docs.filter((d) => d.matchStatus === 'matched').length;
  const pendingDocs = docs.filter((d) => d.matchStatus !== 'matched').length;
  const docCoverage = docs.length ? Math.round((matchedDocs / docs.length) * 100) : 0;

  const approvedSamples = samples.filter((s) => s.status === 'approved').length;
  const pendingSamples = samples.filter((s) => s.status === 'pending').length;
  const passRate = samples.length
    ? Math.round((approvedSamples / Math.max(1, samples.length - pendingSamples)) * 100)
    : 0;

  const runningModels = models.filter((m) => m.status === 'running').length;
  const totalVramUsed = models.reduce((acc, m) => acc + m.vramUsedGb, 0);
  const totalVramCap = models.reduce((acc, m) => acc + m.vramTotalGb, 0);

  // Build smooth SVG polyline for throughput chart
  const maxVal = Math.max(...throughput.map((t) => t.genCount), 700);
  const chartW = 540;
  const chartH = 165;
  const padX = 28;
  const padY = 18;

  const toPoints = (key: 'genCount' | 'auditCount' | 'matchCount') =>
    throughput.map((pt, idx) => {
      const x =
        padX + (idx / Math.max(1, throughput.length - 1)) * (chartW - padX * 2);
      const y =
        chartH - padY - (pt[key] / maxVal) * (chartH - padY * 2);
      return { x, y, pt };
    });

  const genPts = toPoints('genCount');
  const auditPts = toPoints('auditCount');
  const matchPts = toPoints('matchCount');

  const pathFrom = (pts: { x: number; y: number }[]) =>
    pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

  const areaFrom = (pts: { x: number; y: number }[]) =>
    `${pathFrom(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${chartH - padY} L ${pts[0].x.toFixed(1)} ${chartH - padY} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex flex-col gap-5"
    >
      {/* Hero Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[11px] font-medium text-[#5F5C55] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97757]" />
            <span>Lagrange 多模态管线集成工作台</span>
          </div>
          <h1 className="font-serif text-3xl md:text-[34px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            管线协同运行大盘
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            统一调度图片资产库、RAG 图文实体匹配、生图产出审计与后端模型服务状态
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('rag-match')}
            className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-[#1C1B18] hover:bg-white/95 flex items-center gap-1.5 transition-all"
          >
            <FileSearch className="w-3.5 h-3.5 text-[#2F855A]" />
            处理待配图 Doc ({pendingDocs})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gen-audit')}
            className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-[#1C1B18] hover:bg-white/95 flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97757]" />
            进入生图审计 ({pendingSamples} 待审)
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard interactive sheen onClick={() => setActiveTab('assets')}>
          <div className="flex items-center justify-between text-xs text-[#5F5C55]">
            <span>图片资产统一池</span>
            <span className="p-1.5 rounded-xl bg-[#D97757]/12 text-[#D97757]">
              <ImageIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={assets.length}
              className="font-serif text-3xl font-semibold text-[#1C1B18]"
            />
            <span className="text-xs text-[#8C887F]">张高保真图元</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-[#1C1B18]/6 text-[#5F5C55]">
              双用 {bothAssets}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#D97757]/12 text-[#B85B3B]">
              生图 {genOnlyAssets}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2F855A]/12 text-[#246A47]">
              RAG {ragOnlyAssets}
            </span>
          </div>
        </GlassCard>

        <GlassCard interactive sheen onClick={() => setActiveTab('rag-match')}>
          <div className="flex items-center justify-between text-xs text-[#5F5C55]">
            <span>RAG Doc 配图覆盖率</span>
            <span className="p-1.5 rounded-xl bg-[#2F855A]/12 text-[#2F855A]">
              <FileSearch className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={docCoverage}
              suffix="%"
              className="font-serif text-3xl font-semibold text-[#1C1B18]"
            />
            <span className="text-xs text-[#8C887F]">
              ({matchedDocs}/{docs.length} Docs)
            </span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-[#1C1B18]/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2F855A] transition-all duration-500"
                style={{ width: `${docCoverage}%` }}
              />
            </div>
            <div className="text-[11px] text-[#5F5C55] mt-1.5">
              {pendingDocs > 0 ? `仍有 ${pendingDocs} 个 Doc 待确认或绑定图片` : '全部 Doc 已完成标准图绑定'}
            </div>
          </div>
        </GlassCard>

        <GlassCard interactive sheen onClick={() => setActiveTab('gen-audit')}>
          <div className="flex items-center justify-between text-xs text-[#5F5C55]">
            <span>生图产出审计通过率</span>
            <span className="p-1.5 rounded-xl bg-[#C07A28]/12 text-[#C07A28]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={passRate}
              suffix="%"
              className="font-serif text-3xl font-semibold text-[#1C1B18]"
            />
            <span className="text-xs text-[#8C887F]">
              待审 {pendingSamples} 条
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#5F5C55]">
            <span>累计入库 {samples.length} 条渲染样本</span>
            <span className="inline-flex items-center gap-0.5 text-[#D97757] font-medium">
              去审计 <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </GlassCard>

        <GlassCard interactive sheen onClick={() => setActiveTab('models')}>
          <div className="flex items-center justify-between text-xs text-[#5F5C55]">
            <span>模型服务实时健康度</span>
            <span className="p-1.5 rounded-xl bg-[#1C1B18]/8 text-[#1C1B18]">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={runningModels}
              className="font-serif text-3xl font-semibold text-[#1C1B18]"
            />
            <span className="text-xs text-[#8C887F]">/ {models.length} 在线运行</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-[#5F5C55] mb-1">
              <span>集群显存占用</span>
              <span className="font-mono">
                {totalVramUsed.toFixed(0)} / {totalVramCap} GB
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1C1B18]/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#D97757] transition-all duration-500"
                style={{ width: `${Math.round((totalVramUsed / totalVramCap) * 100)}%` }}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Topology Canvas */}
      <PipelineTopology />

      {/* Bottom Split: Throughput & Events | Live Models & Quick Create */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 7 cols: Chart + Event Stream */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <GlassCard padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1C1B18]">
                  今日管线吞吐趋势
                </h3>
                <p className="text-xs text-[#5F5C55]">
                  生图渲染、人工审计与 RAG 图文匹配每两小时处理量
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#5F5C55]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-[#D97757]" /> 生图产出
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-[#2F855A]" /> 审计完成
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-[#7A6B5D]" /> RAG 匹配
                </span>
              </div>
            </div>

            <div className="relative">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="genAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97757" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#D97757" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartH - padY - ratio * (chartH - padY * 2);
                  return (
                    <line
                      key={ratio}
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      stroke="#1C1B18"
                      strokeOpacity="0.07"
                      strokeDasharray="4 4"
                    />
                  );
                })}
                <path d={areaFrom(genPts)} fill="url(#genAreaGrad)" />
                <path
                  d={pathFrom(genPts)}
                  fill="none"
                  stroke="#D97757"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={pathFrom(auditPts)}
                  fill="none"
                  stroke="#2F855A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={pathFrom(matchPts)}
                  fill="none"
                  stroke="#7A6B5D"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />

                {genPts.map((g, idx) => (
                  <g key={g.pt.hour}>
                    <text
                      x={g.x}
                      y={chartH - 2}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      fill="#8C887F"
                    >
                      {g.pt.hour}
                    </text>
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r={hoveredIdx === idx ? 5.5 : 3.5}
                      fill="#FFFDF8"
                      stroke="#D97757"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                    <rect
                      x={g.x - 24}
                      y={0}
                      width={48}
                      height={chartH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                ))}
              </svg>

              {hoveredIdx !== null && throughput[hoveredIdx] && (
                <div className="absolute top-2 right-2 glass-panel rounded-xl px-3 py-2 text-[11px] pointer-events-none">
                  <div className="font-mono font-semibold text-[#1C1B18]">
                    {throughput[hoveredIdx].hour}
                  </div>
                  <div className="text-[#D97757]">
                    生图：{throughput[hoveredIdx].genCount}
                  </div>
                  <div className="text-[#2F855A]">
                    审计：{throughput[hoveredIdx].auditCount}
                  </div>
                  <div className="text-[#5F5C55]">
                    匹配：{throughput[hoveredIdx].matchCount}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D97757]" />
                <h3 className="font-serif text-lg font-semibold text-[#1C1B18]">
                  实时管线动态流
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8C887F]">
                最近 {Math.min(5, events.length)} 条
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {events.slice(0, 5).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-white/55 border border-white/80 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          ev.tone === 'success'
                            ? 'bg-[#2F855A]'
                            : ev.tone === 'warning'
                              ? 'bg-[#C07A28]'
                              : ev.tone === 'danger'
                                ? 'bg-[#C54B38]'
                                : 'bg-[#D97757]'
                        }`}
                      />
                      <span className="text-xs font-semibold text-[#1C1B18] truncate">
                        {ev.title}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#5F5C55] mt-1 leading-relaxed">
                      {ev.detail}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#8C887F] shrink-0">
                    {ev.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right 5 cols: Model Runtime Quick Panel + Action Shortcuts */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1C1B18]">
                  模型运行状态速览
                </h3>
                <p className="text-xs text-[#5F5C55]">
                  一键心跳探活，异常节点将同步点亮大盘警告灯
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('models')}
                className="text-xs font-medium text-[#D97757] hover:underline"
              >
                全部监控
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {models.map((m) => {
                const signal =
                  m.status === 'running'
                    ? 'connected'
                    : m.status === 'offline'
                      ? 'disconnected'
                      : 'degraded';
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-white/58 border border-white/85 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SignalLight status={signal} size="sm" />
                        <span className="text-xs font-semibold text-[#1C1B18] truncate">
                          {m.name}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8C887F] mt-1">
                        {m.gpuNode} · {m.vramUsedGb}/{m.vramTotalGb}GB · {m.latencyMs}ms
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => pingModel(m.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[11px] font-medium text-[#5F5C55] hover:text-[#1C1B18] border border-[#1C1B18]/8 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Ping
                    </button>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard padding="lg" className="bg-gradient-to-br from-[#FFFDF8]/75 to-[#F5E8DF]/65">
            <h3 className="font-serif text-lg font-semibold text-[#1C1B18]">
              高频联动操作
            </h3>
            <p className="text-xs text-[#5F5C55] mt-1 leading-relaxed">
              当资产库新增标准参考图时，可直接建档为 RAG Doc，或推送给生图管线作为合成参考锚点。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openCreateDocModal(['ast_010'])}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D97757] hover:bg-[#C66343] text-white text-xs font-medium shadow-[0_6px_16px_rgba(217,119,87,0.26)] flex items-center justify-center gap-2 transition-all"
              >
                <FilePlus2 className="w-4 h-4" />
                从图片快速创建新 RAG Doc
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('api-config')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/75 hover:bg-white text-[#1C1B18] text-xs font-medium border border-[#1C1B18]/10 transition-all"
              >
                查看三条管线全量接口对接方案
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};
