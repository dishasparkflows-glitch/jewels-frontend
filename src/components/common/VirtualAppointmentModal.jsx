import { useState } from 'react';
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

/* eslint-disable react/prop-types */
const TIME_SLOTS = [
  '10:00 AM - 11:00 AM',
  '11:30 AM - 12:30 PM',
  '02:00 PM - 03:00 PM',
  '03:30 PM - 04:30 PM',
  '05:00 PM - 06:00 PM',
  '06:30 PM - 07:30 PM',
];

const VirtualAppointmentModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    preferredTime: '',
  });

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
      const rawPhone = formData.phoneNumber.trim().replace(/^\+91\s*/, '');
      const payload = {
        customer: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: {
            countryCode: '91',
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
        appointmentDate: new Date().toISOString().split('T')[0],
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
      className="w-[min(480px,calc(100vw-2rem))] !bg-transparent !p-0 !border-0 !shadow-none"
    >
      <div
        style={{ borderRadius: '24px' }}
        className="relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[24px] bg-white border border-stone-100 shadow-2xl p-6 sm:p-7 text-stone-800"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>

        {/* Circular Calendar Badge */}
        <div className="w-16 h-16 rounded-full bg-[#f8f2eb] flex items-center justify-center mx-auto mb-3.5 transition-transform">
          <HiOutlineCalendar className="w-7 h-7 text-[#8c6b45] stroke-[1.8]" />
        </div>

        {/* Header Title & Subtitle */}
        <div className="text-center">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Book a Virtual Appointment
          </h3>
          <p className="text-xs sm:text-[13px] text-stone-500 font-sans mt-1">
            Schedule your online consultation with our jewellery experts.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 h-11 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
              <HiOutlineUser className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 h-11 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
              <HiOutlineMail className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
              <input
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-stone-200 rounded-xl px-3.5 h-11 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
              <div className="flex items-center gap-1.5 pr-2.5 mr-2.5 border-r border-stone-200 text-xs text-stone-600 font-medium shrink-0">
                <span className="text-sm leading-none">🇮🇳</span>
                <span className="font-semibold text-stone-700">IN +91</span>
              </div>
              <input
                type="tel"
                placeholder="98765 43210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
                className="w-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 h-11 focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15 transition-all bg-white">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                  className="w-full text-xs sm:text-sm text-stone-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Time <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={formData.preferredTime}
                onChange={(val) => setFormData({ ...formData, preferredTime: val })}
                options={TIME_SLOTS}
                placeholder="Select Time"
                prefixIcon={<HiOutlineClock className="w-4 h-4 text-stone-400" />}
                buttonClassName="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8c6b45] focus:ring-2 focus:ring-[#8c6b45]/15 transition-all flex items-center justify-between cursor-pointer"
                menuClassName="z-[90]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 sm:pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 h-11 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl btn-theme-primary text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
