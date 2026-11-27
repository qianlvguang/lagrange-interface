import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FilePlus2,
  Grid2x2,
  List,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { AssetUsage, ImageAsset } from '../../types/lagrange';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';

const USAGE_LABELS: Record<AssetUsage, { text: string; cls: string }> = {
  both: { text: '生图 + RAG 双管线', cls: 'bg-[#D97757]/14 text-[#B85B3B]' },
  imggen: { text: '仅生图管线素材', cls: 'bg-[#C07A28]/14 text-[#9C611B]' },
  rag: { text: '仅 RAG 管线素材', cls: 'bg-[#2F855A]/14 text-[#246A47]' },
};

export const AssetHubView: React.FC = () => {
  const {
    assets,
    docs,
    samples,
    pipelines,
    selectedAssetId,
    setSelectedAssetId,
    uploadImageAsset,
    updateAssetUsage,
    openCreateDocModal,
    inspectDocInRag,
    inspectSampleInAudit,
  } = useLagrange();

  const [usageFilter, setUsageFilter] = useState<'all' | AssetUsage | 'unbound'>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assetPipeline = pipelines.find((p) => p.id === 'asset')!;

  const inspectAsset = useMemo(
    () => (selectedAssetId ? assets.find((a) => a.id === selectedAssetId) ?? null : null),
    [assets, selectedAssetId]
  );

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (usageFilter === 'unbound' && a.boundDocIds.length > 0) return false;
      if (
        usageFilter !== 'all' &&
        usageFilter !== 'unbound' &&
        a.usage !== usageFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        a.nameZh.toLowerCase().includes(q) ||
        a.nameEn.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.sha256.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [assets, query, usageFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ext = file.name.split('.').pop()?.toUpperCase();
      const format: ImageAsset['format'] =
        ext === 'JPG' || ext === 'JPEG'
          ? 'JPG'
          : ext === 'SVG'
            ? 'SVG'
            : ext === 'WEBP'
              ? 'WEBP'
              : 'PNG';
      const created = uploadImageAsset({
        nameZh: baseName,
        nameEn: baseName,
        category: '品牌标识',
        usage: 'both',
        tags: ['本地入库', '待分类'],
        width: 1024,
        height: 1024,
        format,
        previewUrl: dataUrl,
      });
      setSelectedAssetId(created.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <SignalLight
              status={assetPipeline.status}
              size="sm"
              showText
              label={`图片资产管理管线 · ${
                assetPipeline.status === 'connected' ? '统一存储在线' : assetPipeline.status
              }`}
            />
            <span className="text-xs font-mono text-[#8C887F]">
              {assets.length} Assets Indexed
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
            统一图片资产管理中心
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            汇集生图管线素材与 RAG 管线参考图；点击任意资产卡片查看溯源详情或一键创建新 Doc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#D97757] hover:bg-[#C66343] text-white shadow-[0_6px_16px_rgba(217,119,87,0.28)] flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            上传图片入库
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `全部 (${assets.length})` },
            {
              id: 'both',
              label: `双管线共享 (${assets.filter((a) => a.usage === 'both').length})`,
            },
            {
              id: 'imggen',
              label: `生图素材 (${assets.filter((a) => a.usage === 'imggen').length})`,
            },
            {
              id: 'rag',
              label: `RAG 素材 (${assets.filter((a) => a.usage === 'rag').length})`,
            },
            {
              id: 'unbound',
              label: `未绑定 Doc (${assets.filter((a) => a.boundDocIds.length === 0).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setUsageFilter(tab.id as typeof usageFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                usageFilter === tab.id
                  ? 'bg-[#1C1B18] text-white'
                  : 'bg-white/55 text-[#5F5C55] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C887F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索名称、ID、SHA256 或标签..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
            />
          </div>
          <div className="flex items-center bg-white/60 rounded-xl p-0.5 border border-white">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid' ? 'bg-[#1C1B18] text-white' : 'text-[#5F5C55]'
              }`}
              aria-label="网格视图"
            >
              <Grid2x2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'list' ? 'bg-[#1C1B18] text-white' : 'text-[#5F5C55]'
              }`}
              aria-label="列表视图"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content + Detail Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className={inspectAsset ? 'xl:col-span-8' : 'xl:col-span-12'}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const usageInfo = USAGE_LABELS[asset.usage];
                const isSelected = inspectAsset?.id === asset.id;
                return (
                  <GlassCard
                    key={asset.id}
                    interactive
                    padding="sm"
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`flex flex-col gap-3 ${
                      isSelected ? 'ring-2 ring-[#D97757]/60 bg-white/88' : ''
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F3EFE6] relative">
                      <img
                        src={asset.previewUrl}
                        alt={asset.nameZh}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md bg-white/85 ${usageInfo.cls}`}
                      >
                        {usageInfo.text}
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1C1B18]/75 text-white">
                        {asset.format} · {asset.width}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1C1B18] truncate">
                          {asset.nameZh}
                        </h3>
                        <span className="text-[10px] font-mono text-[#8C887F] shrink-0">
                          {asset.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5F5C55] mt-0.5 truncate">
                        {asset.category} · 关联 Doc {asset.boundDocIds.length} · 生图引用{' '}
                        {asset.genReferenceCount}
                      </div>
                    </div>

                    <div
                      className="pt-1 mt-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openCreateDocModal([asset.id])}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-[#D97757]/12 hover:bg-[#D97757] text-[#C66343] hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        以此图新建 Doc
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard padding="sm" className="divide-y divide-[#1C1B18]/6">
              {filteredAssets.map((asset) => {
                const usageInfo = USAGE_LABELS[asset.usage];
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="p-3 flex flex-wrap items-center justify-between gap-3 hover:bg-white/55 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={asset.previewUrl}
                        alt={asset.nameZh}
                        className="w-12 h-12 rounded-xl object-cover bg-[#F3EFE6] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#1C1B18] truncate">
                          {asset.nameZh}
                        </div>
                        <div className="text-[11px] font-mono text-[#8C887F]">
                          {asset.id} · sha256:{asset.sha256.slice(0, 12)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${usageInfo.cls}`}
                      >
                        {usageInfo.text}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateDocModal([asset.id]);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#D97757] text-white text-[11px] font-medium"
                      >
                        新建 Doc
                      </button>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          )}
        </div>

        {/* Detail Drawer */}
        <AnimatePresence>
          {inspectAsset && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="xl:col-span-4"
            >
              <GlassCard padding="lg" className="sticky top-20 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-[#8C887F]">
                      {inspectAsset.id} · {inspectAsset.sourceTier}
                    </div>
                    <h2 className="font-serif text-xl font-semibold text-[#1C1B18]">
                      {inspectAsset.nameZh}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAssetId(null)}
                    className="p-1.5 rounded-xl text-[#8C887F] hover:text-[#1C1B18] hover:bg-white/60"
                    aria-label="关闭详情"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden bg-[#F3EFE6] aspect-square border border-[#1C1B18]/8">
                  <img
                    src={inspectAsset.previewUrl}
                    alt={inspectAsset.nameZh}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-3 rounded-2xl glass-inset text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#8C887F]">英文名</span>
                    <span className="font-medium text-[#1C1B18]">
                      {inspectAsset.nameEn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C887F]">规格</span>
                    <span className="font-mono text-[#1C1B18]">
                      {inspectAsset.width}×{inspectAsset.height} {inspectAsset.format}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C887F] block">SHA-256 指纹</span>
                    <span className="font-mono text-[10px] text-[#5F5C55] break-all">
                      {inspectAsset.sha256}
                    </span>
                  </div>
                </div>

                {/* Usage Switcher */}
                <div>
                  <div className="text-xs font-medium text-[#1C1B18] mb-1.5">
                    管线归属用途切换
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['both', 'imggen', 'rag'] as AssetUsage[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => updateAssetUsage(inspectAsset.id, u)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors ${
                          inspectAsset.usage === u
                            ? 'bg-[#1C1B18] text-white'
                            : 'bg-white/65 text-[#5F5C55] hover:bg-white'
                        }`}
                      >
                        {u === 'both'
                          ? '双管线共享'
                          : u === 'imggen'
                            ? '仅生图'
                            : '仅 RAG'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linked Docs */}
                <div>
                  <div className="text-xs font-medium text-[#1C1B18] mb-1.5">
                    已关联的 RAG Docs ({inspectAsset.boundDocIds.length})
                  </div>
                  {inspectAsset.boundDocIds.length === 0 ? (
                    <div className="text-[11px] text-[#8C887F]">暂无关联 RAG Doc</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {inspectAsset.boundDocIds.map((dId) => {
                        const doc = docs.find((d) => d.id === dId);
                        return (
                          <button
                            key={dId}
                            type="button"
                            onClick={() => inspectDocInRag(dId)}
                            className="p-2 rounded-xl bg-white/70 hover:bg-white text-left text-xs border border-white flex items-center justify-between"
                          >
                            <span className="truncate font-medium text-[#1C1B18]">
                              {doc?.title ?? dId}
                            </span>
                            <span className="text-[10px] font-mono text-[#D97757]">
                              跳转
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Linked Gen Samples */}
                <div>
                  <div className="text-xs font-medium text-[#1C1B18] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C07A28]" />
                    生图产出引用样本 (
                    {samples.filter((s) => s.sourceAssetId === inspectAsset.id).length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {samples
                      .filter((s) => s.sourceAssetId === inspectAsset.id)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => inspectSampleInAudit(s.id)}
                          className="px-2 py-1 rounded-lg bg-white/75 text-[10.5px] font-mono text-[#1C1B18] hover:text-[#D97757] border border-white"
                        >
                          {s.id}
                        </button>
                      ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateDocModal([inspectAsset.id])}
                  className="w-full py-2.5 rounded-xl bg-[#D97757] hover:bg-[#C66343] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(217,119,87,0.26)]"
                >
                  <FilePlus2 className="w-4 h-4" />
                  以此图片创建新 RAG Doc
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
