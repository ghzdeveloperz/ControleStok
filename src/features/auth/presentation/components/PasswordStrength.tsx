import { evaluatePasswordStrength } from "../../domain/password-strength";

export const PasswordStrength = ({ password }: { readonly password: string }) => {
  const strength = evaluatePasswordStrength(password);

  return (
    <div className="msd-password-strength" aria-live="polite">
      <div className="msd-password-strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            data-level={strength.score}
            className={`msd-password-strength__bar ${
              level <= strength.score ? "msd-password-strength__bar--active" : ""
            }`}
          />
        ))}
      </div>
      <p className="msd-password-strength__label">{strength.label}</p>
    </div>
  );
};
