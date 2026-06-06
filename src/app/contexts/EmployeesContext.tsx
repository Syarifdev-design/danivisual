import { createContext, useContext, useState, useMemo, ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

export type EmployeeRole = "photographer" | "videographer" | "editor" | "admin" | "finance" | "staff";

export type AttendanceStatus = "present" | "late" | "absent" | "leave";

export interface Employee {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  isActive: boolean;
  joinDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: EmployeeRole;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface EmployeesContextType {
  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deactivateEmployee: (id: string) => void;
  reactivateEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;

  // Attendance
  attendance: Attendance[];
  addAttendance: (attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">) => void;
  updateAttendance: (id: string, updates: Partial<Attendance>) => void;
  getAttendanceByEmployee: (employeeId: string) => Attendance[];
  getAttendanceByDate: (date: string) => Attendance[];
  getAttendanceByMonth: (year: number, month: number) => Attendance[];
}

const EMPLOYEES_KEY = "danivisual_employees";
const ATTENDANCE_KEY = "danivisual_attendance";

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Load from localStorage
function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

// Save to localStorage
function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadFromStorage(EMPLOYEES_KEY, [])
  );
  const [attendance, setAttendance] = useState<Attendance[]>(() =>
    loadFromStorage(ATTENDANCE_KEY, [])
  );

  // Save employees on change
  const employeesValue = useMemo(() => {
    saveToStorage(EMPLOYEES_KEY, employees);
    return employees;
  }, [employees]);

  // Save attendance on change
  const attendanceValue = useMemo(() => {
    saveToStorage(ATTENDANCE_KEY, attendance);
    return attendance;
  }, [attendance]);

  // ============================================================================
  // Employee Operations
  // ============================================================================

  const addEmployee = (data: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newEmployee: Employee = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      )
    );
  };

  const deactivateEmployee = (id: string) => {
    updateEmployee(id, { isActive: false });
  };

  const reactivateEmployee = (id: string) => {
    updateEmployee(id, { isActive: true });
  };

  const getEmployee = (id: string) => {
    return employees.find((e) => e.id === id);
  };

  // ============================================================================
  // Attendance Operations
  // ============================================================================

  const addAttendance = (data: Omit<Attendance, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newAttendance: Attendance = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setAttendance((prev) => [...prev, newAttendance]);
  };

  const updateAttendance = (id: string, updates: Partial<Attendance>) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  const getAttendanceByEmployee = (employeeId: string) => {
    return attendance.filter((a) => a.employeeId === employeeId);
  };

  const getAttendanceByDate = (date: string) => {
    return attendance.filter((a) => a.date === date);
  };

  const getAttendanceByMonth = (year: number, month: number) => {
    return attendance.filter((a) => {
      const d = new Date(a.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  // ============================================================================
  // Value
  // ============================================================================

  const value = {
    employees: employeesValue,
    addEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    getEmployee,
    attendance: attendanceValue,
    addAttendance,
    updateAttendance,
    getAttendanceByEmployee,
    getAttendanceByDate,
    getAttendanceByMonth,
  };

  return (
    <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error("useEmployees must be used within EmployeesProvider");
  }
  return context;
}

// ============================================================================
// Role Labels
// ============================================================================

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  editor: "Editor",
  admin: "Admin",
  finance: "Finance",
  staff: "Staff",
};

// ============================================================================
// Attendance Status Labels
// ============================================================================

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Tidak Hadir",
  leave: "Cuti",
};

// ============================================================================
// Default Employees (Seed Data)
// ============================================================================

export const DEFAULT_EMPLOYEES: Omit<Employee, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Ahmad Photographer",
    email: "ahmad@danivisual.app",
    phone: "081234567890",
    role: "photographer",
    isActive: true,
    joinDate: "2024-01-01",
    notes: "Lead photographer",
  },
  {
    name: "Budi Videographer",
    email: "budi@danivisual.app",
    phone: "081234567891",
    role: "videographer",
    isActive: true,
    joinDate: "2024-02-01",
    notes: "Videographer utama",
  },
  {
    name: "Cita Editor",
    email: "cita@danivisual.app",
    phone: "081234567892",
    role: "editor",
    isActive: true,
    joinDate: "2024-03-01",
    notes: "Photo editor",
  },
];
