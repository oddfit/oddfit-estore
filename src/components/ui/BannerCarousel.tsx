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

const BannerCarousel: React.FC<{ items: BannerItem[]; autoMs?: number }> = ({
  items,
  autoMs = 6000,
}) => {
  const [idx, setIdx] = useState(0);
  const safeItems = useMemo(() => items.filter(Boolean), [items]);
  const curr = safeItems[idx];
  const btnText = curr.buttonText || 'Shop';
  const dest = curr.linkUrl || '/products';
  const align = curr.desktopTextAlign || 'left';
  const justify =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  const textAlign =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    
  useEffect(() => {
    if (safeItems.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % safeItems.length), autoMs);
    return () => clearInterval(t);
  }, [safeItems.length, autoMs]);

  if (safeItems.length === 0) return null;

  return (
    <div className="relative">
      {/* Full-bleed image */}
      <div className="relative h-[38vh] sm:h-[46vh] md:h-[60vh] lg:h-[72vh] overflow-hidden">
        {/* desktop/tablet */}
        <img
          src={curr.imageUrl}
          alt={curr.title || 'Banner'}
          className="hidden sm:block absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* mobile (crop left; show right side) */}
        <img
          src={curr.mobileImageUrl || curr.imageUrl}
          alt={curr.title || 'Banner'}
          className="block sm:hidden absolute inset-0 w-full h-full object-cover object-center "
        />

        {/* 40/60 overlay grid (desktop/tablet) */}
        {/* <div className="hidden sm:grid absolute inset-0 grid-cols-5"> */}
          {/* Left 40%: center the text box */}
          {/* <div className="col-span-2 flex items-center justify-center px-4">
            {(curr.title || curr.subtitle) && (
              <div className="max-w-[90%] text-left"> */}
        {/* Desktop overlay: position left/center/right */}
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
                {/* <Link to="/products">
                  <Button className="mt-5">Shop</Button> */}
                <Link to={dest}>
                  <Button className="mt-5">{btnText}</Button>                  
                </Link>
              {/* </div>
            )}
          </div> */}
          {/* Right 60%: intentionally empty to let the image show */}
          {/* <div className="col-span-3" />
        </div> */}
          </div>
        )}
      </div>
        {/* Mobile overlay: centered title, subtitle, and button */}
        <div className="sm:hidden absolute inset-0 flex items-center justify-center px-5 text-center">
          <div className="max-w-xs">
            {/* {curr.title && ( */}
            {(curr.mobileTitle || curr.title) && (
              <h2 className="text-[#8e3b7f] text-2xl font-extrabold leading-tight drop-shadow">
                {/* {curr.title} */}
                {curr.mobileTitle || curr.title}
              </h2>
            )}
            {/* {curr.subtitle && ( */}
             {(curr.mobileSubtitle || curr.subtitle) && (
              <p className="mt-3 text-[#d25c4d]/95 text-lg md:text-xl lg:text-2xl font-semibold drop-shadow">
                {/* {curr.subtitle} */}
                {curr.mobileSubtitle || curr.subtitle}
              </p>
            )}
            {/* <Link to="/products">
              <Button className="mt-4">Shop</Button> */}
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
