import React from 'react';

interface IshtarLogoProps {
  className?: string;
  collapsed?: boolean;
  sealImageUrl?: string;
}

export const IshtarLogo: React.FC<IshtarLogoProps> = ({
  className = "w-44",
  collapsed = false,
  sealImageUrl = "/ishtar-seal.png"
}) => {
  if (collapsed) {
    return (
      <div className="relative flex items-center justify-center p-1 select-none mx-auto w-10 h-10">
        <img
          src={sealImageUrl}
          alt="Ishtar Command Seal"
          className="w-full h-full object-contain drop-shadow-sm opacity-90"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center p-1 select-none mx-auto transition-all duration-200 ${className}`}>
      {/* Lệnh chú chìm phía sau */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">
        <img
          src={sealImageUrl}
          alt="Ishtar Command Seal"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Cụm Avatar + Text */}
      <div className="relative z-10 flex items-center gap-2.5 w-full px-2 py-3">
        <div className="w-10 h-10 rounded-full border-2 border-amber-400/80 overflow-hidden shadow-sm shrink-0 bg-white">
          <img
            src="/isthar-avatar.png"
            alt="Ishtar Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-base font-extrabold tracking-widest text-slate-900 leading-none drop-shadow-sm">
            I.S.H.T.A.R
          </span>
          <span className="text-[9px] font-semibold text-slate-500 leading-tight mt-1 max-w-[115px]">
            It Shall Help Toward Academic Readiness
          </span>
        </div>
      </div>
    </div>
  );
};
