import { FC, useState } from "react";
import { FALLBACK_LOGO, useBrand } from "../hooks/useBrand";

/**
 * The company logo. Uses the logo uploaded in Site Settings, falls back to the
 * bundled logo, and only shows the company initial if both fail to load.
 */
const BrandLogo: FC<{ className?: string; src?: string }> = ({ className = "h-10 w-10 rounded-xl", src }) => {
  const brand = useBrand();
  const sources = [src ?? brand.logoUrl, FALLBACK_LOGO].filter(Boolean);
  const [failed, setFailed] = useState(0);
  const current = sources[failed];

  if (!current) {
    return (
      <span className={`grid shrink-0 place-items-center bg-accent font-display font-extrabold text-white ${className}`}>
        {brand.companyName.charAt(0)}
      </span>
    );
  }
  return (
    <img
      key={current}
      src={current}
      alt={brand.companyName}
      onError={() => setFailed(f => f + 1)}
      className={`shrink-0 bg-white object-contain ${className}`}
    />
  );
};

export default BrandLogo;
