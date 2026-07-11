import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api';

const VIOLATION_THRESHOLD = 5;
const SNAPSHOT_INTERVAL = 10000;

export default function useExamSecurity(attemptId, onTerminate) {
  const [violations, setViolations] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [warning, setWarning] = useState('');
  const violationCountRef = useRef(0);
  const streamRef = useRef(null);
  const snapshotTimerRef = useRef(null);

  const logViolation = useCallback(async (type, details = '') => {
    try {
      await api.post('/security/log-violation', {
        examAttemptId: attemptId,
        violationType: type,
        details,
      });
      violationCountRef.current += 1;
      setViolations(violationCountRef.current);

      if (violationCountRef.current >= VIOLATION_THRESHOLD) {
        setWarning('Too many violations. Your exam will be terminated.');
        try {
          await api.post(`/security/terminate/${attemptId}`, {
            reason: 'multiple_violations',
          });
          if (onTerminate) onTerminate('multiple_violations');
        } catch {
          // termination failed
        }
      } else {
        setWarning(`Warning: ${type.replace(/_/g, ' ')} detected. (${violationCountRef.current}/${VIOLATION_THRESHOLD})`);
        setTimeout(() => setWarning(''), 3000);
      }
    } catch {
      // silent fail for logging
    }
  }, [attemptId, onTerminate]);

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
        logViolation('tab_switch', 'Tab became hidden');
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement;
      if (!isFullscreen) {
        logViolation('fullscreen_exit', 'Exited fullscreen mode');
        setTimeout(requestFullscreen, 1000);
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      logViolation('copy_attempt', 'Copy action blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logViolation('paste_attempt', 'Paste action blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('right_click', 'Right-click blocked');
    };

    const handleKeyDown = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === 'F12' ||
        e.key === 'F5' ||
        (e.key >= 'F1' && e.key <= 'F12')
      ) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
          e.preventDefault();
          logViolation('refresh_attempt', 'Page refresh blocked');
          return;
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'))) {
          return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) {
          e.preventDefault();
          logViolation('keyboard_shortcut', `Shortcut blocked: ${e.key}`);
        }
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const pushState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', pushState);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    requestFullscreen();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', pushState);
    };
  }, [attemptId, logViolation, requestFullscreen]);

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
          logViolation('camera_disconnect', 'Failed to capture snapshot');
        }
      }, SNAPSHOT_INTERVAL);

      stream.getVideoTracks()[0].onended = () => {
        setCameraActive(false);
        logViolation('camera_disconnect', 'Camera stream ended');
      };
    } catch {
      setCameraActive(false);
      logViolation('camera_disconnect', 'Camera access denied or failed');
    }
  }, [attemptId, logViolation]);

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

  const terminateExam = useCallback(async (reason = 'manual_termination') => {
    try {
      await api.post(`/security/terminate/${attemptId}`, { reason });
      if (onTerminate) onTerminate(reason);
    } catch {
      // termination failed
    }
  }, [attemptId, onTerminate]);

  return {
    violations,
    cameraActive,
    warning,
    enterFullscreen,
    startCamera,
    stopCamera,
    terminateExam,
  };
}
