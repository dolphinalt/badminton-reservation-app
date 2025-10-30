interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

export default function NavItem({
  icon,
  label,
  active,
  onClick,
}: NavItemProps) {
  const colorClass = active ? "text-gray-900" : "text-gray-400";

  return (
    <button
      className={`flex flex-col items-center gap-1 ${colorClass}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
