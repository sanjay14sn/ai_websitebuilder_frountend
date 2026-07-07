'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gripMemberLogin, isGripAdminMobile, gripAdminMobileLogin } from '@/utils/gripApi';
import { Lock, Smartphone, AlertCircle, Eye, EyeOff } from 'lucide-react';

const REMEMBER_MOBILE_KEY = 'gripRememberMobile';

export default function GripLoginForm() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedMobile = localStorage.getItem(REMEMBER_MOBILE_KEY);
    if (savedMobile) {
      setMobileNumber(savedMobile);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);

    try {
      const trimmedMobile = mobileNumber.trim();
      const normalizedMobile = trimmedMobile.replace(/\D/g, '');

      if (rememberMe) {
        localStorage.setItem(REMEMBER_MOBILE_KEY, trimmedMobile);
      } else {
        localStorage.removeItem(REMEMBER_MOBILE_KEY);
      }

      if (isGripAdminMobile(trimmedMobile)) {
        const adminSession = await gripAdminMobileLogin(normalizedMobile, pin);
        localStorage.setItem('token', adminSession.token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: adminSession.id,
            username: adminSession.username || `admin-${normalizedMobile}`,
            email: adminSession.email || `${normalizedMobile}@grip.admin`,
            role: 'admin',
          })
        );
        localStorage.setItem(
          'gripMember',
          JSON.stringify({
            id: adminSession.id,
            mobileNumber: normalizedMobile,
            email: adminSession.email,
            username: adminSession.username,
          })
        );
        localStorage.removeItem('gripToken');
        router.push('/dashboard');
        return;
      }

      const res = await gripMemberLogin(trimmedMobile, pin);
      localStorage.setItem('gripToken', res.token);
      localStorage.setItem('gripMember', JSON.stringify(res.member));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/create-profile');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#c21a22] flex flex-col md:flex-row relative overflow-hidden items-stretch">
      <div className="hidden md:flex md:w-1/2 justify-center items-end relative overflow-hidden bg-[#c21a22]">
        <img
          src="/business_woman.png"
          alt="GRIP Business Forum Representative"
          className="max-h-[90vh] object-contain object-bottom select-none"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-[#c21a22]">
        <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl relative flex flex-col items-center space-y-6">
          <div className="w-full text-center space-y-3">
            <img src="/logo.png" alt="GRIP Logo" className="h-16 md:h-20 object-contain mx-auto" />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#171717] tracking-tight">
                Welcome back! GRIP Business Forum
              </h1>
              <p className="text-xs text-[#737373] uppercase font-bold tracking-wider">
                Webpage builder
              </p>
            </div>
          </div>

          {error && (
            <div className="w-full flex items-center gap-3 bg-red-50 text-[#b91e15] p-4 rounded-xl text-sm border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                required
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="grip-login-input w-full bg-[#fff5f6] border border-[#e5e5e5] rounded-xl py-3.5 pl-12 pr-4 text-[#171717] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#c21a22] transition-all text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type={showPin ? 'text' : 'password'}
                required
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="grip-login-input w-full bg-[#fff5f6] border border-[#e5e5e5] rounded-xl py-3.5 pl-12 pr-12 text-[#171717] placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#c21a22] transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-700"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs w-full pt-1">
              <label className="flex items-center gap-2 text-[#525252] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#c21a22] focus:ring-[#c21a22]"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-[#c21a22] hover:text-[#a6141a] font-bold">
                Forgot PIN?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#c21a22] hover:bg-[#a6141a] disabled:bg-[#d94a50] disabled:cursor-not-allowed font-semibold rounded-xl text-white transition-all shadow-lg hover:shadow-red-800/10 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-xs text-[#525252] pt-2 border-t border-[#e5e5e5] w-full space-y-2">
            <div>
              Don&apos;t have a webpage profile?{' '}
              <a href="/create-profile" className="text-[#c21a22] hover:text-[#a6141a] font-bold underline">
                Register Business Profile
              </a>
            </div>
            <div className="text-[10px] text-[#737373] pt-1">
              Let&apos;s grow together! Join the GRIP Business Forum
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
