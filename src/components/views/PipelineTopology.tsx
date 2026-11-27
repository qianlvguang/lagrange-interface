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
        strokeOpacity={active ? 0.28 : 0.35}
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
          <div>
            <div className="text-sm font-semibold text-[#1C1B18]">{metricText}</div>
            <div className="text-[11px] text-[#5F5C55]">{subText}</div>
          </div>
          <span className="w-7 h-7 rounded-full bg-white/70 group-hover:bg-[#D97757] group-hover:text-white text-[#5F5C55] flex items-center justify-center transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-5 md:p-6 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
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
            生图管线素材与 RAG 管线图素材均统一沉淀于图片资产管理管线；切换顶部信号灯可实时联动数据流光状态
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
      <div className="relative">
        {/* Animated SVG Connection Layer on md+ */}
        <svg
          viewBox="0 0 900 290"
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
            d="M 330 72 C 260 72, 240 82, 185 112"
            status={combineStatus(assetPipe.status, ragPipe.status)}
            durationSec={2.4}
          />
          {/* RAG -> Asset Hub (Create Doc / Feedback) */}
          <FlowLine
            d="M 185 138 C 245 162, 275 135, 330 98"
            status={combineStatus(assetPipe.status, ragPipe.status)}
            durationSec={3.1}
            reverse
          />
          {/* Asset Hub (Center Top) -> ImageGen (Right) */}
          <FlowLine
            d="M 570 72 C 640 72, 660 82, 715 112"
            status={combineStatus(assetPipe.status, genPipe.status)}
            durationSec={2.3}
          />
          {/* ImageGen -> Asset Hub (Derived / Audited Outputs) */}
          <FlowLine
            d="M 715 138 C 655 162, 625 135, 570 98"
            status={combineStatus(assetPipe.status, genPipe.status)}
            durationSec={3.0}
            reverse
          />
          {/* RAG -> Model Cluster (Bottom Center) */}
          <FlowLine
            d="M 185 190 C 230 236, 310 245, 345 245"
            status={combineStatus(ragPipe.status, modelPipe.status)}
            durationSec={2.9}
          />
          {/* ImageGen -> Model Cluster (Bottom Center) */}
          <FlowLine
            d="M 715 190 C 670 236, 590 245, 555 245"
            status={combineStatus(genPipe.status, modelPipe.status)}
            durationSec={2.7}
          />
          {/* Asset Hub -> Model Cluster */}
          <FlowLine
            d="M 450 132 L 450 202"
            status={combineStatus(assetPipe.status, modelPipe.status)}
            durationSec={2.2}
          />
        </svg>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* Left: RAG Pipeline */}
          <div className="md:mt-10">
            {renderNode(
              'rag',
              'rag-match',
              <FileSearch className="w-4.5 h-4.5 text-[#2F855A]" />,
              `${ragMatched} / ${docs.length} Docs 已配图`,
              '点击进入 RAG 资产匹配与新建',
              'bg-[#2F855A]/12'
            )}
          </div>

          {/* Center Column: Asset Hub (Top) + Model Cluster (Bottom) */}
          <div className="flex flex-col gap-8">
            {renderNode(
              'asset',
              'assets',
              <ImageIcon className="w-4.5 h-4.5 text-[#D97757]" />,
              `${assets.length} 张核心统一资产`,
              '生图素材 & RAG 素材统一存储池',
              'bg-[#D97757]/14'
            )}
            {renderNode(
              'model',
              'models',
              <Cpu className="w-4.5 h-4.5 text-[#5F5C55]" />,
              `${runningModels} / ${models.length} 模型运行中`,
              'VLM 审计 · Embedding · 渲染模型',
              'bg-[#1C1B18]/8'
            )}
          </div>

          {/* Right: ImageGen Pipeline */}
          <div className="md:mt-10">
            {renderNode(
              'imggen',
              'gen-audit',
              <Sparkles className="w-4.5 h-4.5 text-[#C07A28]" />,
              `${genApproved} / ${samples.length} 产出已审计`,
              '点击进入 BBox 质量审计工作台',
              'bg-[#C07A28]/14'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
