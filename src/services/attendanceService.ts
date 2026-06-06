/**
 * Attendance Service
 *
 * Mengelola absensi dengan foto selfie dan GPS.
 * Menggunakan Supabase sebagai sumber utama dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";
import { getAttendanceSettings, type AttendanceSettings } from "./attendanceSettingsService";

// ============================================================================
// Types
// ============================================================================

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "remote";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  date: string;
  checkInTime: string | null;
  checkInSelfieUrl: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutTime: string | null;
  checkOutSelfieUrl: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  status: AttendanceStatus;
  lateMinutes: number;
  workDurationMinutes: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInData {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  date: string;
  selfieDataUrl?: string; // base64 for localStorage
  latitude?: number;
  longitude?: number;
}

export interface CheckOutData {
  selfieDataUrl?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const ATTENDANCE_STORAGE_KEY = "danivisual_attendance_records";
const SELFIE_BUCKET = "attendance-selfies";

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const getLocalArray = <T>(key: string): T[] => {
  const value = getLocalData<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const currentTimeMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getDayKey = (date: string): (typeof DAY_KEYS)[number] => {
  return DAY_KEYS[new Date(`${date}T00:00:00`).getDay()];
};

const roleKey = (role: string) => role.toLowerCase().replace(/\s+/g, "_");

const validateCheckInRules = async (
  data: CheckInData,
  settings: AttendanceSettings
): Promise<string | null> => {
  if (!(settings.requiredAttendanceRoles as string[]).includes(roleKey(data.employeeRole))) {
    return "Role ini tidak diwajibkan absensi.";
  }

  if (!(settings.workingDays as string[]).includes(getDayKey(data.date))) {
    return "Tanggal ini bukan hari kerja absensi.";
  }

  if (settings.requireSelfie && !data.selfieDataUrl) {
    return "Selfie wajib untuk Check In.";
  }

  if (settings.requireGps && (data.latitude === undefined || data.longitude === undefined)) {
    return "GPS location wajib untuk Check In.";
  }

  const nowMinutes = currentTimeMinutes();
  if (nowMinutes < timeToMinutes(settings.earliestCheckInTime)) {
    return `Check In paling awal pukul ${settings.earliestCheckInTime}.`;
  }

  if (nowMinutes > timeToMinutes(settings.latestCheckInTime)) {
    return `Check In paling akhir pukul ${settings.latestCheckInTime}.`;
  }

  if (!settings.allowMultipleCheckinPerDay) {
    const existing = await getAttendanceByEmployee(data.employeeId);
    if (existing.some((record) => record.date === data.date)) {
      return "Check In untuk tanggal ini sudah tercatat.";
    }
  }

  return null;
};

const validateCheckOutRules = (
  data: CheckOutData | undefined,
  settings: AttendanceSettings
): string | null => {
  if (settings.requireSelfie && !data?.selfieDataUrl) {
    return "Selfie wajib untuk Check Out.";
  }

  if (settings.requireGps && (data?.latitude === undefined || data?.longitude === undefined)) {
    return "GPS location wajib untuk Check Out.";
  }

  if (currentTimeMinutes() < timeToMinutes(settings.earliestCheckOutTime)) {
    return `Check Out paling awal pukul ${settings.earliestCheckOutTime}.`;
  }

  return null;
};

// Map database row to AttendanceRecord
const mapRowToAttendance = (row: Record<string, unknown>): AttendanceRecord => ({
  id: row.id as string,
  employeeId: row.employee_id as string,
  employeeName: row.employee_name as string || "",
  employeeRole: row.employee_role as string || "",
  date: row.date as string,
  checkInTime: row.check_in_time as string | null,
  checkInSelfieUrl: row.check_in_selfie_url as string | null,
  checkInLatitude: row.check_in_latitude as number | null,
  checkInLongitude: row.check_in_longitude as number | null,
  checkOutTime: row.check_out_time as string | null,
  checkOutSelfieUrl: row.check_out_selfie_url as string | null,
  checkOutLatitude: row.check_out_latitude as number | null,
  checkOutLongitude: row.check_out_longitude as number | null,
  status: (row.status as AttendanceStatus) || "present",
  lateMinutes: (row.late_minutes as number) || 0,
  workDurationMinutes: row.work_duration_minutes as number | null,
  notes: (row.notes as string) || "",
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// Map AttendanceRecord to database row
const mapToDbRow = (record: Partial<AttendanceRecord>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (record.employeeId !== undefined) row.employee_id = record.employeeId;
  if (record.employeeName !== undefined) row.employee_name = record.employeeName;
  if (record.employeeRole !== undefined) row.employee_role = record.employeeRole;
  if (record.date !== undefined) row.date = record.date;
  if (record.checkInTime !== undefined) row.check_in_time = record.checkInTime;
  if (record.checkInSelfieUrl !== undefined) row.check_in_selfie_url = record.checkInSelfieUrl;
  if (record.checkInLatitude !== undefined) row.check_in_latitude = record.checkInLatitude;
  if (record.checkInLongitude !== undefined) row.check_in_longitude = record.checkInLongitude;
  if (record.checkOutTime !== undefined) row.check_out_time = record.checkOutTime;
  if (record.checkOutSelfieUrl !== undefined) row.check_out_selfie_url = record.checkOutSelfieUrl;
  if (record.checkOutLatitude !== undefined) row.check_out_latitude = record.checkOutLatitude;
  if (record.checkOutLongitude !== undefined) row.check_out_longitude = record.checkOutLongitude;
  if (record.status !== undefined) row.status = record.status;
  if (record.lateMinutes !== undefined) row.late_minutes = record.lateMinutes;
  if (record.workDurationMinutes !== undefined) row.work_duration_minutes = record.workDurationMinutes;
  if (record.notes !== undefined) row.notes = record.notes;
  return row;
};

// ============================================================================
// Selfie Upload
// ============================================================================

/**
 * Upload selfie to Supabase Storage
 * Returns URL or base64 for localStorage fallback
 */
