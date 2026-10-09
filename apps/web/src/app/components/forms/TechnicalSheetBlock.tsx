import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { FieldFull } from './FormPage';
import { RichTextArea } from './RichTextArea';
import { type MultiSelectOption, MultiSelectField } from './MultiSelectField';
import { RegionCountryFields } from './RegionCountryFields';

const BIOMES: MultiSelectOption[] = ['Amazônia', 'Caatinga', 'Cerrado', 'Mata Atlântica', 'Pampa', 'Pantanal'].map(
  (biome) => ({ value: biome, label: biome }),
);

function canonicalBiomes(raw: string | null | undefined): string[] {
  return splitList(raw ?? '')
    .map((name) => BIOMES.find((b) => b.value.toLowerCase() === name.toLowerCase())?.value)
    .filter((v): v is string => Boolean(v));
}

const BR_STATES: MultiSelectOption[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

type PartnersChoice = 'yes' | 'no' | '';

export type TechnicalSheetDefaults = {
  developedWithPartners?: boolean | null;
  partnerInstitutions?: string | null;
  methodology?: string | null;
  launchYear?: number | null;
  region?: string | null;
  country?: string | null;
  state?: string | null;
  biome?: string | null;
  responsibleUnit?: string | null;
  accessInfo?: string | null;
  keywords?: string[] | null;
  officialUrl?: string | null;
};

function splitList(raw: FormDataEntryValue | null): string[] {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function textOrNull(form: FormData, name: string): string | null {
  return String(form.get(name) || '').trim() || null;
}

/** Campos da ficha técnica a partir do FormData (nomes definidos em `TechnicalSheetBlock`). */
export function pickTechnicalSheet(form: FormData) {
  const partners = String(form.get('developedWithPartners') || '') as PartnersChoice;
  const year = Number.parseInt(String(form.get('launchYear') || ''), 10);
  return {
    developedWithPartners: partners === 'yes' ? true : partners === 'no' ? false : null,
    partnerInstitutions: partners === 'yes' ? textOrNull(form, 'partnerInstitutions') : null,
    methodology: textOrNull(form, 'methodology'),
    launchYear: Number.isFinite(year) ? year : null,
    state: textOrNull(form, 'state'),
    biome: textOrNull(form, 'biome'),
    responsibleUnit: textOrNull(form, 'responsibleUnit'),
    accessInfo: textOrNull(form, 'accessInfo'),
    keywords: splitList(form.get('keywords')),
    officialUrl: textOrNull(form, 'officialUrl'),
  };
}

type Props = {
  defaults?: TechnicalSheetDefaults;
};

/** Ficha técnica da solução — alimenta o painel lateral da página pública de detalhe. */
export function TechnicalSheetBlock({ defaults = {} }: Props) {
  const { t } = useTranslation();
  const partnersGroupId = useId();
  const [partners, setPartners] = useState<PartnersChoice>(
    defaults.developedWithPartners === true ? 'yes' : defaults.developedWithPartners === false ? 'no' : '',
  );
  const [country, setCountry] = useState(defaults.country || 'BR');
  const isBrazil = country.toUpperCase() === 'BR';
  const currentYear = new Date().getFullYear();

  const choices: { value: Exclude<PartnersChoice, ''>; label: string }[] = [
    { value: 'yes', label: t('catalog.sheetYes') },
    { value: 'no', label: t('catalog.sheetNo') },
  ];

  return (
    <FieldFull>
      <section className="mt-2 space-y-4 rounded-[16px] border border-cac-line bg-[#fbfcfb] p-4 shadow-cac md:p-5">
        <header className="border-b border-cac-line pb-3">
          <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
            {t('catalog.sheetTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.sheetHint')}</p>
        </header>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <FieldFull>
            <fieldset className="space-y-1" aria-labelledby={partnersGroupId}>
              <legend
                id={partnersGroupId}
                className="block text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted"
              >
                {t('catalog.sheetPartners')}
              </legend>
              <input type="hidden" name="developedWithPartners" value={partners} />
              <div className="flex gap-2" role="radiogroup" aria-labelledby={partnersGroupId}>
                {choices.map((choice) => {
                  const selected = partners === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPartners(selected ? '' : choice.value)}
                      className={`min-w-[5.5rem] rounded-[10px] border px-3 py-2 text-pequena font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cac-green2/40 ${
                        selected
                          ? 'border-cac-green bg-cac-green3 text-cac-navy'
                          : 'border-cac-line bg-white text-cac-muted hover:border-cac-green/40'
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </FieldFull>

          {partners === 'yes' ? (
            <FieldFull>
              <TextArea
                label={t('catalog.sheetPartnerInstitutions')}
                hint={t('catalog.sheetPartnerInstitutionsHint')}
                name="partnerInstitutions"
                rows={2}
                defaultValue={defaults.partnerInstitutions ?? ''}
              />
            </FieldFull>
          ) : null}

          <FieldFull>
            <RichTextArea
              label={t('catalog.sheetMethodology')}
              hint={t('catalog.sheetMethodologyHint')}
              name="methodology"
              rows={3}
              defaultValue={defaults.methodology ?? ''}
            />
          </FieldFull>

          <Input
            label={t('catalog.sheetLaunchYear')}
            hint={t('catalog.sheetLaunchYearHint')}
            name="launchYear"
            type="number"
            min={1900}
            max={currentYear + 1}
            step={1}
            placeholder={String(currentYear)}
            defaultValue={defaults.launchYear ?? ''}
          />
          <Input
            label={t('catalog.sheetResponsibleUnit')}
            hint={t('catalog.sheetResponsibleUnitHint')}
            name="responsibleUnit"
            defaultValue={defaults.responsibleUnit ?? ''}
          />

          <RegionCountryFields
            defaultRegion={defaults.region || 'south_america'}
            defaultCountry={defaults.country || 'BR'}
            onCountryChange={setCountry}
          />

          {isBrazil ? (
            <MultiSelectField
              label={t('catalog.sheetState')}
              hint={t('catalog.sheetStateHint')}
              name="state"
              options={BR_STATES}
              defaultValue={splitList(defaults.state ?? '')}
            />
          ) : null}
          <div className={isBrazil ? '' : 'sm:col-span-2'}>
            <MultiSelectField
              label={t('catalog.sheetBiome')}
              hint={t('catalog.sheetBiomeHint')}
              name="biome"
              options={BIOMES}
              defaultValue={canonicalBiomes(defaults.biome)}
            />
          </div>

          <FieldFull>
            <RichTextArea
              label={t('catalog.sheetAccessInfo')}
              hint={t('catalog.sheetAccessInfoHint')}
              name="accessInfo"
              rows={2}
              defaultValue={defaults.accessInfo ?? ''}
            />
          </FieldFull>
          <FieldFull>
            <Input
              label={t('catalog.sheetKeywords')}
              hint={t('catalog.sheetKeywordsHint')}
              name="keywords"
              placeholder="sensoriamento remoto, uso da terra"
              defaultValue={defaults.keywords?.join(', ') ?? ''}
            />
          </FieldFull>
          <FieldFull>
            <Input
              label={t('catalog.sheetOfficialUrl')}
              hint={t('catalog.sheetOfficialUrlHint')}
              name="officialUrl"
              type="url"
              placeholder="https://"
              defaultValue={defaults.officialUrl ?? ''}
            />
          </FieldFull>
        </div>
      </section>
    </FieldFull>
  );
}
