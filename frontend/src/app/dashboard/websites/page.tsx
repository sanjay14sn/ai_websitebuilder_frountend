'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';
import {
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import GenerateWebsiteOverlay from '@/components/GenerateWebsiteOverlay';

interface WebsiteData {
  _id: string;
  name: string;
  companyName: string;
  slug: string;
  category: string;
  location: string;
  phoneNumber: string;
  email: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'GENERATED' | 'PUBLISHED' | 'DEACTIVATED';
  webUrl?: string;
  createdAt: string;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const loadWebsites = async () => {
    try {
      const res = await api.get('/websites');
      setWebsites(res.data);
    } catch (err) {
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const handleGenerate = async (id: string) => {
    if (!confirm('Generate the full website using AI? This may take 1–2 minutes.')) return;
    setGeneratingId(id);
    setActionLoadingId(id);
    try {
      await api.post(`/websites/${id}/generate`);
      alert('Website generated successfully!');
    } catch (err: any) {
      alert(err.message || 'Website generation failed');
    } finally {
      window.location.reload();
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await api.post(`/websites/${id}/publish`);
      const mockStr = res.mock ? ' (Mock mode activated)' : '';
      alert(`Website published to Cloudflare KV namespace!${mockStr}`);
      loadWebsites();
    } catch (err: any) {
      alert(err.message || 'Publishing failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this website? All versions, analytics, and layouts will be permanently erased.')) return;
    try {
      await api.delete(`/websites/${id}`);
      loadWebsites();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Filters
  const filteredWebsites = websites.filter((w) => {
    const matchesSearch =
      w.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {generatingId && (
        <GenerateWebsiteOverlay
          companyName={websites.find((w) => w._id === generatingId)?.companyName}
          themeColor="#E63946"
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Websites</h1>
          <p className="text-xs text-slate-500 mt-1">Review business data, build sections, and publish configurations.</p>
        </div>
        <Link
          href="/dashboard/websites/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all self-start sm:self-auto shadow-lg hover:shadow-blue-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          Add Business
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company name, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-400 focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="GENERATED">GENERATED</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-xs">Loading accounts...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredWebsites.map((web) => {
            const isLoading = actionLoadingId === web._id;
            return (
              <div
                key={web._id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all"
              >
                {/* Left side: Business Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-white">{web.companyName}</h2>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        web.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : web.status === 'GENERATED'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {web.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                    <span>Category: <strong className="text-slate-200">{web.category}</strong></span>
                    <span className="hidden sm:inline text-slate-700">•</span>
                    <span>Location: <strong className="text-slate-200">{web.location}</strong></span>
                    <span className="hidden sm:inline text-slate-700">•</span>
                    <span>Representative: <strong className="text-slate-200">{web.name}</strong></span>
                  </div>
                </div>

                {/* Right side: Actions based on Status */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
                  {/* Generate Button for DRAFT / UNDER_REVIEW */}
                  {(web.status === 'DRAFT' || web.status === 'UNDER_REVIEW') && (
                    <button
                      onClick={() => handleGenerate(web._id)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-500/10"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Generate Website
                    </button>
                  )}

                  {/* Editor and Publish buttons have been removed from list view */}

                  {/* Preview Link (only if layout exists, i.e. status is GENERATED or PUBLISHED) */}
                  {(web.status === 'GENERATED' || web.status === 'PUBLISHED') && (
                    <Link
                      href={`/dashboard/websites/${web._id}/preview`}
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Link>
                  )}

                  {/* External Domain Link for Published sites */}
                  {web.status === 'PUBLISHED' && (
                    <a
                      href={web.webUrl || `https://${web.slug}-${web._id.slice(-4)}.gripforumglobal.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit Site
                    </a>
                  )}

                  {/* Edit metadata link */}
                  <Link
                    href={`/dashboard/websites/${web._id}`}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all text-xs"
                    title="View Details / Edit Details"
                  >
                    View Details
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(web._id)}
                    className="p-2.5 bg-red-950/20 hover:bg-red-500 border border-red-950 text-red-400 hover:text-white rounded-xl transition-all"
                    title="Delete Website"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredWebsites.length === 0 && (
            <div className="text-center p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 italic">
              No matching business websites found. Add a new submission to start.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
