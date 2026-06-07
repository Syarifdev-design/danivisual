<?php
// Auth helpers

// ============================================================================
// Session Helpers
// ============================================================================

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function isAuthenticated() {
    return isLoggedIn();
}

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getCurrentUserId() {
    return getUserId();
}

function getUserRole() {
    return $_SESSION['user_role'] ?? null;
}

function getUser() {
    if (!isLoggedIn()) return null;
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    $stmt->execute([getUserId()]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function getCurrentUser() {
    return getUser();
}

// ============================================================================
// Authorization Helpers
// ============================================================================

function requireAuth() {
    $u = getUser();
    if (!$u) {
        respondError('Authentication required', 401);
    }
    return $u;
}

function requireRole() {
    $u = requireAuth();
    $roles = func_get_args();
    if (!in_array($u['role'], $roles)) {
        respondError('Insufficient permissions', 403);
    }
    return $u;
}

function requireAdmin() {
    return requireRole('super_admin', 'admin', 'finance', 'editor', 'photographer', 'videographer', 'staff');
}

function requireSuperAdmin() {
    return requireRole('super_admin');
}

// ============================================================================
// Login/Logout
// ============================================================================

function doLogin($email, $password) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([strtolower(trim($email))]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) return null;
    if (!password_verify($password, $user['password_hash'] ?? '')) return null;

    // Update login
    $upd = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
    $upd->execute([$user['id']]);

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['name'];

    recordActivity($user['id'], $user['username'], 'login', 'users', $user['id'], 'Logged in');

    unset($user['password_hash']);
    return $user;
}

function doLogout() {
    if (isLoggedIn()) {
        recordActivity(getUserId(), $_SESSION['user_email'] ?? '', 'logout', 'users', getUserId(), 'Logged out');
    }
    session_destroy();
    session_start();
}

function logoutUser() {
    doLogout();
}

// ============================================================================
// User Management
// ============================================================================

function hashPassword($pw) {
    return password_hash($pw, PASSWORD_BCRYPT);
}

function createUser($data) {
    $db = Database::getInstance();

    // Check existing
    $email = strtolower(trim($data['email'] ?? ''));
    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) return null;

    $id = makeUUID();
    $username = $data['username'] ?? explode('@', $email)[0];
    $hash = hashPassword($data['password'] ?? 'changeme');

    $ins = $db->prepare('INSERT INTO users (id,email,username,password_hash,name,phone,role,position,is_active,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())');
    $ins->execute([$id, $email, $username, $hash, $data['name'], $data['phone'] ?? null, $data['role'] ?? 'customer', $data['position'] ?? null]);

    recordActivity(getUserId(), $_SESSION['user_email'] ?? 'system', 'create_user', 'users', $id, 'Created user: ' . $email);

    $get = $db->prepare('SELECT * FROM users WHERE id = ?');
    $get->execute([$id]);
    $u = $get->fetch(PDO::FETCH_ASSOC);
    unset($u['password_hash']);
    return $u;
}

function updateUser($id, $data) {
    $db = Database::getInstance();
    $updates = [];
    $vals = [];
    foreach (['name', 'phone', 'role', 'position', 'is_active'] as $f) {
        if (isset($data[$f])) {
            $updates[] = $f . ' = ?';
            $vals[] = $data[$f];
        }
    }
    if (empty($updates)) return null;

    $vals[] = $id;
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
    $db->prepare($sql)->execute($vals);
    recordActivity(getUserId(), $_SESSION['user_email'] ?? '', 'update_user', 'users', $id, 'Updated user');
}

function deleteUser($id) {
    $db = Database::getInstance();
    $db->prepare('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?')->execute([$id]);
    recordActivity(getUserId(), $_SESSION['user_email'] ?? '', 'delete_user', 'users', $id, 'Deleted user');
}

// ============================================================================
// Activity Logging (alias for recordActivity)
// ============================================================================

function logActivity($uid, $uname, $action, $etype = null, $eid = null, $desc = null) {
    recordActivity($uid, $uname, $action, $etype, $eid, $desc);
}
