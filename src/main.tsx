import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { applyTheme, getStoredTheme } from '@/lib/theme';
import { toast } from 'sonner';

// Apply theme early to prevent flash
applyTheme(getStoredTheme());

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Remove the no-FOUC guard after initial paint
// Give the browser a tick to apply styles, then reveal
requestAnimationFrame(() => {
  const html = document.documentElement;
  if (html.hasAttribute("data-fouc")) {
    html.removeAttribute("data-fouc");
  }
});

// Register service worker for PWA with update notifications
const triggerUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast.message('Update available', {
      description: 'A new version is ready. Reload to update.',
      action: {
        label: 'Refresh',
        onClick: () => triggerUpdate(true),
      },
    });
  },
  onOfflineReady() {
    toast.success('App ready to work offline');
  },
});
