<?php
/**
 * Inquiries API Endpoint
 * GET /api/inquiries - List all inquiries
 * GET /api/inquiries/:id - Get single inquiry
 * POST /api/inquiries - Create inquiry (public)
 * PUT /api/inquiries/:id - Update inquiry (admin)
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
            if (is_numeric($lastPart) && $lastPart !== 'inquiries') {
                getInquiryById($db, $lastPart);
            } else {
                listInquiries($db);
            }
            break;

        case 'POST':
            createInquiry($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateInquiry($db, $lastPart);
            } else {
                errorResponse('Inquiry ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Inquiry API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all inquiries
 */
function listInquiries($db) {
    $user = getCurrentUser();
    if (!$user || !in_array($user['role'], ['super_admin', 'admin', 'finance', 'editor'])) {
        errorResponse('Authentication required', 401);
    }

    $status = $_GET['status'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($status) {
        $where[] = 'status = ?';
        $params[] = $status;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM inquiries WHERE $whereClause ORDER BY created_at DESC");
    $stmt->execute($params);
    $inquiries = $stmt->fetchAll();

    $data = array_map(function($inquiry) {
        return [
            'id' => $inquiry['id'],
            'name' => $inquiry['name'],
            'email' => $inquiry['email'],
            'phone' => $inquiry['phone'] ?? '',
            'serviceType' => $inquiry['service_type'] ?? '',
            'eventDate' => $inquiry['event_date'] ?? '',
            'message' => $inquiry['message'] ?? '',
            'source' => $inquiry['source'] ?? 'website',
            'status' => $inquiry['status'],
            'notes' => $inquiry['notes'] ?? '',
            'createdAt' => $inquiry['created_at'],
            'updatedAt' => $inquiry['updated_at'] ?? null
        ];
    }, $inquiries);

    successResponse($data);
}

/**
 * Get inquiry by ID
 */
function getInquiryById($db, $id) {
    requireAdmin();

    $stmt = $db->prepare('SELECT * FROM inquiries WHERE id = ?');
    $stmt->execute([$id]);
    $inquiry = $stmt->fetch();

    if (!$inquiry) {
        errorResponse('Inquiry not found', 404);
    }

    $data = [
        'id' => $inquiry['id'],
        'name' => $inquiry['name'],
        'email' => $inquiry['email'],
        'phone' => $inquiry['phone'] ?? '',
        'serviceType' => $inquiry['service_type'] ?? '',
        'eventDate' => $inquiry['event_date'] ?? '',
        'message' => $inquiry['message'] ?? '',
        'source' => $inquiry['source'] ?? 'website',
        'status' => $inquiry['status'],
        'notes' => $inquiry['notes'] ?? '',
        'createdAt' => $inquiry['created_at'],
        'updatedAt' => $inquiry['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Create new inquiry (public)
 */
function createInquiry($db) {
    $body = getRequestBody();

    $errors = validateRequired($body, ['name', 'email', 'message']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email format', 400);
    }

    $id = makeUUID();

    $stmt = $db->prepare("
        INSERT INTO inquiries
        (id, name, email, phone, service_type, event_date, message, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['name']),
        sanitize($body['email']),
        sanitize($body['phone'] ?? ''),
        sanitize($body['service_type'] ?? $body['serviceType'] ?? ''),
        sanitize($body['event_date'] ?? $body['eventDate'] ?? ''),
        sanitize($body['message']),
        sanitize($body['source'] ?? 'website')
    ]);

    http_response_code(201);
    successResponse(['id' => $id], 'Inquiry submitted successfully');
}

/**
 * Update inquiry
 */
function updateInquiry($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if inquiry exists
    $stmt = $db->prepare('SELECT id FROM inquiries WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Inquiry not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['name', 'email', 'phone', 'service_type', 'event_date', 'message', 'status', 'notes'];
    foreach ($fields as $field) {
        $dbField = $field === 'event_date' ? 'event_date' : $field;
        if (isset($body[$field])) {
            $updates[] = "{$dbField} = ?";
            $params[] = sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE inquiries SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_inquiry', 'inquiries', $id, "Updated inquiry");

    successResponse(['id' => $id], 'Inquiry updated');
}
