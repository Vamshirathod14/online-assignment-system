import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api';

export default function useExamSecurity(attemptId, onTerminate) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const securityTriggered = useRef(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  const triggerTermination = useCallback(async (violationType, details) => {
    if (securityTriggered.current) return;
    securityTriggered.current = true;

    try {
      await api.post(`/security/terminate/${attemptId}`, {
        reason: 'Tab Switching Detected',
        violationType,
        violationDetails: details,
      });
    } catch {
      // best-effort
    }

    if (onTerminateRef.current) onTerminateRef.current('Tab Switching Detected');
  }, [attemptId]);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  }, []);

  const enterFullscreen = useCallback(() => {
    requestFullscreen();
  }, [requestFullscreen]);

  useEffect(() => {
    if (!attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTermination('tab_switch', 'Tab became hidden');
      }
    };

    const handleWindowBlur = () => {
      triggerTermination('window_blur', 'Window lost focus');
    };

    const handlePageHide = () => {
      triggerTermination('page_hide', 'Page hidden or unloaded');
    };

    const handleFullscreenChange = () => {
      const fs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement;
      setIsFullscreen(!!fs);
      if (!fs && !securityTriggered.current) {
        triggerTermination('fullscreen_exit', 'Exited fullscreen mode');
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      triggerTermination('beforeunload', 'Page refresh or close attempted');
    };

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      triggerTermination('popstate', 'Back button navigation detected');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      console.log('[Security] Copy attempt blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      console.log('[Security] Paste attempt blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      console.log('[Security] Right-click blocked');
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        console.log('[Security] Refresh blocked');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        console.log('[Security] F5 refresh blocked');
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [attemptId, triggerTermination]);

  return {
    isFullscreen,
    enterFullscreen,
  };
}
