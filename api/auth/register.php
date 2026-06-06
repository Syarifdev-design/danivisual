<?php
/**
 * Register Endpoint
 * POST /api/auth/register.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
    // Require admin to create users (for now, disable public registration)
    if (APP_ENV === 'production') {
        requireSuperAdmin();
    }

    $data = getRequestBody();

    // Validate required fields
    $errors = validateRequired($data, ['email', 'name']);
    if ($errors !== null) {
        errorResponse('Validation failed', 400, $errors);
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        errorResponse('Email tidak valid', 400);
    }

    // Validate password for new users (if provided)
    if (isset($data['password']) && strlen($data['password']) < 6) {
        errorResponse('Password minimal 6 karakter', 400);
    }

    // Create user
    $user = createUser($data);

    if ($user === null) {
        errorResponse('Email sudah terdaftar', 409);
    }

    // Remove password hash from response
    unset($user['password_hash']);

    successResponse($user, 'User berhasil dibuat', 201);

} catch (Exception $e) {
    error_log('Register error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan saat registrasi', 500);
}