<?php
// Response helpers for JSON API

function respondJSON($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respondOK($data = null, $msg = 'OK', $code = 200) {
    respondJSON(['success' => true, 'message' => $msg, 'data' => $data], $code);
}

function respondError($msg, $code = 400) {
    respondJSON(['success' => false, 'message' => $msg], $code);
}

// Aliases for consistency
function successResponse($data = null, $msg = 'OK', $code = 200) {
    respondOK($data, $msg, $code);
}

function errorResponse($msg, $code = 400, $errors = null) {
    $data = ['success' => false, 'message' => $msg];
    if ($errors !== null) {
        $data['errors'] = $errors;
    }
    respondJSON($data, $code);
}

function clean($s) {
    return htmlspecialchars(trim($s), ENT_QUOTES, 'UTF-8');
}

function sanitize($s) {
    return clean($s);
}

function makeUUID() {
    return sprintf(
        '%04x%04x-%04x-4%03x-%04x-%04x%04x%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xfff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

function generateUUID() {
    return makeUUID();
}

function getPage() {
    $p = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $per = isset($_GET['per_page']) ? min(100, max(1, intval($_GET['per_page']))) : 20;
    return ['page' => $p, 'per_page' => $per, 'offset' => ($p - 1) * $per];
}

function getPagination() {
    return getPage();
}

function getFilters() {
    $filters = [];
    if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
    if (isset($_GET['date_from'])) $filters['date_from'] = $_GET['date_from'];
    if (isset($_GET['date_to'])) $filters['date_to'] = $_GET['date_to'];
    if (isset($_GET['q'])) $filters['q'] = $_GET['q'];
    if (isset($_GET['search'])) $filters['q'] = $_GET['search'];
    if (isset($_GET['category'])) $filters['category'] = $_GET['category'];
    if (isset($_GET['role'])) $filters['role'] = $_GET['role'];
    if (isset($_GET['type'])) $filters['type'] = $_GET['type'];
    return $filters;
}

function getBody() {
    $raw = file_get_contents('php://input');
    $dec = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && $dec !== null) {
        return $dec;
    }
    $out = [];
    parse_str($raw, $out);
    return $out;
}

// Alias for getBody()
function getRequestBody() {
    return getBody();
}

function paginatedResponse($data, $total, $page, $perPage) {
    respondJSON([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
}

function validateRequired($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            $missing[] = $field;
        }
    }
    return empty($missing) ? null : $missing;
}

function recordActivity($uid, $uname, $action, $etype = null, $eid = null, $desc = null) {
    try {
        $db = Database::getInstance();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $stmt = $db->prepare(
            'INSERT INTO admin_activity_log ' .
            '(id,user_id,username,action,entity_type,entity_id,description,ip_address,user_agent,created_at) ' .
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([makeUUID(), $uid, $uname, $action, $etype, $eid, $desc, $ip, $ua]);
    } catch (Exception $e) {
        // Silent fail
    }
}
