'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import {
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
  Play,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  Globe,
  Loader2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
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
  website: string;
  description: string;
  services: string[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  logo?: string;
  galleryImages: string[];
  status: 'DRAFT' | 'UNDER_REVIEW' | 'GENERATED' | 'PUBLISHED' | 'DEACTIVATED';
  webUrl?: string;
  createdAt: string;
}

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const toast = useToast();
  const [data, setData] = useState<{ website: WebsiteData; layout: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get(`/websites/${id}`);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('Load Failed', err.message || 'Failed to load website details.');
      router.push('/dashboard/websites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.put(`/websites/${id}`, { status });
      toast.success('Status Updated', `Website status changed to ${status}.`);
      loadData();
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update website status.');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerGenerator = async () => {
    setConfirmGenerate(false);
    setGenerating(true);
    setActionLoading(true);
    try {
      await api.post(`/websites/${id}/generate`);
      toast.success('Website Generated!', 'The AI has successfully structured all content sections.');
      await loadData();
    } catch (err: any) {
      toast.error('Generation Failed', err.message || 'Website generation failed. Please try again.');
    } finally {
      setGenerating(false);
      setActionLoading(false);
    }
  };

  const triggerPublish = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/websites/${id}/publish`);
      const mockNote = res.mock ? ' (Mock mode)' : '';
      toast.success('Website Published!', `Successfully pushed to Cloudflare KV.${mockNote}`);
      await loadData();
    } catch (err: any) {
      toast.error('Publish Failed', err.message || 'Publishing failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDeactivate = async () => {
    setConfirmDeactivate(false);
    setActionLoading(true);
    try {
      await api.post(`/websites/${id}/deactivate`);
      toast.success('Website Deactivated', 'The site has been taken offline successfully.');
      await loadData();
    } catch (err: any) {
      toast.error('Deactivation Failed', err.message || 'Could not deactivate the website.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;
  const { website, layout } = data;

  return (
    <div className="space-y-8">
      {generating && (
        <GenerateWebsiteOverlay
          companyName={website.companyName}
          themeColor={layout?.themeSettings?.primaryColor || '#E63946'}
        />
      )}

      {/* Deactivation Confirmation Modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deactivate Website</h3>
                <p className="text-xs text-slate-500">This will take the site offline immediately.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong>{website.companyName}</strong>? It will be removed from the live domain instantly.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={triggerDeactivate}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Website Confirmation Modal */}
      {confirmGenerate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Generate Website with AI</h3>
                <p className="text-xs text-slate-500">This may take 1–2 minutes to complete.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The AI will generate full HTML/CSS layout and copy sections for <strong>{website.companyName}</strong>. Any previously generated content will be overwritten.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmGenerate(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmGenerate(true)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/websites" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4.5 h-4.5" />
            Back to Websites
          </Link>
          <h1 className="text-2xl font-bold text-white">{website.companyName}</h1>
          <p className="text-xs text-slate-500 mt-1">Review parameters and transition status through lifecycle steps.</p>
        </div>

        {/* Life-cycle Control Panel */}
        <div className="flex items-center gap-3">
          {website.status === 'DRAFT' && (
            <button
              onClick={() => updateStatus('UNDER_REVIEW')}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-750 transition-all flex items-center gap-2"
            >
              Mark Under Review
            </button>
          )}

          {(website.status === 'DRAFT' || website.status === 'UNDER_REVIEW') && (
            <button
              onClick={() => setConfirmGenerate(true)}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-500/10 flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Website
            </button>
          )}          {(website.status === 'GENERATED' || website.status === 'PUBLISHED' || website.status === 'DEACTIVATED') && (
            <>
              <button
                onClick={() => setConfirmGenerate(true)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-500/10 flex items-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Regenerate Website
              </button>
              <Link
                href={`/dashboard/websites/${website._id}/editor`}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Launch Section Builder
              </Link>
              <Link
                href={`/dashboard/websites/${website._id}/preview`}
                className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-750 transition-all"
              >
                Launch Preview
              </Link>
              {(website.status === 'GENERATED' || website.status === 'DEACTIVATED') && (
                <button
                  onClick={triggerPublish}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {website.status === 'DEACTIVATED' ? 'Re-activate & Publish' : 'Publish to KV'}
                </button>
              )}
              {website.status === 'PUBLISHED' && (
                <>
                  <a
                    href={website.webUrl || `https://${website.slug}-${website._id.slice(-4)}.gripforumglobal.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live Site
                  </a>
                  <button
                    onClick={() => setConfirmDeactivate(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-red-500/10 flex items-center gap-2"
                  >
                    Deactivate Site
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left main: Business Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Business Profile Parameters
            </h3>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Description</span>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{website.description}</p>
            </div>

            {/* Services List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Core Services</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {website.services.map((srv, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
                    {srv}
                  </span>
                ))}
                {website.services.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No services registered.</span>
                )}
              </div>
            </div>

            {/* Brand Logo */}
            <div className="pt-4 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Corporate Brand Logo</span>
              {website.logo ? (
                <div className="w-24 h-24 bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 p-3 flex items-center justify-center">
                  <img src={website.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="text-xs text-slate-600 italic">No logo provided.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Status and settings */}
        <div className="space-y-6">
          {/* Status Tracker Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lifecycle Tracking</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Active Status</span>
                <span className="text-lg font-extrabold text-white">{website.status}</span>
              </div>
            </div>

            {/* Steps Visual List */}
            <div className="relative pl-1 space-y-5 pt-4 border-t border-slate-800">
              {/* Vertical timeline connector */}
              <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-slate-800"></div>

              {[
                { label: 'DRAFT', desc: 'Parameters submitted' },
                { label: 'UNDER_REVIEW', desc: 'Admin review verification' },
                { label: 'GENERATED', desc: 'AI JSON template configured' },
                { label: 'PUBLISHED', desc: 'Pushed to Cloudflare KV' },
              ].map((step, idx) => {
                const statuses = ['DRAFT', 'UNDER_REVIEW', 'GENERATED', 'PUBLISHED'];
                const currentIdx = statuses.indexOf(website.status);
                const stepIdx = statuses.indexOf(step.label);
                const isPassed = stepIdx < currentIdx || (website.status === 'PUBLISHED' && stepIdx === currentIdx);
                const isCurrent = stepIdx === currentIdx && website.status !== 'PUBLISHED';

                return (
                  <div key={idx} className="flex items-start gap-4 relative z-10">
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                          isPassed
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-blue-600/20 border-blue-500 text-blue-500 animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-semibold block ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{step.label}</span>
                      <span className="text-[10px] text-slate-500 block">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Onboarding Contact</h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="truncate">{website.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{website.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="truncate">{website.location}</span>
              </div>
              {website.website && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <a href={website.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                    {website.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
