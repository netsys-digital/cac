type FacetItem = { value: number; label: string };

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
};

export function ResultFacets({ total, facets, labels }: Props) {
  const items: FacetItem[] = [
    { value: total, label: labels.results },
    { value: facets.solutions, label: labels.solutions },
    { value: facets.projects, label: labels.projects },
    { value: facets.organizations, label: labels.organizations },
    { value: facets.funders, label: labels.funders },
  ];
  if (labels.cases != null) {
    items.push({ value: facets.cases ?? 0, label: labels.cases });
  }
  if (labels.challenges != null) {
    items.push({ value: facets.challenges ?? 0, label: labels.challenges });
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-[10px] border border-cac-line bg-white px-1.5 py-2 text-center sm:px-2 sm:py-2.5"
        >
          <b className="block text-[0.95rem] font-black leading-none text-cac-navy sm:text-[1.05rem]">
            {item.value}
          </b>
          <span className="mt-1 block truncate text-[0.65rem] leading-tight text-cac-muted sm:text-[0.7rem]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
