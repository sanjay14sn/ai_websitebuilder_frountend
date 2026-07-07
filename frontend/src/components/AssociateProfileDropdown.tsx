'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripMemberProfile } from '@/utils/gripApi';
import AssociateProfileCard from '@/components/AssociateProfileCard';
import { User, X } from 'lucide-react';

interface AssociateProfileDropdownProps {
  profile: GripMemberProfile | null;
  loading?: boolean;
  variant?: 'light' | 'dark';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function AssociateProfileDropdown({
  profile,
  loading = false,
  variant = 'light',
}: AssociateProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const panelWidth = 360;
    const gap = 8;
    const viewportPadding = 16;

    let left = rect.left;
    if (left + panelWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - panelWidth - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const maxPanelHeight = Math.min(window.innerHeight * 0.85, 520);

    if (spaceBelow >= 280 || spaceBelow >= spaceAbove) {
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        left,
        width: panelWidth,
        maxHeight: Math.min(maxPanelHeight, spaceBelow - viewportPadding),
        zIndex: 9999,
      });
    } else {
      setPanelStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + gap,
        left,
        width: panelWidth,
        maxHeight: Math.min(maxPanelHeight, spaceAbove - viewportPadding),
        zIndex: 9999,
      });
    }
  };

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const handleReposition = () => updatePanelPosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  const displayName = profile?.fullName || profile?.mobileNumber || 'Profile';
  const initials = getInitials(displayName);

  const triggerClass =
    variant === 'dark'
      ? 'flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all shrink-0'
      : 'flex items-center justify-center w-9 h-9 rounded-full bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-all shrink-0';

  const panel =
    open && mounted
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-black/20"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              style={panelStyle}
              className="overflow-y-auto rounded-2xl shadow-2xl"
              role="dialog"
              aria-label="Associate profile"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#171717]/10 text-[#171717] flex items-center justify-center md:hidden"
                  aria-label="Close profile"
                >
                  <X className="w-4 h-4" />
                </button>
                <AssociateProfileCard
                  profile={
                    profile || {
                      id: '',
                      firstName: '',
                      lastName: '',
                      fullName: 'Associate',
                    }
                  }
                  loading={loading}
                />
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) updatePanelPosition();
          setOpen((prev) => !prev);
        }}
        aria-label="View associate profile"
        aria-expanded={open}
        className={triggerClass}
      >
        {profile?.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : initials ? (
          <span className="text-xs font-bold">{initials}</span>
        ) : (
          <User className="w-4 h-4" />
        )}
      </button>
      {panel}
    </div>
  );
}
