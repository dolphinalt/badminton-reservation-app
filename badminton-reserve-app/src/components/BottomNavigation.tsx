import NavItem from "./NavItem.tsx";

interface BottomNavigationProps {
  activeTab: "reservations" | "groups";
  onTabChange: (tab: "reservations" | "groups") => void;
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center py-4 max-w-md mx-auto">
        {/* <NavItem
          icon={
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          }
          label="Home"
          active={false}
        /> */}

        <NavItem
          icon={
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          }
          label="Reservations"
          active={activeTab === "reservations"}
          onClick={() => onTabChange("reservations")}
        />

        <NavItem
          icon={
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          }
          label="Groups"
          active={activeTab === "groups"}
          onClick={() => onTabChange("groups")}
        />
      </div>
    </div>
  );
}
