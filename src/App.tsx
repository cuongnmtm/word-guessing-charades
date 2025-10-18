import { useState } from 'react';
import { CategorySelection } from './components/CategorySelection';
import { GamePlay } from './components/GamePlay';
import { PWAInstaller } from './components/PWAInstaller';
import { SettingsMenu } from './components/SettingsMenu';
import { Category } from './data/categories';
import './App.css';

type AppState = 'menu' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(60);
  const [maxWords, setMaxWords] = useState<number | undefined>(undefined);

  const handleSelectCategory = (category: Category, duration: number, maxWordsLimit?: number) => {
    setSelectedCategory(category);
    setGameDuration(duration);
    setMaxWords(maxWordsLimit);
    setAppState('playing');
  };

  const handleEndGame = () => {
    setAppState('menu');
    setSelectedCategory(null);
    setMaxWords(undefined);
  };

  return (
    <div className="app">
      <PWAInstaller />
      <SettingsMenu />

      {appState === 'menu' && (
        <CategorySelection onSelectCategory={handleSelectCategory} />
      )}

      {appState === 'playing' && selectedCategory && (
        <GamePlay category={selectedCategory} gameDuration={gameDuration} maxWords={maxWords} onEndGame={handleEndGame} />
      )}
    </div>
  );
}

export default App;
