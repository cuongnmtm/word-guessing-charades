/**
 * Haptic feedback utility for mobile devices
 * Works on iOS (PWA mode, iOS 13+) and Android (Chrome/Firefox)
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/**
 * Check if the Vibration API is supported
 */
const isHapticSupported = (): boolean => {
  // Check for navigator.vibrate in various forms
  const nav = navigator as any;
  return 'vibrate' in navigator || 'webkitVibrate' in nav || 'mozVibrate' in nav || 'msVibrate' in nav;
};

/**
 * Get the vibrate function from navigator
 */
const getVibrateFunction = (): ((pattern: number | number[]) => boolean) | null => {
  const nav = navigator as any;
  return nav.vibrate || nav.webkitVibrate || nav.mozVibrate || nav.msVibrate || null;
};

/**
 * Haptic patterns (in milliseconds)
 * Format: [vibrate, pause, vibrate, pause, ...]
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,           // Quick tap
  medium: 20,          // Normal tap
  heavy: 40,           // Strong feedback
  success: [20, 30, 40], // Success pattern
  error: [30, 20, 30, 20, 30], // Error pattern (double buzz)
  warning: [50, 50, 50], // Warning pattern
};

/**
 * Trigger haptic feedback with the specified pattern
 * @param pattern - The haptic pattern to use
 * @returns boolean - Whether the haptic was triggered successfully
 */
export const triggerHaptic = (pattern: HapticPattern = 'light'): boolean => {
  if (!isHapticSupported()) {
    console.log('Haptic: Not supported on this device');
    return false;
  }

  try {
    const vibrate = getVibrateFunction();
    if (!vibrate) {
      console.log('Haptic: No vibrate function found');
      return false;
    }

    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    console.log('Haptic: Triggering', pattern, 'with pattern:', vibrationPattern);

    // Call with proper context binding
    vibrate.call(navigator, vibrationPattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
};

/**
 * Cancel any ongoing haptic feedback
 */
export const cancelHaptic = (): void => {
  if (isHapticSupported()) {
    try {
      const vibrate = getVibrateFunction();
      if (vibrate) {
        vibrate.call(navigator, 0);
      }
    } catch (error) {
      console.warn('Cancel haptic failed:', error);
    }
  }
};

/**
 * Haptic feedback utility object for easier usage
 */
export const haptic = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
  cancel: cancelHaptic,
  isSupported: isHapticSupported,
};

export default haptic;
