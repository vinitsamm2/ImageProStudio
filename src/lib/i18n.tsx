import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type LanguageCode = "en" | "ja" | "ko" | "zh" | "hi" | "es" | "fr" | "de";

export type LanguageMeta = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  country: string;
  flag: string; // Emoji
};

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", country: "United States / Global", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", country: "Japan", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", country: "South Korea", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "简体中文", country: "China", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", country: "India", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", country: "Spain / LatAm", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", country: "France", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", country: "Germany", flag: "🇩🇪" }
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    studioTitle: "ImagePro Studio",
    tagline: "100% In-Browser Media Workstation",
    freeBadge: "100% Free & Unlimited",
    examBadge: "Exam Form Fill Ready • 100% Free",
    privacyNotice: "Your files are processed locally in your browser and never stored on any server.",
    search: "Search",
    commandPalette: "Command Palette",
    aboutUs: "About Us",
    studioCanvas: "Studio Canvas",
    catalogView: "Catalog View",
    allTools: "All Tools",
    all: "All",
    pdf: "PDFs",
    image: "Images",
    priority: "Priority",
    flip: "Flip",
    switchTo: "Switch to",
    language: "Language",
    selectLanguage: "Select Language",
    createdForStudents: "Created for Students & Employees • 100% Accepted for All Examination & Job Forms",
    browseFiles: "Browse Files",
    pasteClipboard: "Paste (Ctrl/Cmd+V)",
    applyChanges: "Apply Changes",
    download: "Download",
    // Tools
    "edit-pdf": "PDF Editor",
    "pdf-to-word": "PDF to Word / Docs",
    "word-to-pdf": "Word to PDF",
    "image-to-pdf": "Image to PDF",
    "resizer": "Image Resizer",
    "compressor": "Image Compressor",
    "pdf-to-image": "PDF to Image",
    "pdf-splitter": "PDF Splitter",
    "pdf-merger": "PDF Merger",
    "image-converter": "Format Converter",
    "dimension-converter": "Unit & DPI Calc",
    "extender": "Canvas Extender",
    "sign-pdf": "Sign PDF",
    "watermark-pdf": "Watermark PDF",
    "rotate-pdf": "Rotate PDF",
    "organize-pdf": "Organize PDF",
    "pdf-compressor": "PDF Compressor"
  },
  ja: {
    studioTitle: "ImagePro Studio",
    tagline: "100% ブラウザ完結型メディアスタジオ",
    freeBadge: "100% 無料＆無制限",
    examBadge: "受験・申請書類に最適 • 100% 無料",
    privacyNotice: "ファイルは端末のブラウザ内でローカル処理され、サーバーに保存されることは一切ありません。",
    search: "検索",
    commandPalette: "コマンドパレット",
    aboutUs: "スタジオ概要",
    studioCanvas: "編集キャンバス",
    catalogView: "全ツール一覧",
    allTools: "ツール一覧",
    all: "すべて",
    pdf: "PDFツール",
    image: "画像ツール",
    priority: "高優先",
    flip: "入替",
    switchTo: "切替：",
    language: "言語",
    selectLanguage: "言語を選択",
    createdForStudents: "学生および社会人向け • 各種試験・公的申請ポータル完全対応",
    browseFiles: "ファイルを選択",
    pasteClipboard: "貼り付け (Ctrl/Cmd+V)",
    applyChanges: "変更を適用",
    download: "ダウンロード",
    // Tools
    "edit-pdf": "PDF編集ツール",
    "pdf-to-word": "PDFからWord変換",
    "word-to-pdf": "WordからPDF変換",
    "image-to-pdf": "画像からPDF作成",
    "resizer": "画像リサイズ",
    "compressor": "画像圧縮ツール",
    "pdf-to-image": "PDFから画像変換",
    "pdf-splitter": "PDFページ分割",
    "pdf-merger": "PDFファイル結合",
    "image-converter": "画像形式変換",
    "dimension-converter": "寸法・DPI計算",
    "extender": "キャンバス拡張",
    "sign-pdf": "PDF電子署名",
    "watermark-pdf": "PDF透かし追加",
    "rotate-pdf": "PDF回転",
    "organize-pdf": "PDFページ並べ替え",
    "pdf-compressor": "PDFファイル圧縮"
  },
  ko: {
    studioTitle: "ImagePro Studio",
    tagline: "100% 브라우저 기반 미디어 워크스테이션",
    freeBadge: "100% 무료 및 무제한",
    examBadge: "입학/공채 원서 최적화 • 100% 무료",
    privacyNotice: "파일은 기기 브라우저에서 로컬로만 처리되며 서버로 전송되거나 저장되지 않습니다.",
    search: "검색",
    commandPalette: "명령 팔레트",
    aboutUs: "소개",
    studioCanvas: "작업 캔버스",
    catalogView: "전체 도구",
    allTools: "도구 목록",
    all: "전체",
    pdf: "PDF 도구",
    image: "이미지 도구",
    priority: "우선",
    flip: "전환",
    switchTo: "도구 전환:",
    language: "언어",
    selectLanguage: "언어 선택",
    createdForStudents: "학생 및 취업 준비생을 위한 최적화 • 국가 고시 및 대학 입학 원서 규격 지원",
    browseFiles: "파일 선택",
    pasteClipboard: "붙여넣기 (Ctrl/Cmd+V)",
    applyChanges: "변경사항 적용",
    download: "다운로드",
    // Tools
    "edit-pdf": "PDF 편집기",
    "pdf-to-word": "PDF를 Word로 변환",
    "word-to-pdf": "Word를 PDF로 변환",
    "image-to-pdf": "이미지를 PDF로 변환",
    "resizer": "이미지 크기 조절",
    "compressor": "이미지 압축기",
    "pdf-to-image": "PDF를 이미지로 변환",
    "pdf-splitter": "PDF 분할",
    "pdf-merger": "PDF 병합",
    "image-converter": "이미지 포맷 변환",
    "dimension-converter": "단위 및 DPI 변환",
    "extender": "캔버스 확장",
    "sign-pdf": "PDF 서명 추가",
    "watermark-pdf": "PDF 워터마크 추가",
    "rotate-pdf": "PDF 회전",
    "organize-pdf": "PDF 페이지 정렬",
    "pdf-compressor": "PDF 압축기"
  },
  zh: {
    studioTitle: "ImagePro Studio",
    tagline: "100% 浏览器本地处理工作站",
    freeBadge: "100% 免费且无限制",
    examBadge: "考试与求职报名专用 • 100% 免费",
    privacyNotice: "您的文件仅在本地浏览器内存中处理，绝不会上传或存储在任何服务器上。",
    search: "搜索",
    commandPalette: "命令面板",
    aboutUs: "关于我们",
    studioCanvas: "工作室画布",
    catalogView: "工具大全",
    allTools: "所有工具",
    all: "全部",
    pdf: "PDF工具",
    image: "图像工具",
    priority: "优先",
    flip: "切换",
    switchTo: "切换至：",
    language: "语言",
    selectLanguage: "选择语言",
    createdForStudents: "专为学生与求职者打造 • 完美适配各类官方考试与资格报考系统",
    browseFiles: "浏览文件",
    pasteClipboard: "粘贴 (Ctrl/Cmd+V)",
    applyChanges: "应用更改",
    download: "下载",
    // Tools
    "edit-pdf": "PDF编辑器",
    "pdf-to-word": "PDF转Word文档",
    "word-to-pdf": "Word转PDF文档",
    "image-to-pdf": "图片转PDF",
    "resizer": "图片尺寸调整",
    "compressor": "图片压缩工具",
    "pdf-to-image": "PDF转图片",
    "pdf-splitter": "PDF拆分",
    "pdf-merger": "PDF合并",
    "image-converter": "图片格式转换",
    "dimension-converter": "尺寸与DPI换算",
    "extender": "画布留白扩展",
    "sign-pdf": "PDF电子签名",
    "watermark-pdf": "PDF水印添加",
    "rotate-pdf": "PDF页面旋转",
    "organize-pdf": "PDF页面管理与排序",
    "pdf-compressor": "PDF压缩工具"
  },
  hi: {
    studioTitle: "ImagePro Studio",
    tagline: "100% ब्राउज़र-आधारित मीडिया स्टूडियो",
    freeBadge: "100% मुफ़्त एवं असीमित",
    examBadge: "सरकारी परीक्षा व जॉब फॉर्म हेतु तैयार • 100% मुफ़्त",
    privacyNotice: "आपकी फाइलें आपके डिवाइस के ब्राउज़र में प्रोसेस होती हैं और सर्वर पर कभी अपलोड नहीं होतीं।",
    search: "खोजें",
    commandPalette: "कमांड पैलेट",
    aboutUs: "हमारे बारे में",
    studioCanvas: "स्टूडियो कैनवास",
    catalogView: "सभी टूल्स",
    allTools: "टूल्स सूची",
    all: "सभी",
    pdf: "PDF टूल्स",
    image: "फोटो टूल्स",
    priority: "प्राथमिक",
    flip: "बदलें",
    switchTo: "बदलें:",
    language: "भाषा",
    selectLanguage: "भाषा चुनें",
    createdForStudents: "छात्रों एवं नौकरी के आवेदकों हेतु • UPSC, SSC, NEET, JEE फॉर्म्स के लिए 100% मान्य",
    browseFiles: "फाइलें चुनें",
    pasteClipboard: "पेस्ट करें (Ctrl/Cmd+V)",
    applyChanges: "लागू करें",
    download: "डाउनलोड करें",
    // Tools
    "edit-pdf": "PDF एडिटर",
    "pdf-to-word": "PDF से Word कन्वर्टर",
    "word-to-pdf": "Word से PDF कन्वर्टर",
    "image-to-pdf": "फोटो से PDF बनाएं",
    "resizer": "फोटो साइज रिसाइज़र",
    "compressor": "फोटो कंप्रेसर",
    "pdf-to-image": "PDF से फोटो कन्वर्टर",
    "pdf-splitter": "PDF अलग करें",
    "pdf-merger": "PDF जोड़ें",
    "image-converter": "फोटो फॉर्मेट कन्वर्टर",
    "dimension-converter": "इंच/मिमी/DPI कैलकुलेटर",
    "extender": "कैनवास एक्सपैंडर",
    "sign-pdf": "PDF में डिजिटल साइन",
    "watermark-pdf": "PDF वॉटरमार्क",
    "rotate-pdf": "PDF रोटेट करें",
    "organize-pdf": "PDF पेज व्यवस्थित करें",
    "pdf-compressor": "PDF कंप्रेसर"
  },
  es: {
    studioTitle: "ImagePro Studio",
    tagline: "Estudio multimedia 100% en el navegador",
    freeBadge: "100% Gratis e Ilimitado",
    examBadge: "Ideal para Oposiciones y Trámites • 100% Gratis",
    privacyNotice: "Sus archivos se procesan localmente en su navegador y nunca se suben a ningún servidor.",
    search: "Buscar",
    commandPalette: "Paleta de comandos",
    aboutUs: "Acerca de",
    studioCanvas: "Lienzo de trabajo",
    catalogView: "Catálogo",
    allTools: "Todas las herramientas",
    all: "Todo",
    pdf: "PDFs",
    image: "Imágenes",
    priority: "Prioritario",
    flip: "Cambiar",
    switchTo: "Cambiar a",
    language: "Idioma",
    selectLanguage: "Seleccionar idioma",
    createdForStudents: "Creado para estudiantes y profesionales • 100% privado y seguro",
    browseFiles: "Explorar archivos",
    pasteClipboard: "Pegar (Ctrl/Cmd+V)",
    applyChanges: "Aplicar cambios",
    download: "Descargar",
    // Tools
    "edit-pdf": "Editor de PDF",
    "pdf-to-word": "PDF a Word",
    "word-to-pdf": "Word a PDF",
    "image-to-pdf": "Imagen a PDF",
    "resizer": "Redimensionar imagen",
    "compressor": "Comprimir imagen",
    "pdf-to-image": "PDF a imagen",
    "pdf-splitter": "Dividir PDF",
    "pdf-merger": "Unir PDFs",
    "image-converter": "Convertidor de formato",
    "dimension-converter": "Calculadora de DPI",
    "extender": "Extender lienzo",
    "sign-pdf": "Firmar PDF",
    "watermark-pdf": "Marca de agua PDF",
    "rotate-pdf": "Rotar PDF",
    "organize-pdf": "Organizar páginas PDF",
    "pdf-compressor": "Comprimir PDF"
  },
  fr: {
    studioTitle: "ImagePro Studio",
    tagline: "Station multimédia 100% dans votre navigateur",
    freeBadge: "100% Gratuit & Illimité",
    examBadge: "Prêt pour concours et formulaires • 100% Gratuit",
    privacyNotice: "Vos fichiers sont traités localement dans votre navigateur et ne sont jamais stockés sur aucun serveur.",
    search: "Rechercher",
    commandPalette: "Palette de commandes",
    aboutUs: "À propos",
    studioCanvas: "Espace de travail",
    catalogView: "Catalogue",
    allTools: "Tous les outils",
    all: "Tous",
    pdf: "PDF",
    image: "Images",
    priority: "Prioritaire",
    flip: "Basculer",
    switchTo: "Basculer vers",
    language: "Langue",
    selectLanguage: "Choisir la langue",
    createdForStudents: "Conçu pour les étudiants et candidats aux concours • 100% Privé",
    browseFiles: "Parcourir les fichiers",
    pasteClipboard: "Coller (Ctrl/Cmd+V)",
    applyChanges: "Appliquer",
    download: "Télécharger",
    // Tools
    "edit-pdf": "Éditeur PDF",
    "pdf-to-word": "PDF vers Word",
    "word-to-pdf": "Word vers PDF",
    "image-to-pdf": "Image vers PDF",
    "resizer": "Redimensionner image",
    "compressor": "Compresser image",
    "pdf-to-image": "PDF vers Image",
    "pdf-splitter": "Diviser PDF",
    "pdf-merger": "Fusionner PDFs",
    "image-converter": "Convertisseur de format",
    "dimension-converter": "Calculateur d'unités et DPI",
    "extender": "Agrandir le canevas",
    "sign-pdf": "Signer PDF",
    "watermark-pdf": "Filigrane PDF",
    "rotate-pdf": "Pivoter PDF",
    "organize-pdf": "Organiser les pages PDF",
    "pdf-compressor": "Compresser PDF"
  },
  de: {
    studioTitle: "ImagePro Studio",
    tagline: "100% browserbasierte Medien-Workstation",
    freeBadge: "100% Kostenlos & Unbegrenzt",
    examBadge: "Bereit für Bewerbungen & Prüfungen • 100% Frei",
    privacyNotice: "Ihre Dateien werden lokal im Browser verarbeitet und niemals auf einem Server gespeichert.",
    search: "Suchen",
    commandPalette: "Befehlspalette",
    aboutUs: "Über uns",
    studioCanvas: "Arbeitsbereich",
    catalogView: "Alle Werkzeuge",
    allTools: "Werkzeugkatalog",
    all: "Alle",
    pdf: "PDFs",
    image: "Bilder",
    priority: "Priorität",
    flip: "Wechseln",
    switchTo: "Wechseln zu",
    language: "Sprache",
    selectLanguage: "Sprache wählen",
    createdForStudents: "Für Studenten & Bewerber entwickelt • 100% privat & sicher",
    browseFiles: "Dateien durchsuchen",
    pasteClipboard: "Einfügen (Strg/Cmd+V)",
    applyChanges: "Änderungen anwenden",
    download: "Herunterladen",
    // Tools
    "edit-pdf": "PDF-Editor",
    "pdf-to-word": "PDF zu Word",
    "word-to-pdf": "Word zu PDF",
    "image-to-pdf": "Bild zu PDF",
    "resizer": "Bild skalieren",
    "compressor": "Bild komprimieren",
    "pdf-to-image": "PDF zu Bild",
    "pdf-splitter": "PDF teilen",
    "pdf-merger": "PDFs zusammenfügen",
    "image-converter": "Format-Konverter",
    "dimension-converter": "Maße & DPI Rechner",
    "extender": "Leinwand erweitern",
    "sign-pdf": "PDF signieren",
    "watermark-pdf": "PDF Wasserzeichen",
    "rotate-pdf": "PDF drehen",
    "organize-pdf": "PDF Seiten organisieren",
    "pdf-compressor": "PDF komprimieren"
  }
};

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentMeta: LanguageMeta;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get("lang") as LanguageCode;
    if (langParam && TRANSLATIONS[langParam]) return langParam;

    const saved = localStorage.getItem("imagepro-lang") as LanguageCode;
    if (saved && TRANSLATIONS[saved]) return saved;

    const browserLang = navigator.language?.slice(0, 2).toLowerCase() as LanguageCode;
    if (browserLang && TRANSLATIONS[browserLang]) return browserLang;

    return "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("imagepro-lang", lang);
      document.documentElement.lang = lang;
      applyPageTranslation(lang);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== "en") {
      applyPageTranslation(language);
    }
  }, [language]);

  const currentMeta = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentMeta, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Translates the entire webpage (all text, tools, FAQs, modals, buttons)
 * using the Google Translate engine and synchronization cookies.
 */