export const uploadSelfie = async (
  file: File | string, // File object or base64 data URL
  employeeId: string,
  type: "check-in" | "check-out"
): Promise<string | null> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${employeeId}/${type}-${timestamp}.jpg`;

  // If it's already a base64 data URL, convert to Blob
  if (typeof file === "string" && file.startsWith("data:")) {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          // Convert base64 to Blob
          const base64Data = file.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/jpeg" });
          const fileObj = new File([blob], filename, { type: "image/jpeg" });

          const { data, error } = await client.storage
            .from(SELFIE_BUCKET)
            .upload(filename, fileObj, { upsert: true });

          if (error) {
            console.warn("[AttendanceService] Storage upload failed:", error);
            return file; // Return base64 as fallback
          }

          const { data: urlData } = client.storage
            .from(SELFIE_BUCKET)
            .getPublicUrl(filename);

          return urlData.publicUrl;
        } catch (err) {
          console.warn("[AttendanceService] Upload error:", err);
          return file; // Return base64 as fallback
        }
      }
    }
    // Return base64 for localStorage fallback
    return file;
  }

  // It's a File object
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.storage
          .from(SELFIE_BUCKET)
          .upload(filename, file as File, { upsert: true });

        if (error) {
          console.warn("[AttendanceService] Storage upload failed:", error);
          return null;
        }

        const { data: urlData } = client.storage
          .from(SELFIE_BUCKET)
          .getPublicUrl(filename);

        return urlData.publicUrl;
      } catch (err) {
        console.warn("[AttendanceService] Upload error:", err);
        return null;
      }
    }
  }

  return null;
};

// ============================================================================
// Geolocation
// ============================================================================

/**
 * Get current GPS coordinates
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("[AttendanceService] Geolocation error:", error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

// ============================================================================
// Attendance Operations
// ============================================================================

/**
 * Ambil semua attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("attendance_records")
          .select("*")
          .order("date", { ascending: false });

        if (!error && data) {
          const records = Array.isArray(data) ? data.map(mapRowToAttendance) : [];
          // Cache to localStorage
          setLocalData(ATTENDANCE_STORAGE_KEY, records);
          return records;
        }
      } catch (err) {
        console.warn("[AttendanceService] Supabase error:", err);
      }
    }
  }

  // Fallback localStorage
  return getLocalArray<AttendanceRecord>(ATTENDANCE_STORAGE_KEY);
};

/**
 * Ambil attendance untuk employee tertentu
 */
export const getAttendanceByEmployee = async (
  employeeId: string
): Promise<AttendanceRecord[]> => {
  if (!employeeId) return [];

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("attendance_records")
          .select("*")
          .eq("employee_id", employeeId)
          .order("date", { ascending: false });

        if (!error && data) {
          return Array.isArray(data) ? data.map(mapRowToAttendance) : [];
        }
      } catch (err) {
        console.warn("[AttendanceService] getAttendanceByEmployee error:", err);
      }
    }
  }

  return getLocalArray<AttendanceRecord>(ATTENDANCE_STORAGE_KEY).filter((record) => record.employeeId === employeeId);
};

/**
 * Ambil attendance untuk tanggal tertentu
 */
export const getAttendanceByDate = async (
  date: string
): Promise<AttendanceRecord[]> => {
  const all = await getAttendanceRecords();
  return all.filter((record) => record.date === date);
};

/**
 * Check-in
 *
 * SECURITY: employeeId must come from authenticated user context.
 * Never trust employeeId from client-side UI or form input.
 * The calling code must pass user.employeeId from AuthContext.
 */
export const checkIn = async (
  data: CheckInData,
  options?: {
    /** Verified employeeId from AuthContext - not from form input */
    verifiedEmployeeId?: string;
    /** User role for permission check */
    userRole?: string;
  }
): Promise<{ success: boolean; record?: AttendanceRecord | null; error?: string }> => {
  // SECURITY: Validate employeeId
  // If verifiedEmployeeId is provided, enforce it matches data.employeeId
  // This prevents malicious users from spoofing employeeId
  if (options?.verifiedEmployeeId && options.verifiedEmployeeId !== data.employeeId) {
    console.error("[AttendanceService] Security violation: employeeId mismatch");
    return {
      success: false,
      error: "Invalid employee. Please contact admin.",
    };
  }

  // Block non-operational roles from self-check-in
  const restrictedRoles = ["customer"];
  if (options?.userRole && restrictedRoles.includes(options.userRole)) {
    return {
      success: false,
      error: "You are not authorized to check in.",
    };
  }

  const settings = await getAttendanceSettings();
  const ruleError = await validateCheckInRules(data, settings);
  if (ruleError) {
    return { success: false, error: ruleError };
  }

  const now = new Date();
  const checkInTime = now.toISOString();

  const lateThreshold = timeToMinutes(settings.workStartTime) + settings.lateToleranceMinutes;
  const lateMinutes = settings.autoMarkLate
    ? Math.max(0, currentTimeMinutes() - lateThreshold)
    : 0;
  const checkInSelfieUrl = data.selfieDataUrl
    ? await uploadSelfie(data.selfieDataUrl, data.employeeId, "check-in")
    : null;

  const newRecord: AttendanceRecord = {
    id: generateId(),
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    employeeRole: data.employeeRole,
    date: data.date,
    checkInTime,
    checkInSelfieUrl,
    checkInLatitude: data.latitude || null,
    checkInLongitude: data.longitude || null,
    checkOutTime: null,
    checkOutSelfieUrl: null,
    checkOutLatitude: null,
    checkOutLongitude: null,
    status: lateMinutes > 0 ? "late" : "present",
    lateMinutes,
    workDurationMinutes: null,
    notes: "",
    createdAt: checkInTime,
    updatedAt: checkInTime,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("attendance_records")
          .insert(mapToDbRow(newRecord))
          .select()
          .single();

        if (!error && dbData) {
          const created = mapRowToAttendance(dbData);
          // Update localStorage cache
          const all = await getAttendanceRecords();
          setLocalData(ATTENDANCE_STORAGE_KEY, [created, ...all]);
          return { success: true, record: created };
        }

        // Handle RLS/policy error
        if (error) {
          console.error("[AttendanceService] checkIn RLS error:", error);
          return {
            success: false,
            error: "Access denied. Please contact admin if this persists.",
          };
        }
      } catch (err) {
        console.warn("[AttendanceService] checkIn error:", err);
      }
    }
  }

  // Fallback localStorage
  const all = await getAttendanceRecords();
  setLocalData(ATTENDANCE_STORAGE_KEY, [newRecord, ...all]);
  return { success: true, record: newRecord };
};

/**
 * Check-out
 *
 * SECURITY: Staff can only check out their own records.
 * recordId must be validated to belong to the authenticated user's employeeId.
 */
export const checkOut = async (
  recordId: string,
  data?: CheckOutData,
  options?: {
    /** Verified employeeId from AuthContext - must match the record's employee_id */
    verifiedEmployeeId?: string;
    /** User role for permission check */
    userRole?: string;
  }
): Promise<{ success: boolean; record?: AttendanceRecord | null; error?: string }> => {
  const now = new Date();
  const checkOutTime = now.toISOString();

  // Calculate work duration
  const all = await getAttendanceRecords();
  const existing = all.find((r) => r.id === recordId);

  if (!existing) {
    return { success: false, error: "Record not found." };
  }

  // SECURITY: Staff can only check out their own records
  if (options?.verifiedEmployeeId && options.verifiedEmployeeId !== existing.employeeId) {
    console.error("[AttendanceService] Security violation: staff trying to check out another employee's record");
    return {
      success: false,
      error: "You can only check out your own attendance.",
    };
  }

  // Block non-operational roles from self-check-out
  const restrictedRoles = ["customer"];
  if (options?.userRole && restrictedRoles.includes(options.userRole)) {
    return {
      success: false,
      error: "You are not authorized to check out.",
    };
  }

  const settings = await getAttendanceSettings();
  const ruleError = validateCheckOutRules(data, settings);
  if (ruleError) {
    return { success: false, error: ruleError };
  }

  if (!settings.allowCheckoutWithoutCheckin && !existing.checkInTime) {
    return { success: false, error: "Check Out membutuhkan Check In terlebih dahulu." };
  }

  const checkOutSelfieUrl = data?.selfieDataUrl
    ? await uploadSelfie(data.selfieDataUrl, existing.employeeId, "check-out")
    : null;

  const updates: Partial<AttendanceRecord> = {
    checkOutTime,
  };

  if (data) {
    updates.checkOutSelfieUrl = checkOutSelfieUrl;
    updates.checkOutLatitude = data.latitude || null;
    updates.checkOutLongitude = data.longitude || null;
    if (data.notes) updates.notes = data.notes;
  }

  // Calculate work duration if we have check-in time
  if (existing.checkInTime) {
    const checkIn = new Date(existing.checkInTime);
    updates.workDurationMinutes = Math.round((now.getTime() - checkIn.getTime()) / 60000);
  }

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("attendance_records")
          .update(mapToDbRow(updates))
          .eq("id", recordId)
          .select()
          .single();

        if (!error && dbData) {
          const updated = mapRowToAttendance(dbData);
          // Update localStorage cache
          const updatedAll = all.map((r) => (r.id === recordId ? updated : r));
          setLocalData(ATTENDANCE_STORAGE_KEY, updatedAll);
          return { success: true, record: updated };
        }

        // Handle RLS/policy error
        if (error) {
          console.error("[AttendanceService] checkOut RLS error:", error);
          return {
            success: false,
            error: "Access denied. Please contact admin if this persists.",
          };
        }
      } catch (err) {
        console.warn("[AttendanceService] checkOut error:", err);
      }
    }
  }

  // Fallback localStorage
  const updatedAll = all.map((r) =>
    r.id === recordId ? { ...r, ...updates, updatedAt: checkOutTime } : r
  );
  setLocalData(ATTENDANCE_STORAGE_KEY, updatedAll);
  const result = updatedAll.find((r) => r.id === recordId) || null;
  return { success: true, record: result };
};

/**
 * Update attendance status (admin)
 */
export const updateAttendanceStatus = async (
  recordId: string,
  status: AttendanceStatus
): Promise<AttendanceRecord | null> => {
  const all = await getAttendanceRecords();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("attendance_records")
          .update({ status })
          .eq("id", recordId)
          .select()
          .single();

        if (!error && dbData) {
          const updated = mapRowToAttendance(dbData);
          const updatedAll = all.map((r) => (r.id === recordId ? updated : r));
          setLocalData(ATTENDANCE_STORAGE_KEY, updatedAll);
          return updated;
        }
      } catch (err) {
        console.warn("[AttendanceService] updateStatus error:", err);
      }
    }
  }

  // Fallback localStorage
  const updatedAll = all.map((r) =>
    r.id === recordId ? { ...r, status, updatedAt: new Date().toISOString() } : r
  );
  setLocalData(ATTENDANCE_STORAGE_KEY, updatedAll);
  return updatedAll.find((r) => r.id === recordId) || null;
};

/**
 * Get attendance stats for an employee
 */
export const getAttendanceStats = async (
  employeeId: string,
  year: number,
  month: number
): Promise<{
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  workDurationAvg: number;
}> => {
  const records = await getAttendanceByEmployee(employeeId);

  const monthRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalDays = monthRecords.length;
  const present = monthRecords.filter((r) => r.status === "present").length;
  const late = monthRecords.filter((r) => r.status === "late").length;
  const absent = monthRecords.filter((r) => r.status === "absent").length;
  const leave = monthRecords.filter((r) => r.status === "leave").length;

  const workDurations = monthRecords
    .filter((r) => r.workDurationMinutes)
    .map((r) => r.workDurationMinutes!);
  const workDurationAvg = workDurations.length > 0
    ? Math.round(workDurations.reduce((a, b) => a + b, 0) / workDurations.length)
    : 0;

  return { totalDays, present, late, absent, leave, workDurationAvg };
};
