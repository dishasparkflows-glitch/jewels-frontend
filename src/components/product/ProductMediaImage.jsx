/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { IoDiamondOutline } from 'react-icons/io5';
import { getImageUrl, isVideoUrl } from '../../utils/imageUrl';

/**
 * Reusable product media component that smoothly handles image URLs,
 * video URLs (autoPlay, loop, muted), and broken/missing image fallbacks.
 */
export default function ProductMediaImage({
  src,
  alt = 'Product image',
  className = 'w-full h-full object-cover',
  videoClassName,
  fallbackClassName = 'flex h-full w-full flex-col items-center justify-center gap-1.5 text-stone-300',
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={fallbackClassName}>
        <IoDiamondOutline className="h-8 w-8 text-stone-300" />
        <span className="text-[10px] sm:text-[11px] text-stone-400">Image unavailable</span>
      </div>
    );
  }

  const resolvedUrl = getImageUrl(src);

  if (isVideoUrl(src)) {
    return (
      <video
        src={`${resolvedUrl}#t=0.01`}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={videoClassName || `${className} pointer-events-none`}
      />
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
