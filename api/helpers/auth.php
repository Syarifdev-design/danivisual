<?php
/**
 * Authentication Helper
 * DaniVisual PHP Backend
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/**
 * Check if user is logged in
 */
function isAuthenticated(): bool
{
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current user ID
 */
function getCurrentUserId(): ?string
{
    return $_SESSION['user_id'] ?? null;
}

/**
 * Get current user role
 */
function getCurrentUserRole(): ?string
{
    return $_SESSION['user_role'] ?? null;
}

/**
 * Get current user data
 */
function getCurrentUser(): ?array
{
    if (!isAuthenticated()) {
        return null;
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    $stmt->execute([getCurrentUserId()]);
    $user = $stmt->fetch();

    return $user ?: null;
}

/**
 * Require authentication - exit if not logged in
 */
function requireAuth(): array
{
    $user = getCurrentUser();

    if ($user === null) {
        errorResponse('Authentication required', 401);
    }

    return $user;
}

/**
 * Require specific roles - exit if not authorized
 */
function requireRole(string ...$roles): array
{
    $user = requireAuth();

    if (!in_array($user['role'], $roles)) {
        errorResponse('Forbidden - insufficient permissions', 403);
    }

    return $user;
}

/**
 * Require admin access (super_admin, admin, finance, editor, staff, photographer, videographer)
 */
function requireAdmin(): array
{
    return requireRole('super_admin', 'admin', 'finance', 'editor', 'photographer', 'videographer', 'staff');
}

/**
 * Require super admin access
 */
function requireSuperAdmin(): array
{
    return requireRole('super_admin');
}

/**
 * Login user
 */
function loginUser(string $email, string $password): ?array
{
    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([strtolower(trim($email)]);
    $user = $stmt->fetch();

    if ($user === false) {
        return null;
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        return null;
    }

    // Update last login
    $updateStmt = $db->prepare("
        UPDATE users
        SET last_login = NOW(), login_count = login_count + 1
        WHERE id = ?
    ");
    $updateStmt->execute([$user['id']]);

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['name'];

    // Log activity
    logActivity($user['id'], $user['username'], 'login', 'users', $user['id'], 'User logged in');

    return $user;
}

/**
 * Logout current user
 */
function logoutUser(): void
{
    if (isAuthenticated()) {
        logActivity(
            getCurrentUserId(),
            $_SESSION['user_email'] ?? 'unknown',
            'logout',
            'users',
            getCurrentUserId(),
            'User logged out'
        );
    }

    // Clear session
    session_destroy();
    session_start();
    session_regenerate_id(true);
}

/**
 * Hash password using bcrypt
 */
function hashPassword(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT, [
        'cost' => 12,
    ]);
}

/**
 * Create new user
 */
function createUser(array $data): ?array
{
    $db = Database::getInstance();

    // Check if email exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([strtolower(trim($data['email']))];
    if ($stmt->fetch()) {
        return null; // Email already exists
    }

    // Generate ID
    $id = generateUUID();

    // Insert user
    $stmt = $db->prepare("
        INSERT INTO users
        (id, email, username, password_hash, name, phone, role, position, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    ");

    $stmt->execute([
        $id,
        strtolower(trim($data['email'])),
        $data['username'] ?? explode('@', $data['email'])[0],
        hashPassword($data['password'] ?? $data['temporary_password'] ?? 'changeme123'),
        $data['name'],
        $data['phone'] ?? null,
        $data['role'] ?? 'customer',
        $data['position'] ?? null,
    ]);

    // Fetch created user
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    // Log activity
    logActivity(
        getCurrentUserId(),
        $_SESSION['user_email'] ?? 'system',
        'create_user',
        'users',
        $id,
        "Created user: {$user['email']}"
    );

    return $user;
}

/**
 * Update user
 */
function updateUser(string $id, array $data): ?array
{
    $db = Database::getInstance();

    // Build update query dynamically
    $updates = [];
    $values = [];

    $allowedFields = ['name', 'phone', 'role', 'position', 'is_active', 'avatar_url', 'whatsapp'];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "{$field} = ?";
            $values[] = $data[$field];
        }
    }

    if (empty($updates)) {
        return null;
    }

    $values[] = $id;
    $sql = "UPDATE users SET " . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    // Fetch updated user
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    // Log activity
    logActivity(
        getCurrentUserId(),
        $_SESSION['user_email'] ?? 'system',
        'update_user',
        'users',
        $id,
        "Updated user: {$user['email']}"
    );

    return $user;
}

/**
 * Delete user (soft delete - set is_active = 0)
 */
function deleteUser(string $id): bool
{
    $db = Database::getInstance();

    $stmt = $db->prepare("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$id]);

    if ($result) {
        // Log activity
        logActivity(
            getCurrentUserId(),
            $_SESSION['user_email'] ?? 'system',
            'delete_user',
            'users',
            $id,
            "Deleted user ID: {$id}"
        );
    }

    return $result;
}