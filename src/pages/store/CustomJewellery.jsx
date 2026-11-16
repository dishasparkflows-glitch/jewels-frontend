import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCloudUpload,
  HiOutlineX,
  HiCheckCircle,
  HiOutlineSparkles,
  HiOutlinePhotograph,
  HiOutlineUser,
  HiOutlineMail,
} from 'react-icons/hi';
import { IoDiamondOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { FiLayers } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import api from '../../api/axios';
import { customInquiryAPI } from '../../api/services';
import PhoneInput from '../../components/common/PhoneInput';
import Dropdown from '../../components/common/Dropdown';

const DEFAULT_STONE_OPTIONS = [
  { value: 'Natural Diamond', label: 'Natural Diamond' },
  { value: 'Lab Grown Diamond', label: 'Lab Grown Diamond' },
];

const JEWELLERY_TYPES = [
  'Ring/Band',
  'Earrings',
  'Pendant',
  'Bracelets',
  'Necklace',
  'Other',
];

const METAL_OPTIONS = [
  { value: '9KT Gold', label: '9KT Gold' },
  { value: '14KT Gold', label: '14KT Gold' },
  { value: '18KT Gold', label: '18KT Gold' },
];

const BUDGET_OPTIONS = [
  { value: 'Under ₹25,000', label: 'Under ₹25,000' },
  { value: '₹25,000 - ₹50,000', label: '₹25,000 - ₹50,000' },
  { value: '₹50,000 - ₹1,00,000', label: '₹50,000 - ₹1,00,000' },
  { value: '₹1,00,000 - ₹2,50,000', label: '₹1,00,000 - ₹2,50,000' },
  { value: '₹2,50,000 - ₹5,00,000', label: '₹2,50,000 - ₹5,00,000' },
  { value: 'Above ₹5,00,000+', label: 'Above ₹5,00,000+' },
  { value: 'Flexible / Discuss Later', label: 'Flexible / Discuss Later' },
];

export default function CustomJewellery() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    stoneType: '',
    metalType: '',
    budget: '',
    comments: '',
  });

  const [countryCode, setCountryCode] = useState('+91');
  const [selectedJewelleryTypes, setSelectedJewelleryTypes] = useState([]);
  const [stoneOptions, setStoneOptions] = useState(DEFAULT_STONE_OPTIONS);
  const [images, setImages] = useState([]); // array of { file, preview, url, key, uploading, progress, error }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Design Your Own Jewellery | Neirah Fine Jewellery';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch dynamic diamond types from lookup API
  useEffect(() => {
    let isMounted = true;
    const fetchDiamondTypes = async () => {
      try {
        const res = await api
          .get('/diamond-types/lookup')
          .catch(() => api.get('/diamond-types?limit=100'));
        const list = res.data?.data || [];
        if (Array.isArray(list) && list.length > 0 && isMounted) {
          const mapped = list
            .filter((item) => item && item.name && (!item.status || item.status === 'active'))
            .map((item) => ({
              value: item.name,
              label: item.name,
              id: item._id,
            }));
          if (mapped.length > 0) {
            setStoneOptions(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to load diamond types lookup:', err?.message);
      }
    };

    fetchDiamondTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const toggleJewelleryType = (type) => {
    setSelectedJewelleryTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ─── Direct Image Upload via Presigned URL ──────────────────────────────
  const uploadSingleImage = async (fileItem, index) => {
    const { file } = fileItem;
    const rawType = (file.type || '').split(';')[0].trim().toLowerCase();
    const contentType =
      rawType ||
      (/\.png$/i.test(file.name)
        ? 'image/png'
        : /\.webp$/i.test(file.name)
        ? 'image/webp'
        : 'image/jpeg');

    try {
      setImages((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, uploading: true, progress: 10 } : item))
      );

      // 1. Request presigned URL from backend
      const presignedRes = await api.post('/upload/presigned-url', {
        module: 'custom-inquiries',
        contentType,
      });

      const uploadData = presignedRes.data?.data;
      if (!uploadData?.uploadUrl || !uploadData?.key) {
        throw new Error('Could not get upload credentials');
      }

      const { uploadUrl, fileUrl, url, key } = uploadData;

      // 2. Direct PUT to Cloudflare R2
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': contentType,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setImages((prev) =>
              prev.map((item, idx) =>
                idx === index ? { ...item, progress: Math.min(95, percent) } : item
              )
            );
          }
        },
      });

      const finalUrl = fileUrl || url;
      setImages((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? { ...item, url: finalUrl, key, uploading: false, progress: 100 }
            : item
        )
      );
    } catch (err) {
      console.warn('Presigned upload failed; using local fallback:', err?.message);
      // Fallback: convert to base64 data URL so image is preserved
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? { ...item, url: reader.result, key: `local-${Date.now()}`, uploading: false, progress: 100 }
                : item
            )
          );
        };
        reader.readAsDataURL(file);
      } catch (readErr) {
        setImages((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? { ...item, uploading: false, error: 'Upload failed' }
              : item
          )
        );
      }
    }
  };

  const handleFilesSelected = (fileList) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file`);
        return false;
      }
      if (file.size > 12 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 12MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newItems = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      url: '',
      key: '',
      uploading: false,
      progress: 0,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
    }));

    const startIndex = images.length;
    setImages((prev) => [...prev, ...newItems]);

    // Automatically trigger upload for each new file
    newItems.forEach((item, offset) => {
      uploadSingleImage(item, startIndex + offset);
    });
  };

  const removeImage = async (indexToRemove) => {
    const itemToRemove = images[indexToRemove];
    if (!itemToRemove) return;

    if (itemToRemove.preview && itemToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.preview);
    }
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    // Delete from Cloudflare R2 if it was already uploaded
    const targetKey = itemToRemove.key;
    if (targetKey && !String(targetKey).startsWith('local-') && !String(targetKey).startsWith('blob:')) {
      try {
        await api.delete('/upload', {
          data: { key: targetKey },
        });
      } catch (err) {
        console.warn('Failed to delete reference image from Cloudflare R2:', err?.message);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // ─── Submit Custom Inquiry ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!formData.stoneType) {
      toast.error('Please select a stone type');
      return;
    }
    if (selectedJewelleryTypes.length === 0) {
      toast.error('Please select at least one jewellery type');
      return;
    }
    if (!formData.metalType) {
      toast.error('Please select a metal type');
      return;
    }
    if (!formData.budget) {
      toast.error('Please select a budget range');
      return;
    }

    // Check if any image is currently uploading
    const stillUploading = images.some((img) => img.uploading);
    if (stillUploading) {
      toast('Images are still uploading, please wait a moment...', { icon: '⏳' });
      return;
    }

    try {
      setIsSubmitting(true);

      const referenceImagesPayload = images
        .filter((img) => img.url)
        .map((img) => ({
          url: img.url,
          key: img.key || '',
        }));

      const payload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: {
            countryCode: countryCode.replace(/^\+/, ''),
            number: formData.phone.trim(),
          },
        },
        requirements: {
          stoneType: formData.stoneType,
          jewelryTypes: selectedJewelleryTypes,
          metalType: formData.metalType,
          budget: formData.budget,
          comments: formData.comments.trim(),
        },
        referenceImages: referenceImagesPayload,
      };

      const res = await customInquiryAPI.create(payload);
      const createdId = res.data?.data?._id || res.data?.data?.id || 'NEI-CUSTOM';
      setSubmittedInquiryId(createdId);
      setIsSubmitted(true);
      toast.success('Your custom jewellery design inquiry has been submitted!', {
        icon: '💍',
        duration: 5000,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit custom inquiry:', err);
      toast.error(
        err.response?.data?.message || 'Failed to submit inquiry. Please try again or contact us.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      stoneType: '',
      metalType: '',
      budget: '',
      comments: '',
    });
    setCountryCode('+91');
    setSelectedJewelleryTypes([]);
    setImages([]);
    setIsSubmitted(false);
    setSubmittedInquiryId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─── */}
      <div className="pt-8 sm:pt-12 pb-4 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {/* Page Title matching Screenshot 1 */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-stone-900 tracking-tight leading-tight">
          Design Your Own Jewellery
        </h1>

        {/* Subtitle matching Screenshot 1 */}
        <p className="mt-3 text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Design your unique jewellery with Neirah. Tailor every detail to your taste for a truly personal touch. Create the one-of-a-kind piece you&apos;ve always dreamed of.
        </p>
      </div>

      {/* ─── Form Container or Success View ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 pt-4">
        {isSubmitted ? (
          /* ─── Confirmation Success Screen ─── */
          <div className="rounded-3xl border border-[#efe7dd] bg-[#faf7f3]/60 p-8 sm:p-12 text-center space-y-6 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#f4ece3] border border-[#d9c4ad] text-[#8b6f4e] mx-auto flex items-center justify-center shadow-xs">
              <HiCheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8b6f4e]">
                Inquiry Received
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
                Thank You for Your Bespoke Vision
              </h2>
            </div>

            {/* Submission Summary Pill */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-[#efe7dd] text-left text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between items-center text-stone-500">
                <span>Client:</span>
                <span className="font-semibold text-stone-900">{formData.name}</span>
              </div>
              <div className="flex justify-between items-center text-stone-500">
                <span>Stone & Metal:</span>
                <span className="font-semibold text-stone-900">
                  {formData.stoneType} • {formData.metalType}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-500">
                <span>Jewellery Type:</span>
                <span className="font-semibold text-stone-900">
                  {selectedJewelleryTypes.join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-500">
                <span>Target Budget:</span>
                <span className="font-semibold text-[#8b6f4e]">{formData.budget}</span>
              </div>
              {submittedInquiryId && (
                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-400">
                  <span>Reference ID:</span>
                  <span className="font-mono text-stone-700">
                    {String(submittedInquiryId).slice(-8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto px-7 py-3 rounded-lg btn-theme-primary bg-[#8b6f4e] hover:bg-[#755c3e] text-white text-xs font-bold tracking-[0.18em] uppercase transition shadow-sm"
              >
                EXPLORE COLLECTION
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-7 py-3 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-bold tracking-[0.18em] uppercase hover:bg-stone-50 transition cursor-pointer"
              >
                SUBMIT ANOTHER DESIGN
              </button>
            </div>
          </div>
        ) : (
          /* ─── The Main Form (Matching Screenshot 1) ─── */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Row 1: Name* & Email* ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="custom-name"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Name<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8b6f4e]">
                    <HiOutlineUser className="w-4 h-4" />
                  </div>
                  <input
                    id="custom-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Enter your name"
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="custom-email"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Email<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8b6f4e]">
                    <HiOutlineMail className="w-4 h-4" />
                  </div>
                  <input
                    id="custom-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder="Enter your email"
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ── Row 2: Phone Number & Stone Type* ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Phone number */}
              <div>
                <label
                  htmlFor="custom-phone"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Phone number<span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  id="custom-phone"
                  value={formData.phone}
                  onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  placeholder="Enter phone number"
                  required
                  size="md"
                  className="rounded-lg border-stone-200"
                />
              </div>

              {/* Stone type */}
              <div>
                <label
                  htmlFor="custom-stone-type"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Stone type<span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="custom-stone-type"
                  value={formData.stoneType}
                  onChange={(val) => setFormData((prev) => ({ ...prev, stoneType: val }))}
                  options={stoneOptions}
                  placeholder="Select option"
                  prefixIcon={<IoDiamondOutline className="w-4 h-4 text-[#8b6f4e]" />}
                  size="md"
                  showDivider={false}
                  buttonClassName="w-full flex items-center justify-between h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* ── Row 3: Jewellery Type (Multiple optional)* ── */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-2">
                Jewellery Type (Multiple optional)<span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
                {JEWELLERY_TYPES.map((type) => {
                  const isChecked = selectedJewelleryTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-stone-700 cursor-pointer select-none hover:text-stone-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleJewelleryType(type)}
                        className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                      />
                      <span>{type}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Row 4: Metal Type* & Budget* ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Metal Type */}
              <div>
                <label
                  htmlFor="custom-metal-type"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Metal Type<span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="custom-metal-type"
                  value={formData.metalType}
                  onChange={(val) => setFormData((prev) => ({ ...prev, metalType: val }))}
                  options={METAL_OPTIONS}
                  placeholder="Select metal type"
                  prefixIcon={<FiLayers className="w-4 h-4 text-[#8b6f4e]" />}
                  size="md"
                  showDivider={false}
                  buttonClassName="w-full flex items-center justify-between h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all cursor-pointer"
                />
              </div>

              {/* Budget */}
              <div>
                <label
                  htmlFor="custom-budget"
                  className="block text-xs font-semibold text-stone-800 mb-1.5"
                >
                  Budget<span className="text-red-500">*</span>
                </label>
                <Dropdown
                  id="custom-budget"
                  value={formData.budget}
                  onChange={(val) => setFormData((prev) => ({ ...prev, budget: val }))}
                  options={BUDGET_OPTIONS}
                  placeholder="Please Select"
                  prefixIcon={<TbCurrencyRupee className="w-4 h-4 text-[#8b6f4e]" />}
                  size="md"
                  showDivider={false}
                  buttonClassName="w-full flex items-center justify-between h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* ── Row 5: Comments ── */}
            <div>
              <label
                htmlFor="custom-comments"
                className="block text-xs font-semibold text-stone-800 mb-1.5"
              >
                Comments
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none text-[#8b6f4e]">
                  <IoChatbubbleEllipsesOutline className="w-4 h-4" />
                </div>
                <textarea
                  id="custom-comments"
                  rows={4}
                  value={formData.comments}
                  onChange={handleChange('comments')}
                  placeholder="Tell us more about your dream design..."
                  className="w-full pl-10 pr-3.5 py-3 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all resize-y"
                />
              </div>
            </div>

            {/* ── Row 6: Upload Reference Images (Matching Screenshot 1) ── */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed transition-all duration-200 p-8 sm:p-10 flex flex-col items-center justify-center gap-2 cursor-pointer select-none ${
                  isDragging
                    ? 'border-[#8b6f4e] bg-[#faf7f3]'
                    : 'border-stone-300/80 bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] hover:border-[#8b6f4e]/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 mb-0.5">
                  <HiOutlineCloudUpload className="w-7 h-7 stroke-[1.5]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-stone-700">
                  Upload Reference Images
                </span>
              </div>

              {/* Uploaded Images Preview Grid */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-2xs"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-stone-100 relative">
                        <img
                          src={img.preview || img.url}
                          alt={img.name || `Reference ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[11px] font-medium p-2">
                            <span>Uploading {img.progress}%</span>
                            <div className="w-3/4 h-1 bg-white/30 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-white transition-all duration-200"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        aria-label="Remove image"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                      >
                        <HiOutlineX className="w-3.5 h-3.5" />
                      </button>

                      {/* Filename caption */}
                      <div className="p-1.5 text-[10px] text-stone-600 truncate bg-white border-t border-stone-100">
                        {img.name || `Reference ${idx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Submit Button ── */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-[200px] px-12 py-3.5 rounded-lg btn-theme-primary bg-[#8b6f4e] hover:bg-[#755c3e] text-white text-xs font-bold tracking-[0.2em] uppercase active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
