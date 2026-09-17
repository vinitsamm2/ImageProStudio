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
    "pdf-compressor": "PDF Compressor",
    "protect-pdf": "Protect PDF",
    "unlock-pdf": "Unlock PDF",
    "page-number-pdf": "Add Page Numbers",
    "pdf-text-extractor": "PDF Text Extractor",
    "exif-cleaner": "Image EXIF Cleaner",
    "crop-pdf": "Crop PDF",
    // Catalog View
    turnAnyFile: "Turn Any File into",
    perfection: "Perfection.",
    heroSubtitle: "The In-Browser Media Workstation",
    heroDesc: "Convert PDF to JPG/PNG online. Compress certificates under 200KB and resize passport photos to 35x45mm for UPSC, SSC, NEET, and JEE applications. 100% private.",
    exploreTheSuite: "Explore The Suite",
    studioToolsUtilities: "Studio Tools & Utilities",
    allToolsCount: "All Tools",
    imageStudio: "Image Studio",
    pdfPowerhouse: "PDF Powerhouse",
    dropFileOrClick: "Drop file or click",
    launch: "Launch",
    whyChooseTitle: "Why Choose ImagePro Studio",
    whyChooseHeading: "100% Free Client-Side Image Editor & PDF Tools",
    whyChooseSub: "Engineered with modern WebAssembly, HTML5 2D Canvas, and vector PDF processing, ImagePro Studio delivers instant desktop-class media processing directly inside your browser without upload queues or cloud security risks.",
    feature1Title: "Online Bulk Image Resizer Without Upload",
    feature1Desc: "Most image manipulation websites upload your files to third-party cloud servers, posing severe privacy risks. ImagePro Studio is a free client-side image editor where all compression, cropping, resizing, and pixel interpolation run locally in your computer or phone's memory. Your pictures, signatures, and confidential marksheet scans are never transmitted across the network.",
    feature2Title: "Convert PNG to WebP & PDF to Word DOCX",
    feature2Desc: "Easily convert between modern web and print formats. Use our convert PNG to WebP browser tool to reduce web asset weight by up to 80% without visible quality degradation. Furthermore, our PDF to Word DOCX converter without upload and Word to PDF in-browser vector converter support 6 Microsoft Word extensions with structure, headings, and lists intact.",
    feature3Title: "UPSC, SSC, NEET, JEE & Job Form Presets",
    feature3Desc: "Eliminate rejected examination applications. Quickly generate compliant 35×45mm passport photos with clean white backgrounds, format signatures strictly between 10KB and 20KB, and compress certificates and marksheets to PDF under 200KB or 100KB without compromising legibility.",
    faqBadge: "Got Questions?",
    faqTitle: "Frequently Asked Questions",
    faqSub: "Everything you need to know about privacy, supported formats, and examination presets."
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
    "pdf-compressor": "PDFファイル圧縮",
    "protect-pdf": "PDFパスワード保護",
    "unlock-pdf": "PDFパスワード解除",
    "page-number-pdf": "PDFページ番号追加",
    "pdf-text-extractor": "PDFテキスト抽出",
    "exif-cleaner": "画像EXIF情報削除",
    "crop-pdf": "PDFトリミング・切り抜き",
    // Catalog View
    turnAnyFile: "あらゆるファイルを",
    perfection: "完璧な仕上がりに。",
    heroSubtitle: "ブラウザ完結型メディアスタジオ",
    heroDesc: "各種国家試験・公務員試験・大学出願・企業採用フォームに完全対応。35×45mm証明写真作成、10〜20KB署名サイズ調整、200KB以下PDF圧縮、電子署名、相互変換などすべて端末内ローカルで高速処理します。完全無料・無制限・高セキュリティ。",
    exploreTheSuite: "ツール一覧を見る",
    studioToolsUtilities: "スタジオツール＆機能",
    allToolsCount: "全ツール",
    imageStudio: "画像スタジオ",
    pdfPowerhouse: "PDFツール集",
    dropFileOrClick: "ファイルをドロップまたはクリック",
    launch: "起動する",
    whyChooseTitle: "ImagePro Studio が選ばれる理由",
    whyChooseHeading: "100% 無料・端末内完結の画像編集＆PDFツール",
    whyChooseSub: "WebAssembly、HTML5 Canvas、ベクターPDF技術を駆使し、クラウドへのアップロード待機やプライバシー漏洩の心配なく、快適なデスクトップ級の処理を実現します。",
    feature1Title: "サーバー送信ゼロの安全な画像一括リサイズ",
    feature1Desc: "通常の編集サイトとは異なり、ファイルは外部サーバーへ送信されません。すべての圧縮・トリミング・サイズ変更はお手元の端末メモリ内でローカルに実行されるため安全です。",
    feature2Title: "PNGからWebP変換＆PDFからWord変換",
    feature2Desc: "画質を保ったまま画像容量を最大80%削減するWebP変換や、見出し・段落構造を忠実に再現するPDFからWord(DOCX)変換に完全対応。",
    feature3Title: "各種申請・試験用プリセット完備",
    feature3Desc: "35×45mmのパスポート写真、10〜20KBの署名画像、200KB/100KB以下のPDF証明書圧縮など、規定サイズにワンクリックで最適化。",
    faqBadge: "よくあるご質問",
    faqTitle: "よくある質問 (FAQ)",
    faqSub: "プライバシー保護、対応ファイル形式、出願プリセットに関する詳細情報。"
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
    "pdf-compressor": "PDF 압축기",
    "protect-pdf": "PDF 비밀번호 설정",
    "unlock-pdf": "PDF 비밀번호 해제",
    "page-number-pdf": "PDF 페이지 번호 매기기",
    "pdf-text-extractor": "PDF 텍스트 추출",
    "exif-cleaner": "이미지 EXIF 삭제",
    "crop-pdf": "PDF 자르기",
    // Catalog View
    turnAnyFile: "모든 파일을 완벽하게",
    perfection: "완성하세요.",
    heroSubtitle: "브라우저 기반 미디어 워크스테이션",
    heroDesc: "공무원 시험, 공채 및 대학 입학 원서 접수에 최적화되었습니다. 35×45mm 여권용 사진 규격 조절, 10~20KB 서명 용량 맞춤, 200KB 이하 PDF 성적표 압축, 전자 서명 및 포맷 변환을 100% 로컬에서 안전하게 처리합니다.",
    exploreTheSuite: "도구 둘러보기",
    studioToolsUtilities: "스튜디오 도구 및 유틸리티",
    allToolsCount: "전체 도구",
    imageStudio: "이미지 스튜디오",
    pdfPowerhouse: "PDF 파워하우스",
    dropFileOrClick: "파일을 드롭하거나 클릭",
    launch: "도구 실행",
    whyChooseTitle: "ImagePro Studio를 선택하는 이유",
    whyChooseHeading: "100% 무료 클라이언트 기반 이미지 편집기 & PDF 도구",
    whyChooseSub: "최신 WebAssembly와 HTML5 Canvas 기술로 클라우드 업로드 대기나 개인정보 유출 걱정 없이 브라우저 내에서 즉각적인 파일 처리를 지원합니다.",
    feature1Title: "서버 업로드 없는 안전한 대량 이미지 리사이즈",
    feature1Desc: "일반 웹사이트와 달리 귀하의 파일은 외부 서버로 전송되지 않습니다. 모든 압축, 크롭, 리사이징이 사용자의 기기 메모리에서 로컬로 안전하게 작동합니다.",
    feature2Title: "PNG를 WebP로 변환 & PDF를 Word로 변환",
    feature2Desc: "품질 손실 없이 파일 용량을 최대 80% 줄이는 WebP 변환과 제목, 단락, 목록 구조를 완벽 보존하는 PDF-Word 변환을 제공합니다.",
    feature3Title: "각종 원서 접수 규격 프리셋 지원",
    feature3Desc: "35×45mm 여권 사진 규격, 10~20KB 서명 파일 용량, 200KB/100KB 이하 PDF 압축 등 시험 및 채용 사이트의 규격을 손쉽게 맞출 수 있습니다.",
    faqBadge: "궁금한 점이 있으신가요?",
    faqTitle: "자주 묻는 질문 (FAQ)",
    faqSub: "보안 원리, 지원되는 파일 형식 및 원서 프리셋에 관한 모든 안내입니다."
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
    "pdf-compressor": "PDF压缩工具",
    "protect-pdf": "PDF密码保护",
    "unlock-pdf": "PDF密码解除",
    "page-number-pdf": "添加PDF页码",
    "pdf-text-extractor": "PDF文本提取",
    "exif-cleaner": "图片EXIF信息清理",
    "crop-pdf": "PDF裁剪页面",
    // Catalog View
    turnAnyFile: "将任何文件打造为",
    perfection: "完美之作。",
    heroSubtitle: "浏览器本地多媒体处理工作站",
    heroDesc: "专为学生、求职者及考务人员定制。支持35×45mm证件照快速排版、10–20KB签名精准缩减、200KB以内成绩单PDF压缩、水印、签名及双向格式转换。完全免费、无限制且100%保护隐私。",
    exploreTheSuite: "浏览工具套件",
    studioToolsUtilities: "工作室工具与实用程序",
    allToolsCount: "全部工具",
    imageStudio: "图片工作室",
    pdfPowerhouse: "PDF强大工具",
    dropFileOrClick: "拖入文件或点击上传",
    launch: "立即打开",
    whyChooseTitle: "为什么选择 ImagePro Studio",
    whyChooseHeading: "100% 免费客户端本地图像编辑与PDF工具",
    whyChooseSub: "基于前沿 WebAssembly 与 HTML5 Canvas 技术，直接在您的本地浏览器内完成桌面级性能处理，无需排队等待云端上传，零隐私泄露风险。",
    feature1Title: "无需上传服务器的批量图片尺寸调整",
    feature1Desc: "大部分网站会将文件上传到第三方服务器造成隐私隐患。ImagePro Studio 完全在您电脑或手机内存中运行压缩、裁剪与缩放，绝不通过网络传输。",
    feature2Title: "PNG转WebP高压缩格式与PDF转Word文档",
    feature2Desc: "可将图片体积减少多达80%同时保持高画质，更支持无需上传的PDF转Word(DOCX)，保留原有段落标题与列表排版。",
    feature3Title: "官方考务与报考系统专属预设",
    feature3Desc: "告别因规格不符造成的报名驳回。一键生成符合要求的35×45mm证件照、精确将签名压缩至10–20KB，并将PDF文件缩减至200KB或100KB以内。",
    faqBadge: "常见疑问",
    faqTitle: "常见问题解答 (FAQ)",
    faqSub: "关于隐私保护机制、支持的文件格式以及各类官方考试预设的详细说明。"
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
    "pdf-compressor": "PDF कंप्रेसर",
    "protect-pdf": "PDF सुरक्षित करें",
    "unlock-pdf": "PDF अनलॉक करें",
    "page-number-pdf": "PDF पेज नंबर डालें",
    "pdf-text-extractor": "PDF टेक्स्ट एक्सट्रैक्टर",
    "exif-cleaner": "फोटो EXIF क्लीनर",
    "crop-pdf": "PDF क्रॉप करें",
    // Catalog View
    turnAnyFile: "किसी भी फाइल को बनाएं",
    perfection: "सर्वोत्तम और सटीक।",
    heroSubtitle: "ब्राउज़र-आधारित मीडिया वर्कस्टेशन",
    heroDesc: "छात्रों एवं नौकरी के आवेदकों (UPSC, SSC, NEET, JEE, GATE, IBPS, राज्य PSC, विश्वविद्यालयों) के फॉर्म भरने हेतु विशेष रूप से तैयार। 35×45mm पासपोर्ट फोटो, 10–20KB हस्ताक्षर, 200KB से कम PDF मार्कशीट, वॉटरमार्क, डिजिटल साइन और फॉर्मेट कन्वर्टर। 100% मुफ़्त, सुरक्षित एवं निजी।",
    exploreTheSuite: "सभी टूल्स देखें",
    studioToolsUtilities: "स्टूडियो टूल्स और सुविधाएं",
    allToolsCount: "सभी टूल्स",
    imageStudio: "फोटो स्टूडियो",
    pdfPowerhouse: "PDF पावरहाउस",
    dropFileOrClick: "फाइल यहां छोड़ें या क्लिक करें",
    launch: "शुरू करें",
    whyChooseTitle: "ImagePro Studio क्यों चुनें",
    whyChooseHeading: "100% मुफ़्त एवं बिना अपलोड का फोटो व PDF स्टूडियो",
    whyChooseSub: "आधुनिक WebAssembly और HTML5 Canvas तकनीक से लैस, ImagePro Studio आपके ब्राउज़र में ही बिना किसी सर्वर अपलोड के तुरंत परिणाम देता है।",
    feature1Title: "बिना सर्वर अपलोड का सुरक्षित फोटो रिसाइज़र",
    feature1Desc: "अन्य वेबसाइटों के विपरीत, आपकी तस्वीरें और दस्तावेज़ किसी सर्वर पर अपलोड नहीं होते। सभी कंप्रेशन, क्रॉप और साइजिंग सीधे आपके फोन या कंप्यूटर में प्रोसेस होते हैं।",
    feature2Title: "PNG से WebP और PDF से Word कन्वर्टर",
    feature2Desc: "WebP टूल से फाइल का आकार 80% तक कम करें और PDF से Word कनवर्टर द्वारा मूल हेडिंग और पैराग्राफ सुरक्षित रखें।",
    feature3Title: "सरकारी परीक्षा व प्रवेश फॉर्म प्रीसेट्स",
    feature3Desc: "35×45mm पासपोर्ट साइज फोटो, 10–20KB हस्ताक्षर, और 200KB या 100KB से कम PDF मार्कशीट बनाएं 100% गारंटीड स्वीकृति के साथ।",
    faqBadge: "कोई प्रश्न है?",
    faqTitle: "अक्सर पूछे जाने वाले सवाल (FAQ)",
    faqSub: "गोपनीयता, समर्थित फॉर्मेट और परीक्षा प्रीसेट्स के बारे में सभी आवश्यक जानकारी।"
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
    "pdf-compressor": "Comprimir PDF",
    "protect-pdf": "Proteger PDF",
    "unlock-pdf": "Desbloquear PDF",
    "page-number-pdf": "Numerar páginas PDF",
    "pdf-text-extractor": "Extractor de texto PDF",
    "exif-cleaner": "Limpiador EXIF de imágenes",
    "crop-pdf": "Recortar PDF",
    // Catalog View
    turnAnyFile: "Transforma cualquier archivo en",
    perfection: "Perfección.",
    heroSubtitle: "Estudio multimedia 100% en el navegador",
    heroDesc: "Diseñado para estudiantes y profesionales. Crea fotos de carnet de 35×45mm, ajusta firmas a 10–20KB, comprime PDF a menos de 200KB, añade firmas y convierte formatos con garantía total. Gratuito, ilimitado y 100% privado.",
    exploreTheSuite: "Explorar la suite",
    studioToolsUtilities: "Herramientas y Utilidades",
    allToolsCount: "Todas las herramientas",
    imageStudio: "Estudio de Imagen",
    pdfPowerhouse: "Centro de PDF",
    dropFileOrClick: "Suelta el archivo o haz clic",
    launch: "Abrir herramienta",
    whyChooseTitle: "Por qué elegir ImagePro Studio",
    whyChooseHeading: "Editor de imágenes y herramientas PDF 100% gratis en tu navegador",
    whyChooseSub: "Tecnología WebAssembly y Canvas HTML5 para procesar tus archivos localmente en tu dispositivo, sin colas de subida ni riesgos en la nube.",
    feature1Title: "Redimensión masiva de imágenes sin subir archivos",
    feature1Desc: "Tus archivos nunca se transmiten a servidores externos. Todo el procesamiento se realiza en la memoria local de tu dispositivo.",
    feature2Title: "Conversión de PNG a WebP y PDF a Word DOCX",
    feature2Desc: "Reduce el peso de tus imágenes hasta un 80% con WebP y convierte PDF a Word conservando párrafos, títulos y listas intactos.",
    feature3Title: "Preajustes para trámites y formularios oficiales",
    feature3Desc: "Optimiza fotos de pasaporte a 35×45mm, firmas entre 10KB y 20KB, y documentos PDF bajo 200KB con aceptación garantizada.",
    faqBadge: "¿Tienes preguntas?",
    faqTitle: "Preguntas Frecuentes (FAQ)",
    faqSub: "Todo lo que necesitas saber sobre privacidad, formatos admitidos y preajustes."
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
    "pdf-compressor": "Compresser PDF",
    "protect-pdf": "Protéger le PDF",
    "unlock-pdf": "Déverrouiller le PDF",
    "page-number-pdf": "Numéroter les pages PDF",
    "pdf-text-extractor": "Extracteur de texte PDF",
    "exif-cleaner": "Nettoyeur EXIF d'image",
    "crop-pdf": "Rogner le PDF",
    // Catalog View
    turnAnyFile: "Transformez vos fichiers avec",
    perfection: "Perfection.",
    heroSubtitle: "Station multimédia 100% intégrée au navigateur",
    heroDesc: "Conçu pour les étudiants et les professionnels. Créez des photos d'identité 35×45mm, ajustez des signatures à 10–20Ko, compressez des PDF sous 200Ko, signez et convertissez en toute sécurité. Gratuit, illimité et confidentiel.",
    exploreTheSuite: "Explorer les outils",
    studioToolsUtilities: "Outils Studio & Utilitaires",
    allToolsCount: "Tous les outils",
    imageStudio: "Studio d'Image",
    pdfPowerhouse: "Centre PDF",
    dropFileOrClick: "Déposez ou cliquez",
    launch: "Lancer",
    whyChooseTitle: "Pourquoi choisir ImagePro Studio",
    whyChooseHeading: "Éditeur d'images et outils PDF 100% gratuits côté client",
    whyChooseSub: "Développé avec WebAssembly et Canvas HTML5 pour un traitement instantané et privé sans aucun envoi vers un serveur cloud.",
    feature1Title: "Redimensionnement d'images sans téléchargement",
    feature1Desc: "Vos fichiers restent strictement dans la mémoire de votre appareil et ne transitent jamais sur le réseau.",
    feature2Title: "Conversion PNG vers WebP et PDF vers Word DOCX",
    feature2Desc: "Allégez vos fichiers jusqu'à 80% sans perte de netteté et convertissez vos PDF en Word tout en conservant la structure.",
    feature3Title: "Préréglages officiels pour formulaires et concours",
    feature3Desc: "Photos d'identité 35×45mm, signatures calibrées entre 10 et 20Ko, et compression PDF sous 200Ko avec garantie d'acceptation.",
    faqBadge: "Des questions ?",
    faqTitle: "Foire Aux Questions (FAQ)",
    faqSub: "Tout ce qu'il faut savoir sur la confidentialité, les formats supportés et les préréglages."
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
    "pdf-compressor": "PDF komprimieren",
    "protect-pdf": "PDF schützen",
    "unlock-pdf": "PDF entsperren",
    "page-number-pdf": "PDF Seitenzahlen hinzufügen",
    "pdf-text-extractor": "PDF Textextraktor",
    "exif-cleaner": "Bild EXIF Bereiniger",
    "crop-pdf": "PDF zuschneiden",
    // Catalog View
    turnAnyFile: "Verwandeln Sie jede Datei in",
    perfection: "Perfektion.",
    heroSubtitle: "Die browserbasierte Medien-Workstation",
    heroDesc: "Entwickelt für Studenten und Berufstätige. Erstellen Sie 35×45mm Passfotos, skalieren Sie Unterschriften auf 10–20KB, komprimieren Sie PDFs unter 200KB, signieren und konvertieren Sie Dokumente. 100% kostenlos, unbegrenzt und privat.",
    exploreTheSuite: "Suite erkunden",
    studioToolsUtilities: "Studio-Werkzeuge & Dienstprogramme",
    allToolsCount: "Alle Werkzeuge",
    imageStudio: "Bild-Studio",
    pdfPowerhouse: "PDF Kraftpaket",
    dropFileOrClick: "Datei ablegen oder klicken",
    launch: "Starten",
    whyChooseTitle: "Warum ImagePro Studio wählen",
    whyChooseHeading: "100% kostenlose clientseitige Bild- und PDF-Werkzeuge",
    whyChooseSub: "Modernes WebAssembly und HTML5 Canvas ermöglichen Desktop-Performance direkt in Ihrem Browser ohne Cloud-Uploads oder Datenschutzrisiken.",
    feature1Title: "Massen-Bildskalierung ohne Server-Upload",
    feature1Desc: "Ihre Daten werden nicht an fremde Server übertragen. Sämtliche Bearbeitungen laufen ausschließlich im lokalen Speicher Ihres Geräts.",
    feature2Title: "PNG zu WebP & PDF zu Word DOCX Konverter",
    feature2Desc: "Sparen Sie bis zu 80% Speicherplatz mit WebP und konvertieren Sie PDFs in Word-Dokumente mit originalgetreuen Überschriften und Absätzen.",
    feature3Title: "Vorlagen für Bewerbungen und offizielle Anträge",
    feature3Desc: "Generieren Sie konforme 35×45mm Passfotos, Unterschriften zwischen 10KB und 20KB sowie PDFs unter 200KB.",
    faqBadge: "Haben Sie Fragen?",
    faqTitle: "Häufig gestellte Fragen (FAQ)",
    faqSub: "Wissenswertes über Datenschutz, unterstützte Dateiformate und Antrags-Vorlagen."
  }
};

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentMeta: LanguageMeta;
  t: (key: string, fallback?: string) => string;
};

