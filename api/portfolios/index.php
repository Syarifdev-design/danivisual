<?php
/**
 * Portfolio API Endpoint
 * GET /api/portfolios - List all portfolios
 * GET /api/portfolios/:id - Get single portfolio
 * GET /api/portfolios/slug/:slug - Get by slug
 * POST /api/portfolios - Create portfolio (admin)
 * PUT /api/portfolios/:id - Update portfolio (admin)
 * DELETE /api/portfolios/:id - Delete portfolio (admin)
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
$secondLast = count($parts) > 1 ? $parts[count($parts) - 2] : null;

try {
    $db = Database::getInstance();

    // Route handling
    if ($method === 'GET') {
        if ($lastPart === 'portfolios' || $secondLast === 'portfolios') {
            if (str_starts_with($path, '/api/portfolios/slug/')) {
                getPortfolioBySlug($db, substr($path, strrpos($path, '/') + 1));
            } elseif (is_numeric($lastPart) && $lastPart !== 'portfolios') {
                getPortfolioById($db, $lastPart);
            } else {
                listPortfolios($db);
            }
        } else {
            listPortfolios($db);
        }
    } elseif ($method === 'POST') {
        createPortfolio($db);
    } elseif ($method === 'PUT') {
        if (is_numeric($lastPart)) {
            updatePortfolio($db, $lastPart);
        } else {
            errorResponse('Portfolio ID required', 400);
        }
    } elseif ($method === 'DELETE') {
        if (is_numeric($lastPart)) {
            deletePortfolio($db, $lastPart);
        } else {
            errorResponse('Portfolio ID required', 400);
        }
    } else {
        errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Portfolio API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all portfolios
 */
function listPortfolios($db) {
    $category = $_GET['category'] ?? null;
    $featured = $_GET['featured'] ?? null;
    $published = $_GET['published'] ?? null;

    $where = ['1=1'];
    $params = [];

    if ($category) {
        $where[] = 'category = ?';
        $params[] = $category;
    }

    if ($featured !== null) {
        $where[] = 'is_featured = ?';
        $params[] = (int)$featured;
    }

    if ($published !== null) {
        $where[] = 'is_published = ?';
        $params[] = (int)$published;
    }

    $whereClause = implode(' AND ', $where);

    $stmt = $db->prepare("SELECT * FROM portfolios WHERE $whereClause ORDER BY sort_order, date DESC");
    $stmt->execute($params);
    $portfolios = $stmt->fetchAll();

    // Get images for each portfolio
    $data = array_map(function($portfolio) use ($db) {
        $stmt = $db->prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY sort_order');
        $stmt->execute([$portfolio['id']]);
        $images = $stmt->fetchAll();

        return [
            'id' => $portfolio['id'],
            'title' => $portfolio['name'],
            'slug' => $portfolio['slug'],
            'name' => $portfolio['name'],
            'coupleName' => $portfolio['couple_name'] ?? null,
            'category' => $portfolio['category'],
            'coverImage' => $portfolio['cover_image_url'] ?? '',
            'galleryImages' => array_map(function($img) {
                return [
                    'id' => $img['id'],
                    'url' => $img['url'],
                    'caption' => $img['caption'],
                    'sortOrder' => (int)$img['sort_order'],
                    'isPrimary' => (bool)$img['is_primary']
                ];
            }, $images),
            'images' => array_column($images, 'url'),
            'location' => $portfolio['location'] ?? null,
            'story' => $portfolio['story'] ?? null,
            'eventDate' => $portfolio['event_date'] ?? null,
            'date' => $portfolio['date'],
            'isFeatured' => (bool)$portfolio['is_featured'],
            'isPublished' => (bool)$portfolio['is_published'],
            'sortOrder' => (int)$portfolio['sort_order'],
            'metaTitle' => $portfolio['meta_title'] ?? null,
            'metaDescription' => $portfolio['meta_description'] ?? null,
            'createdAt' => $portfolio['created_at'],
            'updatedAt' => $portfolio['updated_at'] ?? null
        ];
    }, $portfolios);

    successResponse($data);
}

/**
 * Get portfolio by ID
 */
function getPortfolioById($db, $id) {
    $stmt = $db->prepare('SELECT * FROM portfolios WHERE id = ?');
    $stmt->execute([$id]);
    $portfolio = $stmt->fetch();

    if (!$portfolio) {
        errorResponse('Portfolio not found', 404);
    }

    // Get images
    $stmt = $db->prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY sort_order');
    $stmt->execute([$id]);
    $images = $stmt->fetchAll();

    $data = [
        'id' => $portfolio['id'],
        'title' => $portfolio['name'],
        'slug' => $portfolio['slug'],
        'name' => $portfolio['name'],
        'coupleName' => $portfolio['couple_name'] ?? null,
        'category' => $portfolio['category'],
        'coverImage' => $portfolio['cover_image_url'] ?? '',
        'galleryImages' => array_map(function($img) {
            return [
                'id' => $img['id'],
                'url' => $img['url'],
                'caption' => $img['caption'],
                'sortOrder' => (int)$img['sort_order'],
                'isPrimary' => (bool)$img['is_primary']
            ];
        }, $images),
        'images' => array_column($images, 'url'),
        'location' => $portfolio['location'] ?? null,
        'story' => $portfolio['story'] ?? null,
        'eventDate' => $portfolio['event_date'] ?? null,
        'date' => $portfolio['date'],
        'isFeatured' => (bool)$portfolio['is_featured'],
        'isPublished' => (bool)$portfolio['is_published'],
        'sortOrder' => (int)$portfolio['sort_order'],
        'metaTitle' => $portfolio['meta_title'] ?? null,
        'metaDescription' => $portfolio['meta_description'] ?? null,
        'createdAt' => $portfolio['created_at'],
        'updatedAt' => $portfolio['updated_at'] ?? null
    ];

    successResponse($data);
}

