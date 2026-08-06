import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly variant?: AppButtonVariant;
  readonly fullWidth?: boolean;
  readonly loading?: boolean;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    {
      children,
      variant = "primary",
      fullWidth = false,
      loading = false,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    const classes = [
      "msd-button",
      `msd-button--${variant}`,
      fullWidth ? "msd-button--full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <span className="msd-spinner" aria-hidden="true" /> : null}
        <span>{children}</span>
      </button>
    );
  },
);
