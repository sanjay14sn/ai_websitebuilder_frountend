'use client';

import { useEffect, useState } from 'react';
import {
  fetchGripMemberProfile,
  getGripMember,
  getCachedGripMemberProfile,
  cacheGripMemberProfile,
  GripMemberProfile,
} from '@/utils/gripApi';

export function useAssociateProfile() {
  const [profile, setProfile] = useState<GripMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedGripMemberProfile();
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }

    const member = getGripMember();
    if (!member?.id) {
      setLoading(false);
      return;
    }

    const fallback: GripMemberProfile = {
      id: member.id,
      firstName: member.username?.split(' ')[0] || '',
      lastName: member.username?.split(' ').slice(1).join(' ') || '',
      fullName: member.username || 'Associate',
      mobileNumber: member.mobileNumber,
      email: member.email,
    };

    if (!localStorage.getItem('gripToken')) {
      setProfile((prev) => prev || fallback);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchGripMemberProfile(member.id)
      .then((loaded) => {
        cacheGripMemberProfile(loaded);
        setProfile(loaded);
      })
      .catch(() => setProfile((prev) => prev || fallback))
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading };
}
