'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getWebsitePreviewUrl } from '@/utils/api';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Edit,
  Send,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

// Custom SVG components to replace missing Lucide brand icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

interface Section {
  id: string;
  type: 'hero' | 'about' | 'services' | 'gallery' | 'contact';
  title?: string;
  subtitle?: string;
  content?: any;
}

interface Layout {
  theme: string;
  sections: Section[];
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  seoSettings?: any;
}

interface WebsiteData {
  _id: string;
  companyName: string;
  category: string;
  location: string;
  phoneNumber: string;
  email: string;
  logo?: string;
  generatedHtml?: string;
  status?: 'DRAFT' | 'UNDER_REVIEW' | 'GENERATED' | 'PUBLISHED';
  webUrl?: string;
  slug: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export default function WebsitePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/websites/${id}`);
        // Backend returns { success, data: { website, layout } }
        const payload = res.data.data || res.data;
        setWebsite(payload.website);
        setLayout(payload.layout);
      } catch (err) {
        console.error(err);
        alert('Failed to load preview details.');
        router.push('/dashboard/websites');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePublish = async () => {
    setPublishLoading(true);
    try {
      const res = await api.post(`/websites/${id}/publish`);
      alert(`Website published successfully!`);
      router.push('/dashboard/websites');
    } catch (err: any) {
      alert(err.message || 'Publishing failed');
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

  if (!website) {
    return (
      <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 italic mt-10">
        Website not found.
      </div>
    );
  }

  // Map viewport to Tailwind width classes
  const viewportWidths = {
    desktop: 'w-full max-w-full h-full border-0 rounded-2xl',
    tablet: 'w-[768px] h-full border-x border-slate-800 shadow-2xl rounded-2xl',
    mobile: 'w-[375px] h-full border-x border-slate-800 shadow-2xl rounded-2xl',
  };

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col space-y-6">
      {/* Viewport & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/websites"
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">Live Layout Canvas</h1>
            <span className="text-[10px] text-slate-500 block uppercase font-mono">{website.companyName}</span>
          </div>
        </div>

        {/* Viewport switchers */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl self-center">
          {[
            { id: 'desktop', icon: Monitor, label: 'Desktop' },
            { id: 'tablet', icon: Tablet, label: 'Tablet' },
            { id: 'mobile', icon: Smartphone, label: 'Mobile' },
          ].map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.id}
                onClick={() => setViewport(vp.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  viewport === vp.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
                title={vp.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{vp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Editor and Publish Quick Actions */}
        <div className="flex items-center gap-3 self-center sm:self-auto">
          <Link
            href={`/dashboard/websites/${id}/editor`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs font-semibold rounded-xl transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit layout
          </Link>

          <button
            onClick={handlePublish}
            disabled={publishLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10"
          >
            {publishLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Publish Site
          </button>
        </div>
      </div>

      {/* Embedded Render Frame Canvas */}
      <div className="flex-1 bg-slate-950 flex justify-center items-start p-4 border border-slate-850 rounded-3xl relative" style={{ minHeight: '600px' }}>
        <iframe
          src={website.status === 'PUBLISHED' ? (website.webUrl || `https://${website.slug}-${website._id.slice(-4)}.gripforumglobal.com`) : getWebsitePreviewUrl(id)}
          className={`bg-white transition-all duration-300 rounded-2xl overflow-hidden shadow-lg border-0 ${viewportWidths[viewport]}`}
          style={{ minHeight: '600px', height: '100%' }}
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
