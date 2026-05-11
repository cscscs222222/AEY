import React from "react";

interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ title, action, children, className }: CardProps) => (
  <section className={`sz-card ${className ?? ""}`.trim()}>
    {(title || action) && (
      <div className="sz-card-header">
        {title && <h3>{title}</h3>}
        {action}
      </div>
    )}
    <div className="sz-card-body">{children}</div>
  </section>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => (
  <button {...props} className={`sz-button sz-${variant} ${className ?? ""}`.trim()} />
);
