<?php
/**
 * Logout Endpoint
 * POST /api/auth/logout.php
 */

declare(strict_types=1);

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
    logoutUser();
    successResponse(null, 'Logout berhasil');

} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan saat logout', 500);
}