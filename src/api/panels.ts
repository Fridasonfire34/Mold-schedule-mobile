import axios from 'axios';
import api from './client';
import { PanelLabel } from '../labels';

export interface PendingPanel {
  idOk: string;
  jobNumber: string;
  partNumber: string;
  panel: string;
  width: string | null;
  hgt: string | null;
  mold: string;
  moldName: string;
  position: string | null;
  // Set when this unit was marked DEFECTIVE earlier and is being re-checked.
  defect: string | null;
  // Kind of panel (Wall, Ceiling, TGC, Corner, 2R Panel…); decides which
  // molds it can come out of.
  panelIdentifier: string | null;
}

export type LookupResult =
  | {
      status: 'found';
      panel: PendingPanel;
      assignedUnits: number;
      completeUnits: number;
      defectUnits: number;
    }
  | { status: 'not_found' }
  | { status: 'not_assigned' }
  | { status: 'all_complete'; assignedUnits: number }
  // The units not complete are with Repairs, which completes them itself.
  | { status: 'in_repair'; repairUnits: number }
  | { status: 'error'; message: string };

export interface DefectType {
  id: number;
  name: string;
  requiresNote: boolean;
}

export type Verdict =
  | { result: 'GOOD' }
  | { result: 'DEFECT'; defectTypeIds: number[]; note?: string; photoBase64?: string };

export type InspectResult =
  | {
      status: 'saved';
      result: 'GOOD' | 'DEFECT';
      defect: string | null;
      photoSaved: boolean;
      moldName: string;
      assignedUnits: number;
      completeUnits: number;
    }
  | { status: 'error'; message: string };

const connectionError = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && !error.response
    ? 'No connection to the server. Check the Wi-Fi.'
    : fallback;

// GET /cleaning/lookup — see tafco-main src/app/api-mobile/molds/cleaning/lookup.
// Finds the unit of the scanned panel that an inspection would apply to.
export async function lookupPanel(label: PanelLabel): Promise<LookupResult> {
  try {
    const { data } = await api.get('/cleaning/lookup', {
      params: { job: label.jobNumber, part: label.panel },
    });
    return {
      status: 'found',
      panel: data.panel,
      assignedUnits: data.assignedUnits,
      completeUnits: data.completeUnits,
      defectUnits: data.defectUnits ?? 0,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { data } = error.response;
      if (data?.reason === 'NOT_FOUND') return { status: 'not_found' };
      if (data?.reason === 'NOT_ASSIGNED') return { status: 'not_assigned' };
      if (data?.reason === 'ALL_COMPLETE') {
        return { status: 'all_complete', assignedUnits: data.assignedUnits };
      }
      if (data?.reason === 'IN_REPAIR') {
        return { status: 'in_repair', repairUnits: data.repairUnits ?? 0 };
      }
    }
    return { status: 'error', message: connectionError(error, 'Server error. Try again in a moment.') };
  }
}

export interface Mold {
  code: string; // [All Molds].[Mold Number], e.g. DGV_M2AB_W
  name: string; // e.g. Mold 2 A&B
  group: string; // e.g. Walls
}

// GET /molds — the molds this kind of panel can come out of, for
// "Completed in" (always including the one it was assigned to).
export async function fetchMolds(
  panelIdentifier: string | null,
  assigned: string,
): Promise<Mold[]> {
  const { data } = await api.get<{ molds: Mold[] }>('/molds', {
    params: { panelIdentifier: panelIdentifier ?? '', assigned },
  });
  return data.molds;
}

// A–Z, with the ones that ask for a note ("Other") last.
export const sortDefectTypes = (types: DefectType[]): DefectType[] =>
  [...types].sort(
    (a, b) =>
      Number(a.requiresNote) - Number(b.requiresNote) ||
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  );

// GET /defect-types — the list the operator picks from, sorted A–Z.
export async function fetchDefectTypes(): Promise<DefectType[]> {
  const { data } = await api.get<{ defectTypes: DefectType[] }>('/defect-types');
  return sortDefectTypes(data.defectTypes);
}

// POST /defect-types — saves a defect typed under "Other" to the list, for
// everyone. Returns the entry to select, or a message to show.
export async function addDefectType(
  name: string,
): Promise<{ ok: true; defectType: DefectType } | { ok: false; message: string }> {
  try {
    const { data } = await api.post<{ defectType: DefectType }>('/defect-types', { name });
    return { ok: true, defectType: data.defectType };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return { ok: false, message: error.response.data?.error ?? 'Check the defect name.' };
    }
    return { ok: false, message: connectionError(error, 'Could not add it. Try again.') };
  }
}

// POST /cleaning/inspect — GOOD completes the unit, DEFECT marks it
// DEFECTIVE; both are kept in the inspection history. `completedMold` is the
// mold the operator says the panel came out of (it can differ from the one
// it was assigned to).
export async function inspectPanel(
  label: PanelLabel,
  verdict: Verdict,
  userId: number,
  completedMold: string,
): Promise<InspectResult> {
  try {
    const { data } = await api.post('/cleaning/inspect', {
      job: label.jobNumber,
      part: label.panel,
      userId,
      completedMold,
      ...verdict,
    });
    return {
      status: 'saved',
      result: data.result,
      defect: data.defect,
      photoSaved: !!data.photoSaved,
      moldName: data.completedMoldName ?? data.unit.moldName,
      assignedUnits: data.assignedUnits,
      completeUnits: data.completeUnits,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.reason === 'ALL_COMPLETE') {
      return { status: 'error', message: 'Every unit of this panel is already complete.' };
    }
    // Rejections the operator can act on (a missing description, a photo
    // too large, a unit marked defective today) come with a readable message.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (axios.isAxiosError(error) && (status === 400 || status === 409)) {
      return { status: 'error', message: error.response?.data?.error ?? 'Check the form.' };
    }
    return { status: 'error', message: connectionError(error, 'Could not save. Try again.') };
  }
}

export interface PrintLabelData {
  jobNumber: string;
  partNumber: string;
  initials: string;
  good: boolean;
  // NO BUENO only: the defects as saved, e.g. "Shallow groove, Soft foam".
  defect?: string | null;
}

export type PrintLabelResult = { status: 'printed' } | { status: 'error'; message: string };

// POST /cleaning/print-label — the server prints the 6" x 2.01" label on the
// label printer attached to it (see tafco-main
// src/app/api-mobile/molds/cleaning/print-label).
export async function printLabel(data: PrintLabelData): Promise<PrintLabelResult> {
  try {
    await api.post('/cleaning/print-label', data, { timeout: 40000 });
    return { status: 'printed' };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.reason === 'PRINTER_NOT_FOUND') {
      return { status: 'error', message: `Printer not found: ${error.response.data.printer}. Ask the supervisor.` };
    }
    return { status: 'error', message: connectionError(error, 'Could not print the label. Try again.') };
  }
}