/**
 * Get portfolio by slug
 */
function getPortfolioBySlug($db, $slug) {
    $stmt = $db->prepare('SELECT * FROM portfolios WHERE slug = ?');
    $stmt->execute([$slug]);
    $portfolio = $stmt->fetch();

    if (!$portfolio) {
        errorResponse('Portfolio not found', 404);
    }

    getPortfolioById($db, $portfolio['id']);
}

/**
 * Create new portfolio
 */
function createPortfolio($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['name', 'category', 'date']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();
    $slug = sanitize($body['slug'] ?? generateSlug($body['name']));

    // Get max sort_order
    $stmt = $db->query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM portfolios');
    $nextOrder = (int)$stmt->fetch()['next_order'];

    $stmt = $db->prepare("
        INSERT INTO portfolios
        (id, slug, name, couple_name, category, cover_image_url, story, location, event_date, date,
         is_featured, is_published, sort_order, meta_title, meta_description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        $slug,
        sanitize($body['name']),
        sanitize($body['coupleName'] ?? ''),
        sanitize($body['category']),
        sanitize($body['coverImage'] ?? ''),
        sanitize($body['story'] ?? ''),
        sanitize($body['location'] ?? ''),
        sanitize($body['eventDate'] ?? ''),
        sanitize($body['date']),
        (int)($body['isFeatured'] ??0),
        (int)($body['isPublished'] ?? 1),
        $body['sortOrder'] ?? $nextOrder,
        sanitize($body['metaTitle'] ?? ''),
        sanitize($body['metaDescription'] ?? '')
    ]);

    // Insert images if provided
    if (!empty($body['galleryImages']) && is_array($body['galleryImages'])) {
        foreach ($body['galleryImages'] as $index => $img) {
            $imgId = makeUUID();
            $stmt = $db->prepare("
                INSERT INTO portfolio_images (id, portfolio_id, url, caption, sort_order, is_primary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $imgId,
                $id,
                sanitize($img['url'] ?? $img),
                sanitize($img['caption'] ?? ''),
                $index + 1,
                (int)($img['isPrimary'] ?? ($index === 0 ? 1 : 0))
            ]);
        }
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'create_portfolio', 'portfolios', $id, "Created portfolio: " . $body['name']);

    http_response_code(201);
    successResponse(['id' => $id, 'slug' => $slug], 'Portfolio created');
}

/**
 * Update portfolio
 */
function updatePortfolio($db, $id) {
    requireAdmin();
    $body = getRequestBody();

    // Check if portfolio exists
    $stmt = $db->prepare('SELECT id FROM portfolios WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Portfolio not found', 404);
    }

    $updates = [];
    $params = [];

    $fieldMap = [
        'title' => 'name',
        'name' => 'name',
        'slug' => 'slug',
        'coupleName' => 'couple_name',
        'category' => 'category',
        'coverImage' => 'cover_image_url',
        'story' => 'story',
        'location' => 'location',
        'eventDate' => 'event_date',
        'date' => 'date',
        'isFeatured' => 'is_featured',
        'isPublished' => 'is_published',
        'sortOrder' => 'sort_order',
        'metaTitle' => 'meta_title',
        'metaDescription' => 'meta_description'
    ];

    foreach ($fieldMap as $frontendField => $dbField) {
        if (isset($body[$frontendField])) {
            $updates[] = "{$dbField} = ?";
            $val = $body[$frontendField];
            if (in_array($dbField, ['is_featured', 'is_published', 'sort_order'])) {
                $val = (int)$val;
            } else {
                $val = sanitize($val);
            }
            $params[] = $val;
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE portfolios SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // Update images if provided
    if (isset($body['galleryImages']) && is_array($body['galleryImages'])) {
        // Delete existing images
        $stmt = $db->prepare('DELETE FROM portfolio_images WHERE portfolio_id = ?');
        $stmt->execute([$id]);

        // Insert new images
        foreach ($body['galleryImages'] as $index => $img) {
            $imgId = makeUUID();
            $stmt = $db->prepare("
                INSERT INTO portfolio_images (id, portfolio_id, url, caption, sort_order, is_primary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $imgId,
                $id,
                sanitize($img['url'] ?? $img),
                sanitize($img['caption'] ?? ''),
                $index + 1,
                (int)($img['isPrimary'] ?? ($index === 0 ? 1 : 0))
            ]);
        }
    }

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'update_portfolio', 'portfolios', $id, "Updated portfolio");

    successResponse(['id' => $id], 'Portfolio updated');
}

/**
 * Delete portfolio
 */
function deletePortfolio($db, $id) {
    requireAdmin();

    // Check if portfolio exists
    $stmt = $db->prepare('SELECT id FROM portfolios WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        errorResponse('Portfolio not found', 404);
    }

    // Images will be deleted by CASCADE
    $stmt = $db->prepare('DELETE FROM portfolios WHERE id = ?');
    $stmt->execute([$id]);

    logActivity(getCurrentUserId(), getCurrentUser()['username'], 'delete_portfolio', 'portfolios', $id, "Deleted portfolio");

    successResponse(null, 'Portfolio deleted');
}

/**
 * Generate slug from name
 */
function generateSlug($name) {
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9]+/g', '-', $slug);
    $slug = preg_replace('/^-|-$/', '', $slug);
    return $slug;
}
