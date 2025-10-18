import { useTranslation } from 'react-i18next';
import { haptic } from '../utils/haptics';
import './LanguageSwitcher.css';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    haptic.light();
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button className="language-switcher" onClick={toggleLanguage}>
      🌐 {i18n.language === 'en' ? 'VI' : 'EN'}
    </button>
  );
};
