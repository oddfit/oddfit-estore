// src/pages/LoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, LogIn, Shield, RefreshCcw } from 'lucide-react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';

type Step = 'form' | 'otp';

const STASH_KEY = 'merge_cart';
const RECAPTCHA_ID = 'recaptcha-container-login';

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [recaptchaMode, setRecaptchaMode] = useState<'invisible' | 'normal'>('invisible');

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const initTriedRef = useRef(false);
  const { sendOTP, verifyOTP } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
  };

  const safeRedirectFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect && redirect.startsWith('/') ? redirect : '/checkout';
  };

  const withTimeout = <T,>(p: Promise<T>, ms: number, message: string): Promise<T> =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(message)), ms);
      p.then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
    });

  /** Clear any existing recaptcha instance & DOM */
  const clearRecaptcha = () => {
    try {
      if (recaptchaVerifier && (recaptchaVerifier as any).clear) {
        (recaptchaVerifier as any).clear();
      }
    } catch {}
    setRecaptchaVerifier(null);
    initTriedRef.current = false;

    // Clear container contents to be safe
    const container = document.getElementById(RECAPTCHA_ID);
    if (container) container.innerHTML = '';
  };

  /** Initialize reCAPTCHA in a given mode; falls back to "normal" if "invisible" fails */
  const initRecaptcha = async (mode: 'invisible' | 'normal') => {
    if (initTriedRef.current) return;
    initTriedRef.current = true;

    const container = document.getElementById(RECAPTCHA_ID);
    if (!container) {
      requestAnimationFrame(() => { initTriedRef.current = false; initRecaptcha(mode); });
      return;
    }

    setError('');
    setRecaptchaMode(mode);

    try {
      const verifier = new RecaptchaVerifier(auth, RECAPTCHA_ID, {
        size: mode, // 'invisible' first, then 'normal' if needed
        callback: () => setError(''),
        'expired-callback': () => setError('Security verification expired. Please try again.'),
      });

      await withTimeout(verifier.render(), 15000, 'Security check failed to load in time.');
      setRecaptchaVerifier(verifier);
    } catch (err: any) {
      console.error('reCAPTCHA render/init error:', err);
      // Fallback: try visible widget if invisible fails
      if (mode === 'invisible') {
        clearRecaptcha();
        setError('Security check blocked; switching to visible verification…');
        // Give DOM a tick to clear then try visible
        setTimeout(() => initRecaptcha('normal'), 50);
      } else {
        setError('Security verification failed to load. Please refresh and try again.');
      }
    }
  };

  /** Manual reload button */
  const handleReloadCaptcha = () => {
    clearRecaptcha();
    initRecaptcha('invisible');
  };

  // Init reCAPTCHA when FORM step is showing
  useEffect(() => {
    if (step === 'form') {
      initRecaptcha('invisible');
    } else {
      clearRecaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Cleanup on unmount
  useEffect(() => clearRecaptcha, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Stash the current (guest) cart in localStorage before we switch auth users */
  const stashGuestCart = () => {
    try {
      const guestUid = auth.currentUser?.uid || null;
      const safeItems = (cart?.items || []).map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        name: item.product?.name || '',
        image: item.product?.images?.[0] || null,
      }));
      localStorage.setItem(STASH_KEY, JSON.stringify({ uid: guestUid, items: safeItems }));
    } catch (e) {
      console.log('Failed to stash guest cart (safe to ignore):', e);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!recaptchaVerifier) {
      setError('Please wait for security verification to load');
      // try to init again immediately
      initRecaptcha('invisible');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Stash the guest cart BEFORE auth flow changes the user
      stashGuestCart();

      // Force verification (invisible triggers challenge automatically)
      try {
        await withTimeout(
          recaptchaVerifier.verify(),
          20000,
          'Security check timed out. Please try again.'
        );
      } catch (verifyErr) {
        // If invisible verify failed due to block, try visible widget once
        if (recaptchaMode === 'invisible') {
          clearRecaptcha();
          setError('Security check needed. Showing the verification widget…');
          await new Promise((r) => setTimeout(r, 50));
          await initRecaptcha('normal');
          if (!recaptchaVerifier) throw verifyErr;
          await withTimeout(
            recaptchaVerifier.verify(),
            20000,
            'Security check timed out. Please try again.'
          );
        } else {
          throw verifyErr;
        }
      }

      // Send OTP after a successful token
      const result = await withTimeout(
        sendOTP(phoneNumber, recaptchaVerifier),
        20000,
        'Network seems slow. Please try again.'
      );

      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const msg =
        err?.code === 'auth/network-request-failed'
          ? 'Network error while contacting the server. Check your connection or disable any ad/privacy blockers that might block Google reCAPTCHA.'
          : err?.message || 'Failed to send OTP. Please try again.';
      setError(msg);

      // Give the user a fresh widget after an error
      clearRecaptcha();
      setTimeout(() => initRecaptcha('invisible'), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    if (!confirmationResult) {
      setError('Please request OTP first');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await verifyOTP(confirmationResult, otp);
      navigate(safeRedirectFromQuery(), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp('');
    setError('');
    setConfirmationResult(null);
  };

  const registerHref = `/register?redirect=${encodeURIComponent(safeRedirectFromQuery())}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Verify Your Phone</h1>
            <p className="text-gray-600">
              We've sent a 6-digit code to<br />
              <span className="font-semibold">+91 {phoneNumber}</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 text-center text-2xl font-bold border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                disabled={loading || otp.length !== 6}
                className="h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleBackToForm}
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                ← Back to form
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORM STEP
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <LogIn className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
          <p className="text-lg text-gray-600">Sign in to your OddFit account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-3">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-gray-200 bg-gray-100 text-gray-700 text-base font-semibold">
                    +91
                  </span>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={handleChange}
                    className="flex-1 pl-3 pr-4 py-4 border border-gray-200 rounded-r-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter 10-digit number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* reCAPTCHA container */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Security Verification {recaptchaMode === 'normal' ? '(visible)' : '(auto)'}
                </span>
                <button
                  type="button"
                  onClick={handleReloadCaptcha}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                  title="Reload verification"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Reload
                </button>
              </div>
              <div id={RECAPTCHA_ID} />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading || phoneNumber.length !== 10}
              className="h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to={registerHref} className="text-purple-600 hover:text-purple-700 font-bold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
