<?php
/**
 * Response Helper Functions
 * DaniVisual PHP Backend
 */

declare(strict_types=1);

/**
 * Send JSON response
 */
function jsonResponse(
    mixed $data,
    int $statusCode = 200,
    array $headers = []
): never {
    http_response_code($statusCode);
    header('Content-Type: application/json');

    foreach ($headers as $key => $value) {
        header("{$key}: {$value}");
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send success response
 */
function successResponse(
    mixed $data = null,
    string $message = 'Success',
    int $statusCode = 200
): never {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data,
    ], $statusCode);
}

/**
 * Send error response
 */
function errorResponse(
    string $message,
    int $statusCode = 400,
    array $errors = []
): never {
    $response = [
        'success' => false,
        'message' => $message,
    ];

    if (!empty($errors)) {
        $response['errors'] = $errors;
    }

    jsonResponse($response, $statusCode);
}

/**
 * Send paginated response
 */
function paginatedResponse(
    array $data,
    int $total,
    int $page,
    int $perPage
): never {
    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int) ceil($total / $perPage),
        ],
    ]);
}

/**
 * Validate required fields in request body
 */
function validateRequired(
    array $data,
    array $fields
): ?array {
    $errors = [];

    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            $errors[$field] = "Field '{$field}' is required";
        }
    }

    if (!empty($errors)) {
        return $errors;
    }

    return null;
}

/**
 * Sanitize input string
 */
function sanitize(string $input): string
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Generate UUID v4
 */
function generateUUID(): string
{
    $data = random_bytes(16);

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Get pagination parameters from request
 */
function getPagination(): array
{
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 20));
    $offset = ($page - 1) * $perPage;

    return [
        'page' => $page,
        'per_page' => $perPage,
        'offset' => $offset,
    ];
}

/**
 * Get filter parameters from request
 */
function getFilters(): array
{
    $filters = [];

    // Common filter fields
    $filterFields = ['status', 'category', 'role', 'is_active'];

    foreach ($filterFields as $field) {
        if (isset($_GET[$field])) {
            $filters[$field] = $_GET[$field];
        }
    }

    // Date range
    if (isset($_GET['date_from'])) {
        $filters['date_from'] = $_GET['date_from'];
    }
    if (isset($_GET['date_to'])) {
        $filters['date_to'] = $_GET['date_to'];
    }

    // Search query
    if (isset($_GET['q']) && trim($_GET['q']) !== '') {
        $filters['q'] = '%' . trim($_GET['q']) . '%';
    }

    return $filters;
}

/**
 * Get bearer token from Authorization header
 */
function getBearerToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

/**
 * Get request body as array
 */
function getRequestBody(): array
{
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        // Try form data
        parse_str($rawInput, $formData);
        return $formData;
    }

    return $data ?? [];
}

/**
 * Log activity to admin_activity_log
 */
function logActivity(
    ?string $userId,
    string $username,
    string $action,
    ?string $entityType = null,
    ?string $entityId = null,
    ?string $description = null,
    ?array $oldData = null,
    ?array $newData = null
): void {
    try {
        $db = Database::getInstance();

        $stmt = $db->prepare("
            INSERT INTO admin_activity_log
            (id, user_id, username, action, entity_type, entity_id, description, old_data, new_data, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            generateUUID(),
            $userId,
            $username,
            $action,
            $entityType,
            $entityId,
            $description,
            $oldData ? json_encode($oldData) : null,
            $newData ? json_encode($newData) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    } catch (Exception $e) {
        // Silently fail - don't break the main operation
        error_log('Failed to log activity: ' . $e->getMessage());
    }
}