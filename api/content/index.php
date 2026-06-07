<?php
/**
 * Content API Endpoint
 * GET /api/content/fields - Get all content fields
 * GET /api/content/fields/:menuId - Get fields by menu
 * POST /api/content/fields - Update/create field (admin)
 * GET /api/content/images - Get all content images
 * POST /api/content/images - Update/create image (admin)
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

    // Route based on path
    if (str_contains($path, '/images')) {
        if ($method === 'GET') {
            listContentImages($db);
        } elseif ($method === 'POST') {
            updateContentImage($db);
        } else {
            errorResponse('Method not allowed', 405);
        }
    } else {
        // Fields endpoint
        if ($method === 'GET') {
            if (count($parts) >= 3 && $parts[count($parts) - 2] === 'fields') {
                getContentFieldsByMenu($db, end($parts));
            } else {
                listContentFields($db);
            }
        } elseif ($method === 'POST') {
            updateContentField($db);
        } else {
            errorResponse('Method not allowed', 405);
        }
    }
} catch (Exception $e) {
    error_log('Content API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all content fields
 */
function listContentFields($db) {
    $menuId = $_GET['menu_id'] ?? null;

    if ($menuId) {
        $stmt = $db->prepare('SELECT * FROM content_fields WHERE menu_id = ? ORDER BY section_id, field_id');
        $stmt->execute([$menuId]);
    } else {
        $stmt = $db->query('SELECT * FROM content_fields ORDER BY menu_id, section_id, field_id');
    }

    $fields = $stmt->fetchAll();

    $data = array_map(function($field) {
        return [
            'id' => $field['id'],
            'menuId' => $field['menu_id'],
            'sectionId' => $field['section_id'],
            'fieldId' => $field['field_id'],
            'value' => $field['value'] ?? '',
            'type' => $field['field_type'] ?? 'text',
            'label' => $field['label'] ?? '',
            'updatedAt' => $field['updated_at'] ?? null
        ];
    }, $fields);

    successResponse($data);
}

/**
 * Get content fields by menu ID
 */
function getContentFieldsByMenu($db, $menuId) {
    $stmt = $db->prepare('SELECT * FROM content_fields WHERE menu_id = ? ORDER BY section_id, field_id');
    $stmt->execute([$menuId]);
    $fields = $stmt->fetchAll();

    $data = array_map(function($field) {
        return [
            'id' => $field['id'],
            'menuId' => $field['menu_id'],
            'sectionId' => $field['section_id'],
            'fieldId' => $field['field_id'],
            'value' => $field['value'] ?? '',
            'type' => $field['field_type'] ?? 'text',
            'label' => $field['label'] ?? '',
            'updatedAt' => $field['updated_at'] ?? null
        ];
    }, $fields);

    successResponse($data);
}

/**
 * Update or create content field
 */
function updateContentField($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['menu_id', 'section_id', 'field_id']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $timestamp = date('Y-m-d H:i:s');

    // Upsert
    $stmt = $db->prepare("
        INSERT INTO content_fields (id, menu_id, section_id, field_id, value, field_type, label, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)
    ");
    $stmt->execute([
        makeUUID(),
        sanitize($body['menu_id']),
        sanitize($body['section_id']),
        sanitize($body['field_id']),
        sanitize($body['value'] ?? ''),
        sanitize($body['type'] ?? 'text'),
        sanitize($body['label'] ?? ''),
        $timestamp
    ]);

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'update_content_field',
        'content_fields',
        $body['menu_id'] . '/' . $body['section_id'] . '/' . $body['field_id'],
        "Updated content field"
    );

    successResponse(null, 'Content field updated');
}

/**
 * List all content images
 */
function listContentImages($db) {
    $stmt = $db->query('SELECT * FROM content_images ORDER BY field_id');
    $images = $stmt->fetchAll();

    $data = array_map(function($image) {
        return [
            'fieldId' => $image['field_id'],
            'url' => $image['url'],
            'menuId' => $image['menu_id'] ?? '',
            'mimeType' => $image['mime_type'] ?? '',
            'fileSize' => $image['file_size'] ?? 0,
            'altText' => $image['alt_text'] ?? '',
            'updatedAt' => $image['updated_at'] ?? null
        ];
    }, $images);

    successResponse($data);
}

/**
 * Update or create content image
 */
function updateContentImage($db) {
    requireAdmin();
    $body = getRequestBody();

    $errors = validateRequired($body, ['field_id', 'url']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $timestamp = date('Y-m-d H:i:s');

    // Upsert
    $stmt = $db->prepare("
        INSERT INTO content_images (field_id, url, menu_id, mime_type, file_size, alt_text, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE url = VALUES(url), updated_at = VALUES(updated_at)
    ");
    $stmt->execute([
        sanitize($body['field_id']),
        sanitize($body['url']),
        sanitize($body['menu_id'] ?? ''),
        sanitize($body['mime_type'] ?? $body['mimeType'] ?? ''),
        (int)($body['file_size'] ?? $body['fileSize'] ?? 0),
        sanitize($body['alt_text'] ?? $body['altText'] ?? ''),
        $timestamp
    ]);

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'update_content_image',
        'content_images',
        $body['field_id'],
        "Updated content image"
    );

    successResponse(null, 'Content image updated');
}
