'use client';

import React from 'react';
import { GripMemberProfile } from '@/utils/gripApi';
import { Building2, Mail, MapPin, Phone, User } from 'lucide-react';

interface AssociateProfileCardProps {
  profile: GripMemberProfile;
  loading?: boolean;
}

function formatMemberSince(dateStr?: string) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AssociateProfileCard({
  profile,
  loading = false,
}: AssociateProfileCardProps) {
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const memberSince = formatMemberSince(profile.memberSince);

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#e5e5e5]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#e5e5e5] rounded w-3/4" />
            <div className="h-3 bg-[#e5e5e5] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full rounded-2xl border border-[#f0d4d6] bg-[#fff8f8] overflow-hidden shadow-sm">
      <div className="bg-[#c21a22] px-4 py-2.5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/90">
          Logged in Associate
        </p>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-4">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#c21a22] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
              {getInitials(profile.fullName) || <User className="w-7 h-7" />}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-[#171717] leading-tight truncate">
              {profile.fullName}
            </h2>
            {profile.companyName && (
              <p className="text-sm text-[#525252] truncate">{profile.companyName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          {profile.categoryRepresented && (
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-[#c21a22] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Category
                </p>
                <p className="text-[#171717] break-words">{profile.categoryRepresented}</p>
              </div>
            </div>
          )}

          {profile.mobileNumber && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-[#c21a22] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Mobile
                </p>
                <p className="text-[#171717]">{profile.mobileNumber}</p>
              </div>
            </div>
          )}

          {profile.email && (
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#c21a22] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Email
                </p>
                <p className="text-[#171717] break-all">{profile.email}</p>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#c21a22] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Location
                </p>
                <p className="text-[#171717]">{location}</p>
              </div>
            </div>
          )}
        </div>

        {(profile.chapterName || profile.zoneName || memberSince) && (
          <div className="pt-3 border-t border-[#f0d4d6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
            {profile.chapterName && (
              <div>
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Chapter
                </p>
                <p className="text-[#171717] font-semibold">{profile.chapterName}</p>
              </div>
            )}
            {profile.zoneName && (
              <div>
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Zone
                </p>
                <p className="text-[#171717] font-semibold">{profile.zoneName}</p>
              </div>
            )}
            {memberSince && (
              <div>
                <p className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
                  Member Since
                </p>
                <p className="text-[#171717] font-semibold">{memberSince}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
