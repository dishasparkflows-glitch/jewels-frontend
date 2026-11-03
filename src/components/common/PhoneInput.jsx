import { useId } from 'react';
import { HiOutlineDeviceMobile } from 'react-icons/hi';
import CountryCodeSelect from './CountryCodeSelect';

/* eslint-disable react/prop-types */

/**
 * Common PhoneInput Component
 *
 * Combines the luxury CountryCodeSelect with telephone input.
 * Reusable across the entire application (Register, Virtual Appointment, Checkout, Profile, Address forms).
 *
 * Props:
 *  - value               : string — the phone number (without country code)
 *  - onChange             : (phoneNumber: string) => void
 *  - countryCode         : string — dial code like "+91"
 *  - onCountryCodeChange : (dialCode: string, country?: object) => void
 *  - placeholder         : string
 *  - required            : boolean
 *  - disabled            : boolean
 *  - size                : 'sm' | 'md' | 'lg' — sm=h-9, md=h-11, lg=h-12
 *  - variant             : 'default' | 'profile' — 'default' (rounded-xl) or 'profile' (rounded-xl border-[#e5ded5])
 *  - showIcon            : boolean — whether to show mobile device icon (default: true)
 *  - icon                : React.ReactNode — custom icon override
 *  - className           : string — container wrapper classes
 *  - buttonClassName     : string — trigger button custom classes
 *  - menuClassName       : string — popover menu custom classes
 *  - inputClassName      : string — input custom classes
 *  - id                  : string
 */
export default function PhoneInput({
  value = '',
  onChange,
  countryCode = '+91',
  onCountryCodeChange,
  placeholder = 'Mobile Number',
  required = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  showIcon = false,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  inputClassName = '',
  id,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  // ------------------------------- size styles ----------------------------
  const sizeClasses = {
    sm: 'h-9 text-xs',
    md: 'h-11 text-sm',
    lg: 'h-12 text-sm',
  };
  const currentSize = sizeClasses[size] || sizeClasses.md;

  // ------------------------------- container variants ----------------------------
  const variantStyles = {
    default:
      'rounded-xl border border-stone-200 bg-white focus-within:border-[#8c6b45] focus-within:ring-2 focus-within:ring-[#8c6b45]/15',
    profile:
      'rounded-xl border border-[#e5ded5] hover:border-[#bdae99] bg-white shadow-2xs focus-within:border-[#9e7a46] focus-within:ring-2 focus-within:ring-[#9e7a46]/10',
  };
  const containerVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`flex ${currentSize.split(' ')[0]} w-full items-center ${containerVariant} transition ${className}`}
    >
      {/* Mobile Icon */}
      {showIcon && (
        <span className="flex items-center pl-2.5 sm:pl-3 shrink-0 text-stone-400">
          {icon || (
            <HiOutlineDeviceMobile
              className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            />
          )}
        </span>
      )}

      {/* Country Code Dropdown */}
      <CountryCodeSelect
        value={countryCode}
        onChange={(dialCode, country) => {
          if (onCountryCodeChange) onCountryCodeChange(dialCode, country);
        }}
        disabled={disabled}
        size={size}
        className="h-full shrink-0"
        buttonClassName={
          buttonClassName ||
          `flex h-full items-center gap-1.5 ${
            size === 'sm' ? 'px-2 text-xs' : 'px-3 text-xs sm:text-sm'
          } rounded-l-xl text-stone-800 transition hover:bg-stone-50 border-r border-stone-200 outline-none cursor-pointer select-none`
        }
        menuClassName={menuClassName}
      />

      {/* Mobile Number Input */}
      <label className="sr-only" htmlFor={inputId}>
        {placeholder}
      </label>
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value);
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`min-w-0 flex-1 bg-transparent ${
          size === 'sm' ? 'px-2 text-xs' : 'px-3 text-sm'
        } text-stone-800 outline-none placeholder:text-stone-400 ${inputClassName}`}
      />
    </div>
  );
}
