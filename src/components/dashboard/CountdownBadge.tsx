interface CountdownBadgeProps {
  daysRemaining: number
}

export default function CountdownBadge({ daysRemaining }: CountdownBadgeProps) {
  const urgent = daysRemaining <= 3
  const warning = daysRemaining <= 7

  return (
    <div
      className={`px-3 py-1.5 rounded-full text-sm font-bold ${
        urgent
          ? 'bg-danger-50 text-danger-600'
          : warning
            ? 'bg-warning-50 text-warning-600'
            : 'bg-primary-50 text-primary-600'
      }`}
    >
      {daysRemaining <= 0 ? 'היום! 🎉' : `${daysRemaining} ימים`}
    </div>
  )
}
