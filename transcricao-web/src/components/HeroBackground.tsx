"use client";

import dynamic from "next/dynamic";

const WaveBackground = dynamic(() => import("@/components/WaveBackground"), {
  ssr: false,
});

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
});

export default function HeroBackground() {
  return (
    <>
      <WaveBackground />
      <HeroScene />
    </>
  );
}
