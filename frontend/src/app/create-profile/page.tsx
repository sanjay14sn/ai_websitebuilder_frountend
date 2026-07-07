'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { getGripMember, isGripAuthenticated, fetchGripMemberProfile, GripMemberProfile, isGripAdminMobile, cacheGripMemberProfile } from '@/utils/gripApi';
import AssociateProfileDropdown from '@/components/AssociateProfileDropdown';
import { useToast } from '@/components/ToastProvider';
import {
  Save,
  Plus,
  X,
  UploadCloud,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Contact,
  Sparkles,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

const fieldInputClass =
  'w-full bg-white border border-[#d4d4d4] hover:border-[#a3a3a3] focus:border-[#c21a22] focus:ring-1 focus:ring-[#c21a22] rounded-xl py-3 px-4 text-[#171717] placeholder:text-[#737373] focus:outline-none transition-all text-sm shadow-sm';

const fieldLabelClass =
  'block text-xs uppercase font-bold text-[#525252] mb-1.5 tracking-wider';

function slugifyCompanyName(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function PublicCreateProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  // Status and URL for existing website request
  const [existingStatus, setExistingStatus] = useState<string>('DRAFT');
  const [webUrl, setWebUrl] = useState<string>('');

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
  const [authChecked, setAuthChecked] = useState(false);
  const [associateProfile, setAssociateProfile] = useState<GripMemberProfile | null>(null);
  const [aiHelperLoading, setAiHelperLoading] = useState(false);

  const handleAiHelper = async () => {
    if (!companyName || !category || !location) {
      toast.warning('Missing Fields', 'Please fill out Company Name, Business Category, and Location/Head Office first to use the AI Helper.');
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
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const dashboardUser = storedUser ? JSON.parse(storedUser) : null;

    if (dashboardUser?.role === 'admin' && token) {
      router.replace('/dashboard');
      return;
    }

    if (!isGripAuthenticated()) {
      router.replace('/');
      return;
    }

    const checkExistingWebsite = async (mobile: string) => {
      try {
        const res = await api.get(`/websites/public/check-mobile/${mobile}`);
        if (res && res.success && res.exists && res.data) {
          const existingWeb = res.data;
          if (existingWeb.status !== 'DEACTIVATED') {
            setSubmitted(true);
            setCompanyName(existingWeb.companyName);
            setExistingStatus(existingWeb.status || 'DRAFT');
            setWebUrl(existingWeb.webUrl || '');
          }
        }
      } catch (err) {
        console.error('Failed to load existing website:', err);
      }
    };

    const member = getGripMember();
    if (!member?.id) {
      setAuthChecked(true);
      setProfileLoading(false);
      return;
    }

    if (member.mobileNumber) {
      checkExistingWebsite(member.mobileNumber);
    }

    if (isGripAdminMobile(member.mobileNumber)) {
      router.replace('/dashboard');
      return;
    }

    fetchGripMemberProfile(member.id)
      .then((profile) => {
        cacheGripMemberProfile(profile);
        setAssociateProfile(profile);
      })
      .catch(() => {
        setAssociateProfile({
          id: member.id,
          firstName: member.username?.split(' ')[0] || '',
          lastName: member.username?.split(' ').slice(1).join(' ') || '',
          fullName: member.username || 'Associate',
          mobileNumber: member.mobileNumber,
          email: member.email,
        });
      })
      .finally(() => {
        setProfileLoading(false);
        setAuthChecked(true);
      });
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-[#f4f4f5] flex items-center justify-center">
        <p className="text-[#525252] text-sm">Loading...</p>
      </div>
    );
  }

  // Auto-slugify company name on change
  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    setSlug(slugifyCompanyName(val));
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Please upload an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await api.upload('/media/upload-public', file);
      const url = res.data?.url || res.url;
      if (!url) throw new Error('Upload response missing URL');
      if (type === 'logo') {
        setLogo(url);
        toast.success('Logo Uploaded', 'Your company logo has been uploaded successfully.');
      } else {
        setGalleryImages((prev) => [...prev, url]);
        toast.success('Image Uploaded', 'Service image has been added.');
      }
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not upload the image. Please try again.');
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

    // Validate services count
    if (services.length < 1) {
      toast.warning('Services Required', 'Please add at least one core service before submitting.');
      return;
    }
    if (!description.trim()) {
      toast.warning('Description Required', 'Please provide a detailed description of your business.');
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
      chapter: associateProfile?.chapterName || '',
      zone: associateProfile?.zoneName || '',
    };

    try {
      const res = await api.post('/websites', payload);
      if (res.success && res.data) {
        setExistingStatus(res.data.status || 'DRAFT');
        setWebUrl(res.data.webUrl || '');
        setCompanyName(res.data.companyName || companyName);
      }
      toast.success('Request Submitted!', 'Your webpage request has been sent to the administrator.');
      setSubmitted(true);
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Could not submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const getStatusDetails = () => {
      switch (existingStatus) {
        case 'PUBLISHED':
          return {
            title: 'Your Webpage is Live!',
            description: `Congratulations! Your business website for "${companyName}" has been approved and published to the web. You can visit it using the link below.`,
          };
        case 'GENERATED':
          return {
            title: 'Webpage Generated',
            description: `The AI layout generator has structured your website copy and sections for "${companyName}". An administrator is reviewing the preview and will publish it shortly.`,
          };
        case 'UNDER_REVIEW':
          return {
            title: 'Under Review',
            description: `Your webpage request details for "${companyName}" are under verification. An administrator will generate the layout sections shortly.`,
          };
        default:
          return {
            title: 'Request Submitted Successfully!',
            description: `Thank you for submitting your request for "${companyName}". Your details have been received. An administrator will review and launch your site shortly.`,
          };
      }
    };

    const statusInfo = getStatusDetails();

    return (
      <div className="min-h-screen w-full bg-[#f4f4f5] text-[#171717] flex flex-col">
        <header className="w-full bg-[#c21a22] px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-4 shadow-md shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img src="/logo.png" alt="GRIP Logo" className="h-10 sm:h-12 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[#ffffff] text-sm sm:text-base font-bold truncate">GRIP Business Forum</p>
              <p className="text-[#ffffffcc] text-[10px] sm:text-xs uppercase tracking-wider">Webpage builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <AssociateProfileDropdown
              profile={associateProfile}
              loading={profileLoading}
              variant="light"
            />
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('gripToken');
                localStorage.removeItem('gripMember');
                localStorage.removeItem('gripMemberProfile');
                router.replace('/');
              }}
              className="text-[#ffffffe6] hover:text-[#ffffff] text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-10 sm:py-16 flex flex-col items-center justify-center text-center">
          <div className="w-full max-w-xl bg-white border border-[#e5e5e5] rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              {statusInfo.title}
            </h1>
            <p className="text-[#525252] text-sm leading-relaxed">
              {statusInfo.description}
            </p>

            <div className="p-5 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl max-w-sm mx-auto space-y-2">
              <span className="text-[10px] text-[#737373] uppercase font-bold tracking-wider block">Webpage Status</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                existingStatus === 'PUBLISHED'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : existingStatus === 'GENERATED'
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-600'
                  : existingStatus === 'UNDER_REVIEW'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
              }`}>
                {existingStatus}
              </span>

              {existingStatus === 'PUBLISHED' && webUrl && (
                <div className="pt-2">
                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#c21a22] font-semibold hover:underline"
                  >
                    Visit Live Site
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#c21a22] hover:bg-[#a6141a] text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
              >
                Return Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f4f5] text-[#171717] flex flex-col">
      <header className="w-full bg-[#c21a22] px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-4 shadow-md shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img src="/logo.png" alt="GRIP Logo" className="h-10 sm:h-12 object-contain shrink-0" />
          <div className="min-w-0">
            <p className="text-[#ffffff] text-sm sm:text-base font-bold truncate">GRIP Business Forum</p>
            <p className="text-[#ffffffcc] text-[10px] sm:text-xs uppercase tracking-wider">Webpage builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AssociateProfileDropdown
            profile={associateProfile}
            loading={profileLoading}
            variant="light"
          />
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('gripToken');
              localStorage.removeItem('gripMember');
              localStorage.removeItem('gripMemberProfile');
              router.replace('/');
            }}
            className="text-[#ffffffe6] hover:text-[#ffffff] text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8 lg:py-10">
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="w-full bg-white border border-[#e5e5e5] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 space-y-8 lg:space-y-10 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border-b border-[#eaeaea] pb-6">
            <div className="shrink-0">
              <img src="/logo.png" alt="GRIP Logo" className="h-14 sm:h-16 lg:h-20 object-contain" />
            </div>
            <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] tracking-tight">
                Webpage Request Form
              </h1>
              <p className="text-xs sm:text-sm text-[#525252]">
                Please fill in the details below to submit your business profile request to the administrator.
              </p>
            </div>
          </div>

          {/* SECTION 1: Business Profile */}
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
              <Briefcase className="w-5 h-5 text-[#c21a22] shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-[#171717]">Business Profile Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              <div>
                <label className={fieldLabelClass}>
                  Representative Name <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>
                  Company Name <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grip Logistics"
                  value={companyName}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>
                  Website URL Slug <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="grip-logistics"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  className={`${fieldInputClass} font-mono bg-[#fafafa]`}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>
                  Business Category <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logistics & Freight Services"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div className="sm:col-span-2 xl:col-span-2">
                <label className={fieldLabelClass}>
                  Location / Head Office <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Delhi, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Contact & Socials */}
          <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4 border-t border-[#eaeaea]">
            <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
              <Contact className="w-5 h-5 text-[#c21a22] shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-[#171717]">Contact & Social Media</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              <div className="sm:col-span-1 xl:col-span-2">
                <label className={fieldLabelClass}>
                  Phone Number <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div className="sm:col-span-1 xl:col-span-2">
                <label className={fieldLabelClass}>
                  Contact Email <span className="text-[#c21a22] font-extrabold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@griplogistics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Services & Description */}
          <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4 border-t border-[#eaeaea]">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c21a22] shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-[#171717]">Services & Copywriting Info</h3>
              </div>
              <button
                type="button"
                onClick={handleAiHelper}
                disabled={aiHelperLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c21a22] hover:bg-[#a6141a] disabled:bg-[#f3a0a3] text-white text-xs font-semibold rounded-lg transition-all shadow-sm shrink-0"
              >
                {aiHelperLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Helper
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className={fieldLabelClass}>
                  Detailed Description
                </label>
                <textarea
                  rows={5}
                  placeholder="Explain your history, values, goals, and client approach. This description feeds into the AI model to write copy blocks for your website layout."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${fieldInputClass} leading-relaxed min-h-[120px] resize-y`}
                />
              </div>

              <div>
                <label className={fieldLabelClass}>
                  Core Services Offered
                </label>
                <p className="text-[11px] text-[#737373] mb-3">Add the specific services your business offers. The AI layout copywriter will create dedicated content sections for each.</p>
                
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g. Worldwide Cargo Express"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className={`${fieldInputClass} flex-1`}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="px-5 py-3 bg-[#c21a22] hover:bg-[#a6141a] text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 sm:shrink-0"
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
                      className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-[#d4d4d4] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#c21a22]/10 border border-[#c21a22]/20 text-[#c21a22] flex items-center justify-center font-bold text-[10px] shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#171717] text-xs font-bold truncate">
                          {srv}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="p-1 text-[#737373] hover:text-[#c21a22] hover:bg-[#c21a22]/10 rounded-lg transition-all shrink-0"
                        title="Remove Service"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-[#e5e5e5] rounded-xl bg-[#f9f9f9]/50">
                    <p className="text-xs text-[#737373] italic">No services listed yet. Add your first service above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Branding */}
          <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4 border-t border-[#eaeaea]">
            <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
              <ImageIcon className="w-5 h-5 text-[#c21a22] shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-[#171717]">Logo & Brand Assets</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className={fieldLabelClass}>Company Logo File</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {logo && (
                    <div className="w-16 h-16 bg-[#fafafa] rounded-xl border border-[#e5e5e5] overflow-hidden flex items-center justify-center p-2 shrink-0 shadow-sm mx-auto sm:mx-0">
                      <img src={logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <label className="flex flex-col items-center justify-center h-20 border border-dashed border-[#d4d4d4] hover:border-[#c21a22] rounded-xl cursor-pointer bg-[#fafafa] hover:bg-[#fff5f6] transition-all">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <UploadCloud className="w-5 h-5 text-[#737373]" />
                        <span className="text-[10px] text-[#525252] font-semibold">{uploading ? 'Uploading...' : 'Upload Logo'}</span>
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
                <div className="pt-1 text-[10px] text-[#737373]">Or paste Logo URL:</div>
                <input
                  type="text"
                  placeholder="https://company.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className={`${fieldInputClass} py-2.5 px-3 text-xs`}
                />
              </div>

              <div className="space-y-2">
                <label className={fieldLabelClass}>Service Images</label>
                <label className="flex flex-col items-center justify-center h-20 border border-dashed border-[#d4d4d4] hover:border-[#c21a22] rounded-xl cursor-pointer bg-[#fafafa] hover:bg-[#fff5f6] transition-all">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UploadCloud className="w-5 h-5 text-[#737373]" />
                    <span className="text-[10px] text-[#525252] font-semibold">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => handleFileUpload(e, 'gallery')}
                    className="hidden"
                  />
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-video bg-[#fafafa] rounded-lg overflow-hidden border border-[#e5e5e5] group shadow-sm">
                      <img src={img} alt="Gallery Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute inset-0 bg-[#c21a22]/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 border-t border-[#eaeaea] pt-6 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#c21a22] hover:bg-[#a6141a] disabled:bg-[#d94a50] disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Submitting Form...' : 'Submit Webpage Request'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
