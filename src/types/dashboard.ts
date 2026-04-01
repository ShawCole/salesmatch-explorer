export interface GeoCounty {
  fips: string;
  state: string;
  name: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface GeoZip {
  zip: string;
  state: string;
  county_fips: string;
  lat: number | null;
  lng: number | null;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AgeGenderBucket {
  age_range: string;
  male: number;
  female: number;
  unknown: number;
}

export interface BucketCount {
  bucket: string;
  count: number;
}

export interface CityCount {
  city: string;
  count: number;
}

export interface LanguageCount {
  code: string;
  count: number;
}

export interface SeniorityCount {
  level: string;
  count: number;
}

export interface FamilyAgg {
  married_children: number;
  married_no_children: number;
  single_children: number;
  single_no_children: number;
}

export interface Aggregations {
  age_gender: AgeGenderBucket[];
  income: BucketCount[];
  net_worth: BucketCount[];
  credit_rating: BucketCount[];
  top_cities: CityCount[];
  language: LanguageCount[];
  family: FamilyAgg;
  seniority: SeniorityCount[];
  employee_count: BucketCount[];
  company_revenue: BucketCount[];
}

export interface FilterOptionCity {
  value: string;
  count: number;
}

export interface FilterOptionCounty {
  fips: string;
  name: string;
  state: string;
  count: number;
}

export interface FilterOptionLanguage {
  code: string;
  count: number;
}

export interface FilterOptions {
  cities: FilterOptionCity[];
  counties: FilterOptionCounty[];
  languages: FilterOptionLanguage[];
}

export interface DashboardResponse {
  totalContacts: number;
  filteredContacts: number;
  geo: {
    counties: GeoCounty[];
    zips: GeoZip[];
  };
  tooltipGeo: {
    counties: GeoCounty[];
    zips: GeoZip[];
  } | null;
  aggregations: Aggregations;
  filterOptions: FilterOptions;
  ms: number;
}
