type IconProps = { className?: string };

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="#2d6e9f" strokeWidth="2.2" />
      <path d="M16.2 16.2 20 20" stroke="#2d6e9f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="3.2" fill="#dff3e9" />
    </svg>
  );
}

export function IconFunding({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#fff1ca" />
      <circle cx="12" cy="12" r="7" stroke="#d59c28" strokeWidth="1.8" />
      <path
        d="M12 7.2v9.6M14.4 9.1c-.5-.7-1.3-1.1-2.4-1.1-1.6 0-2.7.9-2.7 2.1 0 2.8 5.1 1.4 5.1 4.1 0 1.2-1.1 2.1-2.8 2.1-1.2 0-2.2-.5-2.7-1.3"
        stroke="#856217"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconChallenge({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5c0-1.4 1.2-2.5 2.6-2.5h7.3c2.4 0 4.3 1.9 4.3 4.3v.2c0 2.4-1.9 4.3-4.3 4.3H11l-3.8 3.2V14.8H7.1c-1.4 0-2.6-1.1-2.6-2.5V8.5Z"
        fill="#e4eff8"
        stroke="#2d6e9f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="10.6" r="1" fill="#2d6e9f" />
      <circle cx="12" cy="10.6" r="1" fill="#2d6e9f" />
      <circle cx="14.8" cy="10.6" r="1" fill="#2d6e9f" />
    </svg>
  );
}

export function IconOffer({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20c.4-3.2 2.2-5.2 4.8-6.2-1.5-.4-2.6-1.2-3.3-2.4-.6 1.3-1.7 2.2-3.3 2.6C12.8 15 13.4 17.2 12 20Z"
        fill="#2cab77"
      />
      <path
        d="M12 20c-.5-3.4-2.6-5.5-5.5-6.4 1.7-.3 3-1.2 3.7-2.6.8 1.5 2.1 2.4 3.8 2.7C12.7 15.2 12.4 17.4 12 20Z"
        fill="#13865a"
      />
      <path d="M12 20V9.5" stroke="#0a2440" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="7.2" r="2.2" fill="#92dcc0" stroke="#13865a" strokeWidth="1.4" />
    </svg>
  );
}

export function IconCases({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5c0-.8.7-1.5 1.5-1.5H11v14H6.5A1.5 1.5 0 0 1 5 17.5v-11Z"
        fill="#dff3e9"
        stroke="#13865a"
        strokeWidth="1.5"
      />
      <path
        d="M19 6.5c0-.8-.7-1.5-1.5-1.5H13v14h4.5a1.5 1.5 0 0 0 1.5-1.5v-11Z"
        fill="#e4eff8"
        stroke="#2d6e9f"
        strokeWidth="1.5"
      />
      <path d="M12 5v14" stroke="#0a2440" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
