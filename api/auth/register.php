<?php
// Register endpoint

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

header('Content-Type: application/json');

try {
    // Only allow registration in dev or if admin
    if (getenv('APP_ENV') === 'production') {
        requireSuperAdmin();
    }
    $body = getRequestBody();
    if (empty($body['email']) || empty($body['name'])) {
        echo json_encode(['success' => false, 'message' => 'Email and name required']);
        exit;
    }
    if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email']);
        exit;
    }
    $user = createUser($body);
    if (!$user) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        exit;
    }
    echo json_encode(['success' => true, 'message' => 'User created', 'data' => $user]);
} catch (Exception $e) {
    error_log('Register error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
