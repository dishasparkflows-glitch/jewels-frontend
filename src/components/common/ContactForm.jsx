import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
} from 'react-icons/hi';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

export default function ContactForm({ className = '', showHeading = true }) {
  const { settings } = useStoreSettings();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resolveWhatsAppNumber = () => {
    // 1. Check if configured in socialMedia.whatsapp
    if (settings?.socialMedia?.whatsapp) {
      const digits = settings.socialMedia.whatsapp.replace(/\D/g, '');
      if (digits && digits !== '919726237723' && digits.length >= 10) {
        return digits;
      }
    }
    // 2. Check mobileNumber
    if (settings?.businessDetails?.mobileNumber) {
      const digits = settings.businessDetails.mobileNumber.replace(/\D/g, '');
      if (digits && digits.length >= 10) {
        return digits.startsWith('91') ? digits : `91${digits}`;
      }
    }
    // 3. Fallback to store default WhatsApp number
    return '919171507155';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    if (!firstName) {
      toast.error('Please enter your first name');
      return;
    }

    if (!lastName) {
      toast.error('Please enter your last name');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetPhone = resolveWhatsAppNumber();
      const formattedText = `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage: ${message || ''}`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(formattedText)}&type=phone_number&app_absent=0`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening WhatsApp to send your inquiry...');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (err) {
      console.error('Failed to open WhatsApp:', err);
      toast.error('Failed to open WhatsApp. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconStyle = { color: 'var(--btn-primary-bg, #8b6f4e)' };
  const requiredStarStyle = { color: 'var(--btn-primary-bg, #8b6f4e)' };

  return (
    <form onSubmit={handleSubmit} className={`w-full space-y-5 ${className}`}>
      {showHeading && (
        <h2 className="font-serif text-2xl sm:text-[26px] font-medium text-stone-900 leading-snug">
          Send Us a Message
        </h2>
      )}

      {/* 2-Column Top Grid: First Name, Last Name, Email, Phone Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-[13px] font-semibold text-stone-800">
            First Name <span style={requiredStarStyle}>*</span>
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-stone-50/70 border border-stone-200/90 focus-within:bg-white input-theme-focus-within transition-all">
            <HiOutlineUser className="w-4 h-4 shrink-0" style={iconStyle} />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-[13px] font-semibold text-stone-800">
            Last Name <span style={requiredStarStyle}>*</span>
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-stone-50/70 border border-stone-200/90 focus-within:bg-white input-theme-focus-within transition-all">
            <HiOutlineUser className="w-4 h-4 shrink-0" style={iconStyle} />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Enter your last name"
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-[13px] font-semibold text-stone-800">
            Email <span style={requiredStarStyle}>*</span>
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-stone-50/70 border border-stone-200/90 focus-within:bg-white input-theme-focus-within transition-all">
            <HiOutlineMail className="w-4 h-4 shrink-0" style={iconStyle} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-[13px] font-semibold text-stone-800">
            Phone Number
          </label>
          <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-lg bg-stone-50/70 border border-stone-200/90 focus-within:bg-white input-theme-focus-within transition-all">
            <HiOutlinePhone className="w-4 h-4 shrink-0" style={iconStyle} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-[13px] font-semibold text-stone-800">
          Message
        </label>
        <textarea
          rows={4}
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Type your message here..."
          className="w-full p-3.5 rounded-lg bg-stone-50/70 border border-stone-200/90 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:bg-white input-theme-focus transition-all resize-y min-h-[120px]"
        />
      </div>

      {/* Send Button */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-theme-primary min-w-[190px] h-11 px-7 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
          <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
        </button>
      </div>
    </form>
  );
}
