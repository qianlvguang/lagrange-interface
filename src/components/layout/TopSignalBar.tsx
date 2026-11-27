import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FilePlus2,
  Menu,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { NavTab, PipelineId, SignalStatus } from '../../types/lagrange';
import { SignalLight } from '../common/SignalLight';

const STATUS_OPTIONS: { value: SignalStatus; label: string }[] = [
  { value: 'connected', label: '已接入' },
  { value: 'degraded', label: '降级' },
  { value: 'disconnected', label: '断开' },
];

const MOBILE_TABS: { id: NavTab; label: string }[] = [
  { id: 'dashboard', label: '大盘' },
  { id: 'rag-match', label: 'RAG 匹配' },
  { id: 'gen-audit', label: '生图审计' },
  { id: 'assets', label: '资产库' },
  { id: 'models', label: '模型监控' },
  { id: 'api-config', label: '接口配置' },
];

export const TopSignalBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    pipelines,
    setPipelineStatus,
    pingPipeline,
    pingAllPipelines,
    isPingingAll,
    openCreateDocModal,
    pushToast,
  } = useLagrange();

  const [openPopoverId, setOpenPopoverId] = useState<PipelineId | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleTestOne = async (id: PipelineId) => {
    const res = await pingPipeline(id);
    pushToast({
      title: res.ok ? '管线探活通过' : '管线探活异常',
      description: res.message,
      tone: res.ok ? 'success' : 'warning',
    });
  };

  return (
    <header className="sticky top-3 z-30">
      <div className="glass-panel rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Brand + Menu */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="p-2 rounded-xl bg-white/60 text-[#1C1B18]"
            aria-label="打开导航"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-serif text-lg font-semibold text-[#1C1B18]">
            Lagrange
          </span>
        </div>

        {/* Center/Left: Interactive Pipeline Signal Pills */}
        <div className="flex flex-wrap items-center gap-2 relative">
          <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8C887F] mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            管线接入信号灯
          </span>
          {pipelines.map((pipeline) => {
            const isOpen = openPopoverId === pipeline.id;
            return (
              <div key={pipeline.id} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenPopoverId((prev) => (prev === pipeline.id ? null : pipeline.id))
                  }
                  className={`glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-xs transition-all hover:bg-white/90 ${
                    isOpen ? 'ring-2 ring-[#D97757]/40 bg-white/90' : ''
                  }`}
                >
                  <SignalLight status={pipeline.status} size="sm" />
                  <span className="font-medium text-[#1C1B18]">
                    {pipeline.shortName}
                  </span>
                  <span className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#1C1B18]/5 text-[#5F5C55] uppercase">
                    {pipeline.mode}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-0 top-full mt-2 w-72 glass-panel rounded-2xl p-4 z-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[13px] font-semibold text-[#1C1B18]">
                            {pipeline.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#8C887F] mt-0.5 truncate max-w-[180px]">
                            {pipeline.baseUrl}
                          </div>
                        </div>
                        <SignalLight status={pipeline.status} size="md" showText />
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#1C1B18]/8">
                        <div className="text-[11px] text-[#8C887F] mb-1.5">
                          模拟/联调信号灯状态
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setPipelineStatus(pipeline.id, opt.value)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors ${
                                pipeline.status === opt.value
                                  ? 'bg-[#D97757] text-white shadow-sm'
                                  : 'bg-white/60 text-[#5F5C55] hover:bg-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTestOne(pipeline.id)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/75 hover:bg-white text-xs font-medium text-[#1C1B18] border border-[#1C1B18]/10 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          探测连通性
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenPopoverId(null);
                            setActiveTab('api-config');
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-[#1C1B18]/6 hover:bg-[#1C1B18]/12 text-xs font-medium text-[#1C1B18] flex items-center gap-1 transition-colors"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          配置
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={pingAllPipelines}
            disabled={isPingingAll}
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-[#5F5C55] hover:text-[#1C1B18] hover:bg-white/90 flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin text-[#D97757]' : ''}`}
            />
            <span className="hidden sm:inline">全量探测</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateDocModal([])}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#D97757] hover:bg-[#C66343] text-[#FFFDF8] shadow-[0_6px_16px_rgba(217,119,87,0.28)] flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>从图片新建 Doc</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="lg:hidden mt-2 glass-panel rounded-2xl p-2 grid grid-cols-3 gap-1.5"
          >
            {MOBILE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  setMobileNavOpen(false);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium ${
                  activeTab === t.id
                    ? 'bg-[#D97757] text-white'
                    : 'bg-white/55 text-[#5F5C55]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
