import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Portal component for rendering modals at the root level
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Check if we're on the client side before rendering the portal
  if (!mounted || typeof window === 'undefined') return null;

  // Get the portal root or create it if it doesn't exist
  let portalRoot = document.getElementById('portal-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  }

  return createPortal(children, portalRoot);
};

export default Portal; 