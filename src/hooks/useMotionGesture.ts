import { useEffect, useRef, useCallback } from 'react';

interface MotionGestureOptions {
  enabled?: boolean;
  flipDownThreshold?: number; // Gamma angle for flip down in landscape (default: 50)
  flipUpThreshold?: number;   // Gamma angle for flip up in landscape (default: -50)
  debounceMs?: number;        // Debounce time to prevent duplicate triggers
  returnThreshold?: number;   // How close to original position to re-trigger (default: 10)
  calibrate?: boolean;        // Whether to calibrate on first motion event (default: true)
}

type MotionGestureCallback = (gesture: 'flipDown' | 'flipUp') => void;

export const useMotionGesture = (
  onGesture: MotionGestureCallback,
  options: MotionGestureOptions = {},
  resetCalibration?: boolean
) => {
  const {
    enabled = true,
    flipDownThreshold = 50,    // Gesture triggers when gamma > 50 (phone flipped down more than 50°)
    flipUpThreshold = -50,     // Gesture triggers when gamma < -50 (phone flipped up more than 50°)
    debounceMs = 300,
    returnThreshold = 10,      // Threshold for returning to original position
    calibrate = true,          // Auto-calibrate on first motion event
  } = options;

  const lastGestureTime = useRef<number>(0);
  const lastGamma = useRef<number>(0);
  const currentGamma = useRef<number>(0); // Track current gamma for UI display
  const calibrationOffset = useRef<number>(0); // Offset to apply for calibration
  const isCalibrated = useRef<boolean>(!calibrate); // Track if we've calibrated
  const gestureStartGamma = useRef<number | null>(null); // Track original position when gesture starts
  const gestureMaxDistance = useRef<number>(0); // Track max distance reached during gesture
  const isListening = useRef<boolean>(false);
  const callbackRef = useRef<MotionGestureCallback>(onGesture);
  const enabledRef = useRef<boolean>(enabled);
  const flipDownThresholdRef = useRef<number>(flipDownThreshold);
  const flipUpThresholdRef = useRef<number>(flipUpThreshold);
  const debounceRef = useRef<number>(debounceMs);
  const returnThresholdRef = useRef<number>(returnThreshold);
  const pendingGestureRef = useRef<'flipDown' | 'flipUp' | null>(null); // Track pending gesture
  const pendingGestureTimeRef = useRef<number>(0); // Track when gesture was detected
  const minGestureIntervalRef = useRef<number>(800); // Minimum 800ms between gestures (normal game pace is 1+ second per answer)
  const lastCallbackTimeRef = useRef<number>(0); // Track when callback was last called to prevent duplicates

  // Keep refs up to date
  useEffect(() => {
    callbackRef.current = onGesture;
    enabledRef.current = enabled;
    flipDownThresholdRef.current = flipDownThreshold;
    flipUpThresholdRef.current = flipUpThreshold;
    debounceRef.current = debounceMs;
    returnThresholdRef.current = returnThreshold;
  }, [onGesture, enabled, flipDownThreshold, flipUpThreshold, debounceMs, returnThreshold]);

  // Reset calibration when requested (e.g., when game state changes to playing)
  useEffect(() => {
    if (resetCalibration) {
      console.log('Motion: Resetting calibration flag');
      isCalibrated.current = false;
    }
  }, [resetCalibration]);

  // Create stable handler reference - use refs so it's always consistent
  // Note: Game is locked to landscape mode
  // We use GAMMA axis (Y-axis): left/right tilt
  // We detect motion by looking at the magnitude of change in gamma
  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (!enabledRef.current) {
      return;
    }

    // Log all axes to understand device orientation
    console.log('Motion: Raw values - alpha:', event.alpha?.toFixed(1), 'beta:', event.beta?.toFixed(1), 'gamma:', event.gamma?.toFixed(1));

    let gamma = event.gamma ?? 0; // Y axis: -90 to 90 (left/right tilt in landscape)

    console.log('Motion: Current gamma (raw):', gamma.toFixed(1));

    // Calibrate on first motion event if enabled
    if (!isCalibrated.current) {
      calibrationOffset.current = -gamma; // Negative so we subtract it to get 0
      isCalibrated.current = true;
      console.log('Motion: Calibrated to gamma:', gamma, '-> offset:', calibrationOffset.current);
    }

    // Apply calibration offset
    gamma = gamma + calibrationOffset.current;

    // Normalize gamma to stay in -90 to 90 range
    // Handle wrapping at boundaries
    while (gamma > 90) {
      gamma = gamma - 180;
    }
    while (gamma < -90) {
      gamma = gamma + 180;
    }

    console.log('Motion: Normalized gamma:', gamma.toFixed(1));
    currentGamma.current = gamma; // Update current angle for UI display
    const now = Date.now();

    // If we have a pending gesture waiting for debounce time to elapse
    if (pendingGestureRef.current !== null) {
      const timeSincePending = now - pendingGestureTimeRef.current;

      // Track the maximum distance from the start position during the gesture
      if (gestureStartGamma.current !== null) {
        gestureMaxDistance.current = Math.max(
          gestureMaxDistance.current,
          Math.abs(gamma - gestureStartGamma.current)
        );
      }

      // Check if enough time has passed (debounce time)
      if (timeSincePending >= debounceRef.current) {
        // User has held the gesture for debounce time
        // Now check if phone has returned to the correct return range
        if (gestureStartGamma.current !== null) {
          let isInReturnRange = false;

          // For flip DOWN: must return to range close to 0
          if (pendingGestureRef.current === 'flipDown') {
            isInReturnRange = gamma >= -returnThresholdRef.current && gamma <= 0;
          }
          // For flip UP: must return to range close to 0
          else if (pendingGestureRef.current === 'flipUp') {
            isInReturnRange = gamma >= 0 && gamma <= returnThresholdRef.current;
          }

          // If returned to correct range after debounce time, trigger the gesture
          if (isInReturnRange) {
            // Check if enough time has passed since last gesture
            const timeSinceLastGesture = now - lastGestureTime.current;
            if (timeSinceLastGesture < minGestureIntervalRef.current) {
              console.log('Motion: Gesture ignored - too soon after last gesture', { timeSinceLastGesture });
              lastGamma.current = gamma;
              return;
            }

            // Double-check: ensure we haven't called the callback too recently (prevent duplicates)
            const timeSinceLastCallback = now - lastCallbackTimeRef.current;
            if (timeSinceLastCallback < 100) {
              console.log('Motion: Gesture ignored - callback called too recently', { timeSinceLastCallback });
              lastGamma.current = gamma;
              return;
            }

            console.log('Motion: Gesture confirmed after debounce', {
              gesture: pendingGestureRef.current,
              currentGamma: gamma,
              startGamma: gestureStartGamma.current,
              maxDistanceReached: gestureMaxDistance.current,
              debounceTime: timeSincePending,
              returnRange: pendingGestureRef.current === 'flipDown' ? '-5° to 0°' : '0° to 5°'
            });
            lastGestureTime.current = now;
            lastCallbackTimeRef.current = now;
            callbackRef.current(pendingGestureRef.current);
            pendingGestureRef.current = null;
            gestureStartGamma.current = null;
            gestureMaxDistance.current = 0; // Reset for next gesture
            lastGamma.current = gamma;
            return;
          }
        }
      }

      // Still waiting for return or debounce time
      lastGamma.current = gamma;
      return;
    }

    // No pending gesture - check for new gesture initiation
    const gammaDelta = gamma - lastGamma.current;

    // Flip DOWN: gamma decreases (becomes more negative)
    // User tilts phone to the left (negative direction)
    if (
      gammaDelta < 0 &&
      gamma < flipDownThresholdRef.current * -1 &&
      lastGamma.current >= flipDownThresholdRef.current * -1 &&
      gammaDelta < -8  // Require significant movement to initiate
    ) {
      console.log('Motion: Flip DOWN detected, waiting for debounce + return', {
        gamma,
        lastGamma: lastGamma.current,
        threshold: flipDownThresholdRef.current * -1,
        debounceMs: debounceRef.current,
        returnThreshold: returnThresholdRef.current
      });
      gestureStartGamma.current = gamma; // Record where gesture started
      gestureMaxDistance.current = 0; // Initialize max distance - will be tracked from start
      pendingGestureRef.current = 'flipDown';
      pendingGestureTimeRef.current = now;
      lastGamma.current = gamma;
      return;
    }

    // Flip UP: gamma increases and crosses positive threshold
    // User tilts phone to the right (positive direction)
    if (
      gammaDelta > 0 &&
      gamma > flipUpThresholdRef.current &&
      lastGamma.current <= flipUpThresholdRef.current &&
      gammaDelta > 8  // Require significant movement to initiate
    ) {
      console.log('Motion: Flip UP detected, waiting for debounce + return', {
        gamma,
        lastGamma: lastGamma.current,
        threshold: flipUpThresholdRef.current,
        debounceMs: debounceRef.current,
        returnThreshold: returnThresholdRef.current
      });
      gestureStartGamma.current = gamma; // Record where gesture started
      gestureMaxDistance.current = 0; // Initialize max distance - will be tracked from start
      pendingGestureRef.current = 'flipUp';
      pendingGestureTimeRef.current = now;
      lastGamma.current = gamma;
      return;
    }

    lastGamma.current = gamma;
  }, []);

  // Request permission for iOS 13+
  const requestPermission = useCallback(async () => {
    console.log('Motion: requestPermission called, isListening:', isListening.current);
    console.log('Motion: window.undefined?', typeof window === 'undefined');
    console.log('Motion: DeviceOrientationEvent in window?', 'DeviceOrientationEvent' in window);

    if (
      typeof window === 'undefined' ||
      !('DeviceOrientationEvent' in window)
    ) {
      console.log('Motion: DeviceOrientationEvent not supported');
      return;
    }

    console.log('Motion: Requesting permission');

    // Check if we need to request permission (iOS 13+)
    console.log('Motion: Checking if requestPermission function exists');
    console.log('Motion: typeof DeviceOrientationEvent?.requestPermission:', typeof (DeviceOrientationEvent as any)?.requestPermission);

    if (
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      try {
        console.log('Motion: iOS 13+ detected, requesting permission via requestPermission');
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        console.log('Motion: Permission result:', permission);

        if (permission === 'granted') {
          console.log('Motion: Permission granted, isListening before adding:', isListening.current);
          if (!isListening.current) {
            console.log('Motion: Adding event listener');
            window.addEventListener('deviceorientation', handleDeviceOrientation, true);
            isListening.current = true;
            console.log('Motion: Event listener added, isListening now:', isListening.current);
          } else {
            console.log('Motion: Event listener already added, skipping');
          }
        } else {
          console.log('Motion: Permission denied');
        }
      } catch (error) {
        console.warn('Motion: Permission request error:', error);
      }
    } else {
      // Non-iOS or older iOS - permission not needed
      console.log('Motion: Non-iOS device, adding event listener without permission');
      if (!isListening.current) {
        console.log('Motion: Adding event listener');
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        isListening.current = true;
        console.log('Motion: Event listener added, isListening now:', isListening.current);
      } else {
        console.log('Motion: Event listener already added, skipping');
      }
    }
  }, [handleDeviceOrientation]);

  useEffect(() => {
    console.log('Motion: Main effect triggered, enabled:', enabled, 'isListening:', isListening.current);

    if (!enabled) {
      console.log('Motion: Disabling motion gestures');
      // Clean up if disabled
      if (isListening.current) {
        console.log('Motion: Removing event listener');
        window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
        isListening.current = false;
        console.log('Motion: Event listener removed');
      }
      return;
    }

    console.log('Motion: Enabling motion gestures, isListening.current:', isListening.current);

    // Request permission and set up listener
    requestPermission();

    return () => {
      console.log('Motion: Cleanup - removing event listener, isListening:', isListening.current);
      if (isListening.current) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
        isListening.current = false;
        console.log('Motion: Event listener removed in cleanup');
      }
    };
  }, [enabled, requestPermission, handleDeviceOrientation]);

  return {
    isSupported: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window,
    isListening: isListening.current,
    requestPermission,
    currentGamma: currentGamma.current,
    flipDownThreshold,
    flipUpThreshold,
    returnThreshold,
  };
};
