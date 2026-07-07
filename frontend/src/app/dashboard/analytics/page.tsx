'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { 
  Globe, 
  Search, 
  MapPin, 
  ExternalLink, 
  Eye, 
  Briefcase, 
  User, 
  ListFilter, 
  Loader2 
} from 'lucide-react';
import Link from 'next/link';
import { fetchGripZones, fetchGripChaptersByZone, GripZone, GripChapter } from '@/utils/gripApi';

interface WebsiteData {
  _id: string;
  name: string;
  companyName: string;
  category: string;
  location: string;
  phoneNumber: string;
  email: string;
  chapter?: string;
  zone?: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'GENERATED' | 'PUBLISHED' | 'DEACTIVATED';
  webUrl?: string;
  createdAt: string;
}

export default function LiveWebpagesPage() {
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedZoneName, setSelectedZoneName] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Dynamic Options
  const [zonesList, setZonesList] = useState<GripZone[]>([]);
  const [chaptersList, setChaptersList] = useState<GripChapter[]>([]);

  const loadData = async () => {
    try {
      const res = await api.get('/websites');
      setWebsites(res.data || []);
    } catch (err) {
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this website? It will be taken offline immediately from the live domain.')) return;
    try {
      await api.post(`/websites/${id}/deactivate`);
      alert('Website successfully deactivated and taken offline.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Deactivation failed');
    }
  };

  useEffect(() => {
    loadData();
    // Fetch BNI/Grip zones for dynamic filtering
    fetchGripZones().then((res) => setZonesList(res));
  }, []);

  const handleZoneChange = async (zoneId: string, zoneName: string) => {
    setSelectedZoneId(zoneId);
    setSelectedZoneName(zoneName);
    setSelectedChapter('');
    setChaptersList([]);
    if (zoneId) {
      const chapters = await fetchGripChaptersByZone(zoneId);
      setChaptersList(chapters);
    }
  };

  // Filter Logic
  const filteredWebsites = websites.filter((site) => {
    // Search filter (company name or representative name)
    const matchesSearch =
      site.companyName.toLowerCase().includes(search.toLowerCase()) ||
      site.name.toLowerCase().includes(search.toLowerCase());

    // Zone filter
    const matchesZone = selectedZoneName
      ? site.zone?.toLowerCase() === selectedZoneName.toLowerCase()
      : true;

    // Chapter filter
    const matchesChapter = selectedChapter
      ? site.chapter?.toLowerCase() === selectedChapter.toLowerCase()
      : true;

    // Status filter
    const matchesStatus = selectedStatus !== 'ALL'
      ? site.status === selectedStatus
      : true;

    return matchesSearch && matchesZone && matchesChapter && matchesStatus;
  });

  const totalRegistered = websites.length;
  const totalLive = websites.filter((w) => w.status === 'PUBLISHED').length;
  const totalDraft = websites.filter((w) => w.status === 'DRAFT').length;

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-bold text-white">Live Webpages & Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor and filter all published associate pages across zones and chapters.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Live Sites</span>
            <span className="text-3xl font-extrabold text-white block">{totalLive}</span>
            <span className="text-[10px] text-slate-400 block">Pushed to Cloudflare KV</span>
          </div>
          <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Registered</span>
            <span className="text-3xl font-extrabold text-white block">{totalRegistered}</span>
            <span className="text-[10px] text-slate-400 block">Draft, review & published</span>
          </div>
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Pending Review</span>
            <span className="text-3xl font-extrabold text-white block">{totalDraft}</span>
            <span className="text-[10px] text-slate-400 block">Awaiting parameter verification</span>
          </div>
          <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <ListFilter className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Control */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Search & Filter Directories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or representative..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-700 text-xs focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Zone dropdown */}
          <div>
            <select
              value={selectedZoneId}
              onChange={(e) => {
                const zId = e.target.value;
                const zObj = zonesList.find(x => x._id === zId);
                handleZoneChange(zId, zObj ? zObj.zoneName : '');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-350 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Zones</option>
              {zonesList.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.zoneName}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter dropdown */}
          <div>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={!selectedZoneId}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-350 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="">All Chapters</option>
              {chaptersList.map((c) => (
                <option key={c._id} value={c.chapterName}>
                  {c.chapterName}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-350 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="GENERATED">GENERATED</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>

        </div>
      </div>

      {/* Directory Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Company / Category</th>
                <th className="py-4 px-6">Representative Details</th>
                <th className="py-4 px-6">Chapter & Zone</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredWebsites.map((site) => (
                <tr key={site._id} className="hover:bg-slate-850/20 transition-colors">
                  
                  {/* Company Info */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-bold text-white text-sm">{site.companyName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-600" />
                      {site.category}
                    </div>
                  </td>

                  {/* Representative Info */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      {site.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {site.email} • {site.phoneNumber}
                    </div>
                  </td>

                  {/* Chapter & Zone Info */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {site.zone || site.chapter ? (
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-350">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {site.zone || 'N/A Zone'}
                        </div>
                        <div className="text-[10px] text-slate-500 pl-1">
                          Chapter: <span className="text-slate-300 font-semibold">{site.chapter || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic">No region mapped</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        site.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : site.status === 'GENERATED'
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          : site.status === 'UNDER_REVIEW'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : site.status === 'DEACTIVATED'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {site.status}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 px-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      
                      {/* Internal Preview link */}
                      {(site.status === 'GENERATED' || site.status === 'PUBLISHED') && (
                        <Link
                          href={`/dashboard/websites/${site._id}/preview`}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                          title="Preview Template"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Link>
                      )}

                      {/* Live Published Subdomain / subdirectory link */}
                      {site.status === 'PUBLISHED' && site.webUrl ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={site.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visit Site
                          </a>
                          <button
                            onClick={() => handleDeactivate(site._id)}
                            className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] transition-all"
                          >
                            Deactivate
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Not Live</span>
                      )}

                      {/* Configure/Settings parameters link */}
                      <Link
                        href={`/dashboard/websites/${site._id}`}
                        className="inline-flex items-center justify-center p-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Configure Specs"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </Link>

                    </div>
                  </td>
                </tr>
              ))}

              {filteredWebsites.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                    No matching websites found. Adjust search filters above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
