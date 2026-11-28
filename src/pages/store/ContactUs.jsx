import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { HiOutlineChevronRight, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from 'react-icons/hi';
import ContactForm from '../../components/common/ContactForm';
import { staticPagesAPI } from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

export default function ContactUs() {
  const { settings } = useStoreSettings();
  const [page, setPage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    staticPagesAPI
      .getBySlug('contact-us')
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || res.data;
        if (data) setPage(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const business = settings?.businessDetails || {};
  const phone = business.mobileNumber || '+91 84600-91955';
  const email = business.emailAddress || 'info@neirah.in';
  const address =
    business.storeAddress ||
    'Sanskrut - 1 GH Road G-1, 1/2 Sector 3D plot no.1182 G-1, near Hi-Tech hospital, Gandhinagar, Gujarat';

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#1c1917] pb-24">
      <SEO
        title={page?.seoTitle || page?.title || 'Contact Us | Neirah Luxury Jewellery'}
        description={page?.metaDescription || 'Reach our concierge for inquiries, custom orders, or personal appointments.'}
        type="website"
      />

      {/* ─── Breadcrumb ────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-400">
          <Link to="/" className="hover:text-stone-700 transition-colors">
            Home
          </Link>
          <HiOutlineChevronRight className="w-3 h-3 text-stone-300" />
          <span className="text-stone-800 font-medium">Contact Us</span>
        </nav>
      </div>

      {/* ─── Page Title Header ──────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-6 sm:pb-8 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-stone-900">
          Contact Us
        </h1>
      </div>

      {/* ─── Contact Form ───────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-[14px] border border-stone-200/90 shadow-xs">
          <ContactForm showHeading={false} />
        </div>

        {/* ─── Direct Contact Information Row ────────────────── */}
        <div className="mt-10 pt-8 border-t border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
          {/* Phone */}
          <div className="p-4 rounded-[12px] bg-white border border-stone-200/80 flex flex-col items-center">
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, #ffffff)',
                color: 'var(--btn-primary-bg, #8b6f4e)',
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
            >
              <HiOutlinePhone className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Call Us
            </h4>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="text-xs font-semibold text-stone-800 link-theme-hover transition-colors"
            >
              {phone}
            </a>
          </div>

          {/* Email */}
          <div className="p-4 rounded-[12px] bg-white border border-stone-200/80 flex flex-col items-center">
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, #ffffff)',
                color: 'var(--btn-primary-bg, #8b6f4e)',
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
            >
              <HiOutlineMail className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Email Concierge
            </h4>
            <a
              href={`mailto:${email}`}
              className="text-xs font-semibold text-stone-800 link-theme-hover transition-colors"
            >
              {email}
            </a>
          </div>

          {/* Boutique */}
          <div className="p-4 rounded-[12px] bg-white border border-stone-200/80 flex flex-col items-center">
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, #ffffff)',
                color: 'var(--btn-primary-bg, #8b6f4e)',
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
            >
              <HiOutlineLocationMarker className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Visit Store
            </h4>
            <p className="text-xs text-stone-700 leading-snug line-clamp-2">
              {address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
