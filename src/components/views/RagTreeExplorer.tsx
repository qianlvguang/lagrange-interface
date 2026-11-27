import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Folder,
  FolderOpen,
  FolderTree,
  Layers,
  Search,
} from 'lucide-react';
import {
  RAG_REFACTORED_TREE,
  RAG_TREE_SUMMARY,
  type RagTreeNode,
} from '../../data/ragDocTree';
import { GlassCard } from '../common/GlassCard';

function collectAllPaths(nodes: RagTreeNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.children.length > 0) {
      out.push(n.path);
      out.push(...collectAllPaths(n.children));
    }
  }
  return out;
}

function findNodeByPath(nodes: RagTreeNode[], path: string): RagTreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findNodeByPath(n.children, path);
    if (found) return found;
  }
  return null;
}

function collectLeafSamples(node: RagTreeNode): RagTreeNode['samples'] {
  if (node.samples.length > 0) return node.samples;
  const out: RagTreeNode['samples'] = [];
  for (const c of node.children) {
    out.push(...collectLeafSamples(c));
    if (out.length >= 12) break;
  }
  return out.slice(0, 12);
}

function filterTree(
  nodes: RagTreeNode[],
  query: string,
  statusMode: 'all' | 'has_unmatched' | 'has_pending'
): RagTreeNode[] {
  const q = query.trim().toLowerCase();
  const result: RagTreeNode[] = [];

  for (const node of nodes) {
    const filteredChildren = filterTree(node.children, query, statusMode);

    const statusOk =
      statusMode === 'all' ||
      (statusMode === 'has_unmatched' && node.unmatched > 0) ||
      (statusMode === 'has_pending' && node.pending > 0);

    const selfMatchesQuery =
      !q ||
      node.name.toLowerCase().includes(q) ||
      node.path.toLowerCase().includes(q) ||
      node.legacyFolders.some((lf) => lf.folder.toLowerCase().includes(q)) ||
      node.samples.some(
        (s) =>
          s.title.toLowerCase().includes(q) || s.docId.toLowerCase().includes(q)
      );

    if ((statusOk && selfMatchesQuery) || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }
  }
  return result;
}

