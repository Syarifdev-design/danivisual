<?php
/**
 * CORS Configuration
 * DaniVisual PHP Backend
 *
 * Configure allowed origins based on environment.
 * Never use wildcard (*) in production.
 */

declare(strict_types=1);

// Allowed origins - configure per environment
$CORS_ORIGINS = (function(): array {
    $env = getenv('APP_ENV') ?: 'development';
    if ($env === 'production') {
        $domains = getenv('CORS_ALLOWED_DOMAINS');
        if ($domains) {
            return array_filter(array_map('trim', explode(',', $domains)));
        }
        // Fallback for production - must be set via CORS_ALLOWED_DOMAINS env var
        return [];
    }
    // Development - allow localhost
    return [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
    ];
})();

/**
 * Set CORS headers for API requests
 */
function setCorsHeaders(): void {
    global $CORS_ORIGINS;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    $allowedOrigin = null;
    if ($origin !== '' && in_array($origin, $CORS_ORIGINS, true)) {
        $allowedOrigin = $origin;
    }

    if ($allowedOrigin !== null) {
        header("Access-Control-Allow-Origin: {$allowedOrigin}");
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(): void {
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