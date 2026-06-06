<?php
/**
 * Bookings API
 * /api/bookings/index.php - GET all bookings
 * /api/bookings/read.php - GET single booking
 * /api/bookings/create.php - POST create booking
 * /api/bookings/update.php - PUT update booking (admin)
 * /api/bookings/verify-payment.php - POST verify payment (finance)
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

/**
 * Generate order number
 */
function generateOrderNumber(): string
{
    $date = date('dmy');
    $random = str_pad((string) random_int(1, 999), 3, '0', STR_PAD_LEFT);
    return "DV-{$date}-{$random}";
}

/**
 * GET - List bookings
 */
function listBookings(): void
{
    // Require admin for listing all bookings
    requireAdmin();

    $db = Database::getInstance();
    $pagination = getPagination();
    $filters = getFilters();

    $where = ['1=1'];
    $params = [];

    // Apply filters
    if (!empty($filters['status'])) {
        $where[] = 'b.status = ?';
        $params[] = $filters['status'];
    }

    if (!empty($filters['date_from'])) {
        $where[] = 'b.event_date >= ?';
        $params[] = $filters['date_from'];
    }

    if (!empty($filters['date_to'])) {
        $where[] = 'b.event_date <= ?';
        $params[] = $filters['date_to'];
    }

    if (!empty($filters['q'])) {
        $where[] = '(b.order_number LIKE ? OR b.customer_name LIKE ? OR b.customer_email LIKE ?)';
        $search = '%' . $filters['q'] . '%';
        $params[] = $search;
        $params[] = $search;
        $params[] = $search;
    }

    // Finance role - read only
    $user = getCurrentUser();
    if ($user['role'] === 'finance') {
        $where[] = '1=1'; // Finance can see all (read-only)
    }

    $whereClause = implode(' AND ', $where);

    // Count total
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM bookings b WHERE {$whereClause}");
    $stmt->execute($params);
    $total = (int) $stmt->fetch()['total'];

    // Get bookings
    $params[] = $pagination['per_page'];
    $params[] = $pagination['offset'];

    $sql = "
        SELECT b.*, c.name as customer_name_full
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE {$whereClause}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    // Get payments for each booking
    foreach ($bookings as &$booking) {
        $stmt = $db->prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC');
        $stmt->execute([$booking['id']]);
        $booking['payments'] = $stmt->fetchAll();
    }

    paginatedResponse($bookings, $total, $pagination['page'], $pagination['per_page']);
}

/**
 * GET - Get single booking
 */
function getBooking(string $id): void
{
    $db = Database::getInstance();
    $user = getCurrentUser();

    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        errorResponse('Booking not found', 404);
    }

    // Get payments
    $stmt = $db->prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC');
    $stmt->execute([$id]);
    $booking['payments'] = $stmt->fetchAll();

    // Get customer info
    $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
    $stmt->execute([$booking['customer_id']]);
    $booking['customer'] = $stmt->fetch();

    successResponse($booking);
}

/**
 * POST - Create booking (public)
 */
