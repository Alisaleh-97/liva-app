// Business subscription plans. USD base prices; price() converts to AED at runtime.
// Pricing is calibrated for live-commerce: low entry to convert sellers, healthy
// margin at Growth (the expected mode), enterprise pricing at Pro.

import { Plan, Billing } from '@/state/AuthContext';

export interface PlanDef {
  id: Plan;
  nameKey: string;     // i18n key
  descKey: string;
  monthly: number;     // USD
  yearly: number;      // USD billed annually
  popular?: boolean;
  featureKeys: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'starter',
    nameKey: 'planStarter',
    descKey: 'starterDesc',
    monthly: 19,
    yearly: 190,
    featureKeys: ['starterF1', 'starterF2', 'starterF3', 'starterF4', 'starterF5'],
  },
  {
    id: 'growth',
    nameKey: 'planGrowth',
    descKey: 'growthDesc',
    monthly: 79,
    yearly: 790,
    popular: true,
    featureKeys: ['growthF1', 'growthF2', 'growthF3', 'growthF4', 'growthF5', 'growthF6', 'growthF7'],
  },
  {
    id: 'pro',
    nameKey: 'planPro',
    descKey: 'proDesc',
    monthly: 249,
    yearly: 2490,
    featureKeys: ['proF1', 'proF2', 'proF3', 'proF4', 'proF5', 'proF6', 'proF7'],
  },
];

export const planById = (id: Plan): PlanDef => PLANS.find((p) => p.id === id)!;

// Effective monthly amount given billing cadence (yearly bill divided by 12).
export function effectiveMonthly(p: PlanDef, b: Billing): number {
  return b === 'yearly' ? p.yearly / 12 : p.monthly;
}

export function chargedToday(p: PlanDef, b: Billing): number {
  return b === 'yearly' ? p.yearly : p.monthly;
}

export const COUNTRIES = [
  { code: 'US', key: 'countryUS' },
  { code: 'AE', key: 'countryAE' },
  { code: 'SA', key: 'countrySA' },
  { code: 'EG', key: 'countryEG' },
  { code: 'GB', key: 'countryGB' },
  { code: 'CA', key: 'countryCA' },
  { code: 'IN', key: 'countryIN' },
  { code: 'PK', key: 'countryPK' },
  { code: 'NG', key: 'countryNG' },
  { code: 'OTHER', key: 'countryOther' },
] as const;

export const BUSINESS_CATEGORIES = [
  { id: 'fashion', key: 'catFashion' },
  { id: 'beauty', key: 'catBeauty' },
  { id: 'electronics', key: 'catElectronics' },
  { id: 'home', key: 'catHomeLiving' },
  { id: 'sport', key: 'catSport' },
  { id: 'food', key: 'catFood' },
  { id: 'services', key: 'catServices' },
  { id: 'other', key: 'catOther' },
];
