import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  Columns2,
  Eye,
  EyeOff,
  Flag,
  Keyboard,
  X,
  ZoomIn,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { AuditStatus } from '../../types/lagrange';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';

const DEFECT_PRESETS = [
  'BBox 偏移',
  '材质穿帮',
  '图元失真',
  '语义不符',
  '待语义复核',
];

export const GenAuditView: React.FC = () => {
  const {
    samples,
    assets,
    pipelines,
    selectedSampleId,
    setSelectedSampleId,
    submitAuditVerdict,
    inspectAssetInHub,
  } = useLagrange();

  const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
  const [showBBox, setShowBBox] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [noteDraft, setNoteDraft] = useState('');

  const genPipeline = pipelines.find((p) => p.id === 'imggen')!;

  const filteredSamples = useMemo(() => {
    if (statusFilter === 'all') return samples;
    return samples.filter((s) => s.status === statusFilter);
  }, [samples, statusFilter]);

  const currentSample =
    samples.find((s) => s.id === selectedSampleId) ??
    filteredSamples[0] ??
    samples[0];

  useEffect(() => {
    if (!currentSample) return;
    setSelectedTags(currentSample.defectTags);
    setNoteDraft(currentSample.auditorNote);
  }, [currentSample]);

  const sourceAsset = useMemo(
    () => assets.find((a) => a.id === currentSample?.sourceAssetId),
    [assets, currentSample]
  );

  const auditedCount = samples.filter((s) => s.status !== 'pending').length;

  const advanceToNext = (currentId: string) => {
    const idx = filteredSamples.findIndex((s) => s.id === currentId);
    if (idx >= 0 && idx + 1 < filteredSamples.length) {
      setSelectedSampleId(filteredSamples[idx + 1].id);
    }
  };

  const handleVerdict = async (status: AuditStatus) => {
    if (!currentSample) return;
    await submitAuditVerdict(currentSample.id, status, selectedTags, noteDraft);
    advanceToNext(currentSample.id);
  };

  const toggleDefectTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (!currentSample) return;
      const idx = filteredSamples.findIndex((s) => s.id === currentSample.id);
      if (e.key === 'ArrowDown' && idx >= 0 && idx + 1 < filteredSamples.length) {
        e.preventDefault();
        setSelectedSampleId(filteredSamples[idx + 1].id);
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        setSelectedSampleId(filteredSamples[idx - 1].id);
      } else if (e.key.toLowerCase() === 'b') {
        setShowBBox((v) => !v);
      } else if (e.key.toLowerCase() === 'a') {
        handleVerdict('approved');
      } else if (e.key.toLowerCase() === 'r') {
        handleVerdict('rejected');
      } else if (e.key.toLowerCase() === 'f') {
        handleVerdict('flagged');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const statusPill = (status: AuditStatus) => {
    const map: Record<AuditStatus, { label: string; cls: string }> = {
      pending: { label: '待审计', cls: 'bg-[#1C1B18]/8 text-[#5F5C55]' },
      approved: { label: '已通过', cls: 'bg-[#2F855A]/15 text-[#246A47]' },
      rejected: { label: '已驳回', cls: 'bg-[#C54B38]/14 text-[#B33D2B]' },
      flagged: { label: '待复核', cls: 'bg-[#C07A28]/15 text-[#9C611B]' },
    };
    const item = map[status];
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap shrink-0 ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Header & Progress */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <SignalLight
              status={genPipeline.status}
              size="sm"
              showText
              label={`生图管线 · ${genPipeline.status === 'connected' ? '实时连接' : genPipeline.status}`}
            />
            <span className="text-xs font-mono text-[#8C887F]">
              已审计 {auditedCount} / {samples.length}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
            生图产出质量审计台
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            校验合成图与 BBox [ymin, xmin, ymax, xmax] 坐标对齐、源参考图一致性及 Alpha 融合质量
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] text-[#5F5C55]">
            <Keyboard className="w-3.5 h-3.5 text-[#D97757]" />
            <span className="flex flex-wrap items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/80 border border-[#1C1B18]/10 font-mono text-[10px]">A</kbd> 通过
              <kbd className="px-1.5 py-0.5 rounded bg-white/80 border border-[#1C1B18]/10 font-mono text-[10px]">R</kbd> 驳回
              <kbd className="px-1.5 py-0.5 rounded bg-white/80 border border-[#1C1B18]/10 font-mono text-[10px]">F</kbd> 复核
              <kbd className="px-1.5 py-0.5 rounded bg-white/80 border border-[#1C1B18]/10 font-mono text-[10px]">B</kbd> 框线
              <kbd className="px-1.5 py-0.5 rounded bg-white/80 border border-[#1C1B18]/10 font-mono text-[10px]">↑↓</kbd> 切图
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `全部 (${samples.length})` },
            { id: 'pending', label: `待审计 (${samples.filter((s) => s.status === 'pending').length})` },
            { id: 'approved', label: `通过 (${samples.filter((s) => s.status === 'approved').length})` },
            { id: 'rejected', label: `驳回 (${samples.filter((s) => s.status === 'rejected').length})` },
            { id: 'flagged', label: `复核 (${samples.filter((s) => s.status === 'flagged').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#1C1B18] text-white'
                  : 'glass-pill text-[#5F5C55] hover:text-[#1C1B18]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-48 h-2 rounded-full bg-[#1C1B18]/8 overflow-hidden">
          <div
            className="h-full bg-[#2F855A] rounded-full transition-all duration-500"
            style={{ width: `${Math.round((auditedCount / Math.max(1, samples.length)) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3-Column Audit Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Queue (shrinks when compareMode is active to give dual images breathing room) */}
        <GlassCard
          padding="sm"
          className={`${
            compareMode ? 'lg:col-span-2' : 'lg:col-span-3'
          } flex flex-col gap-2 max-h-[640px] overflow-y-auto`}
        >
          {filteredSamples.map((s) => {
            const active = currentSample?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSampleId(s.id)}
                className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                  active
                    ? 'bg-white/95 border-[#D97757]/60 shadow-[0_6px_18px_rgba(217,119,87,0.12)]'
                    : 'bg-white/48 border-white/75 hover:bg-white/78'
                }`}
              >
                <img
                  src={s.imageUrl}
                  alt={s.id}
                  className={`${compareMode ? 'w-9 h-9' : 'w-12 h-12'} rounded-xl object-cover shrink-0 bg-[#EFEAE0]`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-mono font-semibold text-[#1C1B18] truncate">
                      {compareMode ? s.id.replace('DW_V2_', '#') : s.id}
                    </span>
                    {statusPill(s.status)}
                  </div>
                  {!compareMode && (
                    <div className="text-[10.5px] text-[#8C887F] truncate mt-0.5">
                      {s.stage}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-[#5F5C55] mt-0.5">
                    Align {s.metrics.bboxAlign}%
                  </div>
                </div>
              </button>
            );
          })}
        </GlassCard>

        {/* Center Inspector Canvas */}
        {currentSample && (
          <GlassCard
            padding="md"
            className={`${
              compareMode ? 'lg:col-span-6' : 'lg:col-span-5'
            } flex flex-col gap-3`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#1C1B18]">
                  {currentSample.id}
                </span>
                {statusPill(currentSample.status)}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowBBox((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    showBBox
                      ? 'bg-[#D97757] text-white'
                      : 'bg-white/70 text-[#5F5C55]'
                  }`}
                >
                  {showBBox ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  BBox 坐标层
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    compareMode
                      ? 'bg-[#1C1B18] text-white'
                      : 'bg-white/70 text-[#5F5C55]'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  源图对照
                </button>
                <button
                  type="button"
                  onClick={() => setZoomed((v) => !v)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    zoomed ? 'bg-[#1C1B18] text-white' : 'bg-white/70 text-[#5F5C55]'
                  }`}
                  title="缩放检视"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`grid gap-3 ${
                compareMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* Generated Image + SVG BBox Overlay */}
              <div className="relative rounded-2xl overflow-hidden bg-[#ECE6DA] border border-[#1C1B18]/10 aspect-square">
                <img
                  src={currentSample.imageUrl}
                  alt={currentSample.id}
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    zoomed ? 'scale-125' : 'scale-100'
                  }`}
                />
                {showBBox && (
                  <svg
                    viewBox="0 0 1000 1000"
                    className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 ${
                      zoomed ? 'scale-125' : 'scale-100'
                    }`}
                  >
                    {(() => {
                      const [ymin, xmin, ymax, xmax] = currentSample.bbox;
                      const labelX = Math.min(xmin, 680);
                      return (
                        <g>
                          <rect
                            x={xmin}
                            y={ymin}
                            width={xmax - xmin}
                            height={ymax - ymin}
                            fill="rgba(217, 119, 87, 0.14)"
                            stroke="#D97757"
                            strokeWidth="6"
                            strokeDasharray="18 8"
                            rx="10"
                          />
                          <rect
                            x={labelX}
                            y={Math.max(12, ymin - 48)}
                            width="290"
                            height="40"
                            rx="10"
                            fill="#1C1B18"
                            fillOpacity="0.86"
                          />
                          <text
                            x={labelX + 14}
                            y={Math.max(38, ymin - 22)}
                            fill="#FFFDF8"
                            fontSize="24"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            [{ymin}, {xmin}, {ymax}, {xmax}]
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Optional Reference Source Comparison */}
              {compareMode && (
                <div className="rounded-2xl overflow-hidden bg-white/75 border border-[#1C1B18]/10 aspect-square flex flex-col">
                  <div className="px-3 py-2 border-b border-[#1C1B18]/8 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#1C1B18]">资产库源参考图</span>
                    <span className="font-mono text-[#8C887F]">{currentSample.sourceAssetId}</span>
                  </div>
                  <div className="flex-1 p-3 flex items-center justify-center bg-[#F8F6F1]">
                    {sourceAsset ? (
                      <img
                        src={sourceAsset.previewUrl}
                        alt={sourceAsset.nameZh}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-xs text-[#8C887F]">未找到源参考图</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl glass-inset text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-[#1C1B18]">合成 Prompt / 课程描述</div>
              <p className="text-[#5F5C55] leading-relaxed">{currentSample.prompt}</p>
              <div className="pt-1 border-t border-[#1C1B18]/8 text-[11px] text-[#5F5C55]">
                <span className="font-medium text-[#1C1B18]">QA 问：</span>
                {currentSample.qaQuestion}
              </div>
              <div className="text-[11px] text-[#246A47]">
                <span className="font-medium">真值答：</span>
                <span className="font-mono">{currentSample.qaAnswer}</span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Right Verdict & Metrics Panel (4 cols) */}
        {currentSample && (
          <GlassCard padding="md" className="lg:col-span-4 flex flex-col gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1C1B18]">
                自动质检指标与人工判责
              </h3>
              <p className="text-xs text-[#5F5C55]">
                渲染模型：<span className="font-mono">{currentSample.modelUsed}</span>
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5">
              {[
                {
                  label: 'BBox 掩模贴合度',
                  val: currentSample.metrics.bboxAlign,
                  warnBelow: 85,
                },
                {
                  label: 'Alpha 边缘融合度',
                  val: currentSample.metrics.alphaBlend,
                  warnBelow: 88,
                },
                {
                  label: '图文语义一致性',
                  val: currentSample.metrics.promptConsistency,
                  warnBelow: 85,
                },
              ].map((m) => {
                const isLow = m.val < m.warnBelow;
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#5F5C55]">{m.label}</span>
                      <span
                        className={`font-mono font-semibold ${
                          isLow ? 'text-[#C54B38]' : 'text-[#1C1B18]'
                        }`}
                      >
                        {m.val.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1C1B18]/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isLow ? 'bg-[#C54B38]' : 'bg-[#2F855A]'
                        }`}
                        style={{ width: `${Math.min(100, m.val)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="p-2.5 rounded-xl bg-white/60 border border-white flex items-center justify-between text-xs">
                <span className="text-[#5F5C55] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C07A28]" />
                  幻觉偏移风险估值
                </span>
                <span
                  className={`font-mono font-semibold ${
                    currentSample.metrics.hallucinationRisk > 8
                      ? 'text-[#C54B38]'
                      : 'text-[#246A47]'
                  }`}
                >
                  {currentSample.metrics.hallucinationRisk.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Source Asset Card */}
            {sourceAsset && (
              <div className="p-3 rounded-2xl bg-white/65 border border-white flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={sourceAsset.previewUrl}
                    alt={sourceAsset.nameZh}
                    className="w-10 h-10 rounded-xl object-cover bg-[#F3EFE6] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1C1B18] truncate">
                      {sourceAsset.nameZh}
                    </div>
                    <div className="text-[10.5px] font-mono text-[#8C887F]">
                      源资产 {sourceAsset.id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => inspectAssetInHub(sourceAsset.id)}
                  className="text-[11px] font-medium text-[#D97757] hover:underline shrink-0"
                >
                  查看资产
                </button>
              </div>
            )}

            {/* Defect Tags */}
            <div>
              <div className="text-xs font-medium text-[#1C1B18] mb-2">
                缺陷标签（驳回/复核时可选）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFECT_PRESETS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDefectTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        active
                          ? 'bg-[#C54B38] text-white'
                          : 'bg-white/65 text-[#5F5C55] hover:bg-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-[#1C1B18] mb-1">
                审计备注
              </label>
              <textarea
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="记录贴合异常细节或通过说明..."
                className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleVerdict('approved')}
                className="py-2.5 px-3 rounded-xl bg-[#2F855A] hover:bg-[#256D49] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                通过 (A)
              </button>
              <button
                type="button"
                onClick={() => handleVerdict('flagged')}
                className="py-2.5 px-3 rounded-xl bg-[#C07A28] hover:bg-[#A6671F] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                复核 (F)
              </button>
              <button
                type="button"
                onClick={() => handleVerdict('rejected')}
                className="py-2.5 px-3 rounded-xl bg-[#C54B38] hover:bg-[#A93B2A] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                驳回 (R)
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    </motion.div>
  );
};
