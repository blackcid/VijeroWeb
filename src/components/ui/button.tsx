import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "icon" | "text";
  children?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = "default", className = "", children, ...rest }) => {
  const base = `btn ${variant === "icon" ? "btn-icon" : variant === "text" ? "btn-text" : "btn-default"}`;
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export default Button;
