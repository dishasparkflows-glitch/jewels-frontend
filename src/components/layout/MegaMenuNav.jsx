/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { getImageUrl } from '../../utils/imageUrl';

const categoryLink = (category) => `/shop?category=${encodeURIComponent(category._id)}`;
const itemLink = (category, item) => `${categoryLink(category)}&menuItem=${encodeURIComponent(item._id)}`;
const safeLink = (value, fallback) => /^(https?:\/\/|\/(?!\/))/i.test(value || '') ? value : fallback;

function MenuContents({ category, onNavigate, mobile = false }) {
  const sections = (category.menuSections || []).filter((section) => section.menuItems?.length);
  const banners = (category.promoBanners || []).filter((banner) => banner.image?.url);
  const columns = Array.from({ length: Math.min(sections.length, 4) }, () => []);
  sections.forEach((section, index) => columns[Math.floor(index * columns.length / sections.length)].push(section));
  return <div className={mobile ? 'space-y-5 pb-4' : 'mx-auto flex max-h-[calc(100vh-220px)] max-w-[1440px] overflow-y-auto px-6'}>
    <div className={mobile ? 'space-y-5' : 'grid min-w-0 flex-1 grid-cols-4 divide-x divide-stone-200 py-8'}>
      {columns.map((column, index) => <div key={index} className={mobile ? 'space-y-5' : 'space-y-8 px-5 first:pl-0'}>{column.map((section) => <section key={section._id} className="border-b border-stone-200 pb-6 last:border-0"><h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-stone-900">{section.name}</h3><ul className="space-y-3">{section.menuItems.map((item) => <li key={item._id}><Link to={itemLink(category, item)} onClick={onNavigate} className="flex items-start gap-2.5 text-[13px] leading-5 text-stone-700 transition-colors hover:text-[#a7793b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a7793b]">{item.icon?.url && <img src={getImageUrl(item.icon.url)} alt="" className="mt-0.5 h-4 w-4 shrink-0 object-contain" />}<span>{item.name}</span></Link></li>)}</ul></section>)}</div>)}
      {!sections.length && <Link to={categoryLink(category)} onClick={onNavigate} className="col-span-4 text-sm text-stone-700 underline underline-offset-4">Explore {category.name}</Link>}
    </div>
    {!!banners.length && <aside aria-label={`${category.name} highlights`} className={mobile ? 'grid grid-cols-2 gap-3' : 'ml-8 w-[250px] shrink-0 xl:w-[280px]'}>{banners.map((banner) => <Link key={banner._id} to={safeLink(banner.link, categoryLink(category))} onClick={onNavigate} className="group relative block overflow-hidden bg-stone-100"><img src={getImageUrl(banner.image.url)} alt={banner.title || category.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />{banner.title && <span className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-3 text-center text-sm font-medium text-white">{banner.title}</span>}</Link>)}</aside>}
  </div>;
}

export default function MegaMenuNav({ categories, mobile = false, onNavigate, error, onRetry }) {
  const [activeId, setActiveId] = useState(null);
  const root = useRef(null);
  const triggers = useRef({});
  const location = useLocation();
  useEffect(() => { setActiveId(null); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!activeId) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) setActiveId(null); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [activeId]);
  const active = categories.find((category) => category._id === activeId);
  const close = () => { setActiveId(null); onNavigate?.(); };
  return <div ref={root} className={mobile ? '' : 'relative border-y border-stone-200 bg-white'} onMouseLeave={mobile ? undefined : () => setActiveId(null)} onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setActiveId(null); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setActiveId(null); triggers.current[activeId]?.focus(); } }}>
    {error && <div className="p-3 text-center text-xs text-stone-500">Navigation is temporarily unavailable. <button type="button" onClick={onRetry} className="underline">Retry</button></div>}
    {mobile ? <nav aria-label="Product categories" className="space-y-1">{categories.map((category) => <div key={category._id} className="border-b border-white/10"><button type="button" ref={(element) => { triggers.current[category._id] = element; }} aria-expanded={activeId === category._id} aria-controls={`mobile-menu-${category._id}`} onClick={() => setActiveId(activeId === category._id ? null : category._id)} className="flex w-full items-center justify-between py-3 text-left text-xs uppercase tracking-widest text-stone-200">{category.name}<HiOutlineChevronDown className={activeId === category._id ? 'rotate-180' : ''} /></button>{activeId === category._id && <div id={`mobile-menu-${category._id}`} className="rounded-xl bg-white p-4"><Link to={categoryLink(category)} onClick={close} className="mb-5 block text-xs font-semibold underline">Shop all {category.name}</Link><MenuContents category={category} onNavigate={close} mobile /></div>}</div>)}</nav> : <>
      <nav aria-label="Product categories" className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 px-6 xl:gap-x-14">{categories.map((category) => <div key={category._id} className="flex items-center" onMouseEnter={() => setActiveId(category._id)}><Link to={categoryLink(category)} onClick={close} onFocus={() => setActiveId(category._id)} className={`border-b-2 py-5 text-[11px] font-medium uppercase tracking-wider transition-colors ${activeId === category._id ? 'border-[#b88a43] text-[#a7793b]' : 'border-transparent text-stone-800 hover:text-[#a7793b]'}`}>{category.name}</Link><button type="button" ref={(element) => { triggers.current[category._id] = element; }} aria-label={`Open ${category.name} menu`} aria-expanded={activeId === category._id} aria-controls={`desktop-menu-${category._id}`} onClick={() => setActiveId(activeId === category._id ? null : category._id)} className="ml-1 p-1 text-stone-500"><HiOutlineChevronDown className="h-3 w-3" /></button></div>)}</nav>
      {active && <div id={`desktop-menu-${active._id}`} className="absolute inset-x-0 top-full z-50 border-b border-stone-200 bg-white shadow-xl"><MenuContents category={active} onNavigate={close} /></div>}
    </>}
  </div>;
}
