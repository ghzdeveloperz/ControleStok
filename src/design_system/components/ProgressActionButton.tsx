import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface ProgressActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
}

export const ProgressActionButton = forwardRef<
  HTMLButtonElement,
  ProgressActionButtonProps
>(function ProgressActionButton(
  {
    children,
    loading = false,
    fullWidth = false,
    disabled = false,
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const classes = [
    "msd-progress-action",
    fullWidth ? "msd-progress-action--full" : "",
    loading ? "msd-progress-action--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className="msd-progress-action__label">
        {loading ? "Processando..." : children}
      </span>

      {loading && (
        <span
          className="msd-progress-action__spinner"
          aria-hidden="true"
        />
      )}
    </button>
  );
});
