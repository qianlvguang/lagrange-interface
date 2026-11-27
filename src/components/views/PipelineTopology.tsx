import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, FileSearch, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { NavTab, PipelineId, SignalStatus } from '../../types/lagrange';
import { SignalLight } from '../common/SignalLight';

function flowColor(status: SignalStatus): string {
  switch (status) {
    case 'connected':
      return '#2F855A';
    case 'degraded':
    case 'syncing':
      return '#C07A28';
    case 'disconnected':
      return '#B7B2A8';
  }
}

interface FlowLineProps {
  d: string;
  status: SignalStatus;
  durationSec?: number;
  reverse?: boolean;
}

const FlowLine: React.FC<FlowLineProps> = ({
  d,
  status,
  durationSec = 2.8,
  reverse = false,
}) => {
  const stroke = flowColor(status);
  const active = status !== 'disconnected';
  const speed = status === 'degraded' ? durationSec * 1.85 : durationSec;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeOpacity={active ? 0.25 : 0.32}
        strokeWidth={active ? 2.5 : 1.75}
        strokeDasharray={active ? undefined : '6 6'}
      />
      {active && (
        <>
          <path
            d={d}
            fill="none"
            stroke={stroke}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeDasharray="10 14"
          >
            <animate
              attributeName="stroke-dashoffset"
              from={reverse ? '0' : '48'}
              to={reverse ? '48' : '0'}
              dur={`${speed}s`}
              repeatCount="indefinite"
            />
          </path>
          <circle r="4.5" fill={stroke} filter="url(#particle-glow)">
            <animateMotion
              dur={`${speed}s`}
              repeatCount="indefinite"
              path={d}
              keyPoints={reverse ? '1;0' : '0;1'}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </>
      )}
    </g>
  );
};

