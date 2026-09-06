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
    <div className="flex items-center gap-2.5">
      {logoSrc ? (
        <img src={logoSrc} alt="" className="h-[38px] w-[38px] rounded-[11px] object-contain" />
      ) : (
        <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-gradient-to-br from-cac-green2 to-[#92dcc0] text-[10px] font-black text-cac-navy">
          {short.slice(0, 3)}
        </span>
      )}
      <span className={`leading-tight whitespace-nowrap font-black ${onDark ? 'uppercase' : ''}`}>
        <span className={onDark ? 'text-white' : 'text-cac-navy'}>
          {first}{' '}
          <b className={onDark ? 'text-[#8ed5b5]' : 'text-cac-green'}>{last}</b>
        </span>
        {tagline ? (
          <small
            className={`mt-0.5 block text-[10px] tracking-[1px] ${
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
