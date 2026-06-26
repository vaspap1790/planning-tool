// Initiative name input + optional link with an "open" icon.
// Shared by every tab so the name/link edit experience is identical everywhere.
import { useApp } from "../../state/store";
import type { Initiative } from "../../types";

export function InitiativeNameCell({ initiative }: { initiative: Initiative }) {
  const { updateInitiative } = useApp();
  const i = initiative;
  return (
    <>
      <input
        className={`cell-input strong ${i.name.trim() ? "" : "invalid"}`}
        value={i.name}
        placeholder="Required"
        onChange={(e) => updateInitiative(i.id, { name: e.target.value })}
      />
      <div className="link-row">
        <input
          className="cell-input link-input"
          value={i.link}
          placeholder="https://link (optional)"
          onChange={(e) => updateInitiative(i.id, { link: e.target.value })}
        />
        {i.link && (
          <a
            className="open-link"
            href={i.link}
            target="_blank"
            rel="noreferrer"
            title="Open link"
          >
            ↗
          </a>
        )}
      </div>
    </>
  );
}
