// src/pages/RegisterPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Sparkles, Shield, RefreshCcw } from 'lucide-react';
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { initRecaptcha, resetRecaptcha, destroyRecaptcha } from '../components/util/recaptcha';

type Step = 'form' | 'otp';

const RECAPTCHA_ID = 'recaptcha-container-register';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      setFormData((p) => ({ ...p, phoneNumber: numeric }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const safeRedirectFromQuery = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect && redirect.startsWith('/') ? redirect : '/checkout';
  };

  // Initialize a single (visible) reCAPTCHA; destroy on unmount/step change
  useEffect(() => {
    let alive = true;

    async function boot() {
      if (step !== 'form') return;
      setError('');
      setCaptchaReady(false);

      try {
        const v = await initRecaptcha(RECAPTCHA_ID, 'normal', () =>
          setError('Security verification expired. Please try again.')
        );
        if (!alive) return;
        setRecaptchaVerifier(v);
        setCaptchaReady(true);
      } catch (e) {
        console.error('reCAPTCHA init error:', e);
        if (!alive) return;
        setError('Security verification failed to load. Please reload and try again.');
        setCaptchaReady(false);
      }
    }

    boot();
    return () => {
      alive = false;
      destroyRecaptcha(); // hard cleanup so we never duplicate
      setRecaptchaVerifier(null);
      setCaptchaReady(false);
    };
  }, [step]);

  const reloadRecaptcha = () => resetRecaptcha();

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    if (!recaptchaVerifier || !captchaReady) {
      setError('Please wait for the security verification to load.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const result = await sendOTP(formData.phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err?.message || 'Failed to send OTP. Please try again.');
      reloadRecaptcha(); // give a fresh challenge
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
      await verifyOTP(confirmationResult, otp, formData.name);
      navigate(safeRedirectFromQuery(), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.');
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
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
                className="h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
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
                  onChange={onChange}
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
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-gray-200 bg-gray-100 text-gray-700 text-base font-semibold">
                    +91
                  </span>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={onChange}
                    className="flex-1 pl-3 pr-4 py-4 border border-gray-200 rounded-r-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter 10-digit number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* reCAPTCHA (visible) */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Security Verification</span>
                <button
                  type="button"
                  onClick={reloadRecaptcha}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                  title="Reload verification"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Reload
                </button>
              </div>
              <div id={RECAPTCHA_ID} />
              {!captchaReady && <p className="mt-2 text-xs text-gray-500">Loading verification…</p>}
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
              <input
                type="checkbox"
                className="mt-1"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
              />
              <span className="text-sm text-gray-700 leading-relaxed">
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
                .
              </span>
            </label>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={
                loading ||
                !formData.name.trim() ||
                formData.phoneNumber.length !== 10 ||
                !captchaReady ||
                !termsAccepted
              }
              className="h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
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
