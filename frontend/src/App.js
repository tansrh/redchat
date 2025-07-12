import './App.css';
import { useState } from 'react';
import ChatComponent from './components/ChatComponent';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  return (
    <>
      <ThemeToggle  theme={theme} setTheme={setTheme} />
      <ChatComponent theme={theme} />
    </>
  );
}

export default App;
