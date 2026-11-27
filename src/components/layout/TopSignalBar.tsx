import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, RefreshCw, Settings2 } from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { NavTab, PipelineId, SignalStatus } from '../../types/lagrange';
import { SignalLight } from '../common/SignalLight';

const STATUS_OPTIONS: { value: SignalStatus; label: string }[] = [
  { value: 'connected', label: '已接入' },
  { value: 'degraded', label: '降级' },
  { value: 'disconnected', label: '断开' },
];

const VIEW_META: Record<NavTab, { title: string; en: string }> = {
  dashboard: { title: '集成大盘', en: 'Overview' },
  'rag-match': { title: 'RAG 资产匹配', en: 'RAG Matching' },
  'gen-audit': { title: '生图产出审计', en: 'Generation Audit' },
  assets: { title: '图片资产库', en: 'Asset Hub' },
  models: { title: '模型运行监控', en: 'Model Cluster' },
  'api-config': { title: '接口与接入配置', en: 'API Config' },
};

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
    pushToast,
  } = useLagrange();

  const [openPopoverId, setOpenPopoverId] = useState<PipelineId | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const signalClusterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        signalClusterRef.current &&
        !signalClusterRef.current.contains(e.target as Node)
      ) {
        setOpenPopoverId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPopoverId(null);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTestOne = async (id: PipelineId) => {
    const res = await pingPipeline(id);
    pushToast({
      title: res.ok ? '管线探活通过' : '管线探活异常',
      description: res.message,
      tone: res.ok ? 'success' : 'warning',
    });
  };

  const viewInfo = VIEW_META[activeTab];

  return (
    <header className="sticky top-3 z-30">
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Current View Indicator (Desktop) / Brand Menu (Mobile) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl bg-white/60 text-[#1C1B18]"
            aria-label="打开导航"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="lg:hidden font-serif text-lg font-semibold text-[#1C1B18]">
            Lagrange
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1C1B18]">
              {viewInfo.title}
            </span>
            <span className="text-[11px] font-mono text-[#8C887F]">
              / {viewInfo.en}
            </span>
          </div>
        </div>

        {/* Right: Pipeline Signal Hub + Ping All */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div
            ref={signalClusterRef}
            className="flex flex-wrap items-center gap-1.5 relative"
          >
            {pipelines.map((pipeline) => {
              const isOpen = openPopoverId === pipeline.id;
              return (
                <div key={pipeline.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPopoverId((prev) =>
                        prev === pipeline.id ? null : pipeline.id
                      )
                    }
                    className={`glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-xs transition-all hover:bg-white/95 ${
                      isOpen ? 'ring-2 ring-[#D97757]/40 bg-white/95' : ''
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
                        className="absolute right-0 top-full mt-2 w-76 rounded-2xl p-4 z-50 bg-[#FFFDF8]/94 backdrop-blur-2xl border border-white shadow-[0_18px_42px_rgba(45,36,26,0.14)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {pipeline.name}
                            </div>
                            <div className="text-[11px] font-mono text-[#8C887F] mt-0.5 truncate">
                              {pipeline.baseUrl}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <SignalLight status={pipeline.status} size="md" showText />
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-[#5F5C55] bg-white/50 rounded-xl px-2.5 py-1.5">
                          <span>
                            延迟：
                            {pipeline.latencyMs !== null
                              ? `${pipeline.latencyMs}ms`
                              : '离线'}
                          </span>
                          <span>探测：{pipeline.lastCheckedAt}</span>
                        </div>

                        {pipeline.mode === 'mock' ? (
                          <div className="mt-3 pt-3 border-t border-[#1C1B18]/8">
                            <div className="text-[11px] text-[#8C887F] mb-1.5">
                              Mock 沙盒信号灯联调
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setPipelineStatus(pipeline.id, opt.value)
                                  }
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
                        ) : (
                          <div className="mt-3 pt-2.5 border-t border-[#1C1B18]/8 text-[11px] text-[#5F5C55]">
                            当前为 <span className="font-mono font-semibold">LIVE</span> 模式，状态由真实端点探活决定。
                          </div>
                        )}

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

          <button
            type="button"
            onClick={pingAllPipelines}
            disabled={isPingingAll}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C1B18] hover:bg-[#32302B] text-[#FFFDF8] flex items-center gap-1.5 transition-all disabled:opacity-60 shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">全量探测</span>
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
