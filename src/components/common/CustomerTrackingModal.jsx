import { useState, useEffect } from 'react';
import {
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { shiprocketAPI } from '../../api/services';

export default function CustomerTrackingModal({
  isOpen,
  onClose,
  order,
}) {
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [copied, setCopied] = useState(false);

  const orderId = order?._id || order?.id;
  const awbCode = order?.shiprocketInfo?.awbCode;

  const fetchTracking = async () => {
    if (!orderId && !awbCode) return;
    setLoading(true);
    try {
      const res = orderId
        ? await shiprocketAPI.trackByOrderId(orderId)
        : await shiprocketAPI.trackByAwb(awbCode);
      setTracking(res?.data?.data || res?.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Tracking updates currently unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTracking();
    } else {
      setTracking(null);
    }
  }, [isOpen, orderId, awbCode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scans = tracking?.scans || [];
  const activeAwb = tracking?.awb || awbCode;
  const courier = tracking?.courierName || order?.shiprocketInfo?.courierName || 'Courier Partner';
  const status = tracking?.currentStatus || order?.shiprocketInfo?.status || 'IN TRANSIT';

  const handleCopyAwb = () => {
    if (activeAwb) {
      navigator.clipboard.writeText(activeAwb);
      setCopied(true);
      toast.success('AWB code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 animate-scale-in cursor-default"
      >
        {/* Luxury Header */}
        <div className="bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917] text-white p-5 flex items-center justify-between border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b6f4e] flex items-center justify-center text-white shadow-sm">
              <HiOutlineTruck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base text-white tracking-wide">
                  Track Delivery
                </h3>
                <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  {courier}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 font-sans mt-0.5">
                Order {order?.orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* AWB Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Air Waybill (AWB)
              </span>
              <span className="font-mono font-bold text-stone-900 text-sm tracking-wide">
                {activeAwb || 'Generating...'}
              </span>
            </div>
            {activeAwb && (
              <button
                type="button"
                onClick={handleCopyAwb}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium cursor-pointer transition shadow-2xs"
              >
                {copied ? (
                  <>
                    <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <HiOutlineClipboardCopy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy AWB</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Real-time Status Card */}
          <div className="p-4 rounded-xl bg-[#faf6f0] border border-[#8b6f4e]/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Current Delivery Status
              </span>
              <span className="font-bold text-sm text-stone-900 block font-serif">
                {status}
              </span>
              {tracking?.etd && (
                <span className="text-xs text-[#8b6f4e] font-medium block">
                  Estimated Delivery: {tracking.etd}
                </span>
              )}
            </div>
            <div className="text-right text-[11px] text-stone-600">
              <span className="block font-medium">{tracking?.origin || 'Warehouse'}</span>
              <span className="block font-bold text-stone-800">
                ➔ {tracking?.destination || order?.shippingAddress?.city || 'Destination'}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Transit Milestones &amp; Hub Scans
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={fetchTracking}
                className="text-[11px] text-[#8b6f4e] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
              >
                <HiOutlineRefresh className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-stone-300 border-t-[#8b6f4e] rounded-full animate-spin mx-auto" />
                <p className="text-stone-500 text-xs">Connecting to courier tracking network...</p>
              </div>
            ) : scans.length > 0 ? (
              <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {scans.map((scan, i) => (
                  <div key={i} className="relative">
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                        i === 0
                          ? 'bg-[#8b6f4e] border-white ring-2 ring-[#8b6f4e]'
                          : 'bg-stone-300 border-white'
                      }`}
                    />
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-0.5">
                      <p className="font-semibold text-stone-900 text-xs">
                        {scan.activity}
                      </p>
                      <div className="flex items-center justify-between text-[10.5px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <HiOutlineLocationMarker className="w-3 h-3 text-stone-400" />
                          <span>{scan.location || 'Courier Hub'}</span>
                        </span>
                        <span>
                          {new Date(scan.date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
                Package dispatched. Real-time courier hub updates will appear once the carrier performs the first barcode scan.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
