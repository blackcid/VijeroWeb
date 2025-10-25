import React from "react";
import Button from "./button";

export const Menu: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <div className={`ui-menu ${className}`} role="menu">
      {children}
    </div>
  );
};

export default Menu;
