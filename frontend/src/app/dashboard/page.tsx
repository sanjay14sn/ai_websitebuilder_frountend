'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import Link from 'next/link';
import {
  Globe,
  FileText,
  Sparkles,
  CheckCircle,
  Eye,
  Users,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface WebsiteData {
  _id: string;
  companyName: string;
  category: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'GENERATED' | 'PUBLISHED' | 'DEACTIVATED';
  slug: string;
  createdAt: string;
}

interface AnalyticsData {
  totalViews: number;
  totalVisitors: number;
  chartData: Array<{ date: string; views: number; visitors: number }>;
  isMock?: boolean;
}

export default function DashboardPage() {
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const webRes = await api.get('/websites');
        setWebsites(webRes.data);

        const analyticRes = await api.get('/analytics');
        setAnalytics(analyticRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalCount = websites.length;
  const draftCount = websites.filter((w) => w.status === 'DRAFT').length;
  const underReviewCount = websites.filter((w) => w.status === 'UNDER_REVIEW').length;
  const generatedCount = websites.filter((w) => w.status === 'GENERATED').length;
  const publishedCount = websites.filter((w) => w.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
          <p className="text-sm text-slate-400 mt-1">
            Build, edit, and publish dynamic AI-powered business websites seamlessly.
          </p>
        </div>
        <Link
          href="/dashboard/websites/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold text-sm transition-all text-white shrink-0 self-start md:self-auto shadow-lg hover:shadow-blue-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          Create New Website
        </Link>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Draft submissions</span>
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">{draftCount + underReviewCount}</p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Layouts</span>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">{generatedCount}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published Sites</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">{publishedCount}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-32 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</span>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white mt-4">0</p>
          </div>
        </div>
      </div>

      {/* Recent Website Activity */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Submissions</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {websites.slice(0, 4).map((web) => (
              <div key={web._id} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <div>
                  <h4 className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {web.companyName}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{web.category}</span>
                </div>
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
            ))}
            {websites.length === 0 && (
              <p className="text-xs text-slate-500 italic py-6 text-center col-span-full">No business submissions available.</p>
            )}
          </div>
        </div>
        <div className="flex justify-start mt-6 pt-4 border-t border-slate-850">
          <Link
            href="/dashboard/websites"
            className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 font-semibold"
          >
            Manage all websites
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
