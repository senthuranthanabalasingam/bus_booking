"use client";

import type { Ad } from "@/lib/ads";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AdBanner({ ads, interval = 5000 }: { ads: Ad[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = ads.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [paused, count, interval]);

  if (!count) {
    return <section className="h-56 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 sm:h-72 lg:h-80" />;
  }

  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Advertisements"
      className="relative h-56 overflow-hidden bg-indigo-700 sm:h-72 lg:h-80"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {ads.map((ad, i) => {
        const image = (
          <Image src={ad.src} alt={ad.alt} fill sizes="100vw" preload={i === 0} className="object-cover" />
        );
        return (
          <div
            key={ad.src}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {ad.href ? (
              <Link href={ad.href} tabIndex={i === index ? 0 : -1} className="block h-full w-full">
                {image}
              </Link>
            ) : (
              image
            )}
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous ad"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/3 -translate-y-1/2 rounded-full bg-black/30 px-3 py-1.5 text-lg text-white hover:bg-black/50"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next ad"
            onClick={() => go(1)}
            className="absolute right-3 top-1/3 -translate-y-1/2 rounded-full bg-black/30 px-3 py-1.5 text-lg text-white hover:bg-black/50"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-20 flex justify-center gap-2">
            {ads.map((ad, i) => (
              <button
                key={ad.src}
                type="button"
                aria-label={`Show ad ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
