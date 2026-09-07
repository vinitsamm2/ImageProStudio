import { useEffect, useState } from "react";
import StudioLayout from "./components/studio/StudioLayout";
import CommandPalette from "./components/CommandPalette";
import AboutModal from "./components/AboutModal";
import HubView from "./components/HubView";
import ToastContainer, { Toast } from "./components/ui/ToastContainer";
import { TOOLS, ToolId } from "./components/ToolGrid";
import { STUDIO_TOOLS } from "./components/studio/ToolActivityRail";

// Tool Views
import ImageCompressorView from "./components/tools/ImageCompressorView";
import ImageResizerView from "./components/tools/ImageResizerView";
import ImageToPdfView from "./components/tools/ImageToPdfView";
import PdfMergerView from "./components/tools/PdfMergerView";
import PdfSplitterView from "./components/tools/PdfSplitterView";
import PdfToImageView from "./components/tools/PdfToImageView";
import ImageConverterView from "./components/tools/ImageConverterView";
import CanvasExtenderView from "./components/tools/CanvasExtenderView";
import DimensionConverterView from "./components/tools/DimensionConverterView";
import PdfRotateView from "./components/tools/PdfRotateView";
import PdfWatermarkView from "./components/tools/PdfWatermarkView";
import PdfOrganizeView from "./components/tools/PdfOrganizeView";
import PdfSignView from "./components/tools/PdfSignView";
import PdfCompressorView from "./components/tools/PdfCompressorView";
import PdfEditorView from "./components/tools/PdfEditorView";
import PdfToWordView from "./components/tools/PdfToWordView";
import WordToPdfView from "./components/tools/WordToPdfView";
import ShareQrModal, { ShareableFile } from "./components/ShareQrModal";
import MobileDownloadView from "./components/MobileDownloadView";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { uid } from "./lib/files";

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>("image-to-pdf");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [toolInitialFiles, setToolInitialFiles] = useState<File[]>([]);

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("imagepro-theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shareModalFile, setShareModalFile] = useState<ShareableFile | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("download");
  });

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("imagepro-theme", dark ? "dark" : "light");
  }, [dark]);

  // Global Hotkeys: Cmd+K for Command Palette, Numbers 1-9 for instant tool switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const found = STUDIO_TOOLS.find(
          (t) => t.shortcut.toUpperCase() === e.key.toUpperCase()
        );
        if (found) {
          e.preventDefault();
          setActiveTool(found.id);
          setIsCatalogOpen(false);
          notify(`Switched to ${found.name}`, "info");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notify = (text: string, kind: Toast["kind"] = "info") => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, text, kind }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4200
    );
  };

  const handleLaunchTool = (id: ToolId) => {
    setActiveTool(id);
    setIsCatalogOpen(false);
  };

  const handleSendToTool = (toolId: ToolId, files: File[]) => {
    setActiveTool(toolId);
    setToolInitialFiles([...files]);
    setIsCatalogOpen(false);
    notify(`Loaded ${files.length} file(s) into ${toolId.replace(/-/g, " ")}!`, "success");
  };

  const handleOmniRoute = (toolId: ToolId, files: File[]) => {
    setStagedFiles((prev) => [...prev, ...files]);
    setActiveTool(toolId);
    setToolInitialFiles([...files]);
    setIsCatalogOpen(false);
    notify(`Loaded ${files.length} file(s) into ${toolId.replace(/-/g, " ")}!`, "info");
  };

  const currentToolDef = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];

  if (downloadId) {
    return (
      <MobileDownloadView
        downloadId={downloadId}
        onGoToStudio={() => {
          window.history.pushState({}, "", "/");
          setDownloadId(null);
        }}
      />
    );
  }

  return (
    <>
      <StudioLayout
        activeTool={activeTool}
        onSelectTool={(id) => {
          setActiveTool(id);
          setIsCatalogOpen(false);
        }}
        isCatalogOpen={isCatalogOpen}
        onToggleCatalog={() => setIsCatalogOpen(!isCatalogOpen)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        stagedFiles={stagedFiles}
        onAddStagedFiles={(files) => {
          setStagedFiles((prev) => [...prev, ...files]);
          notify(`Added ${files.length} file(s) to Session Staging Shelf!`, "info");
        }}
        onRemoveStagedFile={(idx) => {
          setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
        }}
        onClearStagedFiles={() => {
          setStagedFiles([]);
          notify("Staging shelf cleared", "info");
        }}
        onSendToTool={handleSendToTool}
        catalogContent={
          <HubView
            onLaunchTool={handleLaunchTool}
            onOmniRoute={handleOmniRoute}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        }
        toolContent={
          <div className="space-y-6">
            {/* Active Tool View Content */}
            <div>
              {activeTool === "image-to-pdf" && (
                <ImageToPdfView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("pdf-to-image")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "resizer" && (
                <ImageResizerView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("dimension-converter")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "compressor" && (
                <ImageCompressorView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("pdf-compressor")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "pdf-compressor" && (
                <PdfCompressorView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("compressor")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "pdf-to-image" && (
                <PdfToImageView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("image-to-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "pdf-merger" && (
                <PdfMergerView
                  notify={notify}
                  onSwitchViceVersa={() => setActiveTool("pdf-splitter")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "pdf-splitter" && (
                <PdfSplitterView
                  notify={notify}
                  onSwitchViceVersa={() => setActiveTool("pdf-merger")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "image-converter" && (
                <ImageConverterView
                  notify={notify}
                  onSwitchViceVersa={() => setActiveTool("compressor")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "extender" && (
                <CanvasExtenderView
                  notify={notify}
                  onSwitchViceVersa={() => setActiveTool("resizer")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "dimension-converter" && (
                <DimensionConverterView
                  onSwitchViceVersa={() => setActiveTool("resizer")}
                />
              )}
              {activeTool === "sign-pdf" && (
                <PdfSignView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("watermark-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "watermark-pdf" && (
                <PdfWatermarkView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("sign-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "rotate-pdf" && (
                <PdfRotateView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("organize-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "organize-pdf" && (
                <PdfOrganizeView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("rotate-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "edit-pdf" && (
                <PdfEditorView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("pdf-compressor")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "pdf-to-word" && (
                <PdfToWordView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("word-to-pdf")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
              {activeTool === "word-to-pdf" && (
                <WordToPdfView
                  notify={notify}
                  initialFiles={toolInitialFiles}
                  onSwitchViceVersa={() => setActiveTool("pdf-to-word")}
                  onShareFile={(file) => setShareModalFile(file)}
                />
              )}
            </div>
          </div>
        }
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTool={handleLaunchTool}
        onOpenAbout={() => setIsAboutOpen(true)}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
      />

      {/* About ImagePro Modal Sheet */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenTool={handleLaunchTool}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((curr) => curr.filter((t) => t.id !== id))}
      />

      {/* Mobile QR Code & Share Modal */}
      <ShareQrModal
        isOpen={!!shareModalFile}
        onClose={() => setShareModalFile(null)}
        file={shareModalFile}
        notify={notify}
      />

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </>
  );
}
