import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

export type AppFeedbackTone = "error" | "success" | "warning" | "info";

export interface AppFeedbackProps {
  readonly children: ReactNode;
  readonly tone?: AppFeedbackTone;
}

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
} as const;

export const AppFeedback = ({ children, tone = "info" }: AppFeedbackProps) => {
  const Icon = icons[tone];

  return (
    <div
      className={`msd-feedback msd-feedback--${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon size={19} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
};
