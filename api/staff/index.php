<?php
/**
 * Staff API Endpoint
 * GET /api/staff - List all staff
 * GET /api/staff/:id - Get single staff
 * POST /api/staff - Create staff (admin)
 * PUT /api/staff/:id - Update staff (admin)
 * DELETE /api/staff/:id - Delete staff (admin)
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
            if (is_numeric($lastPart) && $lastPart !== 'staff') {
                getStaffById($db, $lastPart);
            } else {
                listStaff($db);
            }
            break;

        case 'POST':
            createStaff($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateStaff($db, $lastPart);
            } else {
                errorResponse('Staff ID required', 400);
            }
            break;

        case 'DELETE':
            if (is_numeric($lastPart)) {
                deleteStaff($db, $lastPart);
            } else {
                errorResponse('Staff ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Staff API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all staff
 */
function listStaff($db) {
    requireAdmin();

    $role = $_GET['role'] ?? null;
    $active = $_GET['active'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($role) {
        $where[] = 'role = ?';
        $params[] = $role;
    }
    if ($active !== null) {
        $where[] = 'is_active = ?';
        $params[] = (int)$active;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM employees WHERE $whereClause ORDER BY name");
    $stmt->execute($params);
    $staff = $stmt->fetchAll();

    $data = array_map(function($employee) {
        return [
            'id' => $employee['id'],
            'userId' => $employee['user_id'] ?? '',
            'name' => $employee['name'],
            'email' => $employee['email'] ?? '',
            'phone' => $employee['phone'] ?? '',
            'role' => $employee['role'],
            'position' => $employee['position'] ?? '',
            'joinDate' => $employee['join_date'] ?? '',
            'isActive' => (bool)$employee['is_active'],
            'createdAt' => $employee['created_at'],
            'updatedAt' => $employee['updated_at'] ?? null
        ];
    }, $staff);

    successResponse($data);
}

/**
 * Get staff by ID
 */
function getStaffById($db, $id) {
    requireAdmin();

    $stmt = $db->prepare('SELECT * FROM employees WHERE id = ?');
    $stmt->execute([$id]);
    $employee = $stmt->fetch();

    if (!$employee) {
        errorResponse('Staff not found', 404);
    }

    $data = [
        'id' => $employee['id'],
        'userId' => $employee['user_id'] ?? '',
        'name' => $employee['name'],
        'email' => $employee['email'] ?? '',
        'phone' => $employee['phone'] ?? '',
        'role' => $employee['role'],
        'position' => $employee['position'] ?? '',
        'joinDate' => $employee['join_date'] ?? '',
        'isActive' => (bool)$employee['is_active'],
        'createdAt' => $employee['created_at'],
        'updatedAt' => $employee['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Create new staff
 */
function createStaff($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['name', 'role']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();

    $stmt = $db->prepare("
        INSERT INTO employees
        (id, user_id, name, email, phone, role, position, join_date, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['user_id'] ?? $body['userId'] ?? ''),
        sanitize($body['name']),
        sanitize($body['email'] ?? ''),
        sanitize($body['phone'] ?? ''),
        sanitize($body['role']),
        sanitize($body['position'] ?? ''),
        sanitize($body['join_date'] ?? $body['joinDate'] ?? ''),
        (int)($body['is_active'] ?? $body['isActive'] ?? 1)
    ]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'create_staff', 'employees', $id, "Created staff: " . $body['name']);

    http_response_code(201);
    successResponse(['id' => $id], 'Staff created');
}

/**
 * Update staff
 */
function updateStaff($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if staff exists
    $stmt = $db->prepare('SELECT id FROM employees WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Staff not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['name', 'email', 'phone', 'role', 'position', 'join_date', 'is_active'];
    foreach ($fields as $field) {
        if (isset($body[$field])) {
            $updates[] = "{$field} = ?";
            $params[] = sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE employees SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_staff', 'employees', $id, "Updated staff");

    successResponse(['id' => $id], 'Staff updated');
}

/**
 * Delete staff (soft delete)
 */
function deleteStaff($db, $id) {
    requireAdmin();

    // Check if staff exists
    $stmt = $db->prepare('SELECT id FROM employees WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Staff not found', 404);
    }

    // Soft delete
    $stmt = $db->prepare('UPDATE employees SET is_active = 0, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'delete_staff', 'employees', $id, "Deleted staff");

    successResponse(null, 'Staff deleted');
}
