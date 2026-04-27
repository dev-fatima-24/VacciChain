import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
  };

  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          aria-pressed={i18n.language === code}
          style={{
            padding: '0.25rem 0.6rem',
            background: i18n.language === code ? '#0ea5e9' : 'transparent',
            color: i18n.language === code ? '#fff' : '#94a3b8',
            border: '1px solid',
            borderColor: i18n.language === code ? '#0ea5e9' : '#334155',
            borderRadius: 6,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
