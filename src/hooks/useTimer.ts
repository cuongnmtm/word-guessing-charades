import { useState, useEffect } from 'react';

export const useTimer = (initialTime: number, isActive: boolean) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const isUnlimited = initialTime === 0;

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    // Don't start timer if unlimited time or not active
    if (!isActive || isUnlimited || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isUnlimited]);

  const reset = () => setTimeLeft(initialTime);

  return { timeLeft, reset, isUnlimited };
};
