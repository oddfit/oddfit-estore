// src/components/ui/BannerCarousel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

type BannerItem = {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  mobileTitle?: string;
  mobileSubtitle?: string;
  buttonText?: string;
  desktopTextAlign?: 'left' | 'center' | 'right';
};

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

const BannerCarousel: React.FC<{ items: BannerItem[]; autoMs?: number }> = ({
  items,
  autoMs = 6000,
}) => {
  const [idx, setIdx] = useState(0);

  // image load states (desktop & mobile handled separately so skeletons don't cross-trigger)
  const [loadedDesk, setLoadedDesk] = useState(false);
  const [errorDesk, setErrorDesk] = useState(false);
  const [loadedMob, setLoadedMob] = useState(false);
  const [errorMob, setErrorMob] = useState(false);

  const safeItems = useMemo(() => items.filter(Boolean), [items]);
  const curr = safeItems[idx];

  const btnText = curr?.buttonText || 'Shop';
  const dest = curr?.linkUrl || '/products';
  const align = curr?.desktopTextAlign || 'left';
  const justify =
    align === 'center'
      ? 'justify-center'
      : align === 'right'
      ? 'justify-end'
      : 'justify-start';
  const textAlign =
    align === 'center'
      ? 'text-center'
      : align === 'right'
      ? 'text-right'
      : 'text-left';
// helper to add fetchpriority only on the first slide and avoid TS typing issues
const hiPrio = idx === 0 ? { fetchpriority: 'high' as any } : {};
  // auto-advance
  useEffect(() => {
    if (safeItems.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % safeItems.length), autoMs);
    return () => clearInterval(t);
  }, [safeItems.length, autoMs]);

  // reset load state on slide change
  useEffect(() => {
    setLoadedDesk(false);
    setErrorDesk(false);
    setLoadedMob(false);
    setErrorMob(false);

    // (optional) preload next image for smoother transitions
    const next = safeItems[(idx + 1) % safeItems.length];
    if (next?.imageUrl) {
      const pre = new Image();
      pre.src = next.imageUrl;
    }
    if (next?.mobileImageUrl) {
      const preM = new Image();
      preM.src = next.mobileImageUrl;
    }
  }, [idx, safeItems]);

  if (safeItems.length === 0 || !curr) return null;

  return (
    <div className="relative">
      <div className="relative h-[38vh] sm:h-[46vh] md:h-[60vh] lg:h-[72vh] overflow-hidden">
        {/* Desktop / Tablet image */}
        {!errorDesk && (
          <img
            {...hiPrio}
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            src={curr.imageUrl}
            alt={curr.title || 'Banner'}
            className={`hidden sm:block absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${
              loadedDesk ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoadedDesk(true)}
            onError={() => setErrorDesk(true)}
            // loading="eager"
            fetchPriority="high"
            // decoding="async"
          />
        )}
        {/* Desktop fallback only if the main image fails */}
        {errorDesk && (
          <img
            src={FALLBACK}
            alt="Banner"
            className="hidden sm:block absolute inset-0 w-full h-full object-cover object-top"
          />
        )}
        {/* Desktop skeleton while loading */}
        {!loadedDesk && !errorDesk && (
          <div className="hidden sm:block absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Mobile image */}
        {!errorMob && (
          <img  
            {...hiPrio}
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            src={curr.mobileImageUrl || curr.imageUrl}
            alt={curr.title || 'Banner'}
            className={`block sm:hidden absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
              loadedMob ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoadedMob(true)}
            onError={() => setErrorMob(true)}
            // loading="eager"
            fetchPriority="high"
            // decoding="async"
          />
        )}
        {/* Mobile fallback only if the main image fails */}
        {errorMob && (
          <img
            src={FALLBACK}
            alt="Banner"
            className="block sm:hidden absolute inset-0 w-full h-full object-cover object-center"
          />
        )}
        {/* Mobile skeleton while loading */}
        {!loadedMob && !errorMob && (
          <div className="block sm:hidden absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Desktop overlay: left/center/right positioning */}
        <div className={`hidden sm:flex absolute inset-0 items-center ${justify} px-4 md:px-8`}>
          {(curr.title || curr.subtitle) && (
            <div className={`max-w-[40ch] ${textAlign}`}>
              {curr.title && (
                <h2 className="text-[#8e3b7f] text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                  {curr.title}
                </h2>
              )}
              {curr.subtitle && (
                <p className="mt-3 text-[#d25c4d]/95 text-lg md:text-xl lg:text-2xl font-semibold drop-shadow">
                  {curr.subtitle}
                </p>
              )}
              <Link to={dest}>
                <Button className="mt-5">{btnText}</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile overlay: centered title/subtitle/button (uses mobile* if provided) */}
        <div className="sm:hidden absolute inset-0 flex items-center justify-center px-5 text-center">
          <div className="max-w-xs">
            {(curr.mobileTitle || curr.title) && (
              <h2 className="text-[#8e3b7f] text-2xl font-extrabold leading-tight drop-shadow">
                {curr.mobileTitle || curr.title}
              </h2>
            )}
            {(curr.mobileSubtitle || curr.subtitle) && (
              <p className="mt-3 text-[#d25c4d]/95 text-lg font-semibold drop-shadow">
                {curr.mobileSubtitle || curr.subtitle}
              </p>
            )}
            <Link to={dest}>
              <Button className="mt-4">{btnText}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dots */}
      {safeItems.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {safeItems.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-8 bg-white' : 'w-3 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
