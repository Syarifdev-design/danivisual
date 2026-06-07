<?php
/**
 * Customers API Endpoint
 * GET /api/customers - List all customers
 * GET /api/customers/:id - Get single customer
 * POST /api/customers - Create customer
 * PUT /api/customers/:id - Update customer (admin)
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
            if (is_numeric($lastPart) && $lastPart !== 'customers') {
                getCustomerById($db, $lastPart);
            } else {
                listCustomers($db);
            }
            break;

        case 'POST':
            createCustomer($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateCustomer($db, $lastPart);
            } else {
                errorResponse('Customer ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Customer API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all customers
 */
function listCustomers($db) {
    requireAdmin();

    $q = $_GET['q'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($q) {
        $where[] = '(name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        $search = '%' . $q . '%';
        $params[] = $search;
        $params[] = $search;
        $params[] = $search;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM customers WHERE $whereClause ORDER BY created_at DESC");
    $stmt->execute($params);
    $customers = $stmt->fetchAll();

    $data = array_map(function($customer) {
        return [
            'id' => $customer['id'],
            'userId' => $customer['user_id'] ?? null,
            'name' => $customer['name'],
            'email' => $customer['email'] ?? '',
            'phone' => $customer['phone'],
            'address' => $customer['address'] ?? '',
            'instagram' => $customer['instagram'] ?? '',
            'whatsapp' => $customer['whatsapp'] ?? '',
            'notes' => $customer['notes'] ?? '',
            'createdAt' => $customer['created_at'],
            'updatedAt' => $customer['updated_at'] ?? null
        ];
    }, $customers);

    successResponse($data);
}

/**
 * Get customer by ID
 */
function getCustomerById($db, $id) {
    requireAdmin();

    $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        errorResponse('Customer not found', 404);
    }

    $data = [
        'id' => $customer['id'],
        'userId' => $customer['user_id'] ?? null,
        'name' => $customer['name'],
        'email' => $customer['email'] ?? '',
        'phone' => $customer['phone'],
        'address' => $customer['address'] ?? '',
        'instagram' => $customer['instagram'] ?? '',
        'whatsapp' => $customer['whatsapp'] ?? '',
        'notes' => $customer['notes'] ?? '',
        'createdAt' => $customer['created_at'],
        'updatedAt' => $customer['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Create new customer
 */
function createCustomer($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['name', 'phone']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();

    $stmt = $db->prepare("
        INSERT INTO customers
        (id, user_id, name, email, phone, address, instagram, whatsapp, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['user_id'] ?? $body['userId'] ?? ''),
        sanitize($body['name']),
        sanitize($body['email'] ?? ''),
        sanitize($body['phone']),
        sanitize($body['address'] ?? ''),
        sanitize($body['instagram'] ?? ''),
        sanitize($body['whatsapp'] ?? ''),
        sanitize($body['notes'] ?? '')
    ]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'create_customer', 'customers', $id, "Created customer: " . $body['name']);

    http_response_code(201);
    successResponse(['id' => $id], 'Customer created');
}

/**
 * Update customer
 */
function updateCustomer($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if customer exists
    $stmt = $db->prepare('SELECT id FROM customers WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Customer not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['name', 'email', 'phone', 'address', 'instagram', 'whatsapp', 'notes'];
    foreach ($fields as $field) {
        if (isset($body[$field])) {
            $updates[] = "{$field} = ?";
            $params[] = sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE customers SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_customer', 'customers', $id, "Updated customer");

    successResponse(['id' => $id], 'Customer updated');
}
