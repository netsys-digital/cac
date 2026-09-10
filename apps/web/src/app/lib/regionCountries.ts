/** ISO 3166-1 alpha-2 por região CAC (domínios `region`). */
const REGION_COUNTRY_CODES: Record<string, readonly string[]> = {
  africa: [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ',
    'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
    'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO',
    'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW', 'EH',
  ],
  asia: [
    'AF', 'AM', 'AZ', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE', 'HK', 'IN', 'ID', 'JP', 'KZ', 'KP',
    'KR', 'KG', 'LA', 'MO', 'MY', 'MV', 'MN', 'MM', 'NP', 'PK', 'PH', 'SG', 'LK', 'TW', 'TJ',
    'TH', 'TL', 'TM', 'UZ', 'VN',
  ],
  europe: [
    'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
    'GR', 'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL',
    'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'TR', 'UA',
    'GB', 'VA', 'AX', 'FO', 'GI', 'GG', 'IM', 'JE', 'SJ',
  ],
  middle_east: [
    'BH', 'EG', 'IR', 'IQ', 'IL', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'AE',
    'YE',
  ],
  north_america: ['CA', 'MX', 'US', 'BM', 'GL', 'PM'],
  south_america: [
    'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE',
  ],
  latam: [
    'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HT', 'HN', 'MX', 'NI',
    'PA', 'PY', 'PE', 'PR', 'UY', 'VE', 'BZ', 'GY', 'SR', 'GF', 'GP', 'MQ', 'BL', 'MF', 'SX',
    'CW', 'AW', 'BQ', 'TT', 'JM', 'BB', 'BS', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'KY', 'TC',
    'VG', 'VI', 'AI', 'MS',
  ],
  oceania: [
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU', 'NC',
    'PF', 'GU', 'MP', 'AS', 'CK', 'NU', 'TK', 'WF', 'PN',
  ],
  /** Global: todos os países do domínio. */
  global: [],
};

export function countryCodesForRegion(regionKey: string): Set<string> | null {
  if (!regionKey) return null;
  if (regionKey === 'global') return null; // null = sem filtro
  const list = REGION_COUNTRY_CODES[regionKey];
  if (!list) return null;
  return new Set(list);
}

export function isCountryInRegion(countryKey: string, regionKey: string): boolean {
  if (!regionKey || !countryKey || regionKey === 'global') return true;
  const allowed = countryCodesForRegion(regionKey);
  if (!allowed) return true;
  return allowed.has(countryKey.toUpperCase());
}
