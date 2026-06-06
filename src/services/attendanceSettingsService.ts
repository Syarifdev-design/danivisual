import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

export type AttendanceRole = "staff" | "editor" | "photographer" | "videographer" | "admin" | "finance";
export type WorkingDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface AttendanceSettings {
  workStartTime: string;
  workEndTime: string;
  lateToleranceMinutes: number;
  earliestCheckInTime: string;
  latestCheckInTime: string;
  earliestCheckOutTime: string;
  requireSelfie: boolean;
  requireGps: boolean;
  allowCheckoutWithoutCheckin: boolean;
  allowMultipleCheckinPerDay: boolean;
  workingDays: WorkingDay[];
  autoMarkLate: boolean;
  autoMarkAbsent: boolean;
  requiredAttendanceRoles: AttendanceRole[];
}

const STORAGE_KEY = "danivisual_attendance_settings";
const SETTINGS_ID = "default";

export function getDefaultAttendanceSettings(): AttendanceSettings {
  return {
    workStartTime: "09:00",
    workEndTime: "17:00",
    lateToleranceMinutes: 15,
    earliestCheckInTime: "07:00",
    latestCheckInTime: "12:00",
    earliestCheckOutTime: "16:00",
    requireSelfie: true,
    requireGps: false,
    allowCheckoutWithoutCheckin: false,
    allowMultipleCheckinPerDay: false,
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    autoMarkLate: true,
    autoMarkAbsent: false,
    requiredAttendanceRoles: ["staff", "editor", "photographer", "videographer"],
  };
}

function readLocalSettings(): AttendanceSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeSettings(JSON.parse(stored)) : getDefaultAttendanceSettings();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultAttendanceSettings();
  }
}

function writeLocalSettings(settings: AttendanceSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function normalizeSettings(value: Partial<AttendanceSettings> | null | undefined): AttendanceSettings {
  const defaults = getDefaultAttendanceSettings();
  return {
    ...defaults,
    ...(value || {}),
    lateToleranceMinutes: Number(value?.lateToleranceMinutes ?? defaults.lateToleranceMinutes),
    workingDays: Array.isArray(value?.workingDays) ? value.workingDays : defaults.workingDays,
    requiredAttendanceRoles: Array.isArray(value?.requiredAttendanceRoles)
      ? value.requiredAttendanceRoles
      : defaults.requiredAttendanceRoles,
  };
}

function rowToSettings(row: Record<string, unknown>): AttendanceSettings {
  return normalizeSettings({
    workStartTime: String(row.work_start_time || ""),
    workEndTime: String(row.work_end_time || ""),
    lateToleranceMinutes: Number(row.late_tolerance_minutes || 0),
    earliestCheckInTime: String(row.earliest_check_in_time || ""),
    latestCheckInTime: String(row.latest_check_in_time || ""),
    earliestCheckOutTime: String(row.earliest_check_out_time || ""),
    requireSelfie: row.require_selfie === true,
    requireGps: row.require_gps === true,
    allowCheckoutWithoutCheckin: row.allow_checkout_without_checkin === true,
    allowMultipleCheckinPerDay: row.allow_multiple_checkin_per_day === true,
    workingDays: row.working_days as WorkingDay[],
    autoMarkLate: row.auto_mark_late === true,
    autoMarkAbsent: row.auto_mark_absent === true,
    requiredAttendanceRoles: row.required_attendance_roles as AttendanceRole[],
  });
}

function settingsToRow(settings: AttendanceSettings) {
  return {
    id: SETTINGS_ID,
    work_start_time: settings.workStartTime,
    work_end_time: settings.workEndTime,
    late_tolerance_minutes: settings.lateToleranceMinutes,
    earliest_check_in_time: settings.earliestCheckInTime,
    latest_check_in_time: settings.latestCheckInTime,
    earliest_check_out_time: settings.earliestCheckOutTime,
    require_selfie: settings.requireSelfie,
    require_gps: settings.requireGps,
    allow_checkout_without_checkin: settings.allowCheckoutWithoutCheckin,
    allow_multiple_checkin_per_day: settings.allowMultipleCheckinPerDay,
    working_days: settings.workingDays,
    auto_mark_late: settings.autoMarkLate,
    auto_mark_absent: settings.autoMarkAbsent,
    required_attendance_roles: settings.requiredAttendanceRoles,
    updated_at: new Date().toISOString(),
  };
}

export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("attendance_settings")
          .select("*")
          .eq("id", SETTINGS_ID)
          .maybeSingle();

        if (!error && data) {
          const settings = rowToSettings(data);
          writeLocalSettings(settings);
          return settings;
        }

        if (error && !import.meta.env.DEV) {
          throw error;
        }
      } catch (err) {
        if (!import.meta.env.DEV) throw err;
        console.warn("[AttendanceSettings] Supabase read failed:", err);
      }
    }
  }

  return readLocalSettings();
}

export async function updateAttendanceSettings(data: Partial<AttendanceSettings>): Promise<AttendanceSettings> {
  const settings = normalizeSettings({ ...(await getAttendanceSettings()), ...data });

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: saved, error } = await client
          .from("attendance_settings")
          .upsert(settingsToRow(settings), { onConflict: "id" })
          .select("*")
          .single();

        if (!error && saved) {
          const next = rowToSettings(saved);
          writeLocalSettings(next);
          return next;
        }

        if (error && !import.meta.env.DEV) {
          throw error;
        }
      } catch (err) {
        if (!import.meta.env.DEV) throw err;
        console.warn("[AttendanceSettings] Supabase update failed:", err);
      }
    }
  }

  writeLocalSettings(settings);
  return settings;
}
