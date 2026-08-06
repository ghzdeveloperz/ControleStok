import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface AppTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label: string;
  readonly leadingIcon?: ReactNode;
  readonly trailingAction?: ReactNode;
  readonly helperText?: string;
  readonly error?: string;
}

export const AppTextField = forwardRef<HTMLInputElement, AppTextFieldProps>(
  function AppTextField(
    {
      label,
      leadingIcon,
      trailingAction,
      helperText,
      error,
      id,
      className = "",
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    return (
      <label className={`msd-field ${className}`} htmlFor={inputId}>
        <span className="msd-field__label">{label}</span>
        <span
          className={`msd-field__control ${error ? "msd-field__control--error" : ""}`}
        >
          {leadingIcon ? (
            <span className="msd-field__icon" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className="msd-field__input"
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? messageId : undefined}
            {...props}
          />
          {trailingAction}
        </span>
        {error ? (
          <span id={messageId} className="msd-field__error" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span id={messageId} className="msd-field__hint">
            {helperText}
          </span>
        ) : null}
      </label>
    );
  },
);
