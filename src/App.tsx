import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AmbientBackground } from './components/common/AmbientBackground';
import { ToastContainer } from './components/common/ToastContainer';
import { Sidebar } from './components/layout/Sidebar';
import { TopSignalBar } from './components/layout/TopSignalBar';
import { CreateDocFromImageModal } from './components/modals/CreateDocFromImageModal';
import { ApiConfigView } from './components/views/ApiConfigView';
import { AssetHubView } from './components/views/AssetHubView';
import { DashboardView } from './components/views/DashboardView';
import { GenAuditView } from './components/views/GenAuditView';
import { ModelMonitorView } from './components/views/ModelMonitorView';
import { RagMatchView } from './components/views/RagMatchView';
import { LagrangeProvider, useLagrange } from './context/LagrangeContext';

const MainShell: React.FC = () => {
  const { activeTab } = useLagrange();

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'rag-match':
        return <RagMatchView />;
      case 'gen-audit':
        return <GenAuditView />;
      case 'assets':
        return <AssetHubView />;
      case 'models':
        return <ModelMonitorView />;
      case 'api-config':
        return <ApiConfigView />;
    }
  };

  return (
    <div className="min-h-screen relative text-[#1C1B18]">
      <AmbientBackground />
      <ToastContainer />
      <CreateDocFromImageModal />

      <div className="max-w-[1540px] mx-auto p-3 sm:p-4 flex gap-4 lg:gap-5 items-start">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col gap-5 pb-10">
          <TopSignalBar />
          <main className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export function App() {
  return (
    <LagrangeProvider>
      <MainShell />
    </LagrangeProvider>
  );
}

export default App;
