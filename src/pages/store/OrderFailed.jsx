import { useSearchParams, Link } from 'react-router-dom';
import { HiOutlineXCircle, HiOutlineRefresh, HiOutlinePhone } from 'react-icons/hi';

export default function OrderFailed() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const errorMsg = searchParams.get('error') || 'The transaction could not be processed.';

  return (
    <main className="min-h-[65vh] bg-[#faf8f5] px-4 py-16 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <HiOutlineXCircle className="h-12 w-12" />
        </div>

        <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900">
          Payment Unsuccessful
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {errorMsg}
        </p>

        {orderNumber && (
          <p className="mt-2 text-xs font-mono text-stone-500">
            Order Reference: {orderNumber}
          </p>
        )}

        <p className="mt-4 text-xs text-stone-500 leading-relaxed">
          If any amount was debited from your bank or card account, it will automatically be refunded to your original payment method within 5-7 working days.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/checkout"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#171613] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#80603d]"
          >
            <HiOutlineRefresh className="h-4 w-4" /> Try Again
          </Link>
          <a
            href="tel:+919726237723"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-6 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <HiOutlinePhone className="h-4 w-4 text-[#bd9462]" /> Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