/**
 * Automatically detects the user's regional language based on browser languages
 * and Intl timezone region. Defaults to English ('en') if region is not matched
 * or if the region is India (where English is the standard for portal/exam tools).
 */
export function detectRegionLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
    // India explicitly defaults to English
    if (tz.includes("kolkata") || tz.includes("calcutta") || tz.includes("india")) {
      return "en";
    }

    // Check primary user preferred browser language
    const navLangs = navigator.languages ? Array.from(navigator.languages) : [navigator.language || ""];
    const primary = (navLangs[0] || "").toLowerCase().split("-")[0] as LanguageCode;
    if (primary === "en") return "en";
    if (["es", "fr", "de", "ja", "ko", "zh", "hi"].includes(primary)) {
      return primary;
    }

    // Check region from other timezones
    if (tz.includes("tokyo") || tz.includes("japan")) return "ja";
    if (tz.includes("seoul") || tz.includes("pyongyang") || tz.includes("korea")) return "ko";
    if (
      tz.includes("shanghai") ||
      tz.includes("beijing") ||
      tz.includes("chongqing") ||
      tz.includes("urumqi") ||
      tz.includes("harbin") ||
      tz.includes("hong_kong") ||
      tz.includes("taipei") ||
      tz.includes("macau")
    ) {
      return "zh";
    }
    if (tz.includes("paris") || tz.includes("brussels") || tz.includes("monaco")) return "fr";
    if (tz.includes("berlin") || tz.includes("vienna") || tz.includes("zurich")) return "de";
    if (
      tz.includes("madrid") ||
      tz.includes("canary") ||
      tz.includes("mexico") ||
      tz.includes("cancun") ||
      tz.includes("bogota") ||
      tz.includes("buenos_aires") ||
      tz.includes("cordoba") ||
      tz.includes("mendoza") ||
      tz.includes("lima") ||
      tz.includes("santiago") ||
      tz.includes("caracas") ||
      tz.includes("guatemala") ||
      tz.includes("guayaquil") ||
      tz.includes("havana") ||
      tz.includes("la_paz") ||
      tz.includes("santo_domingo") ||
      tz.includes("tegucigalpa") ||
      tz.includes("asuncion") ||
      tz.includes("el_salvador") ||
      tz.includes("managua") ||
      tz.includes("costa_rica") ||
      tz.includes("panama") ||
      tz.includes("montevideo")
    ) {
      return "es";
    }
  } catch (e) {}

  return "en";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get("lang") as LanguageCode;
    if (langParam && TRANSLATIONS[langParam]) return langParam;

    const saved = localStorage.getItem("imagepro-lang") as LanguageCode;
    if (saved && TRANSLATIONS[saved]) return saved;

    const detected = detectRegionLanguage();
    if (detected === "en") {
      return "en";
    }

    return detected;
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
    applyPageTranslation(language);
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

let studioTranslatorPromise: Promise<typeof import("./studioTranslator")> | null = null;
function getStudioTranslator() {
  if (!studioTranslatorPromise) {
    studioTranslatorPromise = import("./studioTranslator");
  }
  return studioTranslatorPromise;
}

/**
 * Translates the entire webpage (all text, tools, FAQs, modals, buttons)
 * using the instant in-memory dictionary engine.
 * Works 100% locally and offline without external services or Google Translate.
 */
export function applyPageTranslation(lang: LanguageCode) {
  if (typeof window === "undefined") return;

  // Instant in-memory translation loaded on-demand
  getStudioTranslator().then((mod) => {
    mod.applyStudioNativeTranslation(lang, TRANSLATIONS);
  });

  // 2. Clear any residual Google Translate cookies
  try {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost") {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${hostname}; path=/; SameSite=Lax`;
    }
  } catch (e) {}
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
