import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineShoppingBag, HiOutlineTag } from 'react-icons/hi';
import { ordersAPI } from '../../api/services';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try {
        let resp = null;
        if (orderId) {
          resp = await ordersAPI.getById(orderId);
        } else if (orderNumber) {
          resp = await ordersAPI.getByNumber(orderNumber);
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
  }, [orderId, orderNumber]);

  return (
    <main className="min-h-[75vh] bg-[#faf8f5] px-4 py-16 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f4ece1] text-[#92704e]">
          <HiOutlineCheckCircle className="h-12 w-12" />
        </div>

        <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Your order has been received and is being prepared with utmost care.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e6dcce] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#92704e]">
          Order Number: <span className="font-mono text-stone-800">{order?.orderNumber || orderNumber || 'Processing'}</span>
        </div>

        {order && (
          <div className="mt-8 overflow-hidden rounded-lg border border-stone-200 bg-white text-left shadow-sm">
            <div className="border-b border-stone-100 bg-[#faf8f5] px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-stone-500">Status: </span>
                  <span className="font-semibold uppercase tracking-wide text-[#8b6f4e]">
                    {order.orderStatus || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">Payment: </span>
                  <span className="font-semibold uppercase text-stone-800">
                    {order.payment?.provider || order.payment?.method}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Items Ordered</h3>
              <div className="mt-3 divide-y divide-stone-100">
                {order.items?.map((item, idx) => {
                  const slug =
                    item.productId?.basicInfo?.slug ||
                    item.productId?.slug ||
                    item.slug;
                  const id =
                    item.productId?._id ||
                    (typeof item.productId === 'string' ? item.productId : null) ||
                    item.id;
                  const productLink = slug
                    ? `/product/${encodeURIComponent(slug)}`
                    : id
                    ? `/product/${encodeURIComponent(id)}`
                    : null;

                  return (
                    <div key={idx} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {productLink ? (
                          <Link
                            to={productLink}
                            className="shrink-0 hover:opacity-85 transition-opacity"
                            title="View Product Details"
                          >
                            {item.image?.url && (
                              <img
                                src={item.image.url}
                                alt={item.title}
                                className="h-12 w-12 rounded object-contain bg-[#f8f6f3] p-1 border border-stone-100"
                              />
                            )}
                          </Link>
                        ) : (
                          item.image?.url && (
                            <img
                              src={item.image.url}
                              alt={item.title}
                              className="h-12 w-12 rounded object-contain bg-[#f8f6f3] p-1 border border-stone-100"
                            />
                          )
                        )}
                        <div className="min-w-0 flex-1">
                          {productLink ? (
                            <Link
                              to={productLink}
                              className="font-medium text-stone-900 hover:text-[#8b6f4e] transition-colors truncate block text-left"
                              title={item.title}
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <p className="font-medium text-stone-900 truncate text-left">{item.title}</p>
                          )}
                          <p className="text-xs text-stone-500 text-left">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-stone-900 shrink-0 ml-3">
                        {formatPrice(item.totalItemPrice || item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-stone-100 pt-4 text-xs space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.pricing?.subtotal || 0)}</span>
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
                    <span>−{formatPrice(order.pricing?.discount || order.coupon?.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Estimated GST (3%)</span>
                  <span>{formatPrice(order.pricing?.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span>{order.pricing?.shipping === 0 ? 'Free' : formatPrice(order.pricing?.shipping)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-2 text-sm font-semibold text-stone-900">
                  <span>Total Paid</span>
                  <span>{formatPrice(order.pricing?.total || 0)}</span>
                </div>
              </div>

              {order.shippingAddress && (
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Shipping To</h4>
                  <p className="mt-1 text-xs text-stone-700">
                    {order.shippingAddress.fullName || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}<br />
                    {order.shippingAddress.addressLine} {order.shippingAddress.apartment}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                    {order.shippingAddress.country} · Phone: {order.shippingAddress.phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/shop"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#8c6536] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#75522b] shadow-xs active:scale-95 cursor-pointer"
          >
            <HiOutlineShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

