<?php
/**
 * Packages API
 * /api/packages/index.php - GET all packages
 * /api/packages/read.php - GET single package
 * /api/packages/create.php - POST create package (admin)
 * /api/packages/update.php - PUT update package (admin)
 * /api/packages/delete.php - DELETE package (admin)
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

/**
 * GET - List packages
 */
function listPackages(): void
{
    $db = Database::getInstance();

    // Get pagination
    $pagination = getPagination();
    $filters = getFilters();

    // Build query
    $where = ['1=1'];
    $params = [];

    // Apply filters
    if (!empty($filters['category'])) {
        $where[] = 'c.category_id = ?';
        $params[] = $filters['category'];
    }

    if (isset($filters['is_active'])) {
        $where[] = 'p.is_active = ?';
        $params[] = (int) $filters['is_active'];
    }

    if (!empty($filters['service_type'])) {
        $where[] = 'p.service_type = ?';
        $params[] = $filters['service_type'];
    }

    // Search
    if (!empty($filters['q'])) {
        $where[] = '(p.name LIKE ? OR p.description LIKE ?)';
        $params[] = $filters['q'];
        $params[] = $filters['q'];
    }

    $whereClause = implode(' AND ', $where);

    // Count total
    $countSql = "
        SELECT COUNT(*) as total
        FROM packages p
        JOIN package_categories c ON p.category_id = c.id
        WHERE {$whereClause}
    ";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetch()['total'];

    // Get packages
    $sql = "
        SELECT
            p.*,
            c.name as category_name,
            c.eyebrow as category_eyebrow,
            c.category_id
        FROM packages p
        JOIN package_categories c ON p.category_id = c.id
        WHERE {$whereClause}
        ORDER BY c.sort_order ASC, p.sort_order ASC
        LIMIT ? OFFSET ?
    ";

    $params[] = $pagination['per_page'];
    $params[] = $pagination['offset'];

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $packages = $stmt->fetchAll();

    // Get benefits for each package
    foreach ($packages as &$package) {
        $stmt = $db->prepare("
            SELECT * FROM package_benefits
            WHERE package_id = ?
            ORDER BY sort_order ASC
        ");
        $stmt->execute([$package['id']]);
        $package['benefits'] = $stmt->fetchAll();
    }

    paginatedResponse($packages, $total, $pagination['page'], $pagination['per_page']);
}

/**
 * GET - Get single package
 */
function getPackage(string $id): void
{
    $db = Database::getInstance();

    $stmt = $db->prepare("
        SELECT
            p.*,
            c.name as category_name,
            c.category_id
        FROM packages p
        JOIN package_categories c ON p.category_id = c.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $package = $stmt->fetch();

    if (!$package) {
        errorResponse('Package not found', 404);
    }

    // Get benefits
    $stmt = $db->prepare("
        SELECT * FROM package_benefits
        WHERE package_id = ?
        ORDER BY sort_order ASC
    ");
    $stmt->execute([$id]);
    $package['benefits'] = $stmt->fetchAll();

    // Get service types
    $stmt = $db->prepare("
        SELECT * FROM package_service_types
        WHERE package_id = ?
        ORDER BY service_type ASC
    ");
    $stmt->execute([$id]);
    $package['service_types'] = $stmt->fetchAll();

    successResponse($package);
}

/**
 * POST - Create package (admin only)
 */
function createPackage(): void
{
    requireAdmin();

    $db = Database::getInstance();
    $data = getRequestBody();

    $errors = validateRequired($data, ['category_id', 'package_id', 'name', 'price']);
    if ($errors !== null) {
        errorResponse('Validation failed', 400, $errors);
    }

    $id = generateUUID();

    $stmt = $db->prepare("
        INSERT INTO packages
        (id, category_id, package_id, name, service_type, is_most_selected,
         starting_price, price, description, is_active, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $id,
        $data['category_id'],
        sanitize($data['package_id']),
        sanitize($data['name']),
        $data['service_type'] ?? 'Photo',
        (int) ($data['is_most_selected'] ?? false),
        (float) ($data['starting_price'] ?? 0),
        (float) $data['price'],
        sanitize($data['description'] ?? ''),
        (int) ($data['is_active'] ?? true),
        (int) ($data['sort_order'] ?? 0),
    ]);

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'create_package',
        'packages',
        $id,
        "Created package: {$data['name']}"
    );

    getPackage($id);
}

/**
 * PUT - Update package (admin only)
 */
function updatePackage(string $id): void
{
    requireAdmin();

    $db = Database::getInstance();
    $data = getRequestBody();

    $updates = [];
    $params = [];

    $fields = [
        'name', 'service_type', 'is_most_selected', 'starting_price',
        'price', 'description', 'is_active', 'sort_order'
    ];

    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "{$field} = ?";
            $params[] = is_bool($data[$field]) ? (int) $data[$field] : $data[$field];
        }
    }

    if (empty($updates)) {
        errorResponse('No fields to update', 400);
    }

    $params[] = $id;
    $sql = 'UPDATE packages SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'update_package',
        'packages',
        $id,
        'Updated package ID: ' . $id
    );

    getPackage($id);
}

/**
 * DELETE - Delete package (admin only)
 */
function deletePackage(string $id): void
{
    requireSuperAdmin();

    $db = Database::getInstance();

    $stmt = $db->prepare('DELETE FROM packages WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'delete_package',
        'packages',
        $id,
        'Deleted package ID: ' . $id
    );

    successResponse(null, 'Package deleted');
}

// Route handler
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = array_filter(explode('/', trim($path, '/')));
$lastPart = end($pathParts);

// Route based on method and path
try {
    switch ($method) {
        case 'GET':
            if ($lastPart === 'packages' || str_contains($path, '/api/packages')) {
                if (is_numeric($lastPart)) {
                    getPackage($lastPart);
                } else {
                    listPackages();
                }
            }
            break;

        case 'POST':
            createPackage();
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updatePackage($lastPart);
            }
            break;

        case 'DELETE':
            if (is_numeric($lastPart)) {
                deletePackage($lastPart);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Packages API error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan', 500);
}