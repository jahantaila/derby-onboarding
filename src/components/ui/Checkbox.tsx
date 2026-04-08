"use client";

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Checkbox({ label, checked, onChange }: Props) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group py-2"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-5 h-5 rounded border border-white/20 bg-white/5 flex items-center justify-center transition-colors peer-checked:bg-derby-blue peer-checked:border-derby-blue-light group-hover:border-white/40">
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span className="text-white/80 font-body text-sm group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}
