import { ToolId } from "../components/ToolGrid";

export type ToolFaq = {
  question: string;
  answer: string;
};

export type ToolHowToStep = {
  step: number;
  title: string;
  description: string;
};

export type ToolSeoDefinition = {
  toolId: ToolId;
  slug: string;
  aliases: string[];
  title: string;
  metaDescription: string;
  h1: string;
  tagline: string;
  howToSteps: ToolHowToStep[];
  faqs: ToolFaq[];
  relatedToolIds: ToolId[];
};

export const TOOL_ROUTES: Record<ToolId, ToolSeoDefinition> = {
  "resizer": {
    toolId: "resizer",
    slug: "/image-resizer",
    aliases: ["/resizer", "/photo-resizer", "/resize-image", "/resize-photo"],
    title: "Image Resizer - Resize Photo in KB, 35x45mm & Pixels Online Free | ImagePro Studio",
    metaDescription: "Free online photo resizer for passport 35x45mm dimensions, signature 10–20KB scaling, and exact pixel/cm/mm resizing. 100% private in-browser tool with zero server upload.",
    h1: "Online Image Resizer & Dimension Converter",
    tagline: "Resize photos to 35×45mm, scale signatures to 10–20KB, and adjust pixel dimensions with zero quality loss.",
    howToSteps: [
      { step: 1, title: "Upload Image", description: "Drag and drop your photo or signature (JPG, PNG, WebP) into the upload area." },
      { step: 2, title: "Select Preset or Dimensions", description: "Choose a standard exam preset (e.g. 35×45mm, UPSC/SSC/NEET signature) or enter custom width, height, and target KB." },
      { step: 3, title: "Download Resized Image", description: "Click Apply & Download to save your calibrated, high-resolution image instantly." }
    ],
    faqs: [
      {
        question: "How do I resize a passport photo to 35x45mm?",
        answer: "Upload your image, click on the '35×45mm Passport' preset button, adjust crop if needed, and download. It matches international passport and exam requirements perfectly."
      },
      {
        question: "How do I compress my signature between 10KB and 20KB?",
        answer: "Select the '10–20 KB Signature' preset under Target File Size. The tool automatically balances resolution and compression to stay strictly within the 10–20KB range."
      },
      {
        question: "Are my photos uploaded to any server?",
        answer: "No. All resizing, cropping, and compression happen 100% client-side inside your browser's memory using HTML5 Canvas and WebAssembly. Your photos never leave your device."
      }
    ],
    relatedToolIds: ["compressor", "dimension-converter", "extender", "image-to-pdf"]
  },
  "compressor": {
    toolId: "compressor",
    slug: "/image-compressor",
    aliases: ["/compressor", "/compress-image", "/reduce-image-size"],
    title: "Image Compressor - Reduce JPG, PNG & WebP File Size in KB Online Free | ImagePro Studio",
    metaDescription: "Compress image file sizes by up to 90% without visible quality loss. Target specific KB (e.g. 20KB, 50KB, 100KB) for government and recruitment portal submissions.",
    h1: "Fast In-Browser Image Compressor",
    tagline: "Compress JPG, PNG, and WebP images to exact KB sizes with real-time visual quality comparison.",
    howToSteps: [
      { step: 1, title: "Select Photos", description: "Drop one or multiple photos into the compression workspace." },
      { step: 2, title: "Set Target Size or Quality", description: "Choose a target size preset (under 50KB, 100KB, 200KB) or drag the visual quality slider." },
      { step: 3, title: "Download Compressed File", description: "Download your compressed image individually or all together as a single ZIP archive." }
    ],
    faqs: [
      {
        question: "Can I compress PNG without losing transparency?",
        answer: "Yes. Our compressor preserves alpha transparency channels while optimizing compression palettes."
      },
      {
        question: "How much file size reduction can I expect?",
        answer: "Most high-resolution photos can be reduced by 70% to 90% in file size with zero perceptible loss in screen sharpness."
      }
    ],
    relatedToolIds: ["resizer", "pdf-compressor", "image-converter"]
  },
  "pdf-compressor": {
    toolId: "pdf-compressor",
    slug: "/pdf-compressor",
    aliases: ["/compress-pdf", "/reduce-pdf-size"],
    title: "PDF Compressor - Compress PDF Under 200KB & 100KB Online Free | ImagePro Studio",
    metaDescription: "Compress PDF documents under 200KB or 100KB for UPSC, SSC, NEET, university admissions, and job applications. 100% private, browser-based compression with zero quality compromise.",
    h1: "Online PDF Compressor for Exams & Portals",
    tagline: "Reduce PDF document file sizes for strict portal upload limits while keeping text and marksheets razor sharp.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Select your PDF document, marksheet, or multi-page certificate." },
      { step: 2, title: "Choose Compression Level", description: "Pick 'Under 200KB', 'Under 100KB', or 'High Quality DPI' depending on your portal requirements." },
      { step: 3, title: "Export Compressed PDF", description: "Download the compressed PDF or scan the instant QR code to send it directly to your phone." }
    ],
    faqs: [
      {
        question: "Will text in my marksheet become blurry after compression?",
        answer: "No. Our compression engine uses smart vector and font-preservation algorithms so that text and grades remain crisp and readable."
      },
      {
        question: "Why do exam portals require PDFs under 200KB or 100KB?",
        answer: "Government portals handle millions of submissions and set strict file caps to save server storage. Our presets ensure your files meet those criteria on the first try."
      }
    ],
    relatedToolIds: ["edit-pdf", "pdf-to-word", "pdf-merger"]
  },
  "pdf-to-word": {
    toolId: "pdf-to-word",
    slug: "/pdf-to-word",
    aliases: ["/pdf-to-docx", "/pdf-to-doc", "/convert-pdf-to-word"],
    title: "PDF to Word Converter Free Online (DOCX, DOC, DOCM) | ImagePro Studio",
    metaDescription: "Convert PDF documents into editable Microsoft Word (.docx, .doc) files online for free. Preserves layout, headings, lists, and tables with 100% privacy.",
    h1: "Convert PDF to Editable Microsoft Word Online",
    tagline: "Transform non-editable PDFs into clean, fully editable Word documents with intact paragraphs and formatting.",
    howToSteps: [
      { step: 1, title: "Upload PDF Document", description: "Drop your PDF file into the converter." },
      { step: 2, title: "Select Word Format", description: "Choose between modern .DOCX, classic .DOC, macro-enabled .DOCM, or template formats." },
      { step: 3, title: "Download Editable Document", description: "Save your Word file and start editing immediately in Microsoft Office, Google Docs, or LibreOffice." }
    ],
    faqs: [
      {
        question: "Can I open the converted document in Microsoft Word and Google Docs?",
        answer: "Yes. The generated .docx files are fully compliant with Microsoft Word (2007–2024), Office 365, Google Docs, and LibreOffice Writer."
      },
      {
        question: "Are tables and numbered lists preserved?",
        answer: "Yes. Our conversion engine analyzes line spacing, indentation, and structure to reconstruct genuine headings, bullet points, and paragraphs."
      }
    ],
    relatedToolIds: ["word-to-pdf", "pdf-text-extractor", "edit-pdf"]
  },
  "word-to-pdf": {
    toolId: "word-to-pdf",
    slug: "/word-to-pdf",
    aliases: ["/docx-to-pdf", "/doc-to-pdf", "/convert-word-to-pdf"],
    title: "Word to PDF Converter Online Free (.DOCX to PDF) | ImagePro Studio",
    metaDescription: "Convert Microsoft Word (.docx, .doc) documents into standard vector PDF files for free. 100% private, preserves original typography and page layout.",
    h1: "Convert Microsoft Word to PDF Online",
    tagline: "Turn DOCX and DOC documents into secure, universally viewable PDF documents with crisp vector formatting.",
    howToSteps: [
      { step: 1, title: "Select Word File", description: "Upload your .docx, .doc, or .dotx document." },
      { step: 2, title: "Configure Page Layout", description: "Select target paper size (A4, Letter) and orientation." },
      { step: 3, title: "Download PDF", description: "Export your publication-ready vector PDF document." }
    ],
    faqs: [
      {
        question: "Does Word to PDF change my document formatting?",
        answer: "No. The converter accurately renders font weights, paragraph margins, and alignment into standard PDF vector commands."
      }
    ],
    relatedToolIds: ["pdf-to-word", "edit-pdf", "pdf-compressor"]
  },
  "image-to-pdf": {
    toolId: "image-to-pdf",
    slug: "/image-to-pdf",
    aliases: ["/jpg-to-pdf", "/png-to-pdf", "/photos-to-pdf"],
    title: "Image to PDF - Convert JPG, PNG & Photos to PDF Online Free | ImagePro Studio",
    metaDescription: "Convert multiple JPG, PNG, and WebP images into a single clean PDF document. Reorder pages, select A4 paper size, and customize margins.",
    h1: "Convert Photos and Images to PDF",
    tagline: "Merge multiple receipts, notes, and photos into a professional, multi-page PDF document.",
    howToSteps: [
      { step: 1, title: "Add Images", description: "Select one or multiple photos, scans, or document snapshots." },
      { step: 2, title: "Arrange & Organize", description: "Drag and drop cards to reorder pages and set orientation (Portrait/Landscape)." },
      { step: 3, title: "Download PDF", description: "Generate and download your merged PDF document in seconds." }
    ],
    faqs: [
      {
        question: "Can I combine multiple photos into a single PDF document?",
        answer: "Yes! You can upload dozens of photos, reorder them, and combine them into one seamless PDF file."
      }
    ],
    relatedToolIds: ["pdf-to-image", "pdf-merger", "pdf-compressor"]
  },
  "pdf-to-image": {
    toolId: "pdf-to-image",
    slug: "/pdf-to-image",
    aliases: ["/pdf-to-jpg", "/pdf-to-png", "/pdf-to-jpeg"],
    title: "PDF to Image - Convert PDF to JPG & PNG in High Resolution Online Free | ImagePro Studio",
    metaDescription: "Extract PDF pages into crystal-clear HD JPG and PNG images. Export individual pages or download all pages in a ZIP file.",
    h1: "Convert PDF Pages to High-Resolution JPG & PNG",
    tagline: "Extract pages from your PDF documents into high-DPI raster images ready for presentations, printing, and web.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop your PDF file into the converter." },
      { step: 2, title: "Select Format & Quality", description: "Choose between JPG (smaller size) and PNG (lossless), and select DPI resolution." },
      { step: 3, title: "Download Images", description: "Download individual page pictures or download all pages bundled in a ZIP." }
    ],
    faqs: [
      {
        question: "What resolution do the extracted images have?",
        answer: "You can render pages up to 300 DPI high resolution, ensuring small text, charts, and figures remain completely sharp."
      }
    ],
    relatedToolIds: ["image-to-pdf", "pdf-splitter", "edit-pdf"]
  },
  "edit-pdf": {
    toolId: "edit-pdf",
    slug: "/pdf-editor",
    aliases: ["/edit-pdf", "/pdf-editor-online", "/online-pdf-editor"],
    title: "Free PDF Editor Online - Annotate, Draw, Redact & Add Text | ImagePro Studio",
    metaDescription: "Full in-browser PDF suite. Add text, draw freehand, permanently redact sensitive data, highlight, stamp, and insert signatures. 100% private with no file upload limits.",
    h1: "In-Browser PDF Editor & Annotation Suite",
    tagline: "Add text, draw, highlight, redact confidential information, and insert images with zero cloud uploads.",
    howToSteps: [
      { step: 1, title: "Open Document", description: "Upload your PDF file to launch the interactive editor workspace." },
      { step: 2, title: "Edit & Annotate", description: "Use top toolbar icons to add text, highlight passages, redact private numbers, draw, or stamp." },
      { step: 3, title: "Save & Apply Changes", description: "Click 'Apply Changes & Download' to compile a brand-new vector PDF with your modifications." }
    ],
    faqs: [
      {
        question: "Is redaction truly permanent?",
        answer: "Yes. Our black-out redaction tool paints solid vector blackout rectangles directly onto the canvas, permanently masking confidential data."
      },
      {
        question: "Can I add electronic signatures in the PDF Editor?",
        answer: "Yes. You can draw your signature, type your name in cursive script, or insert an existing signature image."
      }
    ],
    relatedToolIds: ["pdf-compressor", "sign-pdf", "watermark-pdf", "pdf-to-word"]
  },
  "pdf-merger": {
    toolId: "pdf-merger",
    slug: "/pdf-merger",
    aliases: ["/merge-pdf", "/combine-pdf"],
    title: "PDF Merger - Combine Multiple PDF Files Online Free | ImagePro Studio",
    metaDescription: "Merge multiple PDF documents into one single file in seconds. Drag and drop to reorder pages and files. Fast, secure, and 100% private.",
    h1: "Merge and Combine PDF Files Online",
    tagline: "Combine multiple PDF reports, chapters, and certificates into a unified, ordered document.",
    howToSteps: [
      { step: 1, title: "Add PDF Files", description: "Upload 2 or more PDF documents you want to join together." },
      { step: 2, title: "Arrange File Order", description: "Drag file cards up or down to set the exact sequence of documents." },
      { step: 3, title: "Merge & Download", description: "Click 'Merge PDFs' to download your consolidated document." }
    ],
    faqs: [
      {
        question: "Is there a limit on how many PDFs I can combine?",
        answer: "No. You can combine as many PDF files as your device memory allows, completely free with no paywalls."
      }
    ],
    relatedToolIds: ["pdf-splitter", "organize-pdf", "pdf-compressor"]
  },
  "pdf-splitter": {
    toolId: "pdf-splitter",
    slug: "/pdf-splitter",
    aliases: ["/split-pdf", "/separate-pdf"],
    title: "PDF Splitter - Extract Pages & Split PDF Online Free | ImagePro Studio",
    metaDescription: "Split PDF files into individual pages or extract specific page ranges (e.g. pages 2-5). Fast, client-side, and completely free.",
    h1: "Split PDF Pages and Extract Ranges Online",
    tagline: "Extract specific pages, separate chapters, or split entire PDF documents into standalone files.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop your PDF file into the splitter." },
      { step: 2, title: "Select Pages to Extract", description: "Click thumbnail cards to toggle pages or type a page range like '1-3, 5'." },
      { step: 3, title: "Download Split Pages", description: "Export the selected pages as a new PDF or download all pages in a ZIP." }
    ],
    faqs: [
      {
        question: "Can I extract only one page from a 50-page PDF?",
        answer: "Yes! Click the thumbnail of the page you need and download it as an independent single-page PDF."
      }
    ],
    relatedToolIds: ["pdf-merger", "organize-pdf", "crop-pdf"]
  },
  "protect-pdf": {
    toolId: "protect-pdf",
    slug: "/protect-pdf",
    aliases: ["/lock-pdf", "/encrypt-pdf", "/password-protect-pdf"],
    title: "Protect PDF - Password Protect & Encrypt PDF Online Free | ImagePro Studio",
    metaDescription: "Add military-grade AES-256 password protection and encryption to your PDF documents. Set printing, copying, and editing permissions 100% privately.",
    h1: "Password Protect & Encrypt PDF Documents",
    tagline: "Lock confidential PDFs with AES-256 encryption and custom access permissions using browser Web Crypto.",
    howToSteps: [
      { step: 1, title: "Select PDF File", description: "Drop your confidential document into the security workspace." },
      { step: 2, title: "Enter Password & Permissions", description: "Choose a strong password and toggle printing, copying, or editing restrictions." },
      { step: 3, title: "Download Protected PDF", description: "Save your encrypted document. Anyone opening the file will need the password." }
    ],
    faqs: [
      {
        question: "What encryption algorithm is used?",
        answer: "We use AES-256 (PDF 2.0 standard), the same encryption standard used by banks and government agencies."
      },
      {
        question: "Does ImagePro Studio store my password?",
        answer: "Never. Encryption runs strictly in your local browser runtime via Web Crypto. Zero data is ever sent to our servers."
      }
    ],
    relatedToolIds: ["unlock-pdf", "sign-pdf", "pdf-compressor"]
  },
  "unlock-pdf": {
    toolId: "unlock-pdf",
    slug: "/unlock-pdf",
    aliases: ["/decrypt-pdf", "/remove-pdf-password"],
    title: "Unlock PDF - Remove Password & Restrictions from PDF Online Free | ImagePro Studio",
    metaDescription: "Remove password protection and printing/copying restrictions from secured PDF documents. Decrypt 100% locally with zero server upload.",
    h1: "Unlock & Remove Password Protection from PDF",
    tagline: "Remove security restrictions and passwords from your PDFs to view, print, and edit freely.",
    howToSteps: [
      { step: 1, title: "Upload Locked PDF", description: "Select your encrypted PDF file." },
      { step: 2, title: "Enter Current Password", description: "Type the password once to authenticate decryption." },
      { step: 3, title: "Download Unlocked Copy", description: "Save an unencrypted PDF that can be opened forever without typing a password." }
    ],
    faqs: [
      {
        question: "Can I remove a password if I don't know it?",
        answer: "No. For security and legal compliance, you must know the password once to verify ownership and strip protection."
      }
    ],
    relatedToolIds: ["protect-pdf", "edit-pdf", "pdf-compressor"]
  },
  "page-number-pdf": {
    toolId: "page-number-pdf",
    slug: "/page-numbers",
    aliases: ["/page-number-pdf", "/add-page-numbers-to-pdf", "/bates-numbering"],
    title: "Add Page Numbers to PDF Online Free (Bates Stamping) | ImagePro Studio",
    metaDescription: "Insert page numbers and Bates stamps into PDF headers and footers. Choose 6 positions, formats ('Page 1 of N'), fonts, colors, and skip cover page.",
    h1: "Add Page Numbers and Bates Stamps to PDF",
    tagline: "Number PDF pages in headers or footers with real-time visual preview and custom typography.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Select the document you want to paginate." },
      { step: 2, title: "Choose Format & Position", description: "Select 'Page 1 of N' or '1, 2, 3', pick 1 of 6 positions, adjust margins, and optionally skip the cover page." },
      { step: 3, title: "Stamp & Download", description: "Download your professionally paginated vector PDF document." }
    ],
    faqs: [
      {
        question: "Can I skip numbering on the cover page?",
        answer: "Yes. Check the 'Skip Cover Page' option, and numbering will automatically begin on Page 2."
      },
      {
        question: "What position options are supported?",
        answer: "Top-Left, Top-Center, Top-Right, Bottom-Left, Bottom-Center, and Bottom-Right."
      }
    ],
    relatedToolIds: ["watermark-pdf", "edit-pdf", "pdf-merger"]
  },
  "pdf-text-extractor": {
    toolId: "pdf-text-extractor",
    slug: "/pdf-text-extractor",
    aliases: ["/extract-pdf-text", "/pdf-to-text", "/pdf-word-counter"],
    title: "PDF Text Extractor & Word Counter - Extract to TXT & Markdown Online | ImagePro Studio",
    metaDescription: "Extract text from PDF pages, calculate word and character counts, search text, and export to TXT or Markdown (.md) online for free.",
    h1: "Extract Text & Count Words from PDF Documents",
    tagline: "Extract clean, structured text and Markdown with word count, character count, and estimated reading time analytics.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Select any text-based PDF document." },
      { step: 2, title: "Inspect & Search", description: "View document metrics, search words, and browse page-by-page text." },
      { step: 3, title: "Copy or Download", description: "Copy to clipboard with one click, or download as .TXT or structured .MD." }
    ],
    faqs: [
      {
        question: "Does it preserve formatting like lists and paragraphs?",
        answer: "Yes. Our extractor analyzes vertical Y-coordinates to detect line breaks and paragraph spacing."
      }
    ],
    relatedToolIds: ["pdf-to-word", "edit-pdf", "pdf-compressor"]
  },
  "exif-cleaner": {
    toolId: "exif-cleaner",
    slug: "/exif-cleaner",
    aliases: ["/remove-exif", "/clean-photo-metadata", "/privacy-photo-cleaner"],
    title: "Image EXIF Cleaner - Strip GPS Location & Camera Metadata Online Free | ImagePro Studio",
    metaDescription: "Inspect and remove EXIF metadata, camera serial numbers, and embedded GPS coordinates from JPG, PNG, and WebP photos. 100% privacy-safe.",
    h1: "Strip GPS Location & EXIF Metadata from Photos",
    tagline: "Audit camera settings, detect embedded GPS coordinates, and wipe personal metadata before sharing photos online.",
    howToSteps: [
      { step: 1, title: "Drop Photos", description: "Upload one or multiple photos to inspect embedded EXIF tags." },
      { step: 2, title: "Review Privacy Audit", description: "Inspect detected camera make, model, timestamps, and GPS tracking coordinates." },
      { step: 3, title: "Sanitize & Download", description: "Click 'Strip Metadata' to download clean, privacy-safe photos individually or in a ZIP." }
    ],
    faqs: [
      {
        question: "Why should I strip EXIF metadata before sharing photos?",
        answer: "Photos taken on smartphones frequently contain exact GPS latitude/longitude coordinates of your home or location. Stripping EXIF protects your privacy."
      }
    ],
    relatedToolIds: ["resizer", "compressor", "image-converter"]
  },
  "crop-pdf": {
    toolId: "crop-pdf",
    slug: "/crop-pdf",
    aliases: ["/trim-pdf", "/crop-pdf-pages"],
    title: "Crop PDF - Trim Margins & Shipping Labels (4x6) Online Free | ImagePro Studio",
    metaDescription: "Crop PDF page margins, trim white space, or isolate 4x6 shipping labels using an interactive visual crop rectangle with real-time preview.",
    h1: "Crop PDF Pages & Trim Margins Online",
    tagline: "Visually crop unwanted margins, headers, or isolate shipping labels with real-time draggable handles.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Select the PDF file you wish to trim." },
      { step: 2, title: "Adjust Visual Crop Box", description: "Drag edge sliders or pick presets like 'Trim Margins' or 'Shipping Label (4×6)'." },
      { step: 3, title: "Crop & Export", description: "Download your cropped PDF with clean, trimmed page dimensions." }
    ],
    faqs: [
      {
        question: "Can I apply the crop to all pages or just the current page?",
        answer: "Both! You can choose to apply the crop to all pages across the document or only the active page."
      }
    ],
    relatedToolIds: ["pdf-splitter", "rotate-pdf", "edit-pdf"]
  },
  "image-converter": {
    toolId: "image-converter",
    slug: "/image-converter",
    aliases: ["/convert-image", "/png-to-jpg", "/jpg-to-png", "/webp-converter"],
    title: "Image Format Converter - Convert JPG, PNG, WEBP, GIF Online Free | ImagePro Studio",
    metaDescription: "Convert images between JPG, PNG, WebP, AVIF, and GIF formats. High fidelity, fast batch conversion, 100% private in-browser.",
    h1: "Convert Image Formats Online Free",
    tagline: "Convert image files between JPG, PNG, WebP, and other raster formats with zero quality loss.",
    howToSteps: [
      { step: 1, title: "Upload Images", description: "Select image files in any format." },
      { step: 2, title: "Choose Target Format", description: "Select JPG, PNG, WebP, or GIF and adjust quality settings." },
      { step: 3, title: "Download Converted Images", description: "Save your converted files individually or as a ZIP archive." }
    ],
    faqs: [
      {
        question: "Which format is best for web performance?",
        answer: "WebP generally offers the best balance of high visual fidelity and lightweight file size (up to 30% smaller than JPG)."
      }
    ],
    relatedToolIds: ["resizer", "compressor", "exif-cleaner"]
  },
  "dimension-converter": {
    toolId: "dimension-converter",
    slug: "/dimension-converter",
    aliases: ["/dpi-calculator", "/unit-converter-image"],
    title: "Image Dimension & DPI Calculator - Convert Pixels, CM, MM, Inches | ImagePro Studio",
    metaDescription: "Convert image dimensions between pixels, centimeters, millimeters, and inches at 72, 150, 300, and 600 DPI for print and digital design.",
    h1: "Image Dimension & Print DPI Calculator",
    tagline: "Calculate exact pixel dimensions from mm, cm, and inches across standard print resolutions.",
    howToSteps: [
      { step: 1, title: "Enter Physical Size", description: "Input width and height in mm, cm, or inches (e.g. 35×45mm)." },
      { step: 2, title: "Select Print DPI", description: "Choose 300 DPI for photographic print, 150 DPI for documents, or 72 DPI for web." },
      { step: 3, title: "Copy Pixel Dimensions", description: "Get instant pixel dimensions ready to apply in the Image Resizer." }
    ],
    faqs: [
      {
        question: "What is the standard DPI for passport photos?",
        answer: "300 DPI is the international standard for passport and ID card printing."
      }
    ],
    relatedToolIds: ["resizer", "extender", "compressor"]
  },
  "extender": {
    toolId: "extender",
    slug: "/canvas-extender",
    aliases: ["/extender", "/add-photo-border", "/canvas-padding"],
    title: "Canvas Extender - Add Margins, Borders & Padding to Photos | ImagePro Studio",
    metaDescription: "Expand photo canvas with custom white, black, or color margins and borders. Great for framing signatures and passport photos.",
    h1: "Extend Image Canvas & Add Borders Online",
    tagline: "Add borders, background padding, and custom canvas expansion to photos and signatures.",
    howToSteps: [
      { step: 1, title: "Upload Photo", description: "Drop your image into the canvas extender." },
      { step: 2, title: "Set Margin & Background Color", description: "Choose margin thickness and pick white, black, or custom color." },
      { step: 3, title: "Download Framed Photo", description: "Save your expanded image ready for upload." }
    ],
    faqs: [
      {
        question: "Can I add equal padding to all sides?",
        answer: "Yes. You can link all sides for uniform padding or adjust top, bottom, left, and right individually."
      }
    ],
    relatedToolIds: ["resizer", "dimension-converter"]
  },
  "sign-pdf": {
    toolId: "sign-pdf",
    slug: "/sign-pdf",
    aliases: ["/pdf-signature", "/electronic-signature-pdf"],
    title: "Sign PDF Online Free - Draw, Type or Upload Electronic Signature | ImagePro Studio",
    metaDescription: "Sign PDF documents online for free. Draw your signature, type in stylish cursive, or upload an image. 100% legal, secure, and private.",
    h1: "Sign PDF Documents Electronically Online",
    tagline: "Create and place legally recognized electronic signatures on agreements, contracts, and forms.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Select the document requiring your signature." },
      { step: 2, title: "Create Signature", description: "Draw your signature with touch/mouse, type your name, or upload a scan." },
      { step: 3, title: "Place & Download", description: "Position and resize your signature on the page, then download the signed PDF." }
    ],
    faqs: [
      {
        question: "Is this electronic signature legally binding?",
        answer: "Yes. Electronic signatures are accepted internationally under the ESIGN Act and eIDAS regulations for standard agreements."
      }
    ],
    relatedToolIds: ["edit-pdf", "watermark-pdf", "protect-pdf"]
  },
  "watermark-pdf": {
    toolId: "watermark-pdf",
    slug: "/watermark-pdf",
    aliases: ["/pdf-watermark", "/add-watermark-pdf"],
    title: "Watermark PDF - Add Text & Logo Watermark Online Free | ImagePro Studio",
    metaDescription: "Stamp text watermarks (e.g. 'CONFIDENTIAL', 'SAMPLE') or image logos across PDF pages. Customize opacity, angle, and position.",
    h1: "Add Text and Logo Watermarks to PDF",
    tagline: "Protect your intellectual property by applying custom diagonal or centered watermarks across all pages.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Choose the PDF document to watermark." },
      { step: 2, title: "Customize Watermark", description: "Type custom text, select font, adjust rotation angle, and set transparency." },
      { step: 3, title: "Stamp & Export", description: "Download your watermarked document with indelible protection." }
    ],
    faqs: [
      {
        question: "Can I watermark only selected pages?",
        answer: "You can apply watermarks to all pages or choose specific page ranges."
      }
    ],
    relatedToolIds: ["sign-pdf", "page-number-pdf", "protect-pdf"]
  },
  "rotate-pdf": {
    toolId: "rotate-pdf",
    slug: "/rotate-pdf",
    aliases: ["/pdf-rotator", "/turn-pdf"],
    title: "Rotate PDF - Orient Pages Permanently Online Free | ImagePro Studio",
    metaDescription: "Rotate all or individual PDF pages by 90°, 180°, or 270°. Permanently fix upside-down or sideways scans in seconds.",
    h1: "Rotate PDF Pages Permanently Online",
    tagline: "Fix sideways and upside-down document scans with permanent, lossless orientation.",
    howToSteps: [
      { step: 1, title: "Upload Document", description: "Select the PDF with misaligned or inverted pages." },
      { step: 2, title: "Rotate Pages", description: "Click Rotate All or click individual page cards to turn them 90 degrees." },
      { step: 3, title: "Save PDF", description: "Download your properly oriented document." }
    ],
    faqs: [
      {
        question: "Is the rotation saved permanently?",
        answer: "Yes. When you download the rotated file, the orientation metadata is permanently embedded into the PDF structure."
      }
    ],
    relatedToolIds: ["organize-pdf", "crop-pdf", "pdf-splitter"]
  },
  "organize-pdf": {
    toolId: "organize-pdf",
    slug: "/organize-pdf",
    aliases: ["/pdf-organizer", "/reorder-pdf-pages"],
    title: "Organize PDF - Reorder, Sort, Duplicate & Delete Pages | ImagePro Studio",
    metaDescription: "Rearrange PDF pages visually. Drag and drop to sort, duplicate important pages, or delete unnecessary sheets with instant export.",
    h1: "Organize & Reorder PDF Pages Visually",
    tagline: "Drag and drop page cards to reorder, delete blank pages, or duplicate sections with live preview.",
    howToSteps: [
      { step: 1, title: "Upload PDF", description: "Drop your document to load page cards." },
      { step: 2, title: "Drag to Reorder", description: "Drag and drop page thumbnails to arrange them in your desired order." },
      { step: 3, title: "Download Organized PDF", description: "Export your reorganized document instantly." }
    ],
    faqs: [
      {
        question: "Can I delete specific pages while organizing?",
        answer: "Yes! Hover over any page card and click the Trash icon to remove it."
      }
    ],
    relatedToolIds: ["rotate-pdf", "pdf-splitter", "pdf-merger"]
  }
};

