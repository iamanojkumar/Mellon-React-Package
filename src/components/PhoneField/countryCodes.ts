export interface CountryCodeOption {
  /** ISO 3166-1 alpha-2 code, e.g. "US". */
  iso: string;
  name: string;
  /** Includes the leading "+", e.g. "+1". */
  dialCode: string;
}

/**
 * No flag emoji — Windows (this project's dev environment, and a common
 * deployment target) renders regional-indicator emoji as plain two-letter
 * boxes rather than actual flags, so a flag-based trigger would be
 * inconsistent across platforms. Dial code + country name text only, the
 * same "plain glyph over unreliable graphics" call already made for
 * `DatePicker`'s `‹`/`›` nav and `Chip`'s `×` remove button.
 *
 * Not exhaustive (~70 entries covering the most common countries, not all
 * ~195) — deliberately, to keep the dropdown usably short without adding
 * search/filtering, which would start overlapping with the Combobox this
 * library defers to its own session (see docs/SPEC.md's Phase 10).
 */
export const COUNTRY_CODES: CountryCodeOption[] = [
  { iso: 'US', name: 'United States', dialCode: '+1' },
  { iso: 'CA', name: 'Canada', dialCode: '+1' },
  { iso: 'MX', name: 'Mexico', dialCode: '+52' },
  { iso: 'BR', name: 'Brazil', dialCode: '+55' },
  { iso: 'AR', name: 'Argentina', dialCode: '+54' },
  { iso: 'CL', name: 'Chile', dialCode: '+56' },
  { iso: 'CO', name: 'Colombia', dialCode: '+57' },
  { iso: 'PE', name: 'Peru', dialCode: '+51' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { iso: 'IE', name: 'Ireland', dialCode: '+353' },
  { iso: 'FR', name: 'France', dialCode: '+33' },
  { iso: 'DE', name: 'Germany', dialCode: '+49' },
  { iso: 'ES', name: 'Spain', dialCode: '+34' },
  { iso: 'PT', name: 'Portugal', dialCode: '+351' },
  { iso: 'IT', name: 'Italy', dialCode: '+39' },
  { iso: 'NL', name: 'Netherlands', dialCode: '+31' },
  { iso: 'BE', name: 'Belgium', dialCode: '+32' },
  { iso: 'CH', name: 'Switzerland', dialCode: '+41' },
  { iso: 'AT', name: 'Austria', dialCode: '+43' },
  { iso: 'SE', name: 'Sweden', dialCode: '+46' },
  { iso: 'NO', name: 'Norway', dialCode: '+47' },
  { iso: 'DK', name: 'Denmark', dialCode: '+45' },
  { iso: 'FI', name: 'Finland', dialCode: '+358' },
  { iso: 'IS', name: 'Iceland', dialCode: '+354' },
  { iso: 'PL', name: 'Poland', dialCode: '+48' },
  { iso: 'CZ', name: 'Czech Republic', dialCode: '+420' },
  { iso: 'SK', name: 'Slovakia', dialCode: '+421' },
  { iso: 'HU', name: 'Hungary', dialCode: '+36' },
  { iso: 'RO', name: 'Romania', dialCode: '+40' },
  { iso: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { iso: 'GR', name: 'Greece', dialCode: '+30' },
  { iso: 'TR', name: 'Turkey', dialCode: '+90' },
  { iso: 'UA', name: 'Ukraine', dialCode: '+380' },
  { iso: 'RU', name: 'Russia', dialCode: '+7' },
  { iso: 'IL', name: 'Israel', dialCode: '+972' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { iso: 'QA', name: 'Qatar', dialCode: '+974' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234' },
  { iso: 'KE', name: 'Kenya', dialCode: '+254' },
  { iso: 'GH', name: 'Ghana', dialCode: '+233' },
  { iso: 'IN', name: 'India', dialCode: '+91' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { iso: 'CN', name: 'China', dialCode: '+86' },
  { iso: 'JP', name: 'Japan', dialCode: '+81' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82' },
  { iso: 'TW', name: 'Taiwan', dialCode: '+886' },
  { iso: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { iso: 'SG', name: 'Singapore', dialCode: '+65' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60' },
  { iso: 'TH', name: 'Thailand', dialCode: '+66' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84' },
  { iso: 'AU', name: 'Australia', dialCode: '+61' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '+64' },
];
