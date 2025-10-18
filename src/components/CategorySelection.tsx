import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categories, Category } from '../data/categories';
import { haptic } from '../utils/haptics';
import './CategorySelection.css';

interface CategorySelectionProps {
  onSelectCategory: (category: Category, gameDuration: number, maxWords?: number) => void;
}

export const CategorySelection = ({ onSelectCategory }: CategorySelectionProps) => {
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedMaxWords, setSelectedMaxWords] = useState<number | null>(15);

  const durations = [30, 60, 90, 120, 0]; // 0 represents unlimited time
  const maxWordsOptions = [10, 15, 20, 25, 30];

  return (
    <div className="category-selection">
      <div className="header">
        <h1 className="title">{t('app.title')}</h1>
      </div>

      {/* Timer Selection */}
      <div className="timer-selection">
        <label className="timer-label">{t('settings.gameDuration')}</label>
        <div className="duration-buttons">
          {durations.map(duration => (
            <button
              key={duration}
              className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
              onClick={() => {
                haptic.light();
                setSelectedDuration(duration);
              }}
            >
              {duration === 0 ? t('settings.unlimited') : `${duration}${t('settings.seconds')}`}
            </button>
          ))}
        </div>
      </div>

      {/* Max Words Selection */}
      <div className="timer-selection">
        <label className="timer-label">{t('settings.maxWords')}</label>
        <div className="duration-buttons">
          {maxWordsOptions.map(maxWords => (
            <button
              key={maxWords}
              className={`duration-btn ${selectedMaxWords === maxWords ? 'active' : ''}`}
              onClick={() => {
                haptic.light();
                setSelectedMaxWords(maxWords);
              }}
            >
              {maxWords}
            </button>
          ))}
          <button
            className={`duration-btn ${selectedMaxWords === null ? 'active' : ''}`}
            onClick={() => {
              haptic.light();
              setSelectedMaxWords(null);
            }}
          >
            {t('settings.all')}
          </button>
        </div>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-card"
            onClick={() => {
              haptic.medium();
              onSelectCategory(category, selectedDuration, selectedMaxWords || undefined);
            }}
          >
            <span className="category-emoji">{category.emoji}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">{category.words.length} {t('settings.words')}</span>
          </button>
        ))}
      </div>

      <div className="footer">
        <p className="instruction">{t('settings.rotateDevice')}</p>
      </div>
    </div>
  );
};
