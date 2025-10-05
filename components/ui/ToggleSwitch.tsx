import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false }) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full border border-[rgba(134,165,255,0.35)] bg-[rgba(20,26,58,0.75)] transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(107,150,255,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(7,9,24,0.85)] ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className={`absolute inset-0 transition-opacity duration-300 ${
            checked ? 'opacity-100 bg-[linear-gradient(135deg,rgba(123,92,255,0.9),rgba(37,214,255,0.85))]' : 'opacity-0'
          }`}
        />
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-block h-5 w-5 transform rounded-full bg-white/90 shadow-[0_8px_18px_rgba(18,0,60,0.45)] ring-0 transition duration-300 ease-in-out ${
          checked ? 'translate-x-7 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(201,219,255,0.8))]' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
