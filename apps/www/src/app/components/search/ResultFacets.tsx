type Props = {
  total: number;
  facets: { solutions: number; projects: number; organizations: number; funders: number; cases?: number };
  labels: {
    results: string;
    solutions: string;
    projects: string;
    organizations: string;
    funders: string;
    cases?: string;
  };
};

export function ResultFacets({ total, facets, labels }: Props) {
  const items = [
    { value: total, label: labels.results },
    { value: facets.solutions, label: labels.solutions },
    { value: facets.projects, label: labels.projects },
    { value: facets.organizations, label: labels.organizations },
    { value: facets.funders, label: labels.funders },
    ...(labels.cases != null ? [{ value: facets.cases ?? 0, label: labels.cases }] : []),
  ];
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[10px] border border-cac-line bg-white p-2.5 text-center"
        >
          <b className="block text-[16px] text-cac-navy">{item.value}</b>
          <span className="text-[10px] text-cac-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
