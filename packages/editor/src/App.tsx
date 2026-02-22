import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';
import { RightPanel } from './components/RightPanel';
import { Toolbar } from './components/Toolbar';
import { useThemeStore } from './store/theme-store';

export default function App() {
  const theme = useThemeStore((s) => s.theme);

  // Ensure theme class is applied on mount (handles SSR/initial load)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <Canvas />
          <RightPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
