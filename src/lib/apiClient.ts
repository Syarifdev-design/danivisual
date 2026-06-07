/**
 * API Client for PHP Backend
 *
 * HTTP client untuk berkomunikasi dengan PHP API backend.
 * Auth: Menggunakan session cookie dari backend (BUKAN localStorage).
 *
 * Usage:
 *   import { apiClient } from '../lib/apiClient';
 *   const data = await apiClient.get('/packages');
 */

import { getStoredUser } from "../services/authService";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
}

// ============================================================================
// Storage Keys for Fallback (non-critical data only)
// ============================================================================

export const FALLBACK_STORAGE_KEYS = {
  packages: 'danivisual_admin_packages',
  categories: 'danivisual_admin_categories',
  addons: 'danivisual_admin_addons',
  faqs: 'danivisual_admin_faqs',
  portfolios: 'danivisual_admin_albums',
  media: 'danivisual_admin_media',
  payments: 'danivisual_admin_payments',
  content: 'danivisual_admin_content_v1',
  images: 'danivisual_admin_images_v1',
  bookings: 'danivisual_booking_state_v2',
};

// ============================================================================
// Helper Functions
// ============================================================================

export const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make HTTP request
   * Uses session cookie for auth (backend-managed), NOT localStorage.
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      params,
      headers = {},
      timeout = this.defaultTimeout,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send session cookie
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses gracefully
      const contentType = response.headers.get('content-type') || '';
      let data: ApiResponse<T>;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Try JSON anyway, fall back to error response
        try {
          data = await response.json();
        } catch {
          data = {
            success: false,
            data: {} as T,
            message: response.statusText || 'Invalid response from server',
          } as ApiResponse<T>;
        }
      }

      if (!response.ok) {
        // Handle 401 - redirect to login
        if (response.status === 401) {
          window.location.href = '/admin/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  // ============================================================================
  // Typed API Methods
  // ============================================================================

  // Auth
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async me() {
    return this.get('/auth/me');
  }

  async register(data: { email: string; name: string; password?: string }) {
    return this.post('/auth/register', data);
  }

  // Packages
  async getPackages(params?: { category?: string; active?: number }) {
    return this.get('/packages', params);
  }

  async getPackageById(id: string) {
    return this.get(`/packages/${id}`);
  }

  async createPackage(data: unknown) {
    return this.post('/packages', data);
  }

  async updatePackage(id: string, data: unknown) {
    return this.put(`/packages/${id}`, data);
  }

  // Bookings
  async getBookings(params?: { status?: string; date_from?: string; date_to?: string; q?: string }) {
    return this.get('/bookings', params);
  }

  async getBookingById(id: string) {
    return this.get(`/bookings/${id}`);
  }

  async createBooking(data: unknown) {
    return this.post('/bookings', data);
  }

  async updateBooking(id: string, data: unknown) {
    return this.put(`/bookings/${id}`, data);
  }

  // FAQs
  async getFaqs(params?: { category?: string; published?: number }) {
    return this.get('/faqs', params);
  }

  async getFaqById(id: string) {
    return this.get(`/faqs/${id}`);
  }

  async createFaq(data: unknown) {
    return this.post('/faqs', data);
  }

  async updateFaq(id: string, data: unknown) {
    return this.put(`/faqs/${id}`, data);
  }

  async deleteFaq(id: string) {
    return this.delete(`/faqs/${id}`);
  }

  // Portfolios
  async getPortfolios(params?: { category?: string; featured?: number; published?: number }) {
    return this.get('/portfolios', params);
  }

  async getPortfolioById(id: string) {
    return this.get(`/portfolios/${id}`);
  }

  async getPortfolioBySlug(slug: string) {
    return this.get(`/portfolios/slug/${slug}`);
  }

  async createPortfolio(data: unknown) {
    return this.post('/portfolios', data);
  }

  async updatePortfolio(id: string, data: unknown) {
    return this.put(`/portfolios/${id}`, data);
  }

  async deletePortfolio(id: string) {
    return this.delete(`/portfolios/${id}`);
  }

  // Payments
  async getPayments(params?: { status?: string; booking_id?: string; order_number?: string }) {
    return this.get('/payments', params);
  }

  async getPaymentById(id: string) {
    return this.get(`/payments/${id}`);
  }

  async createPayment(data: unknown) {
    return this.post('/payments', data);
  }

  async verifyPayment(paymentId: string, notes?: string) {
    return this.post('/payments/verify', { payment_id: paymentId, notes });
  }

  async rejectPayment(paymentId: string, notes?: string) {
    return this.post('/payments/reject', { payment_id: paymentId, notes });
  }

  // Inquiries
  async getInquiries(params?: { status?: string }) {
    return this.get('/inquiries', params);
  }

  async createInquiry(data: unknown) {
    return this.post('/inquiries', data);
  }

  async updateInquiry(id: string, data: unknown) {
    return this.put(`/inquiries/${id}`, data);
  }

  // Customers
  async getCustomers(params?: { q?: string }) {
    return this.get('/customers', params);
  }

  async getCustomerById(id: string) {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data: unknown) {
    return this.post('/customers', data);
  }

  async updateCustomer(id: string, data: unknown) {
    return this.put(`/customers/${id}`, data);
  }

  // Content
  async getContentFields(params?: { menu_id?: string }) {
    return this.get('/content/fields', params);
  }

  async updateContentField(data: { menu_id: string; section_id: string; field_id: string; value: string }) {
    return this.post('/content/fields', data);
  }

  async getContentImages() {
    return this.get('/content/images');
  }

  async updateContentImage(data: { field_id: string; url: string }) {
    return this.post('/content/images', data);
  }

  // Calendar
  async getCalendarEvents(params?: { date_from?: string; date_to?: string; type?: string }) {
    return this.get('/calendar', params);
  }

  async getCalendarEventById(id: string) {
    return this.get(`/calendar/${id}`);
  }

  async createCalendarEvent(data: unknown) {
    return this.post('/calendar', data);
  }

  async updateCalendarEvent(id: string, data: unknown) {
    return this.put(`/calendar/${id}`, data);
  }

  async deleteCalendarEvent(id: string) {
    return this.delete(`/calendar/${id}`);
  }

  // Staff
  async getStaff(params?: { role?: string; active?: number }) {
    return this.get('/staff', params);
  }

  async getStaffById(id: string) {
    return this.get(`/staff/${id}`);
  }

  async createStaff(data: unknown) {
    return this.post('/staff', data);
  }

  async updateStaff(id: string, data: unknown) {
    return this.put(`/staff/${id}`, data);
  }

  async deleteStaff(id: string) {
    return this.delete(`/staff/${id}`);
  }

  // Attendance
  async getAttendance(params?: { employee_id?: string; date_from?: string; date_to?: string; status?: string }) {
    return this.get('/attendance', params);
  }

  async checkIn(data?: { date?: string; selfie_url?: string; notes?: string }) {
    return this.post('/attendance', { action: 'check_in', ...data });
  }

  async checkOut(data?: { date?: string }) {
    return this.post('/attendance', { action: 'check_out', ...data });
  }

  async updateAttendance(id: string, data: unknown) {
    return this.put(`/attendance/${id}`, data);
  }

  // Services
  async getServices(params?: { active?: number }) {
    return this.get('/services', params);
  }

  async getServiceById(id: string) {
    return this.get(`/services/${id}`);
  }

  async createService(data: unknown) {
    return this.post('/services', data);
  }

  async updateService(id: string, data: unknown) {
    return this.put(`/services/${id}`, data);
  }

  async deleteService(id: string) {
    return this.delete(`/services/${id}`);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT);

// ============================================================================
// Re-export helpers for direct usage
// ============================================================================

export { FALLBACK_STORAGE_KEYS, getLocalData, setLocalData, generateId };