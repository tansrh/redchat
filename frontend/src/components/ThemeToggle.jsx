import React, { useEffect, useState } from 'react';

function ThemeToggle({theme, setTheme}) {
  

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #888',
        background: theme === 'dark' ? '#222' : '#fff',
        color: theme === 'dark' ? '#fff' : '#222',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
      aria-label="Toggle dark/light theme"
    >
      {theme === 'dark' ?  '☀️ Light' : '🌙 Dark'}
    </button>
  );
}

export default ThemeToggle;
