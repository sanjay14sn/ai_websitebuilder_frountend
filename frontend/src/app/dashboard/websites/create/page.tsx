'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  X,
  UploadCloud,
  CheckCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { fetchGripZones, fetchGripChaptersByZone, GripZone, GripChapter } from '@/utils/gripApi';

export default function CreateWebsitePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form Fields State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [chapter, setChapter] = useState('');
  const [zone, setZone] = useState('');

  const [zonesList, setZonesList] = useState<GripZone[]>([]);
  const [chaptersList, setChaptersList] = useState<GripChapter[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');

  useEffect(() => {
    fetchGripZones().then((res) => {
      setZonesList(res);
    });
  }, []);

  const handleZoneChange = async (zoneId: string, zoneName: string) => {
    setSelectedZoneId(zoneId);
    setZone(zoneName);
    setChapter('');
    setChaptersList([]);
    if (zoneId) {
      const res = await fetchGripChaptersByZone(zoneId);
      setChaptersList(res);
    }
  };
  
  // Services (dynamic tags)
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  
  // Social Links
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Branding Visuals
  const [logo, setLogo] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiHelperLoading, setAiHelperLoading] = useState(false);

  const handleAiHelper = async () => {
    if (!companyName || !category || !location) {
      toast.warning('Missing Fields', 'Please fill out Company Name, Business Category, and Location/Head Office first.');
      return;
    }
    setAiHelperLoading(true);
    try {
      const res = await api.post('/websites/ai-helper', { companyName, category, location });
      if (res && res.success) {
        setDescription(res.data.description || '');
        setServices(res.data.services || []);
        toast.success('AI Helper Complete', 'Description and 6 core services have been auto-generated!');
      }
    } catch (err: any) {
      toast.error('AI Helper Failed', err.message || 'Failed to generate profile suggestions.');
    } finally {
      setAiHelperLoading(false);
    }
  };

  // Auto-slugify company name on change
  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Please upload an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await api.upload('/media/upload', file);
      const url = res.data?.url || res.url;
      if (!url) throw new Error('Upload response missing URL');
      if (type === 'logo') {
        setLogo(url);
        toast.success('Logo Uploaded', 'Company logo uploaded successfully.');
      } else {
        setGalleryImages((prev) => [...prev, url]);
        toast.success('Image Uploaded', 'Service image has been added.');
      }
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not upload the image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!zone || !chapter) {
      toast.warning('Zone & Chapter Required', 'Please select both Zone and Chapter before submitting.');
      return;
    }
    if (services.length < 1) {
      toast.warning('Services Required', 'Please add at least one core service.');
      return;
    }

    setLoading(true);

    const payload = {
      name,
      companyName,
      slug,
      category,
      location,
      phoneNumber,
      email,
      website,
      description,
      services,
      socialLinks: { facebook, instagram, twitter, linkedin },
      logo,
      galleryImages,
      chapter,
      zone,
    };

    try {
      await api.post('/websites', payload);
      toast.success('Profile Registered!', 'Business details saved. Status set to DRAFT.');
      router.push('/dashboard/websites');
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Failed to submit business details.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.min(prev + 1, 4));
  };
  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/websites" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4.5 h-4.5" />
          Back to Websites
        </Link>
        <h1 className="text-2xl font-bold text-white">Register Business Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Submit parameters to feed into the AI layout copy generator.</p>
      </div>

      {/* Progress tracker */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 h-0.5 bg-slate-800 z-0" />
          <div
            className="absolute left-0 h-0.5 bg-blue-600 transition-all duration-300 z-0"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[
            { num: 1, label: 'Company Info' },
            { num: 2, label: 'Contact Details' },
            { num: 3, label: 'Services & Copy' },
            { num: 4, label: 'Logo & Images' },
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${
                  step > s.num
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : step === s.num
                    ? 'bg-slate-900 border-blue-500 text-blue-500 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-2 hidden sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Company Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Representative Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Grip Logistics"
                  value={companyName}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Website URL Slug (auto-generated)</label>
                <input
                  type="text"
                  required
                  placeholder="grip-logistics"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Business Category</label>
                <input
                  type="text"
                  required
                  placeholder="Logistics & Freight Services"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Location / Head Office</label>
                <input
                  type="text"
                  required
                  placeholder="New Delhi, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Zone Name <span className="text-red-500 font-extrabold">*</span></label>
                <select
                  required
                  value={selectedZoneId}
                  onChange={(e) => {
                    const zId = e.target.value;
                    const zObj = zonesList.find(x => x._id === zId);
                    handleZoneChange(zId, zObj ? zObj.zoneName : '');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm appearance-none"
                >
                  <option value="">Select a Zone...</option>
                  {zonesList.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.zoneName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Chapter Name <span className="text-red-500 font-extrabold">*</span></label>
                <select
                  required
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  disabled={!selectedZoneId}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a Chapter...</option>
                  {chaptersList.map((c) => (
                    <option key={c._id} value={c.chapterName}>
                      {c.chapterName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Contact & Social Links</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="contact@griplogistics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Description & Services */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Services & Business Description</h3>
              <button
                type="button"
                onClick={handleAiHelper}
                disabled={aiHelperLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-purple-500/10 shrink-0"
              >
                {aiHelperLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Helper
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Detailed Description</label>
                <textarea
                  rows={5}
                  placeholder="Provide details about your history, values, and client approach. This text is processed by our generator to build copywriting blocks."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">List Core Services</label>
                <p className="text-[10px] text-slate-500 mb-3">Add the specific services your business offers. The AI layout copywriter will create dedicated content sections for each.</p>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g. Worldwide Cargo Express"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 shrink-0"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    Add Service
                  </button>
                </div>
                
                {/* Services grid listing */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {services.map((srv, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-slate-750 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-slate-200 text-xs font-bold truncate">
                          {srv}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                        title="Remove Service"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <p className="text-xs text-slate-500 italic">No services listed yet. Add your first service above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Brand Visuals */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Brand Visuals & Media</h3>
            
            {/* Logo upload */}
            {/* Logo upload */}
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logo && (
                    <div className="w-16 h-16 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2 shrink-0">
                      <img src={logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center h-20 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer bg-slate-950/40 transition-colors">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <UploadCloud className="w-5 h-5 text-slate-500" />
                        <span className="text-[10px] text-slate-400 font-medium">{uploading ? 'Uploading...' : 'Choose Logo File'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">Or enter URL manually:</div>
                <input
                  type="text"
                  placeholder="https://company.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500 text-xs mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-6 mt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-xl text-slate-300 transition-all border border-slate-750"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl text-white transition-all shadow-md shadow-blue-500/10"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-xs font-semibold rounded-xl text-white transition-all shadow-md shadow-emerald-500/10"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Submitting Details...' : 'Save & Register'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
