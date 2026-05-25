import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full">
      <div className="max-w-[1200px] mx-auto px-8 py-6 flex items-center">
        <div className="flex items-center gap-3">
        <div className="flex-center w-8 h-8 rounded-md bg-meevo-purple text-meevo-text-primary font-logo text-xl select-none">
          M
        </div>
        <span className="font-sans font-medium text-meevo-text-primary text-xl tracking-wide select-none">
          Meevo
        </span>
      </div>
      </div>
    </header>
  );
};
