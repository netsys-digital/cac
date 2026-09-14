import { useEffect, useState } from 'react';
import type { SearchFilters } from '../../api/searchApi';

type Option = { value: string; label: string };

type Props = {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  labels: {
    all: string;
    contentType: string;
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
    contentTypes: Option[];
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

const PLACEHOLDER_VALUE = '__placeholder__';
const ALL_VALUE = '__all__';

function Select({
  label,
  allLabel,
  value,
  options,
  onChange,
  disabled,
  compact,
}: {
  label: string;
  allLabel: string;
  value?: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  /** Distingue “nunca escolheu” (placeholder) de “escolheu Todos”. */
  const [allChosen, setAllChosen] = useState(false);

  useEffect(() => {
    if (value) setAllChosen(false);
  }, [value]);

  const selectValue = value ? value : allChosen ? ALL_VALUE : PLACEHOLDER_VALUE;
  const showPlaceholderStyle = selectValue === PLACEHOLDER_VALUE;

  return (
    <label className={`block min-w-0 ${disabled ? 'opacity-60' : ''}`}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        className={`w-full rounded-lg border border-cac-line bg-white py-2 text-pequena outline-none disabled:cursor-not-allowed ${
          compact ? 'px-1.5' : 'px-2.5'
        } ${showPlaceholderStyle ? 'text-cac-muted' : 'text-cac-ink'}`}
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === PLACEHOLDER_VALUE) return;
          if (next === ALL_VALUE) {
            setAllChosen(true);
            onChange('');
            return;
          }
          setAllChosen(false);
          onChange(next);
        }}
      >
        <option value={PLACEHOLDER_VALUE} disabled>
          {label}
        </option>
        <option value={ALL_VALUE}>{allLabel}</option>
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
  const allLabel = labels.all;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={labels.contentType}
          allLabel={allLabel}
          value={value.contentType}
          options={options.contentTypes}
          onChange={(v) => set('contentType', v)}
        />
        <Select
          label={labels.region}
          allLabel={allLabel}
          value={value.region}
          options={options.regions}
          onChange={setRegion}
        />
        <Select
          label={labels.country}
          allLabel={allLabel}
          value={value.country}
          options={countryOptions}
          onChange={(v) => set('country', v)}
          disabled={!regionSelected}
        />
        <Select
          label={labels.theme}
          allLabel={allLabel}
          value={value.theme}
          options={options.themes}
          onChange={(v) => set('theme', v)}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.7fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.15fr)]">
        <Select
          label={labels.actorType}
          allLabel={allLabel}
          value={value.actorType}
          options={options.actorTypes}
          onChange={(v) => set('actorType', v)}
        />
        <Select
          label={labels.sector}
          allLabel={allLabel}
          value={value.sector}
          options={options.sectors}
          onChange={(v) => set('sector', v)}
          compact
        />
        <Select
          label={labels.maturity}
          allLabel={allLabel}
          value={value.maturity}
          options={options.maturities}
          onChange={(v) => set('maturity', v)}
        />
        <Select
          label={labels.scale}
          allLabel={allLabel}
          value={value.scale}
          options={options.scales}
          onChange={(v) => set('scale', v)}
        />
        <Select
          label={labels.financing}
          allLabel={allLabel}
          value={value.financing}
          options={options.financing}
          onChange={(v) => set('financing', v)}
        />
      </div>
    </div>
  );
}
