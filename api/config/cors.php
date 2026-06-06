<?php
/**
 * CORS Configuration
 * DaniVisual PHP Backend
 */

declare(strict_types=1);

require_once __DIR__ . '/database.php';

/**
 * Set CORS headers for API requests
 */
function setCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

    // Check if origin is allowed
    if (in_array('*', CORS_ORIGINS) || in_array($origin, CORS_ORIGINS)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    // Credentials support
    header('Access-Control-Allow-Credentials: true');
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        setCorsHeaders();
        http_response_code(204);
        exit;
    }
}

// Apply CORS headers to all responses
setCorsHeaders();

// Handle preflight
handlePreflight();