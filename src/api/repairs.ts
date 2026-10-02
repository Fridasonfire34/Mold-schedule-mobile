import axios from 'axios';
import api, { API_BASE_URL } from './client';
import { PanelLabel } from '../labels';
import { PendingPanel } from './panels';

// REPAIRED = fixed (the unit becomes COMPLETED); REORDER = can't be fixed,
// it's poured again.
export type RepairDecision = 'REPAIRED' | 'REORDER';

// A unit Cleaning marked defective, now in Repairs (REPAIR status).
export interface RepairUnit extends PendingPanel {
  // What Cleaning checked (the starting point to confirm or change).
  defectTypeIds: number[];
  defectNote: string | null;
  // Cleaning took a photo of the defect (see defectPhotoUrl).
  hasPhoto: boolean;
  // When and by whom it was marked defective.
  markedAt: string | null;
  markedByName: string | null;
}

export type RepairLookupResult =
  | {
      status: 'found';
      // Every unit of the panel in repair, oldest first. A label can't tell
      // identical units apart, so with more than one the operator picks the
      // piece in front of them.
      units: RepairUnit[];
      assignedUnits: number;
      // Units in repair.
      defectUnits: number;
      reorderUnits: number;
    }
  | { status: 'not_found' }
  | { status: 'not_assigned' }
  // No unit of the panel is in repair (none marked defective by Cleaning,
  // or all of them already repaired / sent to reorder).
  | { status: 'none_pending'; panel: PendingPanel | null; reorderUnits: number }
  | { status: 'error'; message: string };

export type RepairSaveResult =
  | { status: 'saved'; decision: RepairDecision }
  | { status: 'error'; message: string };

const connectionError = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && !error.response
    ? 'No connection to the server. Check the Wi-Fi.'
    : fallback;

// GET /repairs/lookup — see tafco-main src/app/api-mobile/molds/repairs/lookup.
export async function lookupRepair(label: PanelLabel): Promise<RepairLookupResult> {
  try {
    const { data } = await api.get('/repairs/lookup', {
      params: { job: label.jobNumber, part: label.panel },
    });
    return {
      status: 'found',
      units: data.units ?? [],
      assignedUnits: data.assignedUnits,
      defectUnits: data.defectUnits ?? 0,
      reorderUnits: data.reorderUnits ?? 0,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { data } = error.response;
      if (data?.reason === 'NOT_FOUND') return { status: 'not_found' };
      if (data?.reason === 'NOT_ASSIGNED') return { status: 'not_assigned' };
      if (data?.reason === 'NONE_PENDING') {
        return {
          status: 'none_pending',
          panel: data.panel ?? null,
          reorderUnits: data.reorderUnits ?? 0,
        };
      }
    }
    return { status: 'error', message: connectionError(error, 'Server error. Try again in a moment.') };
  }
}

// GET /repairs/photo — the photo Cleaning took when it marked the unit
// defective, as an image URL for <Image>.
export const defectPhotoUrl = (idOk: string) =>
  `${API_BASE_URL}/repairs/photo?idOk=${encodeURIComponent(idOk)}`;

export interface DefectSelection {
  defectTypeIds: number[];
  // Text for "Other".
  note: string;
}

// POST /repairs/status — the unit was repaired (COMPLETED) or has to be
// reordered, with the defect as the operator confirmed or changed it.
export async function saveRepairDecision(
  idOk: string,
  decision: RepairDecision,
  userId: number,
  defect: DefectSelection,
): Promise<RepairSaveResult> {
  try {
    await api.post('/repairs/status', {
      idOk,
      status: decision,
      userId,
      defectTypeIds: defect.defectTypeIds,
      defectNote: defect.note,
    });
    return { status: 'saved', decision };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.reason === 'NOT_IN_REPAIR') {
      return { status: 'error', message: 'Someone already finished this panel.' };
    }
    if (axios.isAxiosError(error) && error.response?.data?.reason === 'REORDER_ONLY') {
      return { status: 'error', message: 'You can only send panels to reorder.' };
    }
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return { status: 'error', message: error.response.data?.error ?? 'Check the defect.' };
    }
    return { status: 'error', message: connectionError(error, 'Could not save. Try again.') };
  }
}

// The server stores its local time, and the driver hands it over labeled as
// UTC — formatting in UTC shows it as it was stored.
export const formatServerTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    : null;

export type RepairCaseStatus = 'IN REPAIR' | 'REPAIRED' | 'REORDER' | 'CANCELLED';

// One row of [Panel Repairs]: a unit Cleaning marked defective and what
// became of it.
export interface RepairCase {
  id: string;
  idOk: string;
  jobNumber: string | null;
  partNumber: string | null;
  moldName: string;
  status: RepairCaseStatus;
  // What Cleaning marked…
  defect: string | null;
  markedAt: string | null;
  markedByName: string | null;
  // …and what Repairs confirmed or changed it to.
  finalDefect: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  // REORDER only: the new piece was cleaned and marked Good.
  reorderCompletedAt: string | null;
  reorderCompletedByName: string | null;
}

export type RepairLogResult =
  | {
      status: 'ok';
      cases: RepairCase[];
      // Only on the first page (offset 0).
      counts?: Partial<Record<RepairCaseStatus, number>>;
      // There are older cases after this page.
      hasMore: boolean;
    }
  | { status: 'error'; message: string };

// GET /repairs/log — see tafco-main src/app/api-mobile/molds/repairs/log.
// One page at a time: offset = how many cases the list already has.
export async function fetchRepairLog(
  filter: { status?: RepairCaseStatus; search?: string; date?: string } = {},
  page: { offset?: number; limit?: number } = {},
): Promise<RepairLogResult> {
  try {
    const { data } = await api.get('/repairs/log', {
      params: {
        status: filter.status || undefined,
        search: filter.search?.trim() || undefined,
        // YYYY-MM-DD: anything marked, resolved or reorder-completed that day.
        date: filter.date || undefined,
        offset: page.offset || undefined,
        limit: page.limit || undefined,
      },
    });
    return {
      status: 'ok',
      cases: data.cases ?? [],
      counts: data.counts,
      hasMore: data.hasMore === true,
    };
  } catch (error) {
    return { status: 'error', message: connectionError(error, 'Could not load the log. Try again.') };
  }
}
