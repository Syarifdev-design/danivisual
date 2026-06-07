<?php
/**
 * Database Configuration
 * Reads from api/.env.local file and server environment variables.
 * Priority: .env.local file > server environment variables > defaults
 */

class Database {
    private static ?PDO $pdo = null;

    /**
     * Load environment variables from .env.local file
     */
    private static function loadEnvFile(string $path): void {
        if (!file_exists($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);

            // Skip empty lines and comments
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $eq = strpos($line, '=');
            if ($eq === false) {
                continue;
            }

            $key = trim(substr($line, 0, $eq));
            $val = trim(substr($line, $eq + 1));

            // Remove surrounding quotes
            $val = trim($val, "\"'");

            // Set both $_ENV and environment variable
            $_ENV[$key] = $val;
            putenv("$key=$val");
        }
    }

    /**
     * Get configuration from environment variables
     */
    private static function getConfig(): array {
        // Load from .env.local first
        $envPath = __DIR__ . '/../.env.local';
        self::loadEnvFile($envPath);

        return [
            'host' => $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost',
            'port' => $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306',
            'name' => $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'danivisual',
            'user' => $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root',
            'pass' => $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '',
        ];
    }

    /**
     * Get PDO connection instance
     */
    public static function get(): PDO {
        if (self::$pdo === null) {
            $c = self::getConfig();

            // Validate required config
            if (empty($c['name']) || empty($c['user'])) {
                error_log('Database configuration incomplete');
                throw new Exception('Database configuration is incomplete');
            }

            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $c['host'],
                $c['port'],
                $c['name']
            );

            try {
                self::$pdo = new PDO($dsn, $c['user'], $c['pass'], [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                error_log('Database connection failed: ' . $e->getMessage());
                throw new Exception('Database connection failed');
            }
        }
        return self::$pdo;
    }

    /**
     * Alias for get() - backward compatibility
     */
    public static function getInstance(): PDO {
        return self::get();
    }
}

// Start session with secure defaults
if (session_status() === PHP_SESSION_NONE) {
    $isProduction = ($_ENV['APP_ENV'] ?? getenv('APP_ENV')) === 'production';
    $sessionName = $_ENV['SESSION_NAME'] ?? getenv('SESSION_NAME') ?: 'danivisual_session';
    session_name($sessionName);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isProduction,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}