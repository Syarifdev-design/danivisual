<?php
/**
 * Database Configuration
 * DaniVisual PHP Backend
 *
 * Load configuration from .env.local file
 * DO NOT commit credentials to GitHub!
 */

declare(strict_types=1);

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Load environment variables from .env.local
 */
function loadEnv(string $filepath): void
{
    if (!file_exists($filepath)) {
        throw new RuntimeException(".env.local file not found: {$filepath}");
    }

    $lines = file($filepath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip comments
        if (str_starts_with(trim($line), '#')) {
            continue;
        }

        // Parse KEY=VALUE
        if (str_contains($line, '=')) {
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            $value = trim($value, '"\'');

            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

// Load environment from project root
$envFile = dirname(__DIR__, 2) . '/.env.local';
if (file_exists($envFile)) {
    loadEnv($envFile);
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

define('DB_HOST', $_ENV['DB_HOST'] ?? $_ENV['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'danivisual');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');

// =============================================================================
// APPLICATION CONFIGURATION
// =============================================================================

define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');
define('APP_DEBUG', APP_ENV === 'development');
define('APP_URL', $_ENV['APP_URL'] ?? 'https://danivisual.com');

// Session configuration
define('SESSION_NAME', 'danivisual_session');
define('SESSION_LIFETIME', 86400 * 7); // 7 days

// =============================================================================
// SECURITY
// =============================================================================

// CORS origins (comma-separated in env)
$corsOrigins = $_ENV['CORS_ORIGINS'] ?? '*';
define('CORS_ORIGINS', array_map('trim', explode(',', $corsOrigins));

// API secret for JWT (if needed)
define('API_SECRET', $_ENV['API_SECRET'] ?? '');

// =============================================================================
// PATHS
// =============================================================================

define('ROOT_PATH', dirname(__DIR__, 2));
define('API_PATH', __DIR__ . '/..');
define('UPLOAD_PATH', ROOT_PATH . '/uploads');

// =============================================================================
// ERROR HANDLING
// =============================================================================

if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

ini_set('log_errors', '1');
ini_set('error_log', ROOT_PATH . '/logs/error.log');

// =============================================================================
// TIMEZONE
// =============================================================================

date_default_timezone_set('Asia/Jakarta');

// =============================================================================
// DATABASE CONNECTION (PDO Singleton)
// =============================================================================

class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                DB_HOST,
                DB_PORT,
                DB_NAME
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log('Database connection failed: ' . $e->getMessage());
                throw new RuntimeException('Database connection failed');
            }
        }

        return self::$instance;
    }

    private function __construct()
    {
    }

    private function __clone()
    {
    }
}

// =============================================================================
// SESSION INITIALIZATION
// =============================================================================

function initSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path' => '/',
            'secure' => APP_ENV === 'production',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

// Start session for all API requests
initSession();