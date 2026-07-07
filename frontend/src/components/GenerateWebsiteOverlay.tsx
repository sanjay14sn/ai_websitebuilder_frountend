'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface GenerateWebsiteOverlayProps {
  companyName?: string;
  themeColor?: string;
}

const getRgbaColor = (hex: string, alpha: number) => {
  if (hex.startsWith('#')) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    let r, g, b;
    if (cleanHex.length === 3) {
      r = ((num >> 8) & 0xf) * 17;
      g = ((num >> 4) & 0xf) * 17;
      b = (num & 0xf) * 17;
    } else {
      r = (num >> 16) & 0xff;
      g = (num >> 8) & 0xff;
      b = num & 0xff;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
};

export default function GenerateWebsiteOverlay({ companyName, themeColor = '#a855f7' }: GenerateWebsiteOverlayProps) {
  const loaderBgColor = getRgbaColor(themeColor, 0.2);
  const textColor = getRgbaColor(themeColor, 0.8);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="flex flex-col items-center gap-5 text-center px-6 max-w-md">
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-full border-4" 
            style={{ borderColor: loaderBgColor }}
          />
          <Loader2 
            className="w-20 h-20 animate-spin absolute inset-0" 
            style={{ color: themeColor }}
          />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-white">Generating Website</p>
          {companyName && (
            <p 
              className="text-sm font-medium" 
              style={{ color: textColor }}
            >
              {companyName}
            </p>
          )}
          <p className="text-xs text-slate-400 leading-relaxed">
            AI is building the full GRIP page — header, services, gallery, contact form, and more.
            This can take 1–2 minutes. Please keep this tab open.
          </p>
        </div>
      </div>
    </div>
  );
}
