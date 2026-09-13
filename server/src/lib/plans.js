export const BUSINESS_PLAN_PRICES = Object.freeze({
  starter: Object.freeze({ monthly: 1900, yearly: 19000 }),
  growth: Object.freeze({ monthly: 7900, yearly: 79000 }),
  pro: Object.freeze({ monthly: 24900, yearly: 249000 }),
});

export function planAmount(plan, billing) {
  return BUSINESS_PLAN_PRICES[plan]?.[billing] || null;
}
