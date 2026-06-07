<?php
/**
 * Attendance API Endpoint
 * GET /api/attendance - List attendance records
 * GET /api/attendance/:id - Get single record
 * POST /api/attendance - Check in/out (staff)
 * PUT /api/attendance/:id - Update attendance (admin)
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
            if (is_numeric($lastPart) && $lastPart !== 'attendance') {
                getAttendanceById($db, $lastPart);
            } else {
                listAttendance($db);
            }
            break;

        case 'POST':
            createAttendance($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateAttendance($db, $lastPart);
            } else {
                errorResponse('Attendance ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Attendance API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List attendance records
 */
function listAttendance($db) {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('Authentication required', 401);
    }

    // Staff can only see their own attendance
    $isAdmin = in_array($user['role'], ['super_admin', 'admin', 'finance']);

    $employeeId = $_GET['employee_id'] ?? null;
    $dateFrom = $_GET['date_from'] ?? null;
    $dateTo = $_GET['date_to'] ?? null;
    $status = $_GET['status'] ?? null;

    $where = ['1=1'];
    $params = [];

    // Non-admin can only see their own records
    if (!$isAdmin) {
        // Find employee by user_id
        $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $employee = $stmt->fetch();
        if ($employee) {
            $where[] = 'employee_id = ?';
            $params[] = $employee['id'];
        } else {
            // No employee record, return empty
            successResponse([]);
            return;
        }
    } elseif ($employeeId) {
        $where[] = 'employee_id = ?';
        $params[] = $employeeId;
    }

    if ($dateFrom) {
        $where[] = 'date >= ?';
        $params[] = $dateFrom;
    }
    if ($dateTo) {
        $where[] = 'date <= ?';
        $params[] = $dateTo;
    }
    if ($status) {
        $where[] = 'status = ?';
        $params[] = $status;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM attendance WHERE $whereClause ORDER BY date DESC, created_at");
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    // Get employee names
    $data = array_map(function($record) use ($db) {
        $stmt = $db->prepare('SELECT name FROM employees WHERE id = ?');
        $stmt->execute([$record['employee_id']]);
        $employee = $stmt->fetch();

        return [
            'id' => $record['id'],
            'employeeId' => $record['employee_id'],
            'employeeName' => $employee['name'] ?? '',
            'date' => $record['date'],
            'status' => $record['status'],
            'checkInTime' => $record['check_in_time'] ?? '',
            'checkOutTime' => $record['check_out_time'] ?? '',
            'notes' => $record['notes'] ?? '',
            'selfieUrl' => $record['selfie_url'] ?? '',
            'createdAt' => $record['created_at']
        ];
    }, $records);

    successResponse($data);
}

/**
 * Get attendance by ID
 */
function getAttendanceById($db, $id) {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('Authentication required', 401);
    }

    $stmt = $db->prepare('SELECT * FROM attendance WHERE id = ?');
    $stmt->execute([$id]);
    $record = $stmt->fetch();

    if (!$record) {
        errorResponse('Attendance not found', 404);
    }

    // Check permission
    $isAdmin = in_array($user['role'], ['super_admin', 'admin', 'finance']);
    if (!$isAdmin) {
        $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $employee = $stmt->fetch();
        if (!$employee || $employee['id'] !== $record['employee_id']) {
            errorResponse('Access denied', 403);
        }
    }

    $stmt = $db->prepare('SELECT name FROM employees WHERE id = ?');
    $stmt->execute([$record['employee_id']]);
    $employee = $stmt->fetch();

    $data = [
        'id' => $record['id'],
        'employeeId' => $record['employee_id'],
        'employeeName' => $employee['name'] ?? '',
        'date' => $record['date'],
        'status' => $record['status'],
        'checkInTime' => $record['check_in_time'] ?? '',
        'checkOutTime' => $record['check_out_time'] ?? '',
        'notes' => $record['notes'] ?? '',
        'selfieUrl' => $record['selfie_url'] ?? '',
        'createdAt' => $record['created_at']
    ];

    successResponse($data);
}

/**
 * Check in/out attendance
 */
function createAttendance($db) {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('Authentication required', 401);
    }

    $body = getRequestBody();

    // Find employee by user_id
    $stmt = $db->prepare('SELECT id FROM employees WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $employee = $stmt->fetch();

    if (!$employee) {
        errorResponse('Employee record not found', 404);
    }

    $employeeId = $employee['id'];
    $date = $body['date'] ?? date('Y-m-d');
    $action = $body['action'] ?? 'check_in'; // check_in or check_out

    // Check if already has record for today
    $stmt = $db->prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?');
    $stmt->execute([$employeeId, $date]);
    $existing = $stmt->fetch();

    if ($existing) {
        // Update existing record
        if ($action === 'check_out') {
            $stmt = $db->prepare("
                UPDATE attendance
                SET check_out_time = CURTIME(), status = 'present', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$existing['id']]);
 successResponse(['id' => $existing['id']], 'Checked out successfully');
        } else {
            errorResponse('Already checked in today', 400);
        }
    } else {
        // Create new record
        $id = makeUUID();

        $stmt = $db->prepare("
            INSERT INTO attendance
            (id, employee_id, date, status, check_in_time, selfie_url, notes, created_at)
            VALUES (?, ?, ?, ?, CURTIME(), ?, ?, NOW())
        ");
        $stmt->execute([
            $id,
            $employeeId,
            $date,
            'present',
            sanitize($body['selfie_url'] ?? $body['selfieUrl'] ?? ''),
            sanitize($body['notes'] ?? '')
        ]);

        // Log attendance record
        $stmt = $db->prepare("
            INSERT INTO attendance_records (id, employee_id, date, record_type, value, created_at)
            VALUES (?, ?, ?, 'check_in', CURTIME(), NOW())
        ");
        $stmt->execute([makeUUID(), $employeeId, $date]);

        http_response_code(201);
        successResponse(['id' => $id], 'Checked in successfully');
    }
}

/**
 * Update attendance (admin)
 */
function updateAttendance($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if record exists
    $stmt = $db->prepare('SELECT id FROM attendance WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Attendance not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['status', 'check_in_time', 'check_out_time', 'notes', 'selfie_url'];
    foreach ($fields as $field) {
        if (isset($body[$field])) {
            $updates[] = "{$field} = ?";
            $params[] = sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE attendance SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_attendance', 'attendance', $id, "Updated attendance");

    successResponse(['id' => $id], 'Attendance updated');
}
