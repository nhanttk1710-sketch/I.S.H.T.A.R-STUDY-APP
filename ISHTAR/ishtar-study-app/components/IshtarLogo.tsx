import React from 'react';

interface IshtarLogoProps {
  className?: string;
  collapsed?: boolean;
  logoUrl?: string;
}

/**
 * Uses the approved, pre-composed logo image as a single asset.
 * Keep the emblem, avatar, wordmark and tagline together; do not rebuild layers.
 */
export const IshtarLogo: React.FC<IshtarLogoProps> = ({
  className = 'w-44',
  collapsed = false,
  logoUrl = '/ishtar-logo.webp',
}) => {
  return (
    <div
      className={`flex items-center justify-center p-1 mx-auto select-none ${className} ${collapsed ? 'min-h-10' : ''}`}
    >
      <img
        src={logoUrl}
        alt="I.S.H.T.A.R - It Shall Help Toward Academic Readiness"
        className="block h-auto w-full object-contain"
      />
    </div>
  );
};

export default IshtarLogo;
