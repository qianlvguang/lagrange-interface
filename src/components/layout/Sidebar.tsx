import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileSearch,
  Image as ImageIcon,
  LayoutDashboard,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { NavTab } from '../../types/lagrange';
import { SignalLight } from '../common/SignalLight';

interface NavItem {
  id: NavTab;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: '集成大盘', subtitle: '全链路总览', icon: LayoutDashboard },
  { id: 'rag-match', label: 'RAG 资产匹配', subtitle: '配图 & 建档', icon: FileSearch },
  { id: 'gen-audit', label: '生图产出审计', subtitle: 'BBox & 质检', icon: ShieldCheck },
  { id: 'assets', label: '图片资产库', subtitle: '统一素材池', icon: ImageIcon },
  { id: 'models', label: '模型运行监控', subtitle: '算力 & 延迟', icon: Cpu },
  { id: 'api-config', label: '接口与接入配置', subtitle: '契约 & 联调', icon: PlugZap },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, pipelines, docs, samples, models } = useLagrange();
  const [collapsed, setCollapsed] = useState(false);

  const unmatchedCount = docs.filter((d) => d.matchStatus !== 'matched').length;
  const pendingAuditCount = samples.filter((s) => s.status === 'pending').length;
  const onlinePipelines = pipelines.filter((p) => p.status === 'connected').length;
  const runningModels = models.filter((m) => m.status === 'running').length;

  const overallSignal = pipelines.some((p) => p.status === 'disconnected')
    ? 'disconnected'
    : pipelines.some((p) => p.status === 'degraded' || p.status === 'syncing')
      ? 'degraded'
      : 'connected';

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-out ${
        collapsed ? 'w-[78px]' : 'w-[240px]'
      }`}
    >
      <div className="glass-panel rounded-3xl p-3 flex flex-col h-[calc(100vh-2rem)] sticky top-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-2.5 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#D97757] text-[#FFFDF8] flex items-center justify-center shadow-[0_6px_16px_rgba(217,119,87,0.34)] shrink-0">
              <Activity className="w-4.5 h-4.5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-serif text-[19px] font-semibold tracking-tight text-[#1C1B18] leading-none">
                  Lagrange
                </div>
                <div className="text-[11px] text-[#8C887F] mt-1 truncate">
                  Multimodal Hub
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-xl text-[#8C887F] hover:text-[#1C1B18] hover:bg-white/60 transition-colors"
            title={collapsed ? '展开侧栏' : '收起侧栏'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 mt-1" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            const badge =
              item.id === 'rag-match' && unmatchedCount > 0
                ? unmatchedCount
                : item.id === 'gen-audit' && pendingAuditCount > 0
                  ? pendingAuditCount
                  : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
                  active
                    ? 'text-[#1C1B18]'
                    : 'text-[#5F5C55] hover:text-[#1C1B18] hover:bg-white/40'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="lagrange-nav-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-2xl bg-white/88 border border-white shadow-[0_4px_14px_rgba(45,36,26,0.06)]"
                  />
                )}
                <span
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors ${
                    active ? 'bg-[#D97757]/12 text-[#D97757]' : 'text-[#5F5C55]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                {!collapsed && (
                  <div className="relative z-10 min-w-0 flex-1 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium leading-tight truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#8C887F] mt-0.5 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                    {badge !== null && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#D97757]/14 text-[#C66343]">
                        {badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Minimal System Runtime Summary */}
        <div className="mt-3 pt-3 border-t border-[#1C1B18]/8">
          <button
            type="button"
            onClick={() => setActiveTab('api-config')}
            title="点击前往管线接入配置"
            className={`w-full rounded-2xl bg-white/50 hover:bg-white/80 border border-white/80 transition-colors text-left ${
              collapsed ? 'p-2.5 flex justify-center' : 'px-3 py-2.5'
            }`}
          >
            {collapsed ? (
              <SignalLight status={overallSignal} size="md" />
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#5F5C55]">
                    系统运行摘要
                  </span>
                  <SignalLight status={overallSignal} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#1C1B18]">
                  <span>{onlinePipelines}/{pipelines.length} 管线在线</span>
                  <span className="text-[#8C887F]">·</span>
                  <span>{runningModels}/{models.length} 模型</span>
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