export function applyPageTranslation(lang: LanguageCode) {
  if (typeof window === "undefined") return;

  const target = lang === "zh" ? "zh-CN" : lang;
  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const rootDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join(".")}` : hostname;

  // Sync Google Translate googtrans cookie across root path & domains
  if (lang === "en") {
    document.cookie = "googtrans=/en/en; path=/;";
    document.cookie = `googtrans=/en/en; domain=${hostname}; path=/;`;
    if (rootDomain !== hostname) {
      document.cookie = `googtrans=/en/en; domain=${rootDomain}; path=/;`;
    }
  } else {
    document.cookie = `googtrans=/en/${target}; path=/;`;
    document.cookie = `googtrans=/en/${target}; domain=${hostname}; path=/;`;
    if (rootDomain !== hostname) {
      document.cookie = `googtrans=/en/${target}; domain=${rootDomain}; path=/;`;
    }
  }

  // Trigger Google Translate combo element dynamically
  const triggerCombo = () => {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      const targetVal =
        lang === "en"
          ? Array.from(select.options).some((o) => o.value === "en")
            ? "en"
            : ""
          : target;

      if (select.value !== targetVal) {
        select.value = targetVal;
        select.dispatchEvent(new Event("change"));
      }
      return true;
    }
    return false;
  };

  if (!triggerCombo()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (triggerCombo() || attempts > 25) {
        clearInterval(interval);
      }
    }, 200);
  }
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: "en" as LanguageCode,
      setLanguage: () => {},
      currentMeta: LANGUAGES[0],
      t: (key: string, fallback?: string) => TRANSLATIONS.en[key] || fallback || key
    };
  }
  return ctx;
}
