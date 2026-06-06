<?php
/**
 * Get Current User Endpoint
 * GET /api/auth/me.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
    $user = getCurrentUser();

    if ($user === null) {
        errorResponse('Not authenticated', 401);
    }

    // Remove password hash from response
    unset($user['password_hash']);

    successResponse($user, 'User data retrieved');

} catch (Exception $e) {
    error_log('Me error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan', 500);
}