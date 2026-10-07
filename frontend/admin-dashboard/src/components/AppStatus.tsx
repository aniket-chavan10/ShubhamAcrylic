import { FC, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Download, RefreshCw, Share, SquarePlus, WifiOff, X } from "lucide-react";
import { Modal } from "./ui";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** "New version" and "offline" banners for the installed admin app */
export const AppStatus: FC = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed apps can stay open for days — look for a new version hourly
      if (registration) setInterval(() => { registration.update().catch(() => undefined); }, UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-safe">
      {!online && (
        <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
          You're offline. Changes can't be saved until you're back online.
        </div>
      )}
      {needRefresh && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl">
          <RefreshCw className="h-4 w-4 shrink-0 text-accent" />
          <span className="flex-1">A new version of the admin is available.</span>
          <button onClick={() => updateServiceWorker(true)} className="a-btn-accent px-3 py-1.5">Update</button>
          <button onClick={() => setNeedRefresh(false)} className="rounded-lg p-1 text-white/60 hover:text-white" aria-label="Later"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
};

/** "Install app" menu entry; on iPhone it explains Add to Home Screen */
export const InstallAppButton: FC<{ className?: string; onDone?: () => void }> = ({ className = "", onDone }) => {
  const { canInstall, iosHint, install } = useInstallPrompt();
  const [showIos, setShowIos] = useState(false);
  if (!canInstall && !iosHint) return null;

  return (
    <>
      <button
        onClick={async () => {
          if (canInstall) { await install(); onDone?.(); } else setShowIos(true);
        }}
        className={className}
      >
        <Download className="h-4 w-4" /> Install app
      </button>
      {showIos && (
        <Modal title="Install on iPhone / iPad" onClose={() => { setShowIos(false); onDone?.(); }}>
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper font-bold">1</span>
              <span>Open this page in <b>Safari</b>, then tap the <b>Share</b> button <Share className="inline h-4 w-4 align-text-bottom" /> at the bottom of the screen.</span></li>
            <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper font-bold">2</span>
              <span>Scroll and tap <b>Add to Home Screen</b> <SquarePlus className="inline h-4 w-4 align-text-bottom" />.</span></li>
            <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper font-bold">3</span>
              <span>Tap <b>Add</b>. The Astitva Admin icon appears on your home screen and opens full-screen like an app.</span></li>
          </ol>
        </Modal>
      )}
    </>
  );
};
