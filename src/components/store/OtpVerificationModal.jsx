import { useEffect, useRef, useState } from 'react';
import { HiOutlineShieldCheck, HiOutlineExclamationCircle, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { otpAPI } from '../../api/services';

const maskPhone = (phone, countryCode = '+91') => {
  const digits = String(phone || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length >= 4) {
    const start = last10.slice(0, 2);
    const end = last10.slice(-2);
    const masked = `${start}${'X'.repeat(Math.max(2, last10.length - 4))}${end}`;
    return `${countryCode} ${masked}`;
  }
  return `${countryCode} ${phone}`;
};

export default function OtpVerificationModal({
  isOpen,
  onClose,
  phone,
  countryCode = '+91',
  purpose = 'order_verification',
  title = 'Verify Mobile Number',
  subtitle,
  caption,
  onVerified,
  initialDevOtp = '',
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentDevOtp, setCurrentDevOtp] = useState(initialDevOtp);

  const inputRefs = useRef([]);

  // Reset & focus on modal open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setTimeLeft(30);
      setErrorMsg('');
      setCurrentDevOtp(initialDevOtp);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, initialDevOtp]);

  // 30s Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const otpString = digits.join('');
  const maskedNumber = maskPhone(phone, countryCode);

  const handleChange = (val, index) => {
    // Only accept numeric
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const char = clean.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);
    if (errorMsg) setErrorMsg('');

    // Advance to next box if char entered
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (otpString.length === 4 && !isVerifying) {
        handleVerify();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const updated = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setDigits(updated);
    if (errorMsg) setErrorMsg('');

    const nextIndex = Math.min(pasted.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      const response = await otpAPI.send({ phone, countryCode, purpose });
      const resData = response?.data?.data || response?.data;
      setTimeLeft(30);
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();

      if (resData?.devOtp) {
        setCurrentDevOtp(resData.devOtp);
      }
      toast.success('New OTP sent to your mobile number');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (otpString.length !== 4) {
      setErrorMsg('Please enter all 4 digits of the OTP.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    const toastId = toast.loading('Verifying OTP...');

    try {
      const response = await otpAPI.verify({ phone, otp: otpString, purpose, countryCode });
      const data = response?.data?.data || response?.data;
      toast.success('Mobile number verified successfully!', { id: toastId });
      if (onVerified) {
        onVerified(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setErrorMsg(msg);
      toast.error(msg, { id: toastId });
      // Shake or focus back to first input
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-verify-mobile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 sm:p-8 text-center shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          className="absolute top-4 right-4 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <HiX className="h-5 w-5" />
        </button>

        {/* Shield Icon */}
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ebd9c8] bg-[#faf6f0] text-[#8c6536] shadow-2xs">
          <HiOutlineShieldCheck className="h-7 w-7 stroke-[1.8]" />
        </div>

        {/* Title & Subtitle */}
        <h2 id="modal-verify-mobile-title" className="text-lg font-bold text-stone-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-xs text-stone-500 font-medium">
          {subtitle || (
            <>
              OTP sent to <span className="font-semibold text-stone-700">{maskedNumber}</span>
            </>
          )}
        </p>

        {/* Dev OTP Helper in development */}
        {currentDevOtp && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-medium text-amber-800">
            <span>Dev OTP:</span>
            <span className="font-mono font-bold tracking-widest">{currentDevOtp}</span>
            <button
              type="button"
              onClick={() => {
                const chars = currentDevOtp.split('').slice(0, 4);
                setDigits(chars);
                setErrorMsg('');
              }}
              className="ml-1 text-[10px] underline hover:text-amber-950 cursor-pointer"
            >
              Fill
            </button>
          </div>
        )}

        {/* 4 Digit OTP Inputs */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((index) => {
            const hasVal = Boolean(digits[index]);
            return (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digits[index]}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                disabled={isVerifying}
                aria-label={`Digit ${index + 1}`}
                className={`h-13 w-13 sm:h-14 sm:w-14 rounded-xl border text-center text-xl font-bold transition outline-none shadow-2xs ${
                  errorMsg
                    ? 'border-red-400 bg-red-50/20 text-red-900 focus:border-red-500'
                    : hasVal
                    ? 'border-[#8c6536] bg-[#faf6f1] text-stone-900 ring-1 ring-[#8c6536]/20'
                    : 'border-stone-200 bg-white text-stone-800 focus:border-[#8c6536] focus:ring-2 focus:ring-[#8c6536]/15'
                }`}
              />
            );
          })}
        </div>

        {/* Inline Error */}
        {errorMsg && (
          <p className="mb-4 -mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 animate-fadeIn">
            <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Resend Countdown */}
        <div className="mb-6 text-xs text-stone-500">
          {timeLeft > 0 ? (
            <p className="font-medium">
              Resend OTP in <span className="font-bold text-stone-800">{timeLeft}s</span>
            </p>
          ) : (
            <p>
              Didn&apos;t receive code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-bold text-[#8c6536] underline hover:text-[#704d23] cursor-pointer disabled:opacity-50"
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            </p>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || otpString.length !== 4}
          className="w-full rounded-xl bg-[#6f5e53] hover:bg-[#5e4e44] py-3.5 text-xs font-bold tracking-wider text-white uppercase transition shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {isVerifying ? 'VERIFYING...' : 'VERIFY'}
        </button>

        {/* Footer Caption */}
        <p className="mt-3.5 text-[11px] text-stone-400 font-medium">
          {caption || (purpose === 'registration'
            ? 'Required for your security before account creation.'
            : 'Required for your security before order placement.')}
        </p>
      </div>
    </div>
  );
}
