/**
 * 订单状态标签颜色映射
 */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待付款', className: 'bg-yellow-50 text-yellow-600' },
  PAID: { label: '已支付', className: 'bg-blue-50 text-blue-600' },
  SHIPPED: { label: '已发货', className: 'bg-purple-50 text-purple-600' },
  COMPLETED: { label: '已完成', className: 'bg-green-50 text-green-600' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

interface OrderStatusBadgeProps {
  status: string;
}

/**
 * 订单状态标签组件
 */
export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-500',
  };

  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
