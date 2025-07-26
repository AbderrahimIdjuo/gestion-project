"use client";

import Image from "next/image";

export function EnteteDevis() {
  return (
    <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
      <Image src="/images/LOGO-tete.jpg" alt="Logo entreprise" width={400} height={100} />
      <Image src="/images/LOGO-OUDAOUD.jpg" alt="Logo secondaire" width={144} height={144} /> {/* h-36 = 144px */}
    </div>
  );
}

