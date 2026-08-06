import type { RegistrationStage } from "../../domain/entities/RegistrationStage";

export interface RegistrationState {
  readonly stage: RegistrationStage;
  readonly email: string;
  readonly loading: boolean;
  readonly message: string | null;
}

const createInitialState = (): RegistrationState => ({
  stage: "email_entry",
  email: "",
  loading: false,
  message: null,
});

export class RegistrationController {
  private stateValue: RegistrationState = createInitialState();

  private readonly listeners = new Set<() => void>();

  get state(): RegistrationState {
    return this.stateValue;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  setEmail(email: string): void {
    this.patch({ email });
  }

  setStage(stage: RegistrationStage): void {
    this.patch({
      stage,
      message: null,
    });
  }

  setLoading(loading: boolean): void {
    this.patch({ loading });
  }

  setMessage(message: string | null): void {
    this.patch({ message });
  }

  reset(): void {
    this.stateValue = createInitialState();
    this.emit();
  }

  private patch(changes: Partial<RegistrationState>): void {
    this.stateValue = {
      ...this.stateValue,
      ...changes,
    };

    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
