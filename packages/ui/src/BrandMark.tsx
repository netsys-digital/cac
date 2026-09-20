type BrandMarkProps = {
  name: string;
  short: string;
  logoSrc?: string;
  tagline?: string;
  variant?: 'light' | 'dark';
  /**
   * Wordmark height.
   * - md: cabe na faixa de 74px
   * - header: maior que a faixa (usa overflow no layout)
   * - lg: footer / áreas amplas
   */
  size?: 'md' | 'header' | 'lg';
};

const logoSizeClass = {
  md: 'h-14 w-auto max-w-[260px] object-contain object-left',
  /** ~90px: vaza da faixa 74px sem forçar altura do header. */
  header: 'h-[90px] w-auto max-w-[300px] object-contain object-left',
  lg: 'h-[4.5rem] w-auto max-w-[320px] object-contain object-left',
} as const;

export function BrandMark({
  name,
  short,
  logoSrc,
  tagline = 'GLOBAL • LOCAL • ACTION',
  variant = 'light',
  size = 'md',
}: BrandMarkProps) {
  const onDark = variant === 'dark';
  const parts = name.split(' ');
  const last = parts.pop() ?? '';
  const first = parts.join(' ') || name;

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={name}
        className={logoSizeClass[size]}
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-gradient-to-br from-cac-green2 to-[#92dcc0] text-pequena font-bold leading-none tracking-tight text-cac-navy">
        {short.slice(0, 3)}
      </span>
      <span className="leading-tight whitespace-nowrap font-bold text-media">
        <span className={onDark ? 'text-white' : 'text-cac-navy'}>
          {first}{' '}
          <b className={onDark ? 'text-[#8ed5b5]' : 'text-cac-green'}>{last}</b>
        </span>
        {tagline ? (
          <small
            className={`mt-0.5 block text-pequena tracking-[1.2px] ${
              onDark ? 'text-[#90d6b6]' : 'text-cac-muted'
            }`}
          >
            {tagline}
          </small>
        ) : null}
      </span>
    </div>
  );
}
