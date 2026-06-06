<?php
/**
 * Login Endpoint
 * POST /api/auth/login.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
    $data = getRequestBody();

    // Validate required fields
    $errors = validateRequired($data, ['email', 'password']);
    if ($errors !== null) {
        errorResponse('Validation failed', 400, $errors);
    }

    $email = sanitize($data['email']);
    $password = $data['password'];

    // Attempt login
    $user = loginUser($email, $password);

    if ($user === null) {
        errorResponse('Email atau password salah', 401);
    }

    // Remove password hash from response
    unset($user['password_hash']);

    successResponse($user, 'Login berhasil');

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan saat login', 500);
}