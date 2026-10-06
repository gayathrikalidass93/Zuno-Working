import { BookingPricing, PricingConfig } from '../types';

export function calculatePricing(
  durationHours: number,
  taskCount: number,
  isUrgent: boolean,
  isWeekend: boolean,
  config: PricingConfig,
  customHourlyRate?: number
): BookingPricing {
  const effectiveHours = Math.max(config.minimumDurationHours, durationHours);
  const effectiveHourlyRate = customHourlyRate && customHourlyRate > 0 ? customHourlyRate : config.baseHourlyRate;
  const baseAmount = effectiveHours * effectiveHourlyRate;

  // Multi-task discount: When combining 3 or more tasks in one visit, award bundle discount
  const multiTaskDiscount =
    taskCount >= 3 ? Math.round(baseAmount * (config.multiTaskDiscountPercent / 100)) : 0;

  // Urgent fee
  const urgentFee = isUrgent
    ? Math.round(baseAmount * (config.urgentPremiumPercent / 100))
    : 0;

  // Weekend fee
  const weekendFee = isWeekend
    ? Math.round(baseAmount * (config.weekendPremiumPercent / 100))
    : 0;

  const subtotal = baseAmount - multiTaskDiscount + urgentFee + weekendFee;
  const totalAmount = Math.max(subtotal, effectiveHourlyRate);

  // Helper payout vs ZUNO platform fee
  const helperPayout = Math.round(totalAmount * (config.helperPayoutPercent / 100));
  const zunoFee = totalAmount - helperPayout;

  return {
    baseHourlyRate: effectiveHourlyRate,
    durationHours: effectiveHours,
    baseAmount,
    taskComplexityAdjustment: 0,
    urgentFee,
    weekendFee,
    multiTaskDiscount,
    subtotal,
    zunoFee,
    helperPayout,
    totalAmount,
  };
}
