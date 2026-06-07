<?php
/**
 * Services API Endpoint
 * GET /api/services - List all services
 * GET /api/services/:id - Get single service
 * POST /api/services - Create service (admin)
 * PUT /api/services/:id - Update service (admin)
 * DELETE /api/services/:id - Delete service (admin)
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
            if (is_numeric($lastPart) && $lastPart !== 'services') {
                getServiceById($db, $lastPart);
            } else {
                listServices($db);
            }
            break;

        case 'POST':
            createService($db);
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateService($db, $lastPart);
            } else {
                errorResponse('Service ID required', 400);
            }
            break;

        case 'DELETE':
            if (is_numeric($lastPart)) {
                deleteService($db, $lastPart);
            } else {
                errorResponse('Service ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Service API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all services
 */
function listServices($db) {
    $active = $_GET['active'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($active !== null) {
        $where[] = 'is_active = ?';
        $params[] = (int)$active;
    }

    $whereClause = implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM services WHERE $whereClause ORDER BY sort_order");
    $stmt->execute($params);
    $services = $stmt->fetchAll();

    $data = array_map(function($service) use ($db) {
        // Get includes
        $stmt = $db->prepare('SELECT * FROM service_includes WHERE service_id = ? ORDER BY sort_order');
        $stmt->execute([$service['id']]);
        $includes = $stmt->fetchAll();

        return [
            'id' => $service['id'],
            'serviceId' => $service['service_id'],
            'name' => $service['name'],
            'eyebrow' => $service['eyebrow'] ?? '',
            'description' => $service['description'] ?? '',
            'narrative' => $service['narrative'] ?? '',
            'duration' => $service['duration'] ?? '',
            'highlight' => $service['highlight'] ?? '',
            'access' => $service['access'] ?? '',
            'headerImage' => $service['header_image_url'] ?? '',
            'image1' => $service['image_1_url'] ?? '',
            'image2' => $service['image_2_url'] ?? '',
            'image3' => $service['image_3_url'] ?? '',
            'isActive' => (bool)$service['is_active'],
            'sortOrder' => (int)$service['sort_order'],
            'includes' => array_map(function($inc) {
                return [
                    'id' => $inc['id'],
                    'text' => $inc['include_text'],
                    'sortOrder' => (int)$inc['sort_order']
                ];
            }, $includes),
            'createdAt' => $service['created_at'],
            'updatedAt' => $service['updated_at'] ?? null
        ];
    }, $services);

    successResponse($data);
}

/**
 * Get service by ID
 */
function getServiceById($db, $id) {
    $stmt = $db->prepare('SELECT * FROM services WHERE id = ?');
    $stmt->execute([$id]);
    $service = $stmt->fetch();

    if (!$service) {
        errorResponse('Service not found', 404);
    }

    // Get includes
    $stmt = $db->prepare('SELECT * FROM service_includes WHERE service_id = ? ORDER BY sort_order');
    $stmt->execute([$id]);
    $includes = $stmt->fetchAll();

    $data = [
        'id' => $service['id'],
        'serviceId' => $service['service_id'],
        'name' => $service['name'],
        'eyebrow' => $service['eyebrow'] ?? '',
        'description' => $service['description'] ?? '',
        'narrative' => $service['narrative'] ?? '',
        'duration' => $service['duration'] ?? '',
        'highlight' => $service['highlight'] ?? '',
        'access' => $service['access'] ?? '',
        'headerImage' => $service['header_image_url'] ?? '',
        'image1' => $service['image_1_url'] ?? '',
        'image2' => $service['image_2_url'] ?? '',
        'image3' => $service['image_3_url'] ?? '',
        'isActive' => (bool)$service['is_active'],
        'sortOrder' => (int)$service['sort_order'],
        'includes' => array_map(function($inc) {
            return [
                'id' => $inc['id'],
                'text' => $inc['include_text'],
                'sortOrder' => (int)$inc['sort_order']
            ];
        }, $includes),
        'createdAt' => $service['created_at'],
        'updatedAt' => $service['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Create new service
 */
function createService($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['service_id', 'name']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();

    // Get max sort_order
    $stmt = $db->query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM services');
    $nextOrder = (int)$stmt->fetch()['next_order'];

    $stmt = $db->prepare("
        INSERT INTO services
        (id, service_id, name, eyebrow, description, narrative, duration, highlight, access,
         header_image_url, image_1_url, image_2_url, image_3_url, is_active, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['service_id']),
        sanitize($body['name']),
        sanitize($body['eyebrow'] ?? ''),
        sanitize($body['description'] ?? ''),
        sanitize($body['narrative'] ?? ''),
        sanitize($body['duration'] ?? ''),
        sanitize($body['highlight'] ?? ''),
        sanitize($body['access'] ?? ''),
        sanitize($body['header_image'] ?? $body['headerImage'] ?? ''),
        sanitize($body['image_1'] ?? $body['image1'] ?? ''),
        sanitize($body['image_2'] ?? $body['image2'] ?? ''),
        sanitize($body['image_3'] ?? $body['image3'] ?? ''),
        (int)($body['is_active'] ?? $body['isActive'] ?? 1),
        $body['sort_order'] ?? $nextOrder
    ]);

    // Insert includes if provided
    if (!empty($body['includes']) && is_array($body['includes'])) {
        foreach ($body['includes'] as $index => $include) {
            $incId = makeUUID();
            $stmt = $db->prepare("
                INSERT INTO service_includes (id, service_id, include_text, sort_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $incId,
                $id,
                sanitize(is_array($include) ? ($include['text'] ?? '') : $include),
                $index + 1
            ]);
        }
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'create_service', 'services', $id, "Created service: " . $body['name']);

    http_response_code(201);
    successResponse(['id' => $id], 'Service created');
}

/**
 * Update service
 */
function updateService($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if service exists
    $stmt = $db->prepare('SELECT id FROM services WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Service not found', 404);
    }

    $updates = [];
    $params = [];

    $fieldMap = [
        'service_id' => 'service_id',
        'name' => 'name',
        'eyebrow' => 'eyebrow',
        'description' => 'description',
        'narrative' => 'narrative',
        'duration' => 'duration',
        'highlight' => 'highlight',
        'access' => 'access',
        'header_image' => 'header_image_url',
        'image_1' => 'image_1_url',
        'image_2' => 'image_2_url',
        'image_3' => 'image_3_url',
        'is_active' => 'is_active',
        'sort_order' => 'sort_order'
    ];

    foreach ($fieldMap as $frontendField => $dbField) {
        if (isset($body[$frontendField])) {
            $updates[] = "{$dbField} = ?";
            $params[] = in_array($dbField, ['is_active', 'sort_order'])
                ? (int)$body[$frontendField]
                : sanitize($body[$frontendField]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE services SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // Update includes if provided
    if (isset($body['includes']) && is_array($body['includes'])) {
        // Delete existing includes
        $stmt = $db->prepare('DELETE FROM service_includes WHERE service_id = ?');
        $stmt->execute([$id]);

        // Insert new includes
        foreach ($body['includes'] as $index => $include) {
            $incId = makeUUID();
            $stmt = $db->prepare("
                INSERT INTO service_includes (id, service_id, include_text, sort_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $incId,
                $id,
                sanitize(is_array($include) ? ($include['text'] ?? '') : $include),
                $index + 1
            ]);
        }
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_service', 'services', $id, "Updated service");

    successResponse(['id' => $id], 'Service updated');
}

/**
 * Delete service
 */
function deleteService($db, $id) {
    requireAdmin();

    // Check if service exists
    $stmt = $db->prepare('SELECT id FROM services WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Service not found', 404);
    }

    // Includes will be deleted by CASCADE
    $stmt = $db->prepare('DELETE FROM services WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'delete_service', 'services', $id, "Deleted service");

    successResponse(null, 'Service deleted');
}
