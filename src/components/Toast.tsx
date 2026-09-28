import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1e193b] border border-purple-500/50 text-white px-4 py-2.5 rounded-lg shadow-2xl shadow-purple-900/40 animate-fade-in backdrop-blur-md">
      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white">
        <Check size={13} strokeWidth={3} />
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
