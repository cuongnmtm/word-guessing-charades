import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';
import './CacheManager.css';

export const CacheManager = () => {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status for automatic cache clearing
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-clear cache when reconnecting after being offline
      const wasOffline = localStorage.getItem('was-offline');
      if (wasOffline) {
        console.log('Reconnected - clearing cache automatically');
        await clearCache();
        localStorage.removeItem('was-offline');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      localStorage.setItem('was-offline', 'true');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearCache = async () => {
    try {
      setIsClearing(true);
      haptic.light();

      // 1. Unregister service workers FIRST (this is crucial)
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

      // 3. Clear localStorage
      localStorage.clear();

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
        window.location.href = window.location.href + '?t=' + Date.now();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      haptic.error();
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="cache-manager">
      <button
        className="cache-clear-btn"
        onClick={clearCache}
        disabled={isClearing}
        title={t('clearCache') || 'Clear Cache'}
      >
        {isClearing ? '⏳' : '🗑️'} {t('clearCache') || 'Clear Cache'}
      </button>

      {showSuccess && (
        <div className="cache-success-toast">
          ✓ {t('cacheCleared') || 'Cache cleared! Reloading...'}
        </div>
      )}

      {!isOnline && (
        <div className="offline-indicator">
          📡 {t('offline') || 'Offline'}
        </div>
      )}
    </div>
  );
};
