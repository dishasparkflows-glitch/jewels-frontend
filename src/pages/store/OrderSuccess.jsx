import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineShoppingBag, HiOutlineArrowRight, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import { ordersAPI } from '../../api/services';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId || orderNumber));

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
      } finally {
        if (active) setLoading(false);
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
                  <span className="font-semibold uppercase tracking-wide text-emerald-700">
                    {order.payment?.status === 'paid' ? 'Paid & Confirmed' : order.orderStatus}
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
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex items-center gap-3">
                      {item.image?.url && (
                        <img
                          src={item.image.url}
                          alt={item.title}
                          className="h-12 w-12 rounded object-contain bg-[#f8f6f3] p-1 border border-stone-100"
                        />
                      )}
                      <div>
                        <p className="font-medium text-stone-900">{item.title}</p>
                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-stone-900">{formatPrice(item.totalItemPrice || item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-stone-100 pt-4 text-xs space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.pricing?.subtotal || 0)}</span>
                </div>
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>−{formatPrice(order.pricing.discount)}</span>
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#171613] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#80603d]"
          >
            <HiOutlineShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
          <a
            href="tel:+919726237723"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-6 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <HiOutlinePhone className="h-4 w-4 text-[#bd9462]" /> Need Assistance?
          </a>
        </div>
      </div>
    </main>
  );
}

