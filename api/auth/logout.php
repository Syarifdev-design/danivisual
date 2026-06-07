<?php
// Logout endpoint

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

try {
    logoutUser();
    echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
