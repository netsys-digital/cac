type BrandMarkProps = {
  name: string;
  short: string;
  logoSrc?: string;
  tagline?: string;
  variant?: 'light' | 'dark';
};

export function BrandMark({
  name,
  short,
  logoSrc,
  tagline = 'GLOBAL • LOCAL • ACTION',
  variant = 'light',
}: BrandMarkProps) {
  const onDark = variant === 'dark';
  const parts = name.split(' ');
  const last = parts.pop() ?? '';
  const first = parts.join(' ') || name;

  return (
    <div className="flex items-center gap-3">
      {logoSrc ? (
        <img src={logoSrc} alt="" className="h-11 w-11 rounded-[12px] object-contain" />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-gradient-to-br from-cac-green2 to-[#92dcc0] text-pequena font-bold leading-none tracking-tight text-cac-navy">
          {short.slice(0, 3)}
        </span>
      )}
      <span className={`leading-tight whitespace-nowrap font-bold text-media ${onDark ? 'uppercase' : ''}`}>
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
