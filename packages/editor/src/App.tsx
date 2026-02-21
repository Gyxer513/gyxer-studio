import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <Canvas />
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
