import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import {
  HiOutlineCheckCircle,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import { ordersAPI } from '../../api/services';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';

const formatOrderDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return String(dateVal);
  }
};

const formatPaymentMethod = (payment) => {
  if (!payment) return 'Cash on Delivery (COD)';
  const provider = String(payment.provider || payment.method || payment.paymentMethod || '').toLowerCase();
  if (provider === 'cod' || provider.includes('cash')) return 'Cash on Delivery (COD)';
  if (provider === 'razorpay') return 'Razorpay (Online)';
  if (provider === 'stripe') return 'Credit / Debit Card';
  if (provider === 'card') return 'Card Payment';
  return payment.provider || payment.method || 'Cash on Delivery (COD)';
};

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const orderToken = searchParams.get('token');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try {
        let resp = null;
        if (orderId) {
          resp = await ordersAPI.getById(orderId, orderToken);
        } else if (orderNumber) {
          resp = await ordersAPI.getByNumber(orderNumber, orderToken);
        }
        if (active && resp?.data) {
          setOrder(resp.data.data || resp.data);
        }
      } catch (err) {
        console.error('Failed to load order confirmation:', err);
      }
    };

    if (orderId || orderNumber) {
      fetchOrder();
    }
    return () => {
      active = false;
    };
  }, [orderId, orderNumber, orderToken]);

  return (
    <main className="min-h-[75vh] bg-[#faf8f5] px-4 py-12 sm:py-16 text-stone-900 sm:px-6 lg:px-8">
      <SEO title="Order Confirmed | Neirah Jewels" noindex={true} />
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f4ece1] text-[#92704e]">
          <HiOutlineCheckCircle className="h-12 w-12" />
        </div>

        <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
          Thank you for your order!
        </h1>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e6dcce] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#92704e]">
          Order Number: <span className="font-mono text-stone-800">{order?.orderNumber || orderNumber || 'Processing'}</span>
        </div>

        {order && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#efe7dd] bg-white text-left shadow-xs p-6 sm:p-7">
            {/* ─── Top Info Row (Order Date | Payment Method | Shipping) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/70 border-b border-[#f0eae1] pb-6 mb-6">
              {/* Order Date */}
              <div className="flex items-center gap-3 sm:pr-4 pb-3 sm:pb-0">
                <div className="w-10 h-10 rounded-xl bg-[#f7f2ea] flex items-center justify-center text-[#8c6536] shrink-0">
                  <HiOutlineCalendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-stone-500 font-medium">Order Date</p>
                  <p className="text-xs sm:text-[13px] font-bold text-stone-900 mt-0.5 truncate">
                    {formatOrderDate(order.createdAt || order.orderDate) || 'Today'}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-3 sm:px-4 py-3 sm:py-0">
                <div className="w-10 h-10 rounded-xl bg-[#f7f2ea] flex items-center justify-center text-[#8c6536] shrink-0">
                  <HiOutlineCreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-stone-500 font-medium">Payment Method</p>
                  <p className="text-xs sm:text-[13px] font-bold text-stone-900 mt-0.5 truncate">
                    {formatPaymentMethod(order.payment)}
                  </p>
                </div>
              </div>

              {/* Shipping */}
              <div className="flex items-center gap-3 sm:pl-4 pt-3 sm:pt-0">
                <div className="w-10 h-10 rounded-xl bg-[#f7f2ea] flex items-center justify-center text-[#8c6536] shrink-0">
                  <HiOutlineTruck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-stone-500 font-medium">Shipping</p>
                  <p className="text-xs sm:text-[13px] font-bold text-stone-900 mt-0.5 truncate">
                    {order.pricing?.shipping === 0 || !order.pricing?.shipping ? 'Free' : formatPrice(order.pricing.shipping)}
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Items Ordered ─── */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 mb-4">
                Items Ordered ({order.items?.length || 0})
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {order.items?.map((item, idx) => {
                  const isDiamond = item.itemType === 'diamond';
                  const refDoc = item.refId && typeof item.refId === 'object' ? item.refId : null;
                  const slug =
                    refDoc?.basicInfo?.slug ||
                    refDoc?.slug ||
                    refDoc?.sku ||
                    item.sku ||
                    item.slug;
                  const id =
                    refDoc?._id ||
                    (typeof item.refId === 'string' ? item.refId : null) ||
                    item.id;
                  const target = slug || id;
                  const productLink = target
                    ? (isDiamond ? `/diamond/${encodeURIComponent(target)}` : `/product/${encodeURIComponent(target)}`)
                    : null;

                  const imageUrl =
                    item.image?.url ||
                    refDoc?.image?.url ||
                    refDoc?.colorImages?.[0]?.images?.[0]?.url ||
                    refDoc?.ornate?.ornateImages?.[0]?.url ||
                    (typeof item.image === 'string' ? item.image : '') ||
                    '/featured/ring.jpg';

                  return (
                    <div key={idx} className="flex items-center justify-between py-1 sm:py-1.5 text-sm">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Item Image */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#f5efe6] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                          {productLink ? (
                            <Link
                              to={productLink}
                              className="h-full w-full flex items-center justify-center hover:opacity-90 transition-opacity"
                              title="View Product Details"
                            >
                              <img
                                src={imageUrl}
                                alt={item.title}
                                className="max-h-full max-w-full object-contain"
                              />
                            </Link>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={item.title}
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>

                        {/* Item Title & Qty */}
                        <div className="min-w-0 flex-1 pr-2">
                          {productLink ? (
                            <Link
                              to={productLink}
                              className="font-bold text-xs sm:text-[13px] text-stone-900 hover:text-[#8b6f4e] transition-colors truncate block text-left"
                              title={item.title}
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <p className="font-bold text-xs sm:text-[13px] text-stone-900 truncate text-left">{item.title}</p>
                          )}
                          <p className="text-[11px] sm:text-xs text-stone-500 text-left mt-0.5">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      {/* Item Total Price */}
                      <span className="font-bold text-xs sm:text-sm text-stone-900 shrink-0 ml-3">
                        {formatPrice(item.totalItemPrice || item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Pricing Breakdown ─── */}
            <div className="mt-5 border-t border-[#f0eae1] pt-4 text-xs space-y-2.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-800">{formatPrice(order.pricing?.subtotal || 0)}</span>
              </div>

              {(Number(order.pricing?.discount) > 0 || order.coupon?.code) && (
                <div className="flex items-center justify-between text-emerald-700">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Discount</span>
                    {order.coupon?.code && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-[10.5px] tracking-wide border border-emerald-300">
                        <HiOutlineTag className="w-3 h-3 text-emerald-600" />
                        <span>{order.coupon.code}</span>
                      </span>
                    )}
                    {order.coupon?.discountType === 'Percentage' && Number(order.coupon?.discountValue) > 0 ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200">
                        {order.coupon.discountValue}% OFF
                      </span>
                    ) : order.coupon?.discountType === 'Fixed' && Number(order.coupon?.discountValue) > 0 ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200">
                        ₹{Number(order.coupon.discountValue).toLocaleString('en-IN')} OFF
                      </span>
                    ) : null}
                  </div>
                  <span className="font-medium">−{formatPrice(order.pricing?.discount || order.coupon?.discountAmount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Estimated GST (3%)</span>
                <span className="font-medium text-stone-800">{formatPrice(order.pricing?.tax || 0)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="font-medium text-stone-800">
                  {order.pricing?.shipping === 0 || !order.pricing?.shipping ? 'Free' : formatPrice(order.pricing?.shipping)}
                </span>
              </div>

              {/* Total Paid Row (Soft Warm Highlight) */}
              <div className="mt-3 rounded-xl bg-[#f7f2ea] px-4 py-3 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-stone-900">Total Paid</span>
                <span className="text-sm sm:text-base font-bold text-stone-900">{formatPrice(order.pricing?.total || 0)}</span>
              </div>
            </div>

            {/* ─── Shipping To ─── */}
            {order.shippingAddress && (
              <div className="mt-5 border-t border-[#f0eae1] pt-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f7f2ea] flex items-center justify-center text-[#8c6536] shrink-0 mt-0.5">
                    <HiOutlineLocationMarker className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-stone-900">Shipping To</h4>
                    <p className="mt-1 text-xs font-semibold text-stone-800">
                      {order.shippingAddress.fullName || `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim()}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed mt-0.5">
                      {[
                        order.shippingAddress.addressLine,
                        order.shippingAddress.apartment,
                      ].filter(Boolean).join(' ')}
                      <br />
                      {[
                        order.shippingAddress.city,
                        order.shippingAddress.state ? `${order.shippingAddress.state} - ${order.shippingAddress.postalCode || ''}` : order.shippingAddress.postalCode,
                      ].filter(Boolean).join(', ')}
                      <br />
                      {[
                        order.shippingAddress.country || 'India',
                        order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : null,
                      ].filter(Boolean).join(' | ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            to="/shop"
            style={{
              backgroundColor: 'var(--btn-primary-bg, #8c6536)',
              color: 'var(--btn-primary-text, #ffffff)',
            }}
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl px-8 text-xs sm:text-[13px] font-medium transition hover:opacity-90 shadow-xs active:scale-95 cursor-pointer"
          >
            <HiOutlineShoppingBag className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
