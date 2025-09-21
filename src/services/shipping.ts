// src/services/shipping.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export type ShippingConfig = {
  /** Cart subtotal at/above which shipping is free (per method rules below) */
  freeThreshold: number;
  methods: {
    standard: { feeBelow: number; feeAboveOrEqual: number };
    express:  { feeBelow: number; feeAboveOrEqual: number };
  };
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeThreshold: 999,
  methods: {
    standard: { feeBelow: 99,  feeAboveOrEqual: 0 },
    express:  { feeBelow: 149, feeAboveOrEqual: 0 },
  },
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const ref = doc(db, 'config', 'shipping');
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_SHIPPING_CONFIG;
    const d = snap.data() as any;

    const cfg: ShippingConfig = {
      freeThreshold: Number(d.freeThreshold ?? DEFAULT_SHIPPING_CONFIG.freeThreshold),
      methods: {
        standard: {
          feeBelow: Number(d?.methods?.standard?.feeBelow ?? DEFAULT_SHIPPING_CONFIG.methods.standard.feeBelow),
          feeAboveOrEqual: Number(d?.methods?.standard?.feeAboveOrEqual ?? DEFAULT_SHIPPING_CONFIG.methods.standard.feeAboveOrEqual),
        },
        express: {
          feeBelow: Number(d?.methods?.express?.feeBelow ?? DEFAULT_SHIPPING_CONFIG.methods.express.feeBelow),
          feeAboveOrEqual: Number(d?.methods?.express?.feeAboveOrEqual ?? DEFAULT_SHIPPING_CONFIG.methods.express.feeAboveOrEqual),
        },
      },
    };
    return cfg;
  } catch {
    return DEFAULT_SHIPPING_CONFIG;
  }
}

export function computeShippingFee(
  subtotal: number,
  method: 'standard' | 'express',
  cfg: ShippingConfig
): number {
  if (!cfg) cfg = DEFAULT_SHIPPING_CONFIG;
  const rule = cfg.methods[method];
  if (!rule) return 0;
  return subtotal >= cfg.freeThreshold ? rule.feeAboveOrEqual : rule.feeBelow;
}
