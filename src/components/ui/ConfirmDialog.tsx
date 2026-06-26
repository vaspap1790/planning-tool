// Imperative dialogs. `useConfirm()` for yes/no, `useChoose()` for a small set of
// labelled choice buttons, `usePickOne()` for a dropdown selection. One dialog
// instance, reused everywhere.
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

interface PickOneOptions<T extends string> {
  title: string;
  message?: string;
  options: { label: string; value: T }[];
  /** Pre-selected value; defaults to the first option. */
  defaultValue?: T;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
type ChooseFn = <T extends string>(opts: ChooseOptions<T>) => Promise<T | null>;
type PickOneFn = <T extends string>(opts: PickOneOptions<T>) => Promise<T | null>;

interface DialogApi {
  confirm: ConfirmFn;
  choose: ChooseFn;
  pickOne: PickOneFn;
}

const DialogContext = createContext<DialogApi | null>(null);

interface Button {
  label: string;
  // null is the cancel/dismiss result
  value: string | null;
  variant: "ghost" | "primary" | "danger";
  autoFocus?: boolean;
}

interface SelectConfig {
  options: { label: string; value: string }[];
  confirmLabel: string;
  cancelLabel: string;
}

interface DialogState {
  open: boolean;
  title: string;
  message?: string;
  buttons: Button[];
  select?: SelectConfig;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: "",
    buttons: [],
  });
  const [selectValue, setSelectValue] = useState("");
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
        ...opts.choices.map<Button>((c) => ({
          label: c.label,
          value: c.value,
          variant: c.danger ? "danger" : "primary",
        })),
        { label: opts.cancelLabel ?? "Cancel", value: null, variant: "ghost" },
      ]) as Promise<T | null>,
    [open]
  );

  const pickOne = useCallback<PickOneFn>(
    <T extends string>(opts: PickOneOptions<T>) => {
      setSelectValue(opts.defaultValue ?? opts.options[0]?.value ?? "");
      setState({
        open: true,
        title: opts.title,
        message: opts.message,
        buttons: [],
        select: {
          options: opts.options,
          confirmLabel: opts.confirmLabel ?? "Add",
          cancelLabel: opts.cancelLabel ?? "Cancel",
        },
      });
      return new Promise<string | null>((resolve) => {
        resolver.current = resolve;
      }) as Promise<T | null>;
    },
    []
  );

  const close = (result: string | null) => {
    resolver.current(result);
    setState((s) => ({ ...s, open: false }));
  };

  const btnClass = (v: Button["variant"]) =>
    v === "ghost" ? "btn btn-ghost" : v === "danger" ? "btn btn-danger" : "btn";

  return (
    <DialogContext.Provider value={{ confirm, choose, pickOne }}>
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

            {state.select && (
              <>
                <select
                  className="text-input modal-select"
                  value={selectValue}
                  autoFocus
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  {state.select.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => close(null)}>
                    {state.select.cancelLabel}
                  </button>
                  <button className="btn" onClick={() => close(selectValue)}>
                    {state.select.confirmLabel}
                  </button>
                </div>
              </>
            )}

            {!state.select && (
              <div
                className={`modal-actions${state.buttons.length > 2 ? " stacked" : ""}`}
              >
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
            )}
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

export function usePickOne(): PickOneFn {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("usePickOne must be used within ConfirmProvider");
  return ctx.pickOne;
}
