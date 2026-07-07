import { getApiBaseUrl } from './api';

const GRIP_BASE_URL = (
  process.env.NEXT_PUBLIC_GRIP_API_URL || 'http://127.0.0.1:4002'
).replace('localhost', '127.0.0.1');

export const GRIP_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_GRIP_IMAGE_URL || `${GRIP_BASE_URL}/api/public`;

export interface GripMember {
  id: string;
  mobileNumber: string;
  email?: string;
  chapterId?: string;
  username?: string;
}

export interface GripMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  companyName?: string;
  categoryRepresented?: string;
  industry?: string;
  email?: string;
  mobileNumber?: string;
  secondaryPhone?: string;
  website?: string;
  profileImageUrl?: string;
  chapterName?: string;
  zoneName?: string;
  city?: string;
  state?: string;
  memberSince?: string;
  businessDescription?: string;
}

export interface GripLoginResponse {
  success: boolean;
  token: string;
  member: GripMember;
  message?: string;
}

function buildProfileImageUrl(profileImage?: {
  docPath?: string;
  docName?: string;
}): string | undefined {
  if (!profileImage?.docPath || !profileImage?.docName) return undefined;
  return `${GRIP_IMAGE_BASE_URL}/${profileImage.docPath}/${profileImage.docName}`;
}

function mapMemberProfile(data: Record<string, unknown>): GripMemberProfile {
  const personal = (data.personalDetails || {}) as Record<string, unknown>;
  const contact = (data.contactDetails || {}) as Record<string, unknown>;
  const chapterInfo = (data.chapterInfo || {}) as Record<string, unknown>;
  const businessAddress = (data.businessAddress || {}) as Record<string, unknown>;
  const businessDetails = (data.businessDetails || {}) as Record<string, unknown>;
  const chapter = chapterInfo.chapterId as Record<string, unknown> | undefined;
  const zone = chapterInfo.zoneId as Record<string, unknown> | undefined;

  const firstName = String(personal.firstName || '');
  const lastName = String(personal.lastName || '');

  return {
    id: String(data._id || data.id || ''),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || 'Associate',
    companyName: personal.companyName ? String(personal.companyName) : undefined,
    categoryRepresented: personal.categoryRepresented
      ? String(personal.categoryRepresented)
      : undefined,
    industry: personal.industry ? String(personal.industry) : undefined,
    email: contact.email ? String(contact.email) : undefined,
    mobileNumber: contact.mobileNumber ? String(contact.mobileNumber) : undefined,
    secondaryPhone: contact.secondaryPhone ? String(contact.secondaryPhone) : undefined,
    website: contact.website ? String(contact.website) : undefined,
    profileImageUrl: buildProfileImageUrl(
      personal.profileImage as { docPath?: string; docName?: string } | undefined
    ),
    chapterName: chapter?.chapterName ? String(chapter.chapterName) : undefined,
    zoneName: zone?.zoneName ? String(zone.zoneName) : undefined,
    city: businessAddress.city ? String(businessAddress.city) : undefined,
    state: businessAddress.state ? String(businessAddress.state) : undefined,
    memberSince: data.createdAt ? String(data.createdAt) : undefined,
    businessDescription: businessDetails.businessDescription
      ? String(businessDetails.businessDescription)
      : undefined,
  };
}

export const GRIP_ADMIN_MOBILES = (
  process.env.NEXT_PUBLIC_GRIP_ADMIN_MOBILES || '9988776655,9944270374,9551205555'
)
  .split(',')
  .map((mobile) => mobile.trim())
  .filter(Boolean);

export function normalizeMobileNumber(value: string) {
  return value.replace(/\D/g, '');
}

export function isGripAdminMobile(mobileNumber: string) {
  return GRIP_ADMIN_MOBILES.includes(normalizeMobileNumber(mobileNumber));
}

export async function gripAdminMobileLogin(mobileNumber: string, pin: string) {
  const BASE_URL = getApiBaseUrl();
  const normalizedMobile = normalizeMobileNumber(mobileNumber);

  const response = await fetch(`${BASE_URL}/auth/grip-admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: normalizedMobile, pin }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Admin authentication failed');
  }

  return data.data as {
    id: string;
    username: string;
    email: string;
    mobileNumber?: string;
    role: 'admin';
    token: string;
  };
}

export async function createGripAdminSession(member: GripMember) {
  const BASE_URL = getApiBaseUrl();

  const response = await fetch(`${BASE_URL}/auth/grip-admin-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: member.mobileNumber,
      memberId: member.id,
      username: member.username,
      email: member.email,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to create admin session');
  }

  return data.data as {
    id: string;
    username: string;
    email: string;
    mobileNumber?: string;
    role: 'admin';
    token: string;
  };
}

export async function gripMemberLogin(
  mobileNumber: string,
  pin: string
): Promise<GripLoginResponse> {
  const response = await fetch(`${GRIP_BASE_URL}/api/mobile/member-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, pin }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Authentication failed. Please verify credentials.');
  }

  return data;
}

export async function fetchGripMemberProfile(
  memberId: string
): Promise<GripMemberProfile> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('gripToken') : null;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${GRIP_BASE_URL}/api/mobile/members/${memberId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to load associate profile');
  }

  return mapMemberProfile(data.data);
}

const GRIP_PROFILE_CACHE_KEY = 'gripMemberProfile';

export function cacheGripMemberProfile(profile: GripMemberProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GRIP_PROFILE_CACHE_KEY, JSON.stringify(profile));
}

export function getCachedGripMemberProfile(): GripMemberProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(GRIP_PROFILE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getGripMember(): GripMember | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gripMember');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isGripAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('gripToken'));
}

export interface GripZone {
  _id: string;
  zoneName: string;
}

export interface GripChapter {
  _id: string;
  chapterName: string;
}

export async function fetchGripZones(): Promise<GripZone[]> {
  try {
    const url = `${GRIP_BASE_URL}/api/mobile/zones/list/public?limit=100`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch zones. Status: ${response.status}. Body: ${text}`);
      throw new Error(`Failed to fetch zones: ${response.status}`);
    }
    const data = await response.json();
    return (data.data || []) as GripZone[];
  } catch (err) {
    console.error('fetchGripZones error:', err);
    return [];
  }
}

export async function fetchGripChaptersByZone(zoneId: string): Promise<GripChapter[]> {
  try {
    const response = await fetch(`${GRIP_BASE_URL}/api/mobile/chapters/by-zone/public/${zoneId}`);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    const data = await response.json();
    return (data.data || []) as GripChapter[];
  } catch (err) {
    console.error('fetchGripChaptersByZone error:', err);
    return [];
  }
}
