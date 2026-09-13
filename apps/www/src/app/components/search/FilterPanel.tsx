import type { SearchFilters } from '../../api/searchApi';

type Option = { value: string; label: string };

type Props = {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  labels: {
    country: string;
    region: string;
    theme: string;
    actorType: string;
    sector: string;
    maturity: string;
    scale: string;
    financing: string;
  };
  options: {
    countriesByRegion: Record<string, Option[]>;
    regions: Option[];
    themes: Option[];
    actorTypes: Option[];
    sectors: Option[];
    maturities: Option[];
    scales: Option[];
    financing: Option[];
  };
};

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const empty = !value;
  return (
    <label className={`block min-w-0 ${disabled ? 'opacity-60' : ''}`}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        className={`w-full rounded-lg border border-cac-line bg-white px-2.5 py-2 text-pequena outline-none disabled:cursor-not-allowed ${
          empty ? 'text-cac-muted' : 'text-cac-ink'
        }`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPanel({ value, onChange, labels, options }: Props) {
  function set<K extends keyof SearchFilters>(key: K, raw: string) {
    const next = { ...value };
    if (!raw) delete next[key];
    else next[key] = raw as SearchFilters[K];
    onChange(next);
  }

  function setRegion(raw: string) {
    const next = { ...value };
    if (!raw) delete next.region;
    else next.region = raw;

    const allowed = raw ? (options.countriesByRegion[raw] ?? []).map((c) => c.value) : [];
    if (!next.country || !allowed.includes(next.country)) {
      delete next.country;
    }
    onChange(next);
  }

  const regionSelected = Boolean(value.region);
  const countryOptions = regionSelected ? (options.countriesByRegion[value.region!] ?? []) : [];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Select label={labels.region} value={value.region} options={options.regions} onChange={setRegion} />
      <Select
        label={labels.country}
        value={value.country}
        options={countryOptions}
        onChange={(v) => set('country', v)}
        disabled={!regionSelected}
      />
      <Select label={labels.theme} value={value.theme} options={options.themes} onChange={(v) => set('theme', v)} />
      <Select
        label={labels.actorType}
        value={value.actorType}
        options={options.actorTypes}
        onChange={(v) => set('actorType', v)}
      />
      <Select
        label={labels.sector}
        value={value.sector}
        options={options.sectors}
        onChange={(v) => set('sector', v)}
      />
      <Select
        label={labels.maturity}
        value={value.maturity}
        options={options.maturities}
        onChange={(v) => set('maturity', v)}
      />
      <Select label={labels.scale} value={value.scale} options={options.scales} onChange={(v) => set('scale', v)} />
      <Select
        label={labels.financing}
        value={value.financing}
        options={options.financing}
        onChange={(v) => set('financing', v)}
      />
    </div>
  );
}
