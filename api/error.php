<?php
/**
 * DaniVisual API Error Handler
 * Handles HTTP errors and returns JSON responses
 */

$code = isset($_GET['code']) ? (int)$_GET['code'] : 500;
$message = '';

switch ($code) {
    case 400:
        $message = 'Bad Request - Parameter yang dikirim tidak valid';
        break;
    case 401:
        $message = 'Unauthorized - Silakan login terlebih dahulu';
        break;
    case 403:
        $message = 'Forbidden - Anda tidak memiliki akses ke resource ini';
        break;
    case 404:
        $message = 'Not Found - Resource tidak ditemukan';
        break;
    case 405:
        $message = 'Method Not Allowed - Method HTTP tidak diizinkan';
        break;
    case 500:
 default:
        $message = 'Internal Server Error - Terjadi kesalahan server';
        break;
}

http_response_code($code);
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'error' => [
        'code' => $code,
        'message' => $message
    ]
], JSON_UNESCAPED_UNICODE);