function createBooking(): void
{
    $db = Database::getInstance();
    $data = getRequestBody();

    // Validate
    $errors = validateRequired($data, [
        'customer_name', 'customer_phone', 'event_date', 'package_id', 'package_name', 'total_amount'
    ]);
    if ($errors !== null) {
        errorResponse('Validation failed', 400, $errors);
    }

    $id = generateUUID();
    $orderNumber = generateOrderNumber();

    // Get or create customer
    $customerId = null;
    if (isAuthenticated()) {
        $customerId = $_SESSION['user_id'] ?? null;
    } elseif (!empty($data['customer_email'])) {
        // Check if customer exists
        $stmt = $db->prepare('SELECT id FROM customers WHERE email = ?');
        $stmt->execute([$data['customer_email']]);
        $existing = $stmt->fetch();

        if ($existing) {
            $customerId = $existing['id'];
        } else {
            // Create new customer
            $customerId = generateUUID();
            $stmt = $db->prepare("
                INSERT INTO customers (id, name, email, phone, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $customerId,
                sanitize($data['customer_name']),
                sanitize($data['customer_email'] ?? ''),
                sanitize($data['customer_phone']),
            ]);
        }
    }

    // Create booking
    $stmt = $db->prepare("
        INSERT INTO bookings
        (id, order_number, customer_id, customer_name, customer_email, customer_phone,
         package_id, package_name, package_price, event_date, event_time,
         event_location, event_type, service_type, total_amount,
         dp_amount, status, notes, created_at)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $id,
        $orderNumber,
        $customerId,
        sanitize($data['customer_name']),
        sanitize($data['customer_email'] ?? ''),
        sanitize($data['customer_phone']),
        sanitize($data['package_id'] ?? ''),
        sanitize($data['package_name'] ?? ''),
        (float) ($data['package_price'] ?? 0),
        sanitize($data['event_date']),
        sanitize($data['event_time'] ?? ''),
        sanitize($data['event_location'] ?? ''),
        sanitize($data['event_type'] ?? ''),
        sanitize($data['service_type'] ?? ''),
        (float) $data['total_amount'],
        0,
        'pending',
        sanitize($data['notes'] ?? ''),
    ]);

    // Log if admin created
    if (isAuthenticated()) {
        logActivity(
            getCurrentUserId(),
            getCurrentUser()['username'],
            'create_booking',
            'bookings',
            $id,
            "Created booking: {$orderNumber}"
        );
    }

    getBooking($id);
}

/**
 * PUT - Update booking (admin only)
 */
function updateBooking(string $id): void
{
    requireAdmin();
    $db = Database::getInstance();
    $data = getRequestBody();

    $updates = [];
    $params = [];

    $fields = [
        'status', 'event_date', 'event_time', 'event_location',
        'event_type', 'package_name', 'package_price', 'total_amount',
        'dp_amount', 'paid_amount', 'remaining_amount', 'notes'
    ];

    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "{$field} = ?";
            $params[] = $data[$field];
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE bookings SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    logActivity(
        getCurrentUserId(),
        getCurrentUser()['username'],
        'update_booking',
        'bookings',
        $id,
        'Updated booking ID: ' . $id
    );

    getBooking($id);
}

/**
 * POST - Verify payment (finance/admin)
 */
function verifyPayment(): void
{
    requireRole('super_admin', 'admin', 'finance');

    $db = Database::getInstance();
    $data = getRequestBody();

    $errors = validateRequired($data, ['payment_id', 'booking_id']);
    if ($errors !== null) {
        errorResponse('Validation failed', 400, $errors);
    }

    $user = getCurrentUser();

    // Update payment status
    $stmt = $db->prepare("
        UPDATE payments
        SET status = 'verified', verified_by = ?, verified_at = NOW(), updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$user['username'], $data['payment_id']]);

    // Update booking status if needed
    $stmt = $db->prepare("
        UPDATE bookings
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ? AND status = 'pending'
    ");
    $stmt->execute([$data['booking_id']]);

    logActivity(
        getCurrentUserId(),
        $user['username'],
        'verify_payment',
        'payments',
        $data['payment_id'],
        "Verified payment for booking: {$data['booking_id']}"
    );

    successResponse(null, 'Payment verified');
}

// Route handler
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = array_filter(explode('/', trim($path, '/')));
$lastPart = end($pathParts);
$secondLast = count($pathParts) > 1 ? $pathParts[count($pathParts) - 2] : null;

try {
    switch ($method) {
        case 'GET':
            if ($lastPart === 'bookings' || str_contains($path, '/api/bookings')) {
                if (is_numeric($lastPart)) {
                    getBooking($lastPart);
                } else {
                    listBookings();
                }
            }
            break;

        case 'POST':
            if ($secondLast === 'verify-payment') {
                verifyPayment();
            } else {
                createBooking();
            }
            break;

        case 'PUT':
            if (is_numeric($lastPart)) {
                updateBooking($lastPart);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Bookings API error: ' . $e->getMessage());
    errorResponse('Terjadi kesalahan', 500);
}