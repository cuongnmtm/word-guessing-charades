import { useEffect, useState } from 'react';
import { haptic } from '../utils/haptics';
import './PWAInstaller.css';

export const PWAInstaller = () => {
  const [showInstaller, setShowInstaller] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already installed
    const isInstalled = localStorage.getItem('pwa-installed');
    if (isInstalled) {
      setInstalled(true);
      setTimeout(() => setInstalled(false), 3000);
      return;
    }

    // Check if user previously dismissed the installer
    const isDismissed = localStorage.getItem('pwa-dismissed');
    if (isDismissed) {
      return;
    }

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Check if SW is already active and has cached content
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.active) {
          // Service worker exists, check if assets are cached
          caches.keys().then((cacheNames) => {
            const hasCaches = cacheNames.length > 0;

            if (hasCaches) {
              // Already cached, show success immediately
              setInstalled(true);
              localStorage.setItem('pwa-installed', 'true');
              setTimeout(() => setInstalled(false), 4000);
            } else {
              // SW active but no cache yet, start installation
              handleInstallNow();
            }
          });
        } else {
          // Wait for SW to become ready
          navigator.serviceWorker.ready.then((reg) => {
            if (reg.active) {
              handleInstallNow();
            }
          });
        }
      });
    } else {
      // No service worker support, show warning
      setShowInstaller(true);
    }
  }, []);

  const handleInstallNow = () => {
    haptic.medium();
    setShowInstaller(false);
    setInstalling(true);

    // Simulate caching progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setInstalling(false);
          setInstalled(true);
          localStorage.setItem('pwa-installed', 'true');

          // Auto-hide success message after 4 seconds
          setTimeout(() => {
            setInstalled(false);
          }, 4000);
        }, 500);
      }
    }, 300);
  };

  const handleDismiss = () => {
    haptic.light();
    setShowInstaller(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (installed) {
    // return (
    //   <div className="pwa-installer success">
    //     <div className="installer-content">
    //       <span className="installer-icon">✅</span>
    //       <div className="installer-text">
    //         <strong>Ready for offline use!</strong>
    //         <p>App is cached and works without internet</p>
    //       </div>
    //     </div>
    //   </div>
    // );
  }

  if (installing) {
    return (
      <div className="pwa-installer installing">
        <div className="installer-content">
          <div className="installer-text">
            <strong>Installing for offline use...</strong>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}% - Caching game data</p>
          </div>
        </div>
      </div>
    );
  }

  if (showInstaller) {
    const noServiceWorker = !('serviceWorker' in navigator);

    return (
      <div className={`pwa-installer ${noServiceWorker ? 'warning' : ''}`}>
        <div className="installer-content">
          <span className="installer-icon">{noServiceWorker ? '⚠️' : '📱'}</span>
          <div className="installer-text">
            <strong>
              {noServiceWorker ? 'Offline mode not available' : 'Install for offline play?'}
            </strong>
            <p>
              {noServiceWorker
                ? 'Your browser does not support offline mode'
                : 'Cache the app to play without internet'}
            </p>
          </div>
          {!noServiceWorker && (
            <div className="installer-actions">
              <button className="btn-install" onClick={handleInstallNow}>
                Install Now
              </button>
              <button className="btn-dismiss" onClick={handleDismiss}>
                Maybe Later
              </button>
            </div>
          )}
          {noServiceWorker && (
            <button className="btn-dismiss" onClick={handleDismiss}>
              OK
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
