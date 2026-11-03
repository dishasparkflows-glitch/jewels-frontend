import { useState, useMemo, useEffect } from 'react';
import { appointmentsAPI } from '../../api/services';
import { toast } from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi';
import Modal from './Modal';
import Dropdown from './Dropdown';
import DatePicker from './DatePicker';
import PhoneInput from './PhoneInput';

/* eslint-disable react/prop-types */
// ------------------------------- 10:00 AM to 06:00 PM time slots ----------------------------
const TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

/**
 * Parse time from a slot string like "01:00 PM" (or "10:00 AM - 11:00 AM") into 24-hour { hour, minute }.
 */
const parseSlotStartTime = (slot) => {
  if (!slot) return null;
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
};

/**
 * Helper to get local date as YYYY-MM-DD
 */
const getLocalDateString = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const VirtualAppointmentModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    appointmentDate: getLocalDateString(),
    preferredTime: '',
  });

  // Filter out time slots that have already passed when the selected date is today
  const availableTimeSlots = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    // If selected date is in the past, no slots available
    if (formData.appointmentDate < todayStr) return [];
    // If the selected date is in the future, show all slots
    if (formData.appointmentDate > todayStr) return TIME_SLOTS;

    // For today, filter out slots whose time has already passed
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    return TIME_SLOTS.filter((slot) => {
      const start = parseSlotStartTime(slot);
      if (!start) return false;
      return start.hour > currentHour || (start.hour === currentHour && start.minute > currentMinute);
    });
  }, [formData.appointmentDate]);

  // If the currently selected time is no longer available in the slot list, clear it
  useEffect(() => {
    if (formData.preferredTime && !availableTimeSlots.includes(formData.preferredTime)) {
      setFormData((prev) => ({ ...prev, preferredTime: '' }));
    }
  }, [availableTimeSlots, formData.preferredTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      return toast.error('Please enter your full name');
    }
    if (!formData.email.trim()) {
      return toast.error('Please enter your email address');
    }
    if (!formData.phoneNumber.trim()) {
      return toast.error('Please enter your phone number');
    }
    if (!formData.appointmentDate) {
      return toast.error('Please select an appointment date');
    }
    if (!formData.preferredTime) {
      return toast.error('Please select a preferred time slot');
    }

    try {
      setLoading(true);
      const rawPhone = formData.phoneNumber.trim().replace(/^\+\d+\s*/, '');
      const payload = {
        customer: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: {
            countryCode: countryCode.replace('+', ''),
            number: rawPhone,
          },
        },
        appointment: {
          date: new Date(formData.appointmentDate),
          preferredTime: formData.preferredTime,
          serviceType: 'Jewellery Viewing',
        },
      };

      await appointmentsAPI.create(payload);
      toast.success('Virtual appointment scheduled successfully! Our jewellery expert will contact you.');
      onClose();
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        appointmentDate: getLocalDateString(),
        preferredTime: '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to schedule appointment. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      label="Schedule a virtual appointment"
      className="w-[min(400px,calc(100vw-2rem))] !bg-transparent !p-0 !border-0 !shadow-none"
    >
      <div
        className="relative w-full max-h-[calc(100dvh-2rem)] overflow-visible rounded-2xl bg-white border border-stone-100 shadow-2xl p-4 sm:p-5 text-stone-800"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <HiOutlineX className="w-4 h-4" />
        </button>

        {/* Circular Calendar Badge */}
        <div className="w-10 h-10 rounded-full bg-[#f8f2eb] flex items-center justify-center mx-auto mb-2 transition-transform">
          <HiOutlineCalendar className="w-5 h-5 text-[#8c6b45] stroke-[1.8]" />
        </div>

        {/* Header Title & Subtitle */}
        <div className="text-center">
          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Book a Virtual Appointment
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-500 font-sans mt-0.5">
            Schedule your online consultation with our jewellery experts.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-stone-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-lg px-2.5 h-9 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
              <HiOutlineUser className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-stone-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-lg px-2.5 h-9 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
              <HiOutlineMail className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
              <input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full text-xs text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-stone-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              value={formData.phoneNumber}
              onChange={(val) => setFormData({ ...formData, phoneNumber: val })}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              placeholder="98765 43210"
              required
              size="sm"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Date */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-stone-700">
                Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.appointmentDate}
                onChange={(dateStr) => setFormData((prev) => ({ ...prev, appointmentDate: dateStr }))}
                minDate={new Date()}
                placeholder="Select Date"
                size="sm"
                buttonClassName="h-9 px-2.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8c6b45] focus:ring-2 focus:ring-[#8c6b45]/15 transition-all cursor-pointer"
                popupClassName="z-[100]"
              />
            </div>

            {/* Time */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-stone-700">
                Time <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.preferredTime}
                onChange={(val) => setFormData({ ...formData, preferredTime: val })}
                options={availableTimeSlots}
                placeholder="Select Time"
                size="sm"
                prefixIcon={<HiOutlineClock className="w-3.5 h-3.5 text-stone-400" />}
                buttonClassName="w-full h-9 px-2.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8c6b45] focus:ring-2 focus:ring-[#8c6b45]/15 transition-all flex items-center justify-between cursor-pointer"
                menuClassName="z-[90] text-xs max-h-44"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2.5 sm:pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-9 rounded-lg btn-theme-primary text-xs font-semibold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                'Schedule Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default VirtualAppointmentModal;
