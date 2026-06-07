<?php
/**
 * Database Health Check Endpoint
 * GET /api/health/db - Test database connection
 */

declare(strict_types=1);

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/database.php';

    $db = Database::get();

    // Simple test query
    $stmt = $db->query('SELECT 1 AS ok');
    $result = $stmt->fetch();

    if ($result && $result['ok'] == 1) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Database connected',
            'data' => [
                'ok' => 1,
                'host' => $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost',
                'database' => $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'unknown',
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception('Query did not return expected result');
    }
} catch (Exception $e) {
    error_log('Database health check failed: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ], JSON_UNESCAPED_UNICODE);
}