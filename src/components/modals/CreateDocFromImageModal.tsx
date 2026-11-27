import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FilePlus2, Image as ImageIcon, Plus, Search, Sparkles, X } from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { DocPriority } from '../../types/lagrange';

const DOMAIN_OPTIONS = ['体育联赛', 'IP 角色', '品牌标识', '商品类目', '其他实体'];
const PRIORITY_OPTIONS: DocPriority[] = ['P0', 'P1', 'P2', 'P3'];

function slugifyId(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned ? `kb_${cleaned}` : `kb_asset_${Date.now().toString(36).slice(-4)}`;
}

export const CreateDocFromImageModal: React.FC = () => {
  const {
    createDocModalOpen,
    createDocPresetAssetIds,
    closeCreateDocModal,
    assets,
    createDocFromImages,
    setActiveTab,
  } = useLagrange();

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [assetQuery, setAssetQuery] = useState('');
  const [docId, setDocId] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('品牌标识');
  const [priority, setPriority] = useState<DocPriority>('P1');
  const [aliasesText, setAliasesText] = useState('');
  const [summary, setSummary] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!createDocModalOpen) return;
    const preset = createDocPresetAssetIds.length
      ? createDocPresetAssetIds
      : assets[0]
        ? [assets[0].id]
        : [];
    setSelectedAssetIds(preset);
    setAssetQuery('');

    const primary = assets.find((a) => a.id === preset[0]);
    if (primary) {
      setTitle(`${primary.nameZh}（${primary.nameEn}）`);
      setDocId(slugifyId(primary.nameEn || primary.id));
      setDomain(
        DOMAIN_OPTIONS.includes(primary.category) ? primary.category : '品牌标识'
      );
      setPriority('P1');
      setAliasesText([primary.nameZh, primary.nameEn, ...primary.tags.slice(0, 2)].join(', '));
      setSummary(
        `基于图片资产 ${primary.id}（${primary.nameZh}）直接创建的多模态 RAG 知识文档，用于视觉特征比对与检索召回。`
      );
      setRulesText(
        `核验商品表面印刷图案与主参考图 ${primary.id} 的几何及配色一致性\n未取得官方授权白名单时触发侵权复核`
      );
    } else {
      setTitle('');
      setDocId(`kb_custom_${Date.now().toString(36).slice(-4)}`);
      setDomain('品牌标识');
      setPriority('P1');
      setAliasesText('');
      setSummary('');
      setRulesText('');
    }
  }, [createDocModalOpen, createDocPresetAssetIds, assets]);

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.nameZh.toLowerCase().includes(q) ||
        a.nameEn.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [assets, assetQuery]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedAssetIds.length === 0) return;
    setSubmitting(true);
    try {
      await createDocFromImages({
        id: docId,
        title,
        domain,
        priority,
        summary: summary || `基于图片资产 ${selectedAssetIds.join(', ')} 新建的 RAG 文档。`,
        rules: rulesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        aliases: aliasesText
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        assetIds: selectedAssetIds,
        primaryAssetId: selectedAssetIds[0] ?? null,
      });
      closeCreateDocModal();
      setActiveTab('rag-match');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {createDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateDocModal}
            className="absolute inset-0 bg-[#1C1B18]/28 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden glass-panel rounded-3xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1C1B18]/8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#D97757]/14 text-[#D97757] flex items-center justify-center">
                  <FilePlus2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#1C1B18]">
                    根据图片资产创建新 RAG Doc
                  </h2>
                  <p className="text-xs text-[#5F5C55]">
                    选择图片资产管理管线中的标准图元，自动建档并建立双向视觉索引
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreateDocModal}
                className="p-2 rounded-xl text-[#8C887F] hover:text-[#1C1B18] hover:bg-white/60 transition-colors"
                aria-label="关闭弹窗"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left: Asset picker */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1C1B18] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#D97757]" />
                    选择关联图片（首张为主参考图）
                  </span>
                  <span className="text-[11px] font-mono text-[#8C887F]">
                    已选 {selectedAssetIds.length} 张
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8C887F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={assetQuery}
                    onChange={(e) => setAssetQuery(e.target.value)}
                    placeholder="检索资产名称、ID 或标签..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] placeholder:text-[#8C887F] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredAssets.map((asset) => {
                    const selectedIdx = selectedAssetIds.indexOf(asset.id);
                    const isSelected = selectedIdx >= 0;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => toggleAsset(asset.id)}
                        className={`relative p-2 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-white/90 border-[#D97757] shadow-[0_4px_14px_rgba(217,119,87,0.16)]'
                            : 'bg-white/50 border-white/80 hover:bg-white/80'
                        }`}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-[#F3EFE6] mb-1.5 relative">
                          <img
                            src={asset.previewUrl}
                            alt={asset.nameZh}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D97757] text-white flex items-center justify-center shadow">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          {selectedIdx === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#1C1B18]/80 text-[9px] text-white font-medium">
                              主图
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-[#1C1B18] truncate">
                          {asset.nameZh}
                        </div>
                        <div className="text-[10px] font-mono text-[#8C887F] truncate">
                          {asset.id}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Doc metadata form */}
              <div className="lg:col-span-7 flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                      Doc 名称 / 实体标题 *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例如：地平线户外日出徽（Horizon）"
                      className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                      Doc Entity ID
                    </label>
                    <input
                      type="text"
                      value={docId}
                      onChange={(e) => setDocId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-inset text-xs font-mono text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                      知识领域分类
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                    >
                      {DOMAIN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                      审核优先级
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRIORITY_OPTIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                            priority === p
                              ? 'bg-[#1C1B18] text-white'
                              : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                    检索别名（逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={aliasesText}
                    onChange={(e) => setAliasesText(e.target.value)}
                    placeholder="中文别名, 英文全称, 常见缩写"
                    className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                    Doc 语义摘要
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="描述该实体的视觉特征与适用商品类目..."
                    className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F5C55] mb-1">
                    判定规则条文（每行一条）
                  </label>
                  <textarea
                    rows={3}
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    placeholder="每行输入一条 RAG 判定规则..."
                    className="w-full px-3 py-2 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35 resize-none"
                  />
                </div>

                <div className="mt-1 p-3 rounded-2xl bg-[#D97757]/8 border border-[#D97757]/18 flex items-center gap-2.5 text-xs text-[#5F5C55]">
                  <Sparkles className="w-4 h-4 text-[#D97757] shrink-0" />
                  <span>
                    提交后将调用 <code className="font-mono text-[#1C1B18]">POST /docs/from-image</code> 创建知识实体，并自动将该图片资产标记为 RAG 可召回。
                  </span>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1C1B18]/8 flex items-center justify-between bg-white/35">
              <div className="text-xs text-[#5F5C55]">
                {selectedAssetIds.length === 0 ? (
                  <span className="text-[#C54B38]">请至少选择 1 张图片资产</span>
                ) : (
                  <span>
                    主参考图：<strong className="font-mono text-[#1C1B18]">{selectedAssetIds[0]}</strong>
                    {selectedAssetIds.length > 1 && ` 等共 ${selectedAssetIds.length} 张`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeCreateDocModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-white/70 hover:bg-white text-[#5F5C55] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={submitting || !title.trim() || selectedAssetIds.length === 0}
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#D97757] hover:bg-[#C66343] text-white shadow-[0_6px_16px_rgba(217,119,87,0.28)] flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {submitting ? '正在建档...' : '确认创建并绑定资产'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
