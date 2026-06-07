<?php
// Login API

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$body = getBody();
$email = isset($body['email']) ? $body['email'] : '';
$password = isset($body['password']) ? $body['password'] : '';

if (empty($email) || empty($password)) {
    respondError('Email and password required');
}

$user = doLogin($email, $password);
if (!$user) {
    http_response_code(401);
    respondJSON(['success' => false, 'message' => 'Invalid credentials']);
}

respondOK($user, 'Login berhasil');
