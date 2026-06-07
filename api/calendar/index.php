<?php
/**
 * Calendar API Endpoint
 * GET /api/calendar - List calendar events
 * GET /api/calendar/:id - Get single event
 * POST /api/calendar - Create event (admin)
 * PUT /api/calendar/:id - Update event (admin)
 * DELETE /api/calendar/:id - Delete event (admin)
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', trim($path, '/')));
$lastPart = end($parts);

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            if (is_numeric($lastPart) && $lastPart !== 'calendar') {
                getCalendarEvent($db, $lastPart);
            } else {
                listCalendarEvents($db);
            }
            break;

        case 'POST':
            createCalendarEvent($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateCalendarEvent($db, $lastPart);
            } else {
                errorResponse('Event ID required', 400);
            }
            break;

        case 'DELETE':
            if (is_numeric($lastPart)) {
                deleteCalendarEvent($db, $lastPart);
            } else {
                errorResponse('Event ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Calendar API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List calendar events
 */
function listCalendarEvents($db) {
    $dateFrom = $_GET['date_from'] ?? null;
    $dateTo = $_GET['date_to'] ?? null;
    $type = $_GET['type'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($dateFrom) {
        $where[] = 'event_date >= ?';
        $params[] = $dateFrom;
    }
    if ($dateTo) {
        $where[] = 'event_date <= ?';
        $params[] = $dateTo;
    }
    if ($type) {
        $where[] = 'event_type = ?';
        $params[] = $type;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM calendar_events WHERE $whereClause ORDER BY event_date, created_at");
    $stmt->execute($params);
    $events = $stmt->fetchAll();

    $data = array_map(function($event) {
        return [
            'id' => $event['id'],
            'date' => $event['event_date'],
            'endDate' => $event['end_date'] ?? '',
            'title' => $event['title'],
            'description' => $event['description'] ?? '',
            'type' => $event['event_type'],
            'bookingId' => $event['booking_id'] ?? '',
            'bookingOrderNumber' => $event['booking_order_number'] ?? '',
            'color' => $event['color'] ?? '#3B82F6',
            'createdBy' => $event['created_by'] ?? '',
            'createdByName' => $event['created_by_name'] ?? '',
            'isAllDay' => (bool)($event['is_all_day'] ?? true),
            'createdAt' => $event['created_at']
        ];
    }, $events);

    successResponse($data);
}

/**
 * Get calendar event by ID
 */
function getCalendarEvent($db, $id) {
    $stmt = $db->prepare('SELECT * FROM calendar_events WHERE id = ?');
    $stmt->execute([$id]);
    $event = $stmt->fetch();

    if (!$event) {
        errorResponse('Event not found', 404);
    }

    $data = [
        'id' => $event['id'],
        'date' => $event['event_date'],
        'endDate' => $event['end_date'] ?? '',
        'title' => $event['title'],
        'description' => $event['description'] ?? '',
        'type' => $event['event_type'],
        'bookingId' => $event['booking_id'] ?? '',
        'bookingOrderNumber' => $event['booking_order_number'] ?? '',
        'color' => $event['color'] ?? '#3B82F6',
        'createdBy' => $event['created_by'] ?? '',
        'createdByName' => $event['created_by_name'] ?? '',
        'isAllDay' => (bool)($event['is_all_day'] ?? true),
        'createdAt' => $event['created_at']
    ];

    successResponse($data);
}

/**
 * Create calendar event
 */
function createCalendarEvent($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['date', 'title', 'type']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();
    $user = getCurrentUser();

    $stmt = $db->prepare("
        INSERT INTO calendar_events
        (id, event_date, end_date, title, description, event_type, booking_id, booking_order_number,
         color, created_by, created_by_name, is_all_day, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['date']),
        sanitize($body['end_date'] ?? $body['endDate'] ?? ''),
        sanitize($body['title']),
        sanitize($body['description'] ?? ''),
        sanitize($body['type']),
        sanitize($body['booking_id'] ?? $body['bookingId'] ?? ''),
        sanitize($body['booking_order_number'] ?? $body['bookingOrderNumber'] ?? ''),
        sanitize($body['color'] ?? '#3B82F6'),
        getCurrentUserId(),
        $user['name'] ?? $user['username'] ?? '',
        (int)($body['is_all_day'] ?? $body['isAllDay'] ?? 1)
    ]);

    logActivity(getCurrentUserId(), $user['username'], 'create_calendar_event', 'calendar_events', $id, "Created event: " . $body['title']);

    http_response_code(201);
    successResponse(['id' => $id], 'Event created');
}

/**
 * Update calendar event
 */
function updateCalendarEvent($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if event exists
    $stmt = $db->prepare('SELECT id FROM calendar_events WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Event not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['date', 'end_date', 'title', 'description', 'type', 'booking_id', 'booking_order_number', 'color', 'is_all_day'];
    foreach ($fields as $field) {
        $dbField = $field;
        if (isset($body[$field])) {
            $updates[] = "{$dbField} = ?";
            $params[] = sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE calendar_events SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_calendar_event', 'calendar_events', $id, "Updated event");

    successResponse(['id' => $id], 'Event updated');
}

/**
 * Delete calendar event
 */
function deleteCalendarEvent($db, $id) {
    requireAdmin();

    // Check if event exists
    $stmt = $db->prepare('SELECT id FROM calendar_events WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Event not found', 404);
    }

    $stmt = $db->prepare('DELETE FROM calendar_events WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'delete_calendar_event', 'calendar_events', $id, "Deleted event");

    successResponse(null, 'Event deleted');
}
