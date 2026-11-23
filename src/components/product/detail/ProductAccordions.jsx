import { useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineStar } from 'react-icons/hi';
import FormattedContent from './FormattedContent';

const formatBreakdownValue = (val) => {
  if (val === undefined || val === null || val === '' || isNaN(val)) return '-';
  const num = Number(val);
  if (num === 0) return '-';
  if (num % 1 !== 0) {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatBreakdownRate = (val) => {
  if (!val || isNaN(val) || Number(val) === 0) return '-';
  const num = Number(val);
  if (num % 1 !== 0) {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/g`;
  }
  return `₹${num.toLocaleString('en-IN')}/g`;
};

const formatBreakdownWeight = (val, unit = 'g') => {
  if (!val || isNaN(val) || Number(val) === 0) return '-';
  const num = Number(val);
  return `${num.toLocaleString('en-IN', { maximumFractionDigits: 3 })} ${unit}`;
};

/**
 * Collapsible Accordions for Product Description, Specifications, Price Break Up, and Dynamic Care/Maintenance Guides
 */
export default function ProductAccordions({
  product = {},
  productSpecs = [],
  isGold = false,
  breakdown = null,
}) {
  const [openAccordions, setOpenAccordions] = useState({
    desc: false,
    specs: false,
    price: false,
    origin: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="border border-[#EFE8DD] divide-y divide-[#EFE8DD] rounded-none sm:rounded-sm overflow-hidden text-xs bg-white">
      {/* Accordion 1: Product Description */}
      {Boolean((product.basicInfo?.description || '').trim()) && (
        <div>
          <button
            type="button"
            onClick={() => toggleAccordion('desc')}
            className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
          >
            <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">
              Product Description
            </span>
            <span className="text-stone-600 text-lg sm:text-xl font-light select-none leading-none flex items-center justify-center w-6 h-6">
              {openAccordions.desc ? '−' : '+'}
            </span>
          </button>
          <div className={`accordion-collapse ${openAccordions.desc ? 'open' : ''}`}>
            <div className="accordion-collapse-inner">
              <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD]">
                <FormattedContent content={product.basicInfo?.description} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion: Product Specifications */}
      {productSpecs.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => toggleAccordion('specs')}
            className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
          >
            <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">
              Product Specifications
            </span>
            <span className="text-stone-600 text-lg sm:text-xl font-light select-none leading-none flex items-center justify-center w-6 h-6">
              {openAccordions.specs ? '−' : '+'}
            </span>
          </button>
          <div className={`accordion-collapse ${openAccordions.specs ? 'open' : ''}`}>
            <div className="accordion-collapse-inner">
              <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD]">
                <div className="border border-stone-200 rounded bg-stone-50/50 p-3.5 sm:p-4">
                  <div
                    className={`grid gap-2.5 ${
                      productSpecs.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {productSpecs.map((spec, idx) => (
                      <div
                        key={spec.id || idx}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-stone-200 rounded shadow-2xs text-xs"
                      >
                        <span className="font-medium text-stone-500 capitalize">{spec.key}</span>
                        <div className="flex items-center gap-1.5 font-semibold text-stone-900 text-right">
                          <span className="text-stone-400 font-normal">:</span>
                          <span>{spec.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion 2: PRICE BREAK UP (Only for Gold items) */}
      {isGold && (
        <div>
          <button
            type="button"
            onClick={() => toggleAccordion('price')}
            className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
          >
            <span className="text-[11.5px] sm:text-xs font-semibold tracking-wider uppercase text-stone-900">
              PRICE BREAK UP
            </span>
            <span className="text-stone-600 text-lg sm:text-xl font-light select-none leading-none flex items-center justify-center w-6 h-6">
              {openAccordions.price ? '−' : '+'}
            </span>
          </button>
          <div className={`accordion-collapse ${openAccordions.price ? 'open' : ''}`}>
            <div className="accordion-collapse-inner">
              {breakdown && (
                <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD] text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-[10px] sm:text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
                          <th className="pb-2.5 px-1 font-medium text-stone-400 text-left">COMPONENT</th>
                          <th className="pb-2.5 px-1 font-medium text-stone-400 text-center">RATE</th>
                          <th className="pb-2.5 px-1 font-medium text-stone-400 text-center">WEIGHT</th>
                          <th className="pb-2.5 px-1 font-medium text-stone-400 text-right">VALUE</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {/* METALS */}
                        <tr>
                          <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                            METALS
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-normal text-stone-800">{breakdown.metalName}</td>
                          <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownRate(breakdown.metalRate)}</td>
                          <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownWeight(breakdown.metalWeight, 'g')}</td>
                          <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.metalCost)}</td>
                        </tr>

                        {/* GEMSTONES (Center & Side Colorstone) */}
                        {(breakdown.hasColorStone || breakdown.hasSideColorStone) && (
                          <>
                            <tr>
                              <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                                GEMSTONES
                              </td>
                            </tr>
                            {breakdown.hasColorStone && (
                              <tr>
                                <td className="py-1 px-1 font-normal text-stone-800">
                                  {breakdown.hasSideColorStone ? 'Center Labgrown Gemstone' : 'Labgrown Gemstone'}
                                </td>
                                <td className="py-1 px-1 text-center font-normal text-stone-700">
                                  {breakdown.colorStoneRate ? `₹${Number(breakdown.colorStoneRate).toLocaleString('en-IN')}/ct` : '-'}
                                </td>
                                <td className="py-1 px-1 text-center font-normal text-stone-700">
                                  {formatBreakdownWeight(breakdown.colorStoneWeight, 'cts')}
                                </td>
                                <td className="py-1 px-1 text-right font-normal text-stone-900">
                                  {formatBreakdownValue(breakdown.colorStoneCost)}
                                </td>
                              </tr>
                            )}
                            {breakdown.hasSideColorStone && (
                              <tr>
                                <td className="py-1 px-1 font-normal text-stone-800">
                                  Side Labgrown Gemstone
                                </td>
                                <td className="py-1 px-1 text-center font-normal text-stone-700">
                                  {breakdown.sideColorStoneRate ? `₹${Number(breakdown.sideColorStoneRate).toLocaleString('en-IN')}/ct` : '-'}
                                </td>
                                <td className="py-1 px-1 text-center font-normal text-stone-700">
                                  {formatBreakdownWeight(breakdown.sideColorStoneWeight, 'cts')}
                                </td>
                                <td className="py-1 px-1 text-right font-normal text-stone-900">
                                  {formatBreakdownValue(breakdown.sideColorStoneCost)}
                                </td>
                              </tr>
                            )}
                          </>
                        )}

                        {/* DIAMONDS */}
                        {(!breakdown.hasColorStone || breakdown.hasDiamond || Number(breakdown.diamondCost) > 0) && (
                          <>
                            <tr>
                              <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                                DIAMONDS
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1 px-1 font-normal text-stone-800">{breakdown.diamondLabel}</td>
                              <td className="py-1 px-1 text-center text-stone-400">-</td>
                              <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownWeight(breakdown.diamondCarat, 'cts')}</td>
                              <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.diamondCost)}</td>
                            </tr>
                          </>
                        )}

                        {/* MAKING CHARGES */}
                        <tr>
                          <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                            MAKING CHARGES
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-normal text-stone-800">Making Charge</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.labourCharge)}</td>
                        </tr>

                        {/* OTHER CHARGES */}
                        <tr>
                          <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                            OTHER CHARGES
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-normal text-stone-800">Certificate Charge</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.certificateCharge)}</td>
                        </tr>

                        {/* SUMMARY */}
                        <tr>
                          <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                            SUMMARY
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-normal text-stone-800">Subtotal</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.subtotal)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-1 font-normal text-stone-800">GST (3%)</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-center text-stone-400">-</td>
                          <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.gstAmount)}</td>
                        </tr>
                        <tr className="border-t border-stone-200">
                          <td className="pt-3 pb-1 px-1 font-bold text-stone-900 text-xs">Grand Total</td>
                          <td className="pt-3 pb-1 px-1 text-center text-stone-400 font-normal">-</td>
                          <td className="pt-3 pb-1 px-1 text-center text-stone-400 font-normal">-</td>
                          <td className="pt-3 pb-1 px-1 text-right font-bold text-stone-900 text-xs">{formatBreakdownValue(breakdown.finalPrice)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Variation in Weight Notice Card */}
                  <div className="mt-4 p-3.5 sm:p-4 rounded-xl border border-[#faedd3] bg-[#fffdf7] flex items-start gap-3">
                    <HiOutlineStar className="w-4 h-4 text-[#8b6f4e] shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#44382c] leading-relaxed font-normal">
                      The final invoice amount will be adjusted in case of variation in weight.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Accordions: Care & Specs Sections (e.g. How to Care, Key Benefits, How to Maintain) */}
      {Array.isArray(product.descriptionSections || product.careSections) &&
        (product.descriptionSections || product.careSections)
          .filter(
            (sec) =>
              sec &&
              sec.showOnProductPage !== false &&
              Boolean((sec.title || sec.heading || '').trim()) &&
              Boolean((sec.content || sec.body || '').trim())
          )
          .map((sec, secIdx) => {
            const secKey = `dynamic_${sec._id || secIdx}`;
            const secTitle = sec.title || sec.heading;
            const secContent = sec.content || sec.body;

            return (
              <div key={secKey}>
                <button
                  type="button"
                  onClick={() => toggleAccordion(secKey)}
                  className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">
                    {secTitle}
                  </span>
                  <span className="text-stone-600 text-lg sm:text-xl font-light select-none leading-none flex items-center justify-center w-6 h-6">
                    {openAccordions[secKey] ? '−' : '+'}
                  </span>
                </button>
                <div className={`accordion-collapse ${openAccordions[secKey] ? 'open' : ''}`}>
                  <div className="accordion-collapse-inner">
                    <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD]">
                      <FormattedContent content={secContent} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  );
}

ProductAccordions.propTypes = {
  product: PropTypes.object,
  productSpecs: PropTypes.array,
  isGold: PropTypes.bool,
  breakdown: PropTypes.object,
};