export const RagTreeExplorer: React.FC = () => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(RAG_REFACTORED_TREE.slice(0, 3).map((n) => n.path))
  );
  const [selectedPath, setSelectedPath] = useState<string>(
    RAG_REFACTORED_TREE[0]?.path ?? ''
  );
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'has_unmatched' | 'has_pending'
  >('all');

  const allExpandablePaths = useMemo(
    () => collectAllPaths(RAG_REFACTORED_TREE),
    []
  );

  const visibleTree = useMemo(
    () => filterTree(RAG_REFACTORED_TREE, query, statusFilter),
    [query, statusFilter]
  );

  const selectedNode = useMemo(
    () =>
      findNodeByPath(RAG_REFACTORED_TREE, selectedPath) ??
      RAG_REFACTORED_TREE[0] ??
      null,
    [selectedPath]
  );

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedPaths(new Set(allExpandablePaths));
  const collapseAll = () => setExpandedPaths(new Set());

  const renderTreeNodes = (nodes: RagTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded =
        query.trim().length > 0 ? true : expandedPaths.has(node.path);
      const isSelected = selectedNode?.path === node.path;
      const matchedPct = Math.round(
        (node.matched / Math.max(1, node.count)) * 100
      );

      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => {
              setSelectedPath(node.path);
              if (hasChildren && !expandedPaths.has(node.path)) {
                toggleExpand(node.path);
              }
            }}
            style={{ paddingLeft: `${depth * 16 + 10}px` }}
            className={`group pr-2.5 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
              isSelected
                ? 'bg-white/92 border border-[#D97757]/55 shadow-[0_4px_14px_rgba(217,119,87,0.12)]'
                : 'border border-transparent hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.path);
                  }}
                  className="p-0.5 rounded-md text-[#8C887F] hover:text-[#1C1B18] hover:bg-[#1C1B18]/6 shrink-0"
                  aria-label={isExpanded ? '折叠目录' : '展开目录'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-4.5 shrink-0" />
              )}

              {node.anomalyCount > 0 && depth === 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-[#C07A28] shrink-0" />
              ) : hasChildren && isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-[#D97757] shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#5F5C55] shrink-0" />
              )}

              <span
                className={`text-xs truncate ${
                  depth === 0
                    ? 'font-semibold text-[#1C1B18]'
                    : 'font-medium text-[#1C1B18]'
                }`}
              >
                {node.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex w-12 h-1.5 rounded-full bg-[#1C1B18]/8 overflow-hidden">
                <div
                  className="h-full bg-[#2F855A]"
                  style={{ width: `${matchedPct}%` }}
                />
              </div>
              <span className="text-[10.5px] font-mono text-[#5F5C55] min-w-[38px] text-right">
                {node.count.toLocaleString()}
              </span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-0.5 space-y-0.5">
                  {renderTreeNodes(node.children, depth + 1)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const previewSamples = useMemo(
    () => (selectedNode ? collectLeafSamples(selectedNode) : []),
    [selectedNode]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Refactor Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard padding="sm">
          <div className="text-[11px] text-[#5F5C55]">目录结构收敛</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-[#1C1B18]">
            {RAG_TREE_SUMMARY.legacyFolderCount} → {RAG_TREE_SUMMARY.rootDomainCount}
            <span className="text-xs font-sans font-normal text-[#8C887F] ml-1.5">
              根域 / {RAG_TREE_SUMMARY.newLeafFolderCount} 叶子
            </span>
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-[11px] text-[#5F5C55]">纳管文档总量</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-[#1C1B18]">
            {RAG_TREE_SUMMARY.totalDocs.toLocaleString()}
            <span className="text-xs font-sans font-normal text-[#8C887F] ml-1.5">
              最大 {RAG_TREE_SUMMARY.maxDepth} 级深度
            </span>
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-[11px] text-[#5F5C55]">配图状态总览</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-full bg-[#2F855A]/14 text-[#246A47]">
              已匹配 {RAG_TREE_SUMMARY.statusCounts.matched.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#C07A28]/14 text-[#9C611B]">
              待确认 {RAG_TREE_SUMMARY.statusCounts.pending}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#C54B38]/12 text-[#B33D2B]">
              未配图 {RAG_TREE_SUMMARY.statusCounts.unmatched.toLocaleString()}
            </span>
          </div>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="text-[11px] text-[#5F5C55]">数据治理发现</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-[#1C1B18]">
            {RAG_TREE_SUMMARY.duplicateTitleGroupCount}
            <span className="text-xs font-sans font-normal text-[#8C887F] ml-1.5">
              组跨库重名 · {RAG_TREE_SUMMARY.anomalyDocCount} 条异常隔离
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Interactive Split Tree + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Tree Navigator (6 cols) */}
        <GlassCard padding="md" className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B18]">
              <FolderTree className="w-4 h-4 text-[#D97757]" />
              重构后 RAG 标准文件树
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white text-[11px] text-[#5F5C55] border border-[#1C1B18]/8 flex items-center gap-1"
              >
                <ChevronsUpDown className="w-3 h-3" />
                展开全部
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg bg-white/70 hover:bg-white text-[11px] text-[#5F5C55] border border-[#1C1B18]/8 flex items-center gap-1"
              >
                <ChevronsDownUp className="w-3 h-3" />
                收起
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-[#8C887F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="检索新目录名、旧目录名或样例实体..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-inset text-xs text-[#1C1B18] focus:outline-none focus:ring-2 focus:ring-[#D97757]/35"
              />
            </div>
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: '全部' },
                { id: 'has_unmatched', label: '含未配图' },
                { id: 'has_pending', label: '含待确认' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id as typeof statusFilter)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                    statusFilter === t.id
                      ? 'bg-[#1C1B18] text-white'
                      : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto pr-1 space-y-1">
            {visibleTree.length > 0 ? (
              renderTreeNodes(visibleTree)
            ) : (
              <div className="py-10 text-center text-xs text-[#8C887F]">
                未找到匹配的目录或文档样例
              </div>
            )}
          </div>
        </GlassCard>

        {/* Right Node Inspector (6 cols) */}
        <GlassCard padding="lg" className="lg:col-span-6 flex flex-col gap-4">
          {selectedNode ? (
            <>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8C887F] flex-wrap">
                  <Layers className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>{selectedNode.path}</span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#1C1B18] mt-1.5">
                  {selectedNode.name}
                </h2>
                {selectedNode.description && (
                  <p className="text-xs text-[#5F5C55] mt-1.5 leading-relaxed">
                    {selectedNode.description}
                  </p>
                )}
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#2F855A]/10 border border-[#2F855A]/15">
                  <div className="text-[11px] text-[#246A47]">已匹配</div>
                  <div className="font-mono text-lg font-semibold text-[#1C1B18] mt-0.5">
                    {selectedNode.matched.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#C07A28]/10 border border-[#C07A28]/15">
                  <div className="text-[11px] text-[#9C611B]">待确认</div>
                  <div className="font-mono text-lg font-semibold text-[#1C1B18] mt-0.5">
                    {selectedNode.pending.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#C54B38]/10 border border-[#C54B38]/15">
                  <div className="text-[11px] text-[#B33D2B]">未配图</div>
                  <div className="font-mono text-lg font-semibold text-[#1C1B18] mt-0.5">
                    {selectedNode.unmatched.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Legacy Folders Traceability */}
              <div>
                <div className="text-xs font-semibold text-[#1C1B18] mb-2">
                  整合的原始目录溯源 ({selectedNode.legacyFolders.length})
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {selectedNode.legacyFolders.map((lf) => (
                    <span
                      key={lf.folder}
                      className="px-2.5 py-1 rounded-full bg-white/80 border border-[#1C1B18]/8 text-[11px] text-[#5F5C55] font-mono"
                    >
                      {lf.folder}{' '}
                      <strong className="text-[#1C1B18]">({lf.count})</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Representative Docs */}
              <div>
                <div className="text-xs font-semibold text-[#1C1B18] mb-2">
                  代表性文档样例 ({previewSamples.length})
                </div>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {previewSamples.map((s) => (
                    <div
                      key={s.docId}
                      className="p-2.5 rounded-xl bg-white/65 border border-white flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#1C1B18] truncate">
                          {s.title}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#8C887F] truncate">
                          {s.docId} · 原目录 {s.legacyFolder}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          s.status === 'matched'
                            ? 'bg-[#2F855A]/14 text-[#246A47]'
                            : s.status === 'pending'
                              ? 'bg-[#C07A28]/14 text-[#9C611B]'
                              : 'bg-[#C54B38]/12 text-[#B33D2B]'
                        }`}
                      >
                        {s.status === 'matched'
                          ? '已匹配'
                          : s.status === 'pending'
                            ? '待确认'
                            : '未配图'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#8C887F]">
              请在左侧选择任意目录节点查看详情
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
