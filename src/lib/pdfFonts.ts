export interface PdfEditorFontOption {
  id: string;
  name: string;
  category: "Sans-Serif" | "Serif" | "Monospace" | "Script & Signature" | "Display & Modern";
  css: string;
}

export const PDF_EDITOR_FONTS: PdfEditorFontOption[] = [
  // 1. Sans-Serif (Clean, Modern, Universal)
  {
    id: "sans",
    name: "Arial (Universal)",
    category: "Sans-Serif",
    css: 'Arial, Helvetica, "Plus Jakarta Sans", Inter, -apple-system, sans-serif'
  },
  {
    id: "inter",
    name: "Inter (Modern Sans)",
    category: "Sans-Serif",
    css: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    category: "Sans-Serif",
    css: '"Plus Jakarta Sans", Inter, system-ui, -apple-system, sans-serif'
  },
  {
    id: "trebuchet",
    name: "Trebuchet MS",
    category: "Sans-Serif",
    css: '"Trebuchet MS", "Lucida Grande", "Segoe UI", sans-serif'
  },
  {
    id: "verdana",
    name: "Verdana (Wide Sans)",
    category: "Sans-Serif",
    css: 'Verdana, Geneva, sans-serif'
  },
  {
    id: "calibri",
    name: "Calibri / Carlito",
    category: "Sans-Serif",
    css: 'Calibri, "Carlito", Candara, Segoe, "Segoe UI", sans-serif'
  },

  // 2. Serif (Official, Academic, Legal, Book)
  {
    id: "serif",
    name: "Times New Roman (Legal / Form)",
    category: "Serif",
    css: '"Times New Roman", Times, Georgia, Cambria, serif'
  },
  {
    id: "georgia",
    name: "Georgia (Warm Editorial)",
    category: "Serif",
    css: 'Georgia, Cambria, "Times New Roman", Times, serif'
  },
  {
    id: "garamond",
    name: "Garamond (Classic Book)",
    category: "Serif",
    css: 'Garamond, "EB Garamond", "Baskerville", "Palatino Linotype", serif'
  },
  {
    id: "merriweather",
    name: "Merriweather (Document Serif)",
    category: "Serif",
    css: '"Merriweather", Georgia, "Times New Roman", serif'
  },

  // 3. Monospace (Typewriter, Box Forms, Coding)
  {
    id: "mono",
    name: "Courier New (Typewriter)",
    category: "Monospace",
    css: '"Courier New", Courier, Consolas, Monaco, monospace'
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono (Modern Code)",
    category: "Monospace",
    css: '"JetBrains Mono", Consolas, Monaco, "Courier New", monospace'
  },

  // 4. Script & Signature (Signatures, Endorsements, Diplomas)
  {
    id: "cursive",
    name: "Dancing Script (Signature)",
    category: "Script & Signature",
    css: '"Dancing Script", "Brush Script MT", cursive'
  },
  {
    id: "great-vibes",
    name: "Great Vibes (Calligraphy)",
    category: "Script & Signature",
    css: '"Great Vibes", "Brush Script MT", cursive'
  },
  {
    id: "caveat",
    name: "Caveat (Handwritten)",
    category: "Script & Signature",
    css: '"Caveat", "Comic Sans MS", cursive'
  },
  {
    id: "pacifico",
    name: "Pacifico (Casual Script)",
    category: "Script & Signature",
    css: '"Pacifico", "Brush Script MT", cursive'
  },
  {
    id: "brush",
    name: "Brush Script (Vintage)",
    category: "Script & Signature",
    css: '"Brush Script MT", "Dancing Script", cursive'
  },

  // 5. Display & Modern (Notices, Bold Headlines, Stamps)
  {
    id: "impact",
    name: "Impact (Bold Notice)",
    category: "Display & Modern",
    css: 'Impact, "Arial Black", "Trebuchet MS", sans-serif'
  },
  {
    id: "oswald",
    name: "Oswald (Condensed)",
    category: "Display & Modern",
    css: '"Oswald", "Arial Narrow", sans-serif'
  }
];

export function getPdfEditorFontCss(fontId?: string, actualFontName?: string): string {
  const actualPrefix = actualFontName ? `"${actualFontName}", ` : "";
  if (!fontId) {
    return `${actualPrefix}Arial, Helvetica, "Plus Jakarta Sans", Inter, -apple-system, sans-serif`;
  }

  const match = PDF_EDITOR_FONTS.find((f) => f.id === fontId);
  if (match) {
    return `${actualPrefix}${match.css}`;
  }

  // Handle standard backwards-compatible aliases
  if (fontId === "serif") return `${actualPrefix}"Times New Roman", Times, Georgia, Cambria, serif`;
  if (fontId === "mono") return `${actualPrefix}"Courier New", Courier, Consolas, monospace`;
  if (fontId === "cursive") return `${actualPrefix}"Dancing Script", "Brush Script MT", cursive`;

  return `${actualPrefix}${fontId}, Arial, Helvetica, sans-serif`;
}
