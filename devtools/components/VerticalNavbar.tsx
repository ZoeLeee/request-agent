import React from "react";

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  beta?: boolean;
}

interface VerticalNavbarProps {
  items: NavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({
  items,
  activeItem,
  onItemClick
}) => {
  return (
    <div className="vertical-navbar">
      {items.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${activeItem === item.id ? "active" : ""}`}
          onClick={() => onItemClick(item.id)}
          title={item.label}
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
          {item.beta && <div className="beta-badge">BETA</div>}
        </div>
      ))}
    </div>
  );
};

export default VerticalNavbar;
