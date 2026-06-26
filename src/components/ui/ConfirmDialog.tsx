// Imperative dialogs. `useConfirm()` for yes/no, `useChoose()` for a small set of
// labelled choices. One dialog instance, reused everywhere.
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface Choice<T extends string> {
  label: string;
  value: T;
  danger?: boolean;
}

interface ChooseOptions<T extends string> {
  title: string;
  message?: string;
  choices: Choice<T>[];
  cancelLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
type ChooseFn = <T extends string>(opts: ChooseOptions<T>) => Promise<T | null>;

interface DialogApi {
  confirm: ConfirmFn;
  choose: ChooseFn;
}

const DialogContext = createContext<DialogApi | null>(null);

interface Button {
  label: string;
  // null is the cancel/dismiss result
  value: string | null;
  variant: "ghost" | "primary" | "danger";
  autoFocus?: boolean;
}

interface DialogState {
  open: boolean;
  title: string;
  message?: string;
  buttons: Button[];
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: "",
    buttons: [],
  });
  const resolver = useRef<(value: string | null) => void>(() => {});

  const open = useCallback(
    (title: string, message: string | undefined, buttons: Button[]) => {
      setState({ open: true, title, message, buttons });
      return new Promise<string | null>((resolve) => {
        resolver.current = resolve;
      });
    },
    []
  );

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      open(opts.title, opts.message, [
        { label: opts.cancelLabel ?? "Cancel", value: null, variant: "ghost" },
        {
          label: opts.confirmLabel ?? "Delete",
          value: "ok",
          variant: opts.danger === false ? "primary" : "danger",
          autoFocus: true,
        },
      ]).then((r) => r === "ok"),
    [open]
  );

  const choose = useCallback<ChooseFn>(
    <T extends string>(opts: ChooseOptions<T>) =>
      open(opts.title, opts.message, [
        { label: opts.cancelLabel ?? "Cancel", value: null, variant: "ghost" },
        ...opts.choices.map<Button>((c) => ({
          label: c.label,
          value: c.value,
          variant: c.danger ? "danger" : "primary",
        })),
      ]) as Promise<T | null>,
    [open]
  );

  const close = (result: string | null) => {
    resolver.current(result);
    setState((s) => ({ ...s, open: false }));
  };

  const btnClass = (v: Button["variant"]) =>
    v === "ghost" ? "btn btn-ghost" : v === "danger" ? "btn btn-danger" : "btn";

  return (
    <DialogContext.Provider value={{ confirm, choose }}>
      {children}
      {state.open && (
        <div className="modal-overlay" onClick={() => close(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">{state.title}</h3>
            {state.message && <p className="modal-message">{state.message}</p>}
            <div className="modal-actions">
              {state.buttons.map((b) => (
                <button
                  key={b.label}
                  className={btnClass(b.variant)}
                  onClick={() => close(b.value)}
                  autoFocus={b.autoFocus}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function useChoose(): ChooseFn {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useChoose must be used within ConfirmProvider");
  return ctx.choose;
}
