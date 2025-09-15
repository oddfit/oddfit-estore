import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../services/firebase';

export type RecaptchaMode = 'invisible' | 'normal';

// Singleton state
let instance: RecaptchaVerifier | null = null;
let widgetId: number | null = null;
let currentContainerId: string | null = null;

// A mutex so StrictMode / fast route switches can't create twice
let creating: Promise<RecaptchaVerifier> | null = null;

function hardClearContainer(containerId: string | null) {
  if (!containerId) return;
  const el = document.getElementById(containerId);
  if (!el) return;

  // Remove any rendered reCAPTCHA nodes from the container
  try {
    const widgets = el.querySelectorAll('.g-recaptcha, iframe, div[style*="visibility: hidden"]');
    widgets.forEach((n) => n.parentElement?.removeChild(n));
  } catch {
    // ignore
  }
  el.innerHTML = '';
}

export async function initRecaptcha(
  containerId: string,
  mode: RecaptchaMode,
  onExpire?: () => void
): Promise<RecaptchaVerifier> {
  // If we already have one for this container, reuse it
  if (instance && currentContainerId === containerId) return instance;

  // If another init is in-flight, await it and reuse whatever it created
  if (creating) {
    await creating;
    if (instance && currentContainerId === containerId) return instance;
  }

  // Start a creation under a mutex
  creating = (async () => {
    // Always tear down any previous widget first (no duplicates)
    await destroyRecaptcha();

    const el = document.getElementById(containerId);
    if (!el) throw new Error(`reCAPTCHA container "${containerId}" not found`);
    hardClearContainer(containerId);

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: mode,
      callback: () => {}, // token solved
      'expired-callback': () => onExpire?.(),
    });

    const id = await verifier.render();
    instance = verifier;
    widgetId = id;
    currentContainerId = containerId;

    return verifier;
  })();

  try {
    return await creating;
  } finally {
    creating = null;
  }
}

export function resetRecaptcha() {
  const gre: any = (window as any).grecaptcha;
  if (widgetId != null && gre?.reset) {
    try { gre.reset(widgetId); } catch {}
  }
}

export async function destroyRecaptcha() {
  // Try the official remover if present
  const gre: any = (window as any).grecaptcha;
  if (widgetId != null && gre?.remove) {
    try { gre.remove(widgetId); } catch {}
  }

  // Firebase helper (not always present, but try)
  try { (instance as any)?.clear?.(); } catch {}

  hardClearContainer(currentContainerId);

  instance = null;
  widgetId = null;
  currentContainerId = null;
}
