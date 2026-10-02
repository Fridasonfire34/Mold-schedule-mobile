export interface PanelLabel {
  jobNumber: string;
  panel: string;
}

// Panel labels carry a Data Matrix code shaped `<Job Number>---<Panel>[-...]`:
//   126-0361-TB---C01      -> job 126-0361-TB,  panel C01
//   126-0447-ST-B---W03-1  -> job 126-0447-ST-B, panel W03
// The job is everything before the `---` run (kept exactly as printed, even
// when the label is missing a digit, like ST-B for ST-B1 — that's fixed
// elsewhere), and the panel is the text after it up to the next dash.
// Returns null for anything that doesn't look like a panel label.
export function parsePanelLabel(raw: string): PanelLabel | null {
  const match = /^(.+?)-{3,}([^-\s]+)/.exec(raw.trim());
  if (!match) return null;

  const jobNumber = match[1].trim();
  const panel = match[2].trim();
  if (!jobNumber || !panel) return null;

  return { jobNumber, panel };
}