export const PipelineTopology: React.FC = () => {
  const { pipelines, assets, docs, samples, models, setActiveTab } = useLagrange();

  const byId = (id: PipelineId) => pipelines.find((p) => p.id === id)!;
  const assetPipe = byId('asset');
  const ragPipe = byId('rag');
  const genPipe = byId('imggen');
  const modelPipe = byId('model');

  const ragMatched = docs.filter((d) => d.matchStatus === 'matched').length;
  const genApproved = samples.filter((s) => s.status === 'approved').length;
  const runningModels = models.filter((m) => m.status === 'running').length;

  const combineStatus = (a: SignalStatus, b: SignalStatus): SignalStatus => {
    if (a === 'disconnected' || b === 'disconnected') return 'disconnected';
    if (a === 'degraded' || b === 'degraded' || a === 'syncing' || b === 'syncing') {
      return 'degraded';
    }
    return 'connected';
  };

  const renderNode = (
    id: PipelineId,
    targetTab: NavTab,
    icon: React.ReactNode,
    metricText: string,
    subText: string,
    accentBg: string
  ) => {
    const p = byId(id);
    return (
      <motion.button
        type="button"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setActiveTab(targetTab)}
        className="glass-card glass-sheen rounded-2xl p-4 text-left w-full border border-white/85 hover:border-[#D97757]/45 transition-all group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentBg}`}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#1C1B18] truncate">
                {p.name}
              </div>
              <div className="text-[11px] font-mono text-[#8C887F] flex items-center gap-1.5 mt-0.5">
                <span className="uppercase">{p.mode}</span>
                <span>·</span>
                <span>{p.latencyMs !== null ? `${p.latencyMs}ms` : '离线'}</span>
              </div>
            </div>
          </div>
          <SignalLight status={p.status} size="md" />
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1C1B18]/7 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#1C1B18] truncate">
              {metricText}
            </div>
            <div className="text-[11px] text-[#5F5C55] truncate">{subText}</div>
          </div>
          <span className="w-7 h-7 rounded-full bg-white/75 group-hover:bg-[#D97757] group-hover:text-white text-[#5F5C55] flex items-center justify-center transition-colors shrink-0 ml-2">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-5 md:p-6 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg md:text-xl font-semibold text-[#1C1B18]">
              Lagrange 管线实时拓扑与资产流向
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#D97757]/12 text-[#C66343]">
              LIVE TOPOLOGY
            </span>
          </div>
          <p className="text-xs text-[#5F5C55] mt-0.5">
            生图素材与 RAG 图元统一沉淀于中心资产池；流光速率与颜色随信号灯实时联动
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#5F5C55]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2F855A]" /> 正常流转
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C07A28]" /> 延迟降级
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B7B2A8]" /> 已断开
          </span>
        </div>
      </div>

      {/* Desktop / Tablet Interactive Topology */}
      <div className="relative py-1">
        <svg
          viewBox="0 0 900 300"
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Asset Hub (Center Top) -> RAG (Left) */}
          <FlowLine
            d="M 325 66 C 255 66, 240 88, 185 118"
            status={combineStatus(assetPipe.status, ragPipe.status)}
            durationSec={2.4}
          />
          {/* RAG -> Asset Hub */}
          <FlowLine
            d="M 185 144 C 245 162, 275 128, 325 94"
            status={combineStatus(assetPipe.status, ragPipe.status)}
            durationSec={3.1}
            reverse
          />
          {/* Asset Hub (Center Top) -> ImageGen (Right) */}
          <FlowLine
            d="M 575 66 C 645 66, 660 88, 715 118"
            status={combineStatus(assetPipe.status, genPipe.status)}
            durationSec={2.3}
          />
          {/* ImageGen -> Asset Hub */}
          <FlowLine
            d="M 715 144 C 655 162, 625 128, 575 94"
            status={combineStatus(assetPipe.status, genPipe.status)}
            durationSec={3.0}
            reverse
          />
          {/* RAG -> Model Cluster (Bottom Center) */}
          <FlowLine
            d="M 185 196 C 235 244, 305 250, 340 250"
            status={combineStatus(ragPipe.status, modelPipe.status)}
            durationSec={2.9}
          />
          {/* ImageGen -> Model Cluster (Bottom Center) */}
          <FlowLine
            d="M 715 196 C 665 244, 595 250, 560 250"
            status={combineStatus(genPipe.status, modelPipe.status)}
            durationSec={2.7}
          />
          {/* Asset Hub -> Model Cluster */}
          <FlowLine
            d="M 450 132 L 450 206"
            status={combineStatus(assetPipe.status, modelPipe.status)}
            durationSec={2.2}
          />
        </svg>

        {/* Subtle Relationship Capsule Labels (md+) */}
        <div className="hidden md:block pointer-events-none">
          <span className="absolute left-[24%] top-[24%] -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FFFDF8]/90 border border-[#1C1B18]/8 text-[10px] font-medium text-[#5F5C55] shadow-xs z-20">
            图文绑定
          </span>
          <span className="absolute left-[76%] top-[24%] -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FFFDF8]/90 border border-[#1C1B18]/8 text-[10px] font-medium text-[#5F5C55] shadow-xs z-20">
            素材供给 · 产出审计
          </span>
          <span className="absolute left-1/2 top-[51%] -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-[#FFFDF8]/90 border border-[#1C1B18]/8 text-[10px] font-medium text-[#5F5C55] shadow-xs z-20">
            推理算力
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: RAG Pipeline */}
          <div className="md:col-span-4 md:mt-10">
            {renderNode(
              'rag',
              'rag-match',
              <FileSearch className="w-4.5 h-4.5 text-[#2F855A]" />,
              `${ragMatched} / ${docs.length} Docs 已配图`,
              '进入 RAG 资产匹配与建档',
              'bg-[#2F855A]/12'
            )}
          </div>

          {/* Center Column: Asset Hub (Top) + Model Cluster (Bottom) */}
          <div className="md:col-span-4 flex flex-col gap-10">
            {renderNode(
              'asset',
              'assets',
              <ImageIcon className="w-4.5 h-4.5 text-[#D97757]" />,
              `${assets.length} 张核心统一资产`,
              '生图素材 & RAG 图元共享池',
              'bg-[#D97757]/14'
            )}
            {renderNode(
              'model',
              'models',
              <Cpu className="w-4.5 h-4.5 text-[#5F5C55]" />,
              `${runningModels} / ${models.length} 模型运行中`,
              'VLM 审计 · Embedding · 渲染',
              'bg-[#1C1B18]/8'
            )}
          </div>

          {/* Right: ImageGen Pipeline */}
          <div className="md:col-span-4 md:mt-10">
            {renderNode(
              'imggen',
              'gen-audit',
              <Sparkles className="w-4.5 h-4.5 text-[#C07A28]" />,
              `${genApproved} / ${samples.length} 产出已审计`,
              '进入 BBox 质量审计工作台',
              'bg-[#C07A28]/14'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
