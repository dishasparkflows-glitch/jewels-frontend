/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import SEO from '../common/SEO';

/**
 * Shared centered card layout for Forgot Password and Reset Password flows,
 * dynamically tinted by the active storefront theme (`--btn-primary-bg`).
 */
export default function AuthLuxuryCard({ seoTitle, title, subtitle, children }) {
  return (
    <main className="min-h-[75vh] bg-[#fbf9f6] px-4 py-12 sm:py-16 flex items-center justify-center font-sans">
      <SEO title={seoTitle} noindex={true} />
      <section
        className="relative w-full max-w-[420px] overflow-hidden rounded-[26px] border p-7 sm:p-9"
        style={{
          borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 22%, #ffffff)',
          backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 4%, #ffffff)',
          boxShadow: '0 12px 45px color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 10%, transparent)',
        }}
      >
        {/* Card Header */}
        <div className="text-center relative z-10 mb-2">
          {/* Heading */}
          <h1 className="font-serif text-[24px] sm:text-[26px] text-stone-900 font-normal tracking-tight">
            {title}
          </h1>

          {/* Decorative Divider with Heart */}
          <div className="my-2.5 flex items-center justify-center gap-3">
            <div
              className="h-[1px] w-12"
              style={{ backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 35%, #ffffff)' }}
            />
            <svg
              className="w-3.5 h-3.5"
              style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <div
              className="h-[1px] w-12"
              style={{ backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 35%, #ffffff)' }}
            />
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] leading-relaxed text-stone-600 max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Form / State Body */}
        <div className="relative z-10 mt-5">
          {children}

          {/* Back to Login */}
          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 link-theme-hover transition-colors cursor-pointer"
            >
              <span className="text-sm leading-none">←</span>
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
