import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';
import './SettingsMenu.css';

export const SettingsMenu = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [motionEnabled, setMotionEnabled] = useState(
    localStorage.getItem('motionGesturesEnabled') !== 'false'
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleLanguage = () => {
    haptic.light();
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleMotionGestures = () => {
    haptic.light();
    const newState = !motionEnabled;
    setMotionEnabled(newState);
    localStorage.setItem('motionGesturesEnabled', String(newState));
  };

  const clearCache = async () => {
    try {
      setIsClearing(true);
      haptic.light();

      // 1. Unregister service workers FIRST
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      // 3. Clear localStorage (except language preference)
      const language = localStorage.getItem('language');
      localStorage.clear();
      if (language) {
        localStorage.setItem('language', language);
      }

      // 4. Clear sessionStorage
      sessionStorage.clear();

      // 5. Clear IndexedDB
      if (window.indexedDB) {
        const databases = await indexedDB.databases?.() || [];
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }

      setShowSuccess(true);
      haptic.success();

      // 6. Do a hard refresh with cache busting
      setTimeout(() => {
        // Use cache-control headers to force fresh fetch
        window.location.href = window.location.href + '?t=' + Date.now();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      haptic.error();
      alert(t('cache.clearError') || 'Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="settings-menu-container" ref={menuRef}>
      <button
        className="settings-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t('settings.title') || 'Settings'}
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="settings-menu-dropdown">
          <div className="settings-menu-header">
            {t('settings.title') || 'Settings'}
          </div>

          <div className="settings-menu-item">
            <label>{t('settings.language') || 'Language'}:</label>
            <button
              className="settings-menu-option-btn"
              onClick={toggleLanguage}
            >
              🌐 {i18n.language === 'en' ? 'English (EN)' : 'Tiếng Việt (VI)'}
            </button>
          </div>

          {typeof (DeviceOrientationEvent as any)?.requestPermission === 'function' || 'DeviceOrientationEvent' in window ? (
            <div className="settings-menu-item">
              <label>{t('settings.motionGestures') || 'Motion Gestures'}:</label>
              <button
                className={`settings-menu-option-btn ${motionEnabled ? 'enabled' : 'disabled'}`}
                onClick={toggleMotionGestures}
              >
                {motionEnabled ? '✅' : '❌'} {motionEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ) : null}

          <div className="settings-menu-item">
            <label>{t('settings.cache') || 'Cache'}:</label>
            <button
              className="settings-menu-option-btn clear-cache-btn"
              onClick={clearCache}
              disabled={isClearing}
            >
              {isClearing ? '⏳' : '🗑️'} {t('cache.clearCache') || 'Clear Cache'}
            </button>
          </div>

          {!isOnline && (
            <div className="settings-menu-item offline-warning">
              📡 {t('cache.offline') || 'Offline Mode'}
            </div>
          )}

          <div className="settings-menu-footer">
            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '0.5rem' }}>
              v{__APP_VERSION__}
            </div>
            {t('settings.tapToClose') || 'Tap outside to close'}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="settings-success-toast">
          ✓ {t('cache.cacheCleared') || 'Cache cleared! Reloading...'}
        </div>
      )}
    </div>
  );
};
