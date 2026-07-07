'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { API_ORIGIN } from '@/utils/api';

function normalizeUploadUrl(url: string) {
  if (!url) return url;
  // Fix legacy uploads pointing at wrong port
  return url
    .replace('http://localhost:5001/', `${API_ORIGIN}/`)
    .replace('https://localhost:5001/', `${API_ORIGIN}/`);
}

function updatePreviewImage(iframe: HTMLIFrameElement | null, imageId: string, url: string) {
  const doc = iframe?.contentDocument;
  if (!doc) return false;
  const img = doc.querySelector(`img[data-html-image-id="${imageId}"]`) as HTMLImageElement | null;
  if (!img) return false;
  const bustUrl = `${normalizeUploadUrl(url)}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  img.src = bustUrl;
  img.removeAttribute('srcset');
  return true;
}

function cleanBodyHtml(doc: Document) {
  const clone = doc.body.cloneNode(true) as HTMLElement;
  clone.querySelector('.html-edit-banner')?.remove();
  clone.querySelector('script[data-html-editor]')?.remove();
  clone.querySelectorAll('[data-html-editable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-html-editable');
    el.removeAttribute('spellcheck');
  });
  clone.querySelectorAll('[data-html-image]').forEach((el) => {
    el.removeAttribute('data-html-image');
  });
  let html = clone.innerHTML.trim();
  html = html.replace(/<div><br><\/div>/gi, '<br>');
  return html;
}

export default function WebsiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [website, setWebsite] = useState<{ companyName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dirty, setDirty] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImageId = useRef<string | null>(null);
  const baseCssRef = useRef('');

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/websites/${id}/edit-preview`);
      setPreviewDoc(res.data.document);
      baseCssRef.current = res.data.baseCss || '';
    } catch (err) {
      console.error('Failed to load edit preview', err);
      alert('No generated website to edit. Please generate the website first.');
      router.push(`/dashboard/websites/${id}`);
    } finally {
      setPreviewLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/websites/${id}`);
        const payload = res.data;
        setWebsite(payload.website);
        if (!payload.website?.generatedHtml) {
          alert('Please generate the website first before editing.');
          router.push(`/dashboard/websites/${id}`);
          return;
        }
        await loadPreview();
      } catch (err) {
        console.error(err);
        alert('Failed to load editor.');
        router.push('/dashboard/websites');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router, loadPreview]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === 'html-edited') {
        setDirty(true);
      }
      if (event.data?.type === 'html-image-edit') {
        pendingImageId.current = event.data.imageId;
        fileInputRef.current?.click();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const imageId = pendingImageId.current;
    e.target.value = '';
    pendingImageId.current = null;
    if (!file || !imageId) return;

    try {
      const res = await api.upload('/media/upload', file);
      const url = normalizeUploadUrl(res.data?.url);
      if (!url) {
        throw new Error('Upload succeeded but no image URL was returned');
      }

      const updated = updatePreviewImage(iframeRef.current, imageId, url);
      if (!updated) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'update-image', imageId, value: url },
          '*'
        );
      }
      setDirty(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Image upload failed');
    }
  };

  const collectEditedContent = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) throw new Error('Preview not ready');
    const generatedHtml = cleanBodyHtml(doc);
    const generatedCss = baseCssRef.current;
    return { generatedHtml, generatedCss };
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const { generatedHtml, generatedCss } = collectEditedContent();
      await api.put(`/websites/${id}`, { generatedHtml, generatedCss });
      setDirty(false);
      alert('Changes saved!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishLoading(true);
    try {
      const { generatedHtml, generatedCss } = collectEditedContent();
      await api.put(`/websites/${id}`, { generatedHtml, generatedCss });
      await api.post(`/websites/${id}/publish`);
      setDirty(false);
      alert('Website published successfully!');
      router.push('/dashboard/websites');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!website) return null;

  const viewportWidths = {
    desktop: 'w-full max-w-full h-full border-0 rounded-2xl',
    tablet: 'w-[768px] h-full border-x border-slate-800 shadow-2xl rounded-2xl',
    mobile: 'w-[375px] h-full border-x border-slate-800 shadow-2xl rounded-2xl',
  };

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col space-y-4 -m-6 md:-m-10 p-4 md:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/websites"
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">Edit Layout</h1>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">
              {website.companyName}
              {dirty ? ' · unsaved changes' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl self-center">
          {[
            { id: 'desktop' as const, icon: Monitor },
            { id: 'tablet' as const, icon: Tablet },
            { id: 'mobile' as const, icon: Smartphone },
          ].map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.id}
                onClick={() => setViewport(vp.id)}
                className={`p-2 rounded-lg transition-all ${
                  viewport === vp.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-center sm:self-auto">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs font-semibold rounded-xl"
          >
            {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            onClick={handlePublish}
            disabled={publishLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            {publishLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 flex justify-center items-start p-2 border border-slate-850 rounded-3xl relative min-h-0">
        {previewLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/40 rounded-3xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        {previewDoc && (
          <iframe
            ref={iframeRef}
            title="Editable website"
            srcDoc={previewDoc}
            className={`bg-white transition-all duration-300 rounded-2xl overflow-hidden shadow-lg border-0 ${viewportWidths[viewport]}`}
            style={{ height: '100%', minHeight: '500px' }}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
