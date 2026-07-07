export interface Section {
  id: string;
  type: 'hero' | 'about' | 'services' | 'gallery' | 'contact';
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
}

export interface LayoutData {
  theme: string;
  sections: Section[];
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  seoSettings: {
    title: string;
    description: string;
    keywords: string;
  };
}

function defaultSectionContent(type: Section['type']) {
  switch (type) {
    case 'hero':
      return { backgroundImage: '', ctaText: 'Get in Touch', ctaLink: '#contact' };
    case 'about':
      return { bodyText: '', image: '' };
    case 'services':
      return { items: [] };
    case 'gallery':
      return { images: [] };
    case 'contact':
      return {
        phone: '',
        email: '',
        address: '',
        formTitle: 'Send us a message',
        submitText: 'Send Message',
        namePlaceholder: 'Your Name',
        emailPlaceholder: 'Your Email',
        phonePlaceholder: 'Your Phone',
        messagePlaceholder: 'Your Message',
      };
    default:
      return {};
  }
}

export function normalizeLayout(raw: LayoutData): LayoutData {
  return {
    theme: raw.theme || 'business',
    sections: (raw.sections || []).map((section) => ({
      ...section,
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: { ...defaultSectionContent(section.type), ...(section.content || {}) },
    })),
    themeSettings: {
      primaryColor: raw.themeSettings?.primaryColor || '#c21a22',
      secondaryColor: raw.themeSettings?.secondaryColor || '#171717',
      backgroundColor: raw.themeSettings?.backgroundColor || '#ffffff',
      textColor: raw.themeSettings?.textColor || '#171717',
      fontFamily: raw.themeSettings?.fontFamily || 'Inter',
    },
    seoSettings: {
      title: raw.seoSettings?.title || '',
      description: raw.seoSettings?.description || '',
      keywords: raw.seoSettings?.keywords || '',
    },
  };
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: string) {
  const keys = path.split('.');
  let current: Record<string, unknown> | unknown[] = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isIndex = /^\d+$/.test(nextKey);

    if (Array.isArray(current)) {
      const idx = Number(key);
      if (!current[idx] || typeof current[idx] !== 'object') {
        current[idx] = isIndex ? [] : {};
      }
      current = current[idx] as Record<string, unknown> | unknown[];
      continue;
    }

    const record = current as Record<string, unknown>;
    if (record[key] === undefined || record[key] === null) {
      record[key] = isIndex ? [] : {};
    }
    current = record[key] as Record<string, unknown> | unknown[];
  }

  const lastKey = keys[keys.length - 1];
  if (Array.isArray(current)) {
    current[Number(lastKey)] = value;
  } else {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}

/** Apply inline edit: field format is `sectionId:path` e.g. `sec-hero:title` or `sec-hero:content.ctaText` */
export function applyLayoutFieldEdit(layout: LayoutData, field: string, value: string): LayoutData {
  const colonIdx = field.indexOf(':');
  if (colonIdx === -1) return layout;

  const sectionId = field.slice(0, colonIdx);
  const path = field.slice(colonIdx + 1);

  const sections = layout.sections.map((section) => {
    if (section.id !== sectionId) return section;

    if (path === 'title') return { ...section, title: value };
    if (path === 'subtitle') return { ...section, subtitle: value };

    if (path.startsWith('content.')) {
      const contentPath = path.slice('content.'.length);
      const newContent = { ...section.content };
      setNestedValue(newContent, contentPath, value);
      return { ...section, content: newContent };
    }

    return section;
  });

  return { ...layout, sections };
}

export function buildEditorDocument(compiled: {
  html: string;
  css: string;
  editorScript?: string;
  pageTitle?: string;
  metaDescription?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${compiled.pageTitle || 'Edit Website'}</title>
  <meta name="description" content="${compiled.metaDescription || ''}" />
  <style>${compiled.css || ''}</style>
</head>
<body>${compiled.html || ''}${compiled.editorScript ? `<script>${compiled.editorScript}</script>` : ''}</body>
</html>`;
}

export function themeSettingsKey(layout: LayoutData) {
  return JSON.stringify(layout.themeSettings) + layout.theme;
}
