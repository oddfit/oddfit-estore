// src/pages/RegisterPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';

type Step = 'form' | 'otp';

const STASH_KEY = 'merge_cart';
const RECAPTCHA_ID = 'recaptcha-container-register';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaInitRef = useRef(false);

  const { cart } = useCart();
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const safeRedirectFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect && redirect.startsWith('/') ? redirect : '/checkout';
  };

  const initializeRecaptcha = () => {
    // Avoid double init
    if (recaptchaInitRef.current) return;

    const container = document.getElementById(RECAPTCHA_ID);
    if (!container) {
      // If DOM not painted yet, try once on next frame
      requestAnimationFrame(initializeRecaptcha);
      return;
    }

    try {
      const verifier = new RecaptchaVerifier(auth, RECAPTCHA_ID, {
        size: 'normal',
        callback: () => setError(''),
        'expired-callback': () =>
          setError('Security verification expired. Please refresh and try again.'),
      });

      verifier
        .render()
        .then(() => {
          recaptchaInitRef.current = true;
          setRecaptchaVerifier(verifier);
        })
        .catch(() => {
          recaptchaInitRef.current = false;
          setError('Security verification failed to load. Please refresh and try again.');
        });
    } catch {
      recaptchaInitRef.current = false;
      setError('Failed to initialize security verification. Please refresh the page.');
    }
  };

  // Only initialize reCAPTCHA when the FORM step is visible
  useEffect(() => {
    if (step === 'form') initializeRecaptcha();
  }, [step]);

  // Cleanup reCAPTCHA on unmount/step change
  useEffect(() => {
    return () => {
      if (recaptchaVerifier && (recaptchaVerifier as any).clear) {
        try {
          (recaptchaVerifier as any).clear();
        } catch {}
      }
      setRecaptchaVerifier(null);
      recaptchaInitRef.current = false;
    };
  }, [recaptchaVerifier]);

  const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
    try {
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', formattedPhone));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch {
      // If we can't check due to rules, allow proceeding; Auth will decide next
      return false;
    }
  };

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
// ── inside src/pages/RegisterPage.tsx
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!recaptchaVerifier) {
      setError('Security verification not ready. Please refresh the page and try again.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // 1) Stash guest cart BEFORE auth state changes
      stashGuestCart();

      // 2) ✅ just send OTP
      const result = await sendOTP(formData.phoneNumber, recaptchaVerifier);

      // 3) Save result and go to OTP step
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      if (recaptchaVerifier && (recaptchaVerifier as any).clear) {
        try { (recaptchaVerifier as any).clear(); } catch {}
        setRecaptchaVerifier(null);
      }
      recaptchaInitRef.current = false;
      initializeRecaptcha();
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

      // verifyOTP will link to the anonymous user if present and create/update the profile
      await verifyOTP(confirmationResult, otp, formData.name);

      // Go to intended page (defaults to /checkout)
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
              <span className="font-semibold">+91 {formData.phoneNumber}</span>
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
                className="h-14 text-base font-semibold rounded-2xl"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
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
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Join OddFit</h1>
          <p className="text-lg text-gray-600">Create your account with phone verification</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Phone */}
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
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="flex-1 pl-3 pr-4 py-4 border border-gray-200 rounded-r-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter 10-digit number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Security Verification</span>
              </div>
              <div id={RECAPTCHA_ID} />
            </div>

            {/* T&C */}
            <TermsCheckbox termsAcceptedLabel="I agree to the Terms of Service and Privacy Policy" />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading || !formData.name.trim() || formData.phoneNumber.length !== 10}
              className="h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

// Small presentational component for T&C (keeps the main file tidy)
const TermsCheckbox: React.FC<{ termsAcceptedLabel: string }> = ({ termsAcceptedLabel }) => {
  const [checked, setChecked] = useState(false);
  // expose checked to parent (simple pattern: use a hidden input the parent can read if needed)
  useEffect(() => {
    const hidden = document.getElementById('terms-accepted-hidden') as HTMLInputElement | null;
    if (hidden) hidden.value = checked ? 'true' : 'false';
  }, [checked]);

  return (
    <>
      <input id="terms-accepted-hidden" type="hidden" defaultValue="false" />
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
        <label className="flex items-start cursor-pointer group">
          <div className="relative mt-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="sr-only"
              required
            />
            <div
              className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                checked
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-600 shadow-lg'
                  : 'border-gray-300 bg-white group-hover:border-purple-400 group-hover:shadow-md'
              }`}
            >
              {checked && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
          </div>
          <span className="ml-4 text-sm text-gray-700 leading-relaxed">
            I agree to the{' '}
            <Link
              to="/terms"
              className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2"
            >
              Privacy Policy
            </Link>
          </span>
        </label>
      </div>
    </>
  );
};
