/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * "תחקור אירועים" (Closing the Loop / Historical Debrief) View.
 * Matches the Figma design:
 * - Header: Title & subtitle
 * - Filter bar: Date & time range pickers, search input, "החל סינון", "נקה סינון", count badge
 * - Left panel: Map visualizer ("מיקום האירוע") with telemetry bar
 * - Right panel: Events table ("יומן אירועים") with CSV export & pagination
 */
import { useState, useMemo, useEffect } from 'react';
import { useInterceptionEvents } from './useInterceptionEvents';
import { EventsTable } from './components/EventsTable';
import { EventMap } from './components/EventMap';

const PAGE_SIZE = 8;

export function LogsView(): JSX.Element {
  // Load all interception events (live WebSocket updates keep them fresh)
  const { events, isLoading } = useInterceptionEvents('all');

  // Filter States
  const [startDate, setStartDate] = useState('08.09.2026');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endDate, setEndDate] = useState('09.09.2026');
  const [endTime, setEndTime] = useState('23:59:59');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Pagination & Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Apply Search / Filtering
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (!appliedSearch.trim()) return true;
      const q = appliedSearch.toLowerCase().trim();

      const idMatch = evt.id.toLowerCase().includes(q) || `evt-${evt.id}`.toLowerCase().includes(q);
      const droneMatch =
        evt.threat.droneTypeName.toLowerCase().includes(q) ||
        evt.threat.droneId.toLowerCase().includes(q) ||
        `רחפן-${evt.threat.droneId}`.includes(q);
      const systemMatch = evt.launcher.launcherTypeName.toLowerCase().includes(q);
      const interceptorMatch =
        evt.interceptor.interceptorTypeName.toLowerCase().includes(q) ||
        `מיירט-${evt.launcher.liveLauncherId}`.includes(q);

      return idMatch || droneMatch || systemMatch || interceptorMatch;
    });
  }, [events, appliedSearch]);

  // Paginated Slice
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  // Ensure an event is selected by default for map preview
  useEffect(() => {
    if (filteredEvents.length > 0) {
      if (!selectedEventId || !filteredEvents.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(filteredEvents[0]?.id ?? null);
      }
    } else {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  const selectedEvent = useMemo(() => {
    return filteredEvents.find((e) => e.id === selectedEventId) ?? null;
  }, [filteredEvents, selectedEventId]);

  const handleApplyFilter = () => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setStartDate('08.09.2026');
    setStartTime('00:00:00');
    setEndDate('09.09.2026');
    setEndTime('23:59:59');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (filteredEvents.length === 0) return;

    const headers = [
      'מזהה אירוע',
      'מערכת יירוט',
      'מיירט',
      'מזהה רחפן',
      'שעת שיגור',
      'קואורדינטות',
      'סטטוס',
      'תוצאה',
    ];

    const rows = filteredEvents.map((evt) => {
      const coords = evt.threat.lastPosition
        ? `"${evt.threat.lastPosition.latitude}, ${evt.threat.lastPosition.longitude}"`
        : '—';
      const time = new Date(evt.launchedAt).toLocaleTimeString('he-IL');
      return [
        `EVT-2026-${evt.id.padStart(4, '0')}`,
        `"${evt.launcher.launcherTypeName}"`,
        `מיירט-${evt.launcher.liveLauncherId}`,
        `רחפן-${evt.threat.droneId}`,
        time,
        coords,
        evt.status,
        evt.result ?? 'לא בוצע',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `interception-events-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-4">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-white">תחקור אירועים</h1>
        <p className="text-xs text-text-dim">חיפוש, סינון וניתוח אירועי יירוט היסטוריים</p>
      </div>

      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-text">טווח זמן</span>

          {/* Start Date & Time */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded border border-line bg-panel-2 px-2 py-1 text-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-20 bg-transparent text-center font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded border border-line bg-panel-2 px-2 py-1 text-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-16 bg-transparent text-center font-mono focus:outline-none"
              />
            </div>
          </div>

          <span className="text-text-dim">—</span>

          {/* End Date & Time */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded border border-line bg-panel-2 px-2 py-1 text-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-20 bg-transparent text-center font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded border border-line bg-panel-2 px-2 py-1 text-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 16 14" />
              </svg>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-16 bg-transparent text-center font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="חיפוש לפי מזהה אירוע או רחפן"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-64 rounded border border-line bg-panel-2 py-1 pe-3 ps-8 text-xs text-text placeholder:text-text-dim focus:border-line-hot focus:outline-none"
            />
            <svg
              className="pointer-events-none absolute start-2.5 text-text-dim"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Buttons */}
          <button
            onClick={handleApplyFilter}
            className="rounded bg-white px-4 py-1 font-medium text-black transition hover:bg-gray-200"
          >
            החל סינון
          </button>
          <button
            onClick={handleClearFilter}
            className="rounded px-2.5 py-1 text-text-dim transition hover:text-text"
          >
            נקה סינון
          </button>
        </div>

        {/* Counter */}
        <div className="text-xs text-text-dim font-mono">
          {filteredEvents.length} אירועים נמצאו
        </div>
      </div>

      {/* Main 2-Panel Split View */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Left Panel (Map View) */}
        <div className="h-full min-h-[400px] lg:col-span-5">
          <EventMap selectedEvent={selectedEvent} />
        </div>

        {/* Right Panel (Events Table) */}
        <div className="h-full min-h-[400px] lg:col-span-7">
          <EventsTable
            events={paginatedEvents}
            selectedEventId={selectedEventId}
            isLoading={isLoading}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredEvents.length}
            onPageChange={setCurrentPage}
            onSelectEvent={(evt) => setSelectedEventId(evt.id)}
            onExportCsv={handleExportCsv}
          />
        </div>
      </div>
    </div>
  );
}