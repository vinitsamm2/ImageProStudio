import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { ToolId } from "../ToolGrid";
import ToolActivityRail, { STUDIO_TOOLS } from "./ToolActivityRail";
import StudioTopBar from "./StudioTopBar";
import AssetStagingDrawer from "./AssetStagingDrawer";

type StudioLayoutProps = {
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  isCatalogOpen: boolean;
  onToggleCatalog: () => void;
  onOpenCommandPalette: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onOpenAbout: () => void;
  stagedFiles: File[];
  onAddStagedFiles: (files: File[]) => void;
  onRemoveStagedFile: (index: number) => void;
  onClearStagedFiles: () => void;
  onSendToTool: (toolId: ToolId, files: File[]) => void;
  catalogContent: ReactNode;
  toolContent: ReactNode;
};

export default function StudioLayout({
  activeTool,
  onSelectTool,
  isCatalogOpen,
  onToggleCatalog,
  onOpenCommandPalette,
  dark,
  onToggleDark,
  onOpenAbout,
  stagedFiles,
  onAddStagedFiles,
  onRemoveStagedFile,
  onClearStagedFiles,
  onSendToTool,
  catalogContent,
  toolContent
}: StudioLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-[#070a10] dark:text-slate-100 font-sans">
      {/* Ambient Atmospheric Studio Glows */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-500/15" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px] dark:bg-indigo-500/15" />

      {/* Desktop Left Activity Rail */}
      <div className="hidden lg:flex shrink-0">
        <ToolActivityRail
          activeTool={activeTool}
          onSelectTool={(id) => {
            onSelectTool(id);
            if (isCatalogOpen) onToggleCatalog();
          }}
          onToggleCatalog={onToggleCatalog}
          isCatalogOpen={isCatalogOpen}
          onOpenAbout={onOpenAbout}
          dark={dark}
          onToggleDark={onToggleDark}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Activity Rail Drawer Overlay */}
      <AnimatePresence>
        {mobileRailOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileRailOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="relative z-10 w-64 h-full"
            >
              <ToolActivityRail
                activeTool={activeTool}
                onSelectTool={(id) => {
                  onSelectTool(id);
                  setMobileRailOpen(false);
                  if (isCatalogOpen) onToggleCatalog();
                }}
                onToggleCatalog={() => {
                  onToggleCatalog();
                  setMobileRailOpen(false);
                }}
                isCatalogOpen={isCatalogOpen}
                onOpenAbout={() => {
                  setMobileRailOpen(false);
                  onOpenAbout();
                }}
                dark={dark}
                onToggleDark={onToggleDark}
                collapsed={false}
                onToggleCollapsed={() => setMobileRailOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Studio Workstation Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top Control & Command Bar */}
        <StudioTopBar
          activeTool={activeTool}
          onSelectTool={(id) => {
            onSelectTool(id);
            if (isCatalogOpen) onToggleCatalog();
          }}
          isCatalogOpen={isCatalogOpen}
          onToggleCatalog={onToggleCatalog}
          onOpenCommandPalette={onOpenCommandPalette}
          onOpenAbout={onOpenAbout}
          dark={dark}
          onToggleDark={onToggleDark}
          onToggleMobileRail={() => setMobileRailOpen(true)}
          stagedFileCount={stagedFiles.length}
        />

        {/* Central Studio Stage Viewport */}
        <main
          className="flex-1 studio-grid p-3 sm:p-5 lg:p-6 min-h-0 overflow-y-auto"
        >
          <div className="mx-auto max-w-[1680px] w-full min-h-0">
            <AnimatePresence mode="wait">
              {isCatalogOpen ? (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {catalogContent}
                </motion.div>
              ) : (
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full min-h-0"
                >
                  {toolContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Session Staging Shelf */}
        <AssetStagingDrawer
          stagedFiles={stagedFiles}
          onAddFiles={onAddStagedFiles}
          onRemoveFile={onRemoveStagedFile}
          onClearFiles={onClearStagedFiles}
          onSendToTool={onSendToTool}
          activeTool={activeTool}
        />
      </div>
    </div>
  );
}
