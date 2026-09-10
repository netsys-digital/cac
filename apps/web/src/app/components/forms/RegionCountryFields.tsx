import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catalogApi } from '../../api/catalogApi';
import { countryCodesForRegion, isCountryInRegion } from '../../lib/regionCountries';
import { SelectField } from './FormPage';

export type DomainOption = {
  id: string;
  key: string;
  labelPt: string;
  labelEn: string;
  sortOrder: number;
};

function labelFor(item: DomainOption, lang: string) {
  if (lang.startsWith('en') || lang.startsWith('es')) return item.labelEn;
  return item.labelPt;
}

type Props = {
  regionName?: string;
  countryName?: string;
  defaultRegion?: string;
  defaultCountry?: string;
  region?: string;
  country?: string;
  onRegionChange?: (value: string) => void;
  onCountryChange?: (value: string) => void;
  required?: boolean;
};

/** Região primeiro; país filtrado pela região. Opções de `/api/domains`. */
export function RegionCountryFields({
  regionName = 'region',
  countryName = 'country',
  defaultRegion = '',
  defaultCountry = '',
  region,
  country,
  onRegionChange,
  onCountryChange,
  required = true,
}: Props) {
  const { t, i18n } = useTranslation();
  const [regions, setRegions] = useState<DomainOption[]>([]);
  const [countries, setCountries] = useState<DomainOption[]>([]);
  const [regionKey, setRegionKey] = useState(region ?? defaultRegion);
  const [countryKey, setCountryKey] = useState(country ?? defaultCountry);

  useEffect(() => {
    void Promise.all([catalogApi.listDomains('region'), catalogApi.listDomains('country')]).then(
      ([reg, cty]) => {
        setRegions(reg.items);
        setCountries(cty.items);
      },
    );
  }, []);

  useEffect(() => {
    if (region != null) setRegionKey(region);
  }, [region]);

  useEffect(() => {
    if (country != null) setCountryKey(country);
  }, [country]);

  const filteredCountries = useMemo(() => {
    if (!regionKey) return [];
    const allowed = countryCodesForRegion(regionKey);
    if (!allowed) return countries; // global
    return countries.filter((c) => allowed.has(c.key.toUpperCase()));
  }, [countries, regionKey]);

  function handleRegionChange(value: string) {
    setRegionKey(value);
    onRegionChange?.(value);
    if (countryKey && !isCountryInRegion(countryKey, value)) {
      setCountryKey('');
      onCountryChange?.('');
    }
  }

  function handleCountryChange(value: string) {
    setCountryKey(value);
    onCountryChange?.(value);
  }

  return (
    <>
      <SelectField
        label={t('catalog.region')}
        hint={t('catalog.regionHint')}
        name={regionName}
        required={required}
        value={regionKey}
        onChange={handleRegionChange}
      >
        <option value="">{t('catalog.selectRegion')}</option>
        {regions.map((item) => (
          <option key={item.id} value={item.key}>
            {labelFor(item, i18n.language)}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={t('catalog.country')}
        hint={regionKey ? t('catalog.countryHint') : t('catalog.countryHintNeedRegion')}
        name={countryName}
        required={required}
        disabled={!regionKey}
        value={countryKey}
        onChange={handleCountryChange}
      >
        <option value="">
          {regionKey ? t('catalog.selectCountry') : t('catalog.countryHintNeedRegion')}
        </option>
        {filteredCountries.map((item) => (
          <option key={item.id} value={item.key}>
            {labelFor(item, i18n.language)} ({item.key})
          </option>
        ))}
      </SelectField>
    </>
  );
}
