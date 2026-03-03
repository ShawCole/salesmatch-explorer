export interface IntentRecord {
  AGE_RANGE: string;
  CHILDREN: string;
  COMPANY_NAME: string;
  PERSONAL_VERIFIED_EMAILS: string;
  FIRST_NAME: string;
  GENDER: string;
  INCOME_RANGE: string;
  JOB_TITLE: string;
  LAST_NAME: string;
  LINKEDIN_URL: string;
  MARRIED: string;
  MOBILE_PHONE: string;
  MOBILE_PHONE_DNC: string;
  NET_WORTH: string;
  PERSONAL_ADDRESS: string;
  PERSONAL_CITY: string;
  PERSONAL_PHONE: string;
  PERSONAL_PHONE_DNC: string;
  PERSONAL_ZIP: string;
  PERSONAL_ZIP4: string;
  SENIORITY_LEVEL: string;
  SHA256_PERSONAL_EMAIL: string;
  SKIPTRACE_ADDRESS: string;
  SKIPTRACE_CITY: string;
  SKIPTRACE_CREDIT_RATING: string;
  SKIPTRACE_LANGUAGE_CODE: string;
  SKIPTRACE_NAME: string;
  SKIPTRACE_WIRELESS_NUMBERS: string;
  SKIPTRACE_ZIP: string;
  UUID: string;
  SKIPTRACE_STATE: string;
  PERSONAL_STATE: string;
  HOME_VALUE_TAB: string;
}

export type FilterKey =
  | 'homeValueTabs'
  | 'ageRange'
  | 'gender'
  | 'incomeRange'
  | 'netWorth'
  | 'creditRating'
  | 'seniorityLevel'
  | 'selectedZips';

export interface MultiSelectFilter {
  include: Set<string>;
  exclude: Set<string>;
}
