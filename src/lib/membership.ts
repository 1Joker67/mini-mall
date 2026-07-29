/**
 * 心悦会员等级配置
 * 根据累计消费金额决定会员等级和折扣
 */

export interface MembershipLevel {
  level: number;
  name: string;
  threshold: number;
  discountRate: number;
  discountLabel: string;
}

/** 会员等级定义 */
export const MEMBERSHIP_LEVELS: MembershipLevel[] = [
  { level: 0, name: '普通会员', threshold: 0, discountRate: 1.0, discountLabel: '无折扣' },
  { level: 1, name: '心悦1', threshold: 8000, discountRate: 0.98, discountLabel: '9.8 折' },
  { level: 2, name: '心悦2', threshold: 80000, discountRate: 0.95, discountLabel: '9.5 折' },
  { level: 3, name: '心悦3', threshold: 800000, discountRate: 0.90, discountLabel: '9.0 折' },
];

/**
 * 根据累计消费金额计算会员等级
 */
export function getMembershipLevel(totalSpent: number): MembershipLevel {
  let level = MEMBERSHIP_LEVELS[0];
  for (const l of MEMBERSHIP_LEVELS) {
    if (totalSpent >= l.threshold) {
      level = l;
    }
  }
  return level;
}

/**
 * 获取当前等级的折扣率
 */
export function getDiscountRate(level: number): number {
  return MEMBERSHIP_LEVELS[level]?.discountRate ?? 1.0;
}
