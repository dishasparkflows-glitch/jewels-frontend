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
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.startsWith('+91')
          ? formData.phoneNumber
          : `+91 ${formData.phoneNumber.trim()}`,
        appointmentDate: new Date(formData.appointmentDate),
        preferredTime: formData.preferredTime,
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
    <Modal open={isOpen} onClose={onClose} label="Schedule a virtual appointment" className="w-[min(640px,calc(100vw-2rem))]">
      <div className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Modal Header (Dark Forest Green #1e463a from Screenshot 1) */}
          <div className="relative bg-[#22201e] px-6 py-6 text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
          <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-white">
            Virtual Appointment
          </h3>
          <p className="text-xs text-white/80 mt-1 font-light">
            Schedule your online consultation
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-white text-stone-800">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-stone-700 tracking-wider uppercase">
              FULL NAME <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#1e463a] focus-within:ring-1 focus-within:ring-[#1e463a]/30 transition-all bg-white">
              <HiOutlineUser className="w-5 h-5 text-stone-400 mr-2.5 shrink-0" />
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
            <label className="block text-[11px] font-bold text-stone-700 tracking-wider uppercase">
              EMAIL ADDRESS <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#1e463a] focus-within:ring-1 focus-within:ring-[#1e463a]/30 transition-all bg-white">
              <HiOutlineMail className="w-5 h-5 text-stone-400 mr-2.5 shrink-0" />
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
            <label className="block text-[11px] font-bold text-stone-700 tracking-wider uppercase">
              PHONE NUMBER <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#1e463a] focus-within:ring-1 focus-within:ring-[#1e463a]/30 transition-all bg-white">
              <div className="flex items-center gap-1.5 pr-3 mr-2 border-r border-stone-200 text-xs text-stone-600 font-medium shrink-0">
                <span className="text-base leading-none">🇮🇳</span>
                <span>+91</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700 tracking-wider uppercase">
                DATE <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#1e463a] focus-within:ring-1 focus-within:ring-[#1e463a]/30 transition-all bg-white">
                <HiOutlineCalendar className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                  className="w-full text-xs sm:text-sm text-stone-800 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700 tracking-wider uppercase">
                TIME <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#1e463a] focus-within:ring-1 focus-within:ring-[#1e463a]/30 transition-all bg-white">
                <HiOutlineClock className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  required
                  className="w-full text-xs sm:text-sm text-stone-800 bg-transparent focus:outline-none"
                >
                  <option value="">Select Time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-[#739588] hover:bg-[#5f8174] text-white text-xs sm:text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default VirtualAppointmentModal;
