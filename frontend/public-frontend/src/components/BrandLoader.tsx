import { useSiteSettings } from '../context/SiteSettingsContext';

const BrandLoader = () => {
  const { settings, getLogoUrl } = useSiteSettings();
  const companyName = settings?.companyName || 'Astitva Creations';
  const logoUrl = getLogoUrl();

  // Brand Colors
  const colors = {
    blue: '#1C71B9',
    orange: 'rgb(214, 136, 53)',
    magenta: '#A02367',
    teal: '#238C7F',
    handleGray: '#D1D5DB'
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50">
      <div 
        role="status" 
        aria-label={`Loading ${companyName}`} 
        className="relative flex flex-col items-center justify-center p-12 backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${companyName} Logo`}
            className="h-24 w-24 object-contain rounded-xl shadow-md animate-pulse"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="relative z-10 h-24 w-24 md:h-28 md:w-28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="logoClip">
                <rect x="0" y="0" width="200" height="200" />
              </clipPath>
              <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            <g className="animate-converge-tl">
              <path
                d="M 10 10 H 90 V 38 H 70 V 25 H 35 V 75 H 70 V 62 H 90 V 90 H 10 Z"
                fill={colors.blue}
              />
              <circle cx="47.5" cy="50" r="7" fill={colors.blue} />
            </g>

            <g className="animate-converge-tr">
              <rect x="105" y="10" width="40" height="80" fill={colors.orange} />
              <rect x="150" y="10" width="40" height="80" fill={colors.orange} />
              <rect x="138" y="45" width="2" height="15" fill={colors.handleGray} />
              <rect x="155" y="45" width="2" height="15" fill={colors.handleGray} />
            </g>

            <g className="animate-converge-br">
              <rect x="105" y="105" width="25" height="80" fill={colors.teal} />
              <rect x="130" y="105" width="60" height="18" fill={colors.teal} />
              <rect x="130" y="138" width="60" height="18" fill={colors.teal} />
              <rect x="150" y="130" width="15" height="4" fill={colors.teal} />
              <rect x="150" y="168" width="15" height="4" fill={colors.teal} />
            </g>

            <g className="animate-converge-bl">
              <circle cx="30" cy="125" r="18" fill={colors.magenta} />
              <circle cx="75" cy="125" r="18" fill={colors.magenta} />
              <circle cx="30" cy="170" r="18" fill={colors.magenta} />
              <circle cx="75" cy="170" r="18" fill={colors.magenta} />
            </g>

            <rect 
              x="0" y="-100%" width="200" height="50" 
              fill="url(#scanGradient)"
              className="animate-scan"
              style={{ mixBlendMode: 'overlay' }} 
            />
          </svg>
        )}
        <h2 className="text-xl font-extrabold text-gray-800 mt-6 tracking-wide uppercase">{companyName}</h2>
      </div>

      <style>{`
        @keyframes converge-tl {
          0%, 100% { transform: translate(-40px, -40px); opacity: 0; }
          20%, 80% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes converge-tr {
           0%, 100% { transform: translate(40px, -40px); opacity: 0; }
           20%, 80% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes converge-br {
           0%, 100% { transform: translate(40px, 40px); opacity: 0; }
           20%, 80% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes converge-bl {
           0%, 100% { transform: translate(-40px, 40px); opacity: 0; }
           20%, 80% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes scan-vertical {
           0%, 25% { transform: translateY(0); opacity: 0; }
           26% { opacity: 1; }
           75% { transform: translateY(300px); opacity: 1; }
           76%, 100% { opacity: 0; }
        }
        .animate-converge-tl { animation: converge-tl 3s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .animate-converge-tr { animation: converge-tr 3s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .animate-converge-br { animation: converge-br 3s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .animate-converge-bl { animation: converge-bl 3s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .animate-scan { animation: scan-vertical 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default BrandLoader;