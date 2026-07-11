import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api';

export default function useExamSecurity(attemptId, onTerminate) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamRef = useRef(null);
  const snapshotTimerRef = useRef(null);
  const securityTriggered = useRef(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  const triggerTermination = useCallback(async (violationType, details) => {
    if (securityTriggered.current) return;
    securityTriggered.current = true;

    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

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

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [attemptId, triggerTermination]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      snapshotTimerRef.current = setInterval(async () => {
        if (securityTriggered.current) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, 320, 240);
          const imageData = canvas.toDataURL('image/jpeg', 0.7);

          await api.post('/exam/snapshot', {
            examAttemptId: attemptId,
            imageUrl: imageData,
          });
        } catch {
          // silent
        }
      }, 10000);

      stream.getVideoTracks()[0].onended = () => {
        setCameraActive(false);
      };
    } catch {
      setCameraActive(false);
    }
  }, [attemptId]);

  const stopCamera = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  return {
    cameraActive,
    isFullscreen,
    enterFullscreen,
    startCamera,
    stopCamera,
  };
}
