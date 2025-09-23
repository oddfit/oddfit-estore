// src/services/banners.ts
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function toDate(v: any): Date | null {
  return v?.toDate?.() ?? (v instanceof Date ? v : null);
}

/** Public list for the homepage (filters client-side; no index required). */
export async function listActiveBanners(now = new Date()) {
  const snap = await getDocs(collection(db, 'banners'));
  const out: any[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() as any;

    const imageUrl =
      d.imageUrl || d.imageURL || d.image || d.url || '';
    if (!imageUrl) return;

    const start = toDate(d.startAt);
    const end = toDate(d.endAt);

    const active = !!d.active;
    if (!active) return;
    if (start && start > now) return;
    if (end && end < now) return;

    out.push({
      id: docSnap.id,
      imageUrl,
      mobileImageUrl: d.mobileImageUrl || d.mobile || undefined,
      linkUrl: d.linkUrl || d.href || undefined,
      title: d.title ?? d.headline ?? '',
      subtitle: d.subtitle ?? d.subhead ?? '',
      mobileTitle: d.mobileTitle ?? '',
      mobileSubtitle: d.mobileSubtitle ?? '',
      buttonText: d.buttonText ?? '',
      desktopTextAlign: d.desktopTextAlign ?? 'left',      
      order: Number(d.order ?? 0),
      startAt: start,
      endAt: end,
      active,
    });
  });

  out.sort((a, b) => (a.order || 0) - (b.order || 0));
  return out;
}

/** Admin list (no filtering; sorts client-side). */
export async function listAllBanners() {
  const snap = await getDocs(collection(db, 'banners'));
  const out: any[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() as any;
    out.push({
      id: docSnap.id,
      imageUrl: d.imageUrl || d.imageURL || d.image || d.url || '',
      mobileImageUrl: d.mobileImageUrl || d.mobile || '',
      linkUrl: d.linkUrl || d.href || '',
      title: d.title ?? d.headline ?? '',
      subtitle: d.subtitle ?? d.subhead ?? '',
      mobileTitle: d.mobileTitle ?? '',
      mobileSubtitle: d.mobileSubtitle ?? '',
      buttonText: d.buttonText ?? '',
      desktopTextAlign: d.desktopTextAlign ?? 'left',
      order: Number(d.order ?? 0),
      startAt: d.startAt ?? null,
      endAt: d.endAt ?? null,
      active: !!d.active,
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
    });
  });
  out.sort((a, b) => (a.order || 0) - (b.order || 0));
  return out;
}

/** Create a banner (imageUrl required). */
export async function createBanner(input: {
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  mobileTitle?: string;
  mobileSubtitle?: string;
  buttonText?: string;
  desktopTextAlign?: 'left' | 'center' | 'right';  
  order?: number;
  active?: boolean;
  startAt?: any;
  endAt?: any;
}) {
  const payload: any = {
    imageUrl: String(input.imageUrl || ''),
    mobileImageUrl: input.mobileImageUrl ?? '',
    linkUrl: input.linkUrl ?? '',
    title: input.title ?? '',
    subtitle: input.subtitle ?? '',
    mobileTitle: input.mobileTitle ?? '',
    mobileSubtitle: input.mobileSubtitle ?? '',
    buttonText: input.buttonText ?? '',
    desktopTextAlign: input.desktopTextAlign ?? 'left',
    order: Number(input.order ?? 0),
    active: !!input.active,
    startAt: input.startAt ?? null,
    endAt: input.endAt ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const refDoc = await addDoc(collection(db, 'banners'), payload);
  return refDoc.id;
}

/** Update any subset of fields safely (no `undefined` writes). */
export async function updateBanner(
  id: string,
  patch: Partial<{
    imageUrl: string;
    mobileImageUrl: string;
    linkUrl: string;
    title: string;
    subtitle: string;
    mobileTitle: string;
    mobileSubtitle: string;
    buttonText: string;
    desktopTextAlign: 'left' | 'center' | 'right';    
    order: number;
    active: boolean;
    startAt: any;
    endAt: any;
  }>
) {
  const payload: any = { updatedAt: serverTimestamp() };
  ([
    'imageUrl',
    'mobileImageUrl',
    'linkUrl',
    'title',
    'subtitle',
    'mobileTitle',
    'mobileSubtitle',
    'buttonText',
    'desktopTextAlign',  
    'startAt',
    'endAt',
  ] as const).forEach((k) => {
    if (k in patch) payload[k] = (patch as any)[k] ?? '';
  });
  if ('order' in patch) payload.order = Number(patch.order ?? 0);
  if ('active' in patch) payload.active = !!patch.active;

  await updateDoc(doc(db, 'banners', id), payload);
}

/** Delete a banner doc. */
export async function removeBanner(id: string) {
  await deleteDoc(doc(db, 'banners', id));
}

/** Alias if some pages still import this old name. */
export const deleteBanner = removeBanner;

/** Toggle active flag convenience. */
export async function setBannerActive(id: string, active: boolean) {
  await updateDoc(doc(db, 'banners', id), {
    active: !!active,
    updatedAt: serverTimestamp(),
  });
}

/** Upload a file to Storage and return a download URL. */
export async function uploadBannerImage(file: File): Promise<string> {
  const storage = getStorage(); // uses your configured storageBucket
  const safeName = file.name.replace(/\s+/g, '_');
  const fullPath = `banners/${Date.now()}_${safeName}`;
  const r = ref(storage, fullPath);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
