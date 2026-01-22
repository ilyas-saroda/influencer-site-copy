import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const KeyboardShortcutsHelper = () => {
  const [isVisible, setIsVisible] = useState(false);

  const shortcuts = [
    { key: 'P', description: 'Mark selected as Processing' },
    { key: 'M', description: 'Mark selected as Paid' },
    { key: 'N', description: 'Add note to selected' },
    { key: 'E', description: 'Export current view' },
    { key: 'F', description: 'Focus search/filter' },
    { key: '/', description: 'Toggle keyboard shortcuts' },
    { key: 'Esc', description: 'Clear selection' }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.key === '/' && !e?.ctrlKey && !e?.metaKey) {
        e?.preventDefault();
        setIsVisible(!isVisible);
      }
      if (e?.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg-custom flex items-center justify-center hover:scale-105 transition-transform duration-200 z-[300]"
        aria-label="Show keyboard shortcuts"
      >
        <Icon name="Keyboard" size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-card border border-border rounded-lg shadow-lg-custom w-80 z-[300]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Keyboard" size={18} color="var(--color-primary)" />
          <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-md hover:bg-muted transition-colors duration-200"
          aria-label="Close shortcuts"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
      <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {shortcuts?.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">{shortcut?.description}</span>
            <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
              {shortcut?.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelper;