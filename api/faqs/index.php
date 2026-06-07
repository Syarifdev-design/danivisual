<?php
/**
 * FAQ API Endpoint
 * GET /api/faqs - List all FAQs
 * POST /api/faqs - Create FAQ (admin)
 * PUT /api/faqs - Update FAQ (admin)
 * DELETE /api/faqs - Delete FAQ (admin)
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
$isNumericLast = is_numeric($lastPart);

try {
    $db = Database::getInstance();

    switch ($method) {
        case 'GET':
            // Check if requesting single FAQ by ID
            if ($isNumericLast && $lastPart !== 'faqs') {
                getFaqById($db, $lastPart);
            } else {
                listFaqs($db);
            }
            break;

        case 'POST':
            createFaq($db);
            break;

        case 'PUT':
            if ($isNumericLast) {
                updateFaq($db, $lastPart);
            } else {
                errorResponse('FAQ ID required', 400);
            }
            break;

        case 'DELETE':
            if ($isNumericLast) {
                deleteFaq($db, $lastPart);
            } else {
                errorResponse('FAQ ID required', 400);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('FAQ API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all FAQs
 */
function listFaqs($db) {
    $category = $_GET['category'] ?? null;
    $published = $_GET['published'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($category) {
        $where[] = 'category = ?';
        $params[] = $category;
    }

    if ($published !== null) {
        $where[] = 'is_published = ?';
        $params[] = (int)$published;
    }

    $whereClause = implode(' AND ', $where);

    $stmt = $db->prepare("SELECT * FROM faqs WHERE $whereClause ORDER BY sort_order, created_at");
    $stmt->execute($params);
    $faqs = $stmt->fetchAll();

    // Transform to camelCase
    $data = array_map(function($faq) {
        return [
            'id' => $faq['id'],
            'category' => $faq['category'],
            'question' => $faq['question'],
            'answer' => $faq['answer'],
            'sortOrder' => (int)$faq['sort_order'],
            'isPublished' => (bool)$faq['is_published'],
            'createdAt' => $faq['created_at'],
            'updatedAt' => $faq['updated_at'] ?? null
        ];
    }, $faqs);

    successResponse($data);
}

/**
 * Get single FAQ by ID
 */
function getFaqById($db, $id) {
    $stmt = $db->prepare('SELECT * FROM faqs WHERE id = ?');
    $stmt->execute([$id]);
    $faq = $stmt->fetch();

    if (!$faq) {
        errorResponse('FAQ not found', 404);
    }

    $data = [
        'id' => $faq['id'],
        'category' => $faq['category'],
        'question' => $faq['question'],
        'answer' => $faq['answer'],
        'sortOrder' => (int)$faq['sort_order'],
        'isPublished' => (bool)$faq['is_published'],
        'createdAt' => $faq['created_at'],
        'updatedAt' => $faq['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Create new FAQ
 */
function createFaq($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['category', 'question', 'answer']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();

    // Get max sort_order
    $stmt = $db->query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM faqs');
    $nextOrder = (int)$stmt->fetch()['next_order'];

    $stmt = $db->prepare("
        INSERT INTO faqs (id, category, question, answer, sort_order, is_published, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['category']),
        sanitize($body['question']),
        sanitize($body['answer']),
        $body['sort_order'] ?? $nextOrder,
        (int)($body['is_published'] ?? 1)
    ]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'create_faq', 'faqs', $id, "Created FAQ: " . substr($body['question'], 0, 50));

    http_response_code(201);
    successResponse(['id' => $id], 'FAQ created');
}

/**
 * Update FAQ
 */
function updateFaq($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if FAQ exists
    $stmt = $db->prepare('SELECT id FROM faqs WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('FAQ not found', 404);
    }

    $updates = [];
    $params = [];

    $fields = ['category', 'question', 'answer', 'sort_order', 'is_published'];
    foreach ($fields as $field) {
        $dbField = $field === 'sort_order' ? 'sort_order' : ($field === 'is_published' ? 'is_published' : $field);
        if (isset($body[$field])) {
            $updates[] = "{$dbField} = ?";
            $params[] = $field === 'sort_order' || $field === 'is_published'
                ? (int)$body[$field]
                : sanitize($body[$field]);
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE faqs SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_faq', 'faqs', $id, "Updated FAQ");

    successResponse(['id' => $id], 'FAQ updated');
}

/**
 * Delete FAQ
 */
function deleteFaq($db, $id) {
    requireAdmin();

    // Check if FAQ exists
    $stmt = $db->prepare('SELECT id FROM faqs WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('FAQ not found', 404);
    }

    $stmt = $db->prepare('DELETE FROM faqs WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'delete_faq', 'faqs', $id, "Deleted FAQ");

    successResponse(null, 'FAQ deleted');
}
