import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  FilePlus2,
  FileSearch,
  Link2,
  Search,
  Sparkles,
  Star,
  Unlink,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { ImageAsset, RagDoc } from '../../types/lagrange';
import { GlassCard } from '../common/GlassCard';
import { SignalLight } from '../common/SignalLight';

function computeMatchScore(doc: RagDoc, asset: ImageAsset): number {
  let score = 28;
  if (doc.candidateAssetIds.includes(asset.id)) score += 52;
  if (doc.domain === asset.category) score += 16;

  const docText = `${doc.title} ${doc.aliases.join(' ')} ${doc.summary}`.toLowerCase();
  if (docText.includes(asset.nameEn.toLowerCase()) || docText.includes(asset.nameZh.toLowerCase())) {
    score += 36;
  }
  const tagHits = asset.tags.filter((t) => docText.includes(t.toLowerCase())).length;
  score += Math.min(20, tagHits * 10);

  return Math.min(99, score);
}

export const RagMatchView: React.FC = () => {
  const {
    docs,
    assets,
    pipelines,
    selectedDocId,
    setSelectedDocId,
    bindAssetToDoc,
    unbindAssetFromDoc,
    setDocPrimaryAsset,
    openCreateDocModal,
    setActiveTab,
  } = useLagrange();

  const [docSearch, setDocSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'pending' | 'unmatched'>('all');
  const [assetSearch, setAssetSearch] = useState('');

  const ragPipeline = pipelines.find((p) => p.id === 'rag')!;

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return docs.filter((d) => {
      if (statusFilter !== 'all' && d.matchStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [docs, docSearch, statusFilter]);

  const currentDoc =
    docs.find((d) => d.id === selectedDocId) ?? filteredDocs[0] ?? docs[0];

  const boundAssets = useMemo(() => {
    if (!currentDoc) return [];
    return currentDoc.boundAssetIds
      .map((id) => assets.find((a) => a.id === id))
      .filter((a): a is ImageAsset => Boolean(a));
  }, [assets, currentDoc]);

  const candidatePool = useMemo(() => {
    if (!currentDoc) return [];
    const q = assetSearch.trim().toLowerCase();
    return assets
      .filter((a) => !currentDoc.boundAssetIds.includes(a.id))
      .filter((a) => {
        if (!q) return true;
        return (
          a.nameZh.toLowerCase().includes(q) ||
          a.nameEn.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .map((a) => ({
        asset: a,
        score: computeMatchScore(currentDoc, a),
        isCandidate: currentDoc.candidateAssetIds.includes(a.id),
      }))
      .sort((a, b) => b.score - a.score);
  }, [assets, assetSearch, currentDoc]);

  const statusBadge = (status: RagDoc['matchStatus']) => {
    if (status === 'matched') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#2F855A]/14 text-[#246A47]">
          已匹配
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#C07A28]/14 text-[#9C611B]">
          待确认
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#C54B38]/12 text-[#B33D2B]">
        未配图
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
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <SignalLight status={ragPipeline.status} size="sm" showText label={`RAG 管线 · ${ragPipeline.status === 'connected' ? '在线同步' : ragPipeline.status}`} />
            <span className="text-xs text-[#8C887F] font-mono">{docs.length} Docs</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
            RAG 资产匹配与 Doc 建档
          </h1>
          <p className="text-sm text-[#5F5C55] mt-1">
            为知识库中的每条 Doc 匹配图片资产管理管线里的标准图元，或直接根据图片创建全新 Doc
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateDocModal([])}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-[#D97757] hover:bg-[#C66343] text-white shadow-[0_6px_16px_rgba(217,119,87,0.28)] flex items-center gap-1.5 transition-all"
        >
          <FilePlus2 className="w-4 h-4" />
          根据图片新建 Doc
        </button>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Doc List */}
        <GlassCard padding="md" className="lg:col-span-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C887F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="搜索 Doc 标题、ID 或别名..."
              className="w-full pl-8 pr-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] placeholder:text-[#8C887F] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
            />
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'all', label: '全部' },
              { id: 'pending', label: '待确认' },
              { id: 'unmatched', label: '未配图' },
              { id: 'matched', label: '已匹配' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                className={`py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#1C1B18] text-white'
                    : 'bg-white/55 text-[#5F5C55] hover:bg-white/85'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const active = currentDoc?.id === doc.id;
              const thumb = doc.primaryAssetId
                ? assets.find((a) => a.id === doc.primaryAssetId)?.previewUrl
                : null;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                    active
                      ? 'bg-white/92 border-[#D97757]/55 shadow-[0_6px_18px_rgba(217,119,87,0.12)]'
                      : 'bg-white/48 border-white/75 hover:bg-white/78'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EFEAE0] overflow-hidden shrink-0 flex items-center justify-center border border-[#1C1B18]/8">
                    {thumb ? (
                      <img src={thumb} alt={doc.title} className="w-full h-full object-cover" />
                    ) : (
                      <FileSearch className="w-4 h-4 text-[#8C887F]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold text-[#1C1B18] truncate">
                        {doc.title}
                      </span>
                      {statusBadge(doc.matchStatus)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] font-mono text-[#8C887F]">
                      <span>{doc.priority}</span>
                      <span>·</span>
                      <span className="truncate">{doc.id}</span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredDocs.length === 0 && (
              <div className="py-10 text-center text-xs text-[#8C887F]">
                暂无符合筛选条件的 RAG Doc
              </div>
            )}
          </div>
        </GlassCard>

        {/* Right: Doc Detail + Bound Assets + Intelligent Matching Pool */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {currentDoc && (
            <>
              <GlassCard padding="lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#1C1B18] text-white text-[10px] font-mono">
                        {currentDoc.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/80 text-[#5F5C55] text-[11px] font-medium border border-[#1C1B18]/8">
                        {currentDoc.domain}
                      </span>
                      {statusBadge(currentDoc.matchStatus)}
                      {currentDoc.createdFromImage && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#D97757]/14 text-[#C66343]">
                          由图片新建
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-[#1C1B18] mt-2">
                      {currentDoc.title}
                    </h2>
                    <div className="text-xs font-mono text-[#8C887F] mt-0.5">
                      {currentDoc.id} · 更新于 {currentDoc.updatedAt}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#5F5C55] mt-3 leading-relaxed">
                  {currentDoc.summary}
                </p>

                {currentDoc.rules.length > 0 && (
                  <div className="mt-3 p-3 rounded-2xl glass-inset">
                    <div className="text-[11px] font-semibold text-[#1C1B18] mb-1.5">
                      审核与检索规则
                    </div>
                    <ul className="space-y-1 text-xs text-[#5F5C55]">
                      {currentDoc.rules.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#D97757] mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bound Assets Slot */}
                <div className="mt-5 pt-4 border-t border-[#1C1B18]/8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-[#1C1B18] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2F855A]" />
                      已绑定的图片资产 ({boundAssets.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('assets')}
                      className="text-[11px] text-[#D97757] hover:underline"
                    >
                      去资产库浏览全部
                    </button>
                  </div>

                  {boundAssets.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-dashed border-[#1C1B18]/18 bg-white/35 text-center text-xs text-[#8C887F]">
                      当前 Doc 尚未绑定标准图片资产，请在下方匹配池选择并一键绑定
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {boundAssets.map((asset) => {
                        const isPrimary = currentDoc.primaryAssetId === asset.id;
                        return (
                          <div
                            key={asset.id}
                            className="p-3 rounded-2xl bg-white/75 border border-white flex items-center gap-3"
                          >
                            <img
                              src={asset.previewUrl}
                              alt={asset.nameZh}
                              className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE6] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#1C1B18] truncate">
                                  {asset.nameZh}
                                </span>
                                {isPrimary && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#D97757] text-white text-[9px] font-medium shrink-0">
                                    主图
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] font-mono text-[#8C887F] mt-0.5">
                                {asset.id} · {asset.width}×{asset.height}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => setDocPrimaryAsset(currentDoc.id, asset.id)}
                                    className="text-[11px] text-[#D97757] hover:underline flex items-center gap-1"
                                  >
                                    <Star className="w-3 h-3" /> 设为主图
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => unbindAssetFromDoc(currentDoc.id, asset.id)}
                                  className="text-[11px] text-[#8C887F] hover:text-[#C54B38] flex items-center gap-1"
                                >
                                  <Unlink className="w-3 h-3" /> 解绑
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Candidate & Asset Pool */}
              <GlassCard padding="lg">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1B18] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D97757]" />
                      资产库智能匹配池
                    </h3>
                    <p className="text-xs text-[#5F5C55]">
                      按多模态向量召回与标签语义匹配度排序，点击即可将资产绑定至当前 Doc
                    </p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#8C887F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      placeholder="按资产名称 / 标签检索..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {candidatePool.map(({ asset, score, isCandidate }) => (
                    <motion.div
                      layout
                      key={asset.id}
                      className={`p-3 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                        isCandidate
                          ? 'bg-white/88 border-[#C07A28]/45 shadow-[0_4px_14px_rgba(192,122,40,0.1)]'
                          : 'bg-white/55 border-white/80 hover:bg-white/85'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={asset.previewUrl}
                          alt={asset.nameZh}
                          className="w-14 h-14 rounded-xl object-cover bg-[#F3EFE6] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[#1C1B18] truncate">
                              {asset.nameZh}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold shrink-0 ${
                                score >= 75
                                  ? 'bg-[#2F855A]/14 text-[#246A47]'
                                  : 'bg-[#1C1B18]/7 text-[#5F5C55]'
                              }`}
                            >
                              {score}%
                            </span>
                          </div>
                          <div className="text-[10.5px] text-[#8C887F] truncate mt-0.5">
                            {asset.category} · {asset.id}
                          </div>
                          {isCandidate && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-[#C07A28]/14 text-[#9C611B] text-[9.5px] font-medium">
                              向量推荐候选
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-auto pt-1">
                        <button
                          type="button"
                          onClick={() => bindAssetToDoc(currentDoc.id, asset.id, boundAssets.length === 0)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#D97757] hover:bg-[#C66343] text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <Link2 className="w-3 h-3" />
                          绑定此资产
                        </button>
                        <button
                          type="button"
                          onClick={() => openCreateDocModal([asset.id])}
                          title="以此图片另建新 Doc"
                          className="py-1.5 px-2.5 rounded-xl bg-white/80 hover:bg-white text-[11px] font-medium text-[#5F5C55] border border-[#1C1B18]/10 transition-colors"
                        >
                          建新 Doc
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
