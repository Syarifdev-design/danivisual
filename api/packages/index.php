<?php
// Packages endpoint

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));
$lastId = end($parts);

try {
    $db = Database::getInstance();

    if ($method === 'GET' && ($lastId === 'packages' || $parts[count($parts)-2] === 'packages')) {
        // List packages
        $page = max(1, (int)($_GET['page'] ?? 1));
        $per = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $per;
        $where = '1=1';
        $params = [];

        if (!empty($_GET['category'])) {
            $where .= ' AND c.category_id = ?';
            $params[] = $_GET['category'];
        }
        if (isset($_GET['active'])) {
            $where .= ' AND p.is_active = ?';
            $params[] = (int)$_GET['active'];
        }

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM packages p JOIN package_categories c ON p.category_id = c.id WHERE $where");
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['total'];

        $params[] = $per;
        $params[] = $offset;
        $stmt = $db->prepare("SELECT p.*, c.name as category_name FROM packages p JOIN package_categories c ON p.category_id = c.id WHERE $where ORDER BY c.sort_order, p.sort_order LIMIT ? OFFSET ?");
        $stmt->execute($params);
        $packages = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $packages,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $per,
                'total_pages' => ceil($total / $per)
            ]
        ]);

    } elseif ($method === 'GET' && is_numeric($lastId)) {
        // Get single package
        $stmt = $db->prepare("SELECT p.*, c.name as category_name FROM packages p JOIN package_categories c ON p.category_id = c.id WHERE p.id = ?");
        $stmt->execute([$lastId]);
        $pkg = $stmt->fetch();

        if (!$pkg) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Package not found']);
            exit;
        }

        echo json_encode(['success' => true, 'data' => $pkg]);

    } elseif ($method === 'POST') {
        // Create package (admin only)
        requireAdmin();
        $body = getRequestBody();

        if (empty($body['category_id']) || empty($body['package_id']) || empty($body['name']) || !isset($body['price'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        $id = generateUUID();
        $stmt = $db->prepare("INSERT INTO packages (id,category_id,package_id,name,service_type,is_most_selected,starting_price,price,description,is_active,sort_order,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())");
        $stmt->execute([
            $id,
            $body['category_id'],
            $body['package_id'],
            $body['name'],
            $body['service_type'] ?? 'Photo',
            (int)($body['is_most_selected'] ?? 0),
            (float)($body['starting_price'] ?? 0),
            (float)$body['price'],
            $body['description'] ?? '',
            (int)($body['is_active'] ?? 1),
            (int)($body['sort_order'] ?? 0),
            null
        ]);

        logActivity(getCurrentUserId(), $_SESSION['user_name'] ?? '', 'create_package', 'packages', $id, "Created package: " . $body['name']);

        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Package created', 'data' => ['id' => $id]]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log('Packages API error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
