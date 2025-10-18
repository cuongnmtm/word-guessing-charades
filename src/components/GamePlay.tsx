import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Category } from '../data/categories';
import { useTimer } from '../hooks/useTimer';
import { useMotionGesture } from '../hooks/useMotionGesture';
import { haptic } from '../utils/haptics';
import './GamePlay.css';

interface GamePlayProps {
  category: Category;
  gameDuration: number;
  maxWords?: number;
  onEndGame: () => void;
}

type GameState = 'countdown' | 'playing' | 'finished';

export const GamePlay = ({ category, gameDuration, maxWords, onEndGame }: GamePlayProps) => {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [lastAction, setLastAction] = useState<'correct' | 'skip' | null>(null);
  const [motionEnabled, setMotionEnabled] = useState(
    localStorage.getItem('motionGesturesEnabled') !== 'false'
  );
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  const { timeLeft, reset: resetTimer, isUnlimited } = useTimer(gameDuration, gameState === 'playing');

  // Motion gesture handler
  const handleMotionGesture = (gesture: 'flipDown' | 'flipUp') => {
    console.log('GamePlay: Motion gesture received:', gesture, 'gameState:', gameState, 'lastAction:', lastAction);
    if (gameState !== 'playing') {
      console.log('GamePlay: Ignoring gesture, gameState is not playing');
      return;
    }

    if (lastAction !== null) {
      console.log('GamePlay: Ignoring gesture, lastAction is not null:', lastAction);
      return;
    }

    if (gesture === 'flipDown') {
      console.log('GamePlay: Handling flip down (correct)');
      handleCorrect();
    } else if (gesture === 'flipUp') {
      console.log('GamePlay: Handling flip up (skip)');
      handleSkip();
    }
  };

  const motionGestureInfo = useMotionGesture(
    handleMotionGesture,
    {
      enabled: motionEnabled && gameState === 'playing',
      flipDownThreshold: 40,   // Gesture triggers when gamma < -40 (phone tilted left)
      flipUpThreshold: 40,     // Gesture triggers when gamma > 40 (phone tilted right)
      debounceMs: 300,         // Faster response time for better feel
      returnThreshold: 10,     // Must return within 10° of original position
      calibrate: true,         // Auto-calibrate at start so whatever position is 0°
    },
    gameState === 'playing'    // Reset calibration when entering playing state
  );

  // Monitor orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Shuffle words on mount
  useEffect(() => {
    const shuffled = [...category.words].sort(() => Math.random() - 0.5);
    const limitedWords = maxWords ? shuffled.slice(0, maxWords) : shuffled;
    setShuffledWords(limitedWords);
  }, [category, maxWords]);

  // Request motion permission and lock to landscape on countdown start
  useEffect(() => {
    console.log('GamePlay: Permission effect triggered, gameState:', gameState, 'motionEnabled:', motionEnabled);
    if (gameState === 'countdown' && motionEnabled) {
      // Lock orientation to landscape
      const lockOrientation = async () => {
        try {
          const screenOrientation = (screen?.orientation as any);
          if (screenOrientation?.lock) {
            await screenOrientation.lock('landscape');
            console.log('GamePlay: Screen orientation locked to landscape');
          }
        } catch (error) {
          console.warn('GamePlay: Screen orientation lock failed:', error);
        }
      };

      // Request motion permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        console.log('GamePlay: Requesting motion permission on countdown start');
        const requestPermissionAsync = async () => {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            console.log('GamePlay: Motion permission result:', permission);
            if (permission === 'granted') {
              console.log('GamePlay: Permission granted, saving to localStorage');
              localStorage.setItem('motionGesturesEnabled', 'true');
            }
          } catch (error) {
            console.warn('GamePlay: Motion permission request failed:', error);
          }
        };

        requestPermissionAsync();
      }

      lockOrientation();
    }
  }, [gameState, motionEnabled]);

  // Handle countdown
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      haptic.light(); // Haptic on each countdown tick
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      haptic.heavy(); // Strong haptic when game starts
      setGameState('playing');
    }
  }, [countdown, gameState]);

  // Handle game timer end
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing' && !isUnlimited) {
      haptic.warning(); // Warning haptic when time is up
      setGameState('finished');
    } else if (timeLeft <= 10 && timeLeft > 0 && gameState === 'playing' && !isUnlimited) {
      haptic.light(); // Light haptic for last 10 seconds countdown
    }
  }, [timeLeft, gameState, isUnlimited]);

  // Lock scrolling during gameplay and unlock orientation on game end
  useEffect(() => {
    if (gameState === 'playing') {
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else if (gameState === 'finished') {
      // Restore scrolling and unlock orientation
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';

      // Unlock orientation
      const unlockOrientation = async () => {
        try {
          const screenOrientation = (screen?.orientation as any);
          if (screenOrientation?.unlock) {
            await screenOrientation.unlock();
            console.log('GamePlay: Screen orientation unlocked');
          }
        } catch (error) {
          console.warn('GamePlay: Screen orientation unlock failed:', error);
        }
      };

      unlockOrientation();
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [gameState]);

  const handleCorrect = () => {
    if (gameState !== 'playing' || lastAction !== null) {
      console.log('GamePlay: handleCorrect blocked - gameState:', gameState, 'lastAction:', lastAction);
      return;
    }

    console.log('GamePlay: handleCorrect executed');
    haptic.success(); // Success haptic for correct answer
    setLastAction('correct');
    setCorrectCount(prev => prev + 1);
    nextWord();
  };

  const handleSkip = () => {
    if (gameState !== 'playing' || lastAction !== null) {
      console.log('GamePlay: handleSkip blocked - gameState:', gameState, 'lastAction:', lastAction);
      return;
    }

    console.log('GamePlay: handleSkip executed');
    haptic.light(); // Light haptic for skip
    setLastAction('skip');
    setSkipCount(prev => prev + 1);
    nextWord();
  };

  const handleTimerClick = () => {
    handleCorrect();
  };

  const nextWord = () => {
    setTimeout(() => {
      setLastAction(null);
      setCurrentWordIndex(prev => {
        const next = prev + 1;
        if (next >= shuffledWords.length) {
          setGameState('finished');
          return prev;
        }
        return next;
      });
    }, 1000);  // Increased from 500ms to 1000ms to show feedback/answer for longer
  };

  const handleStop = () => {
    haptic.medium(); // Medium haptic for stopping
    setGameState('finished');
  };

  const handleRestart = () => {
    haptic.medium(); // Medium haptic for restart
    setGameState('countdown');
    setCountdown(3);
    setCurrentWordIndex(0);
    setCorrectCount(0);
    setSkipCount(0);
    setLastAction(null);
    resetTimer();
    const shuffled = [...category.words].sort(() => Math.random() - 0.5);
    const limitedWords = maxWords ? shuffled.slice(0, maxWords) : shuffled;
    setShuffledWords(limitedWords);
  };

  if (gameState === 'countdown') {
    // Show portrait warning if not in landscape
    if (!isLandscape) {
      return (
        <div className="game-play portrait-warning-screen">
          <div className="portrait-warning-content">
            <h2 className="warning-title">📱 {t('warning.rotateDevice')}</h2>
            <p className="warning-message">
              {t('warning.landscapeRequired')}
            </p>
            <div className="warning-icon" style={{ fontSize: '4rem', margin: '2rem 0' }}>
              🔄
            </div>
            <button className="btn btn-primary" onClick={onEndGame}>
              {t('warning.backToMenu')}
            </button>
          </div>
        </div>
      );
    }

    const handleRequestMotionPermission = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setMotionEnabled(true);
            localStorage.setItem('motionGesturesEnabled', 'true');
          }
        } catch (error) {
          console.warn('Motion permission denied:', error);
        }
      }
    };

    return (
      <div className="game-play countdown-screen">
        <div className="countdown-content">
          <h2 className="countdown-title">{category.emoji} {category.name}</h2>
          <div className="countdown-number">{countdown || t('countdown.go')}</div>

          <p className="countdown-instruction">
            {t('countdown.instruction')}
          </p>

          {motionEnabled && typeof (DeviceOrientationEvent as any)?.requestPermission === 'function' && localStorage.getItem('motionGesturesEnabled') !== 'true' && (
            <button className="motion-permission-btn" onClick={handleRequestMotionPermission}>
              {t('countdown.enableMotion')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const totalWords = correctCount + skipCount;
    const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;
    const wasCompleted = currentWordIndex >= shuffledWords.length;

    return (
      <div className="game-play finished-screen">
        <div className="results">
          <h2 className="results-title">
            {wasCompleted ? t('results.allComplete') : t('results.gameOver')}
          </h2>
          {maxWords && (
            <p className="game-info">
              {t('results.playedWords', { count: totalWords, total: category.words.length })}
            </p>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{correctCount}</div>
              <div className="stat-label">{t('results.correct')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{skipCount}</div>
              <div className="stat-label">{t('results.skipped')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">{t('results.accuracy')}</div>
            </div>
          </div>

          <div className="results-buttons">
            <button className="btn btn-primary" onClick={handleRestart}>
              {t('results.playAgain')}
            </button>
            <button className="btn btn-secondary" onClick={onEndGame}>
              {t('results.mainMenu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-play playing-screen">
      {/* Split screen tap areas */}
      <div className="tap-area tap-area-correct" onClick={handleCorrect}>
        <div className="tap-label">✅ {t('gameplay.correct')}</div>
        <div className="tap-score">{correctCount}</div>
      </div>
      <div className="tap-area tap-area-skip" onClick={handleSkip}>
        <div className="tap-label">⏭️ {t('gameplay.skip')}</div>
        <div className="tap-score">{skipCount}</div>
      </div>

      {/* Game header */}
      <div className="game-header">
        <div className="timer" onClick={handleTimerClick} style={{ cursor: 'pointer' }}>
          ⏱️ {isUnlimited ? '∞' : `${timeLeft}s`}
        </div>
        <button className="stop-btn" onClick={handleStop}>
          ❌ {t('gameplay.stop')}
        </button>
      </div>

      {/* Word display */}
      <div className="word-display">
        <div className="word">
          {shuffledWords[currentWordIndex]}
        </div>
        <div className="word-counter">
          {currentWordIndex + 1} / {shuffledWords.length}
        </div>
      </div>

      {/* Action feedback */}
      {lastAction && (
        <div className={`action-feedback ${lastAction}`}>
          {lastAction === 'correct' ? t('gameplay.feedbackCorrect') : t('gameplay.feedbackSkipped')}
        </div>
      )}

      {/* Angle display for motion feedback */}
      {motionEnabled && motionGestureInfo && (
        <div className="angle-display">
          <div className="angle-value">
            Angle: {motionGestureInfo.currentGamma?.toFixed(1)}°
          </div>
          <div className="angle-thresholds">
            ✅ Tilt LEFT &lt;-40° | ❌ Tilt RIGHT &gt;40°
            <br />
            ✅ Return: -10~0° | ❌ Return: 0-10°
          </div>
        </div>
      )}
    </div>
  );
};