/**
 * Resolves a given URL pathname to its corresponding ToolId, checking slugs and aliases.
 */
export function getToolIdFromPath(pathname: string): ToolId | null {
  const clean = pathname.toLowerCase().replace(/\/$/, "");
  if (!clean || clean === "") return null;

  for (const def of Object.values(TOOL_ROUTES)) {
    if (def.slug.toLowerCase() === clean) return def.toolId;
    if (def.aliases.some((a) => a.toLowerCase() === clean)) return def.toolId;
  }
  return null;
}

/**
 * Returns the primary canonical slug for a given ToolId.
 */
export function getPathFromToolId(toolId: ToolId): string {
  return TOOL_ROUTES[toolId]?.slug || "/";
}

/**
 * Dynamically updates document.title, meta description, canonical link, and JSON-LD schema.
 */
export function updatePageSeo(toolId: ToolId | null): void {
  if (typeof document === "undefined") return;

  const origin = "https://www.imageprostudio.in";

  if (!toolId) {
    // Default Home Page SEO
    document.title = "ImagePro Studio — 100% Free In-Browser Media Workstation";
    const desc = "The browser-based media studio for students and job applicants. Resize 35x45mm passport photos, scale 10–20KB signatures, compress PDF marksheets under 200KB, edit, sign, and convert with 100% privacy.";
    updateMetaTag("name", "description", desc);
    updateCanonicalLink(origin);
    return;
  }

  const seo = TOOL_ROUTES[toolId];
  if (!seo) return;

  // Title
  document.title = seo.title;

  // Meta Description
  updateMetaTag("name", "description", seo.metaDescription);
  updateMetaTag("property", "og:title", seo.title);
  updateMetaTag("property", "og:description", seo.metaDescription);
  updateMetaTag("property", "og:url", `${origin}${seo.slug}`);

  // Canonical Link
  updateCanonicalLink(`${origin}${seo.slug}`);

  // Dynamic Schema.org JSON-LD (SoftwareApplication + FAQPage)
  updateStructuredData(seo, origin);
}

function updateMetaTag(attributeName: "name" | "property", attributeValue: string, content: string): void {
  let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attributeName, attributeValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function updateCanonicalLink(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function updateStructuredData(seo: ToolSeoDefinition, origin: string): void {
  const scriptId = "dynamic-tool-ldjson";
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": `${seo.h1} - ImagePro Studio`,
        "url": `${origin}${seo.slug}`,
        "description": seo.metaDescription,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires HTML5 Canvas & WebAssembly support",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "HowTo",
        "name": `How to use ${seo.h1}`,
        "step": seo.howToSteps.map((s) => ({
          "@type": "HowToStep",
          "position": s.step,
          "name": s.title,
          "text": s.description
        }))
      },
      {
        "@type": "FAQPage",
        "mainEntity": seo.faqs.map((f) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      }
    ]
  };

  script.textContent = JSON.stringify(structuredData);
}
