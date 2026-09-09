type FacetKey =
  | 'results'
  | 'solutions'
  | 'projects'
  | 'organizations'
  | 'funders'
  | 'cases'
  | 'challenges';

type FacetItem = {
  key: FacetKey;
  value: number;
  label: string;
  /** undefined = limpa filtro (todos os resultados) */
  contentType?: string;
};

type Props = {
  total: number;
  facets: {
    solutions: number;
    projects: number;
    organizations: number;
    funders: number;
    cases?: number;
    challenges?: number;
  };
  labels: {
    results: string;
    solutions: string;
    projects: string;
    organizations: string;
    funders: string;
    cases?: string;
    challenges?: string;
  };
  /** contentType ativo na URL, ou vazio/undefined = todos */
  activeContentType?: string;
  onSelect: (contentType: string | undefined) => void;
};

export function ResultFacets({ total, facets, labels, activeContentType, onSelect }: Props) {
  const items: FacetItem[] = [
    { key: 'results', value: total, label: labels.results },
    { key: 'solutions', value: facets.solutions, label: labels.solutions, contentType: 'SOLUTION' },
    { key: 'projects', value: facets.projects, label: labels.projects, contentType: 'PROJECT' },
    {
      key: 'organizations',
      value: facets.organizations,
      label: labels.organizations,
      contentType: 'ORGANIZATION',
    },
    { key: 'funders', value: facets.funders, label: labels.funders, contentType: 'FUNDER' },
  ];
  if (labels.cases != null) {
    items.push({
      key: 'cases',
      value: facets.cases ?? 0,
      label: labels.cases,
      contentType: 'CASE',
    });
  }
  if (labels.challenges != null) {
    items.push({
      key: 'challenges',
      value: facets.challenges ?? 0,
      label: labels.challenges,
      contentType: 'CHALLENGE',
    });
  }

  const active = (activeContentType ?? '').trim();

  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-7">
      {items.map((item) => {
        const isActive = item.contentType
          ? active === item.contentType
          : !active;
        const disabled = item.value === 0 && Boolean(item.contentType);

        return (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => {
              if (item.contentType && active === item.contentType) {
                onSelect(undefined);
                return;
              }
              onSelect(item.contentType);
            }}
            className={`min-w-0 rounded-[10px] border px-1.5 py-2 text-center transition sm:px-2 sm:py-2.5 ${
              isActive
                ? 'border-cac-green bg-cac-green3 shadow-[0_0_0_1px_rgba(19,134,90,.25)]'
                : 'border-cac-line bg-white hover:border-cac-green/40 hover:bg-[#f7faf8]'
            } ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
          >
            <b
              className={`block text-media font-bold leading-none ${
                isActive ? 'text-cac-green' : 'text-cac-navy'
              }`}
            >
              {item.value}
            </b>
            <span
              className={`mt-1 block truncate text-mini leading-tight sm:text-pequena ${
                isActive ? 'font-bold text-cac-navy' : 'text-cac-muted'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
