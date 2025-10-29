

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

export default function NavItem({ icon, label, active }: NavItemProps) {
  const colorClass = active ? 'text-gray-900' : 'text-gray-400';
  
  return (
    <button className={`flex flex-col items-center gap-1 ${colorClass}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}