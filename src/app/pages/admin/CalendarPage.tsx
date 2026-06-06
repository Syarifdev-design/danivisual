import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon,
  Clock, MapPin, Trash2, Edit2, AlertTriangle, Check
} from "lucide-react";
import { useAdmin, CalendarEvent } from "../../contexts/AdminContext";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const eventTypeConfig: Record<string, { bg: string; text: string; border: string }> = {
  booking: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  blocked: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  event: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

export default function CalendarPage() {
  const { calendarEvents, bookings, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useAdmin();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventList, setShowEventList] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    title: "",
    type: "blocked" as "booking" | "blocked" | "event",
    description: "",
    bookingId: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Get booking events for display
  const bookingEvents = useMemo(() => {
    return bookings
      .filter(b => b.status !== "cancelled" && b.status !== "completed")
      .map(b => ({
        id: `booking-${b.id}`,
        date: b.eventDate,
        title: `${b.customerName} - ${b.packageName}`,
        type: "booking" as const,
        bookingId: b.id,
        description: b.eventLocation,
        createdBy: "system",
      }));
  }, [bookings]);

  // Combine calendar events with booking events
  const allEvents = useMemo(() => {
    return [...calendarEvents, ...bookingEvents];
  }, [calendarEvents, bookingEvents]);

  const getEventsForDate = (date: string) => {
    return allEvents.filter(e => e.date === date);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleOpenModal = (date?: string, event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        date: event.date,
        title: event.title,
        type: event.type,
        description: event.description,
        bookingId: event.bookingId || "",
      });
    } else {
      setEditingEvent(null);
      setFormData({
        date: date || new Date().toISOString().split("T")[0],
        title: "",
        type: "blocked",
        description: "",
        bookingId: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, formData);
    } else {
      addCalendarEvent(formData);
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus event ini?")) {
      deleteCalendarEvent(id);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowEventList(true);
  };

  // Generate calendar cells
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push(dateStr);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Scheduling</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Calendar</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola jadwal booking dan blocked dates untuk menghindari double booking.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
          >
            <Plus size={14} />
            Add Blocked Date
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600">Total Bookings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{bookings.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-600">Blocked Dates</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {calendarEvents.filter(e => e.type === "blocked").length}
          </p>
        </div>
        <div className="rounded-xl border border-border-line bg-white p-4">
          <p className="text-xs text-foreground-secondary">This Month</p>
          <p className="mt-1 text-2xl font-bold">
            {allEvents.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length} events
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-border-line p-4">
          <h3 className="text-lg font-semibold">{monthNames[month]} {year}</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-premium-beige/10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="rounded-lg px-3 py-1 text-sm hover:bg-premium-beige/10">
              Today
            </button>
            <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-premium-beige/10">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-foreground-secondary py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const events = getEventsForDate(date);
              const isToday = date === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={date}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square flex flex-col items-center justify-start rounded-lg border p-1 transition ${
                    isToday
                      ? "border-premium-beige bg-premium-beige/10"
                      : "border-transparent hover:border-border-line"
                  } ${date === selectedDate ? "ring-2 ring-premium-beige" : ""}`}
                >
                  <span className={`text-sm font-semibold ${isToday ? "text-premium-beige" : ""}`}>
                    {new Date(date).getDate()}
                  </span>
                  {events.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                      {events.slice(0, 3).map((event, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${
                            event.type === "booking" ? "bg-emerald-500" :
                            event.type === "blocked" ? "bg-red-500" : "bg-blue-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 border-t border-border-line p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs">Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs">Event</span>
          </div>
        </div>
      </div>

      {/* Event List for Selected Date */}
      {showEventList && selectedDate && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground-secondary">Events on</p>
              <h3 className="text-lg font-semibold">{formatDate(selectedDate)}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal(selectedDate)}
                className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus size={14} /> Add Event
              </button>
              <button onClick={() => setShowEventList(false)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground-secondary">No events for this date</p>
            ) : (
              getEventsForDate(selectedDate).map((event) => {
                const config = eventTypeConfig[event.type];
                return (
                  <div key={event.id} className={`rounded-lg border p-4 ${config.border}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                          {event.type}
                        </span>
                        <h4 className="mt-2 font-semibold">{event.title}</h4>
                        {event.description && (
                          <p className="mt-1 text-sm text-foreground-secondary">{event.description}</p>
                        )}
                        {event.bookingId && (
                          <p className="mt-1 text-xs text-foreground-secondary">Booking ID: {event.bookingId}</p>
                        )}
                      </div>
                      {!event.id.startsWith("booking-") && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenModal(undefined, event)}
                            className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">{editingEvent ? "Edit" : "Add"} Event</p>
                <h3 className="mt-1 text-xl font-semibold">{editingEvent ? "Edit Event" : "New Event"}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setEditingEvent(null); }} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Date *</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClassName} placeholder="Event title" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Type *</label>
                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className={inputClassName}>
                  <option value="blocked">Blocked Date</option>
                  <option value="event">Special Event</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClassName} rows={2} placeholder="Additional details" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingEvent(null); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">{editingEvent ? "Update" : "Add"} Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}