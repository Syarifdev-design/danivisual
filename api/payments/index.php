<?php
/**
 * Payments API Endpoint
 * GET /api/payments - List all payments
 * GET /api/payments/:id - Get single payment
 * POST /api/payments - Create payment
 * POST /api/payments/verify - Verify payment (admin/finance)
 * POST /api/payments/reject - Reject payment (admin/finance)
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', trim($path, '/')));
$lastPart = end($parts);
$secondLast = count($parts) > 1 ? $parts[count($parts) - 2] : null;

try {
    $db = Database::getInstance();

    // Special routes
    if ($method === 'POST' && str_ends_with($path, '/verify')) {
        verifyPayment($db);
        return;
    }
    if ($method === 'POST' && str_ends_with($path, '/reject')) {
        rejectPayment($db);
        return;
    }

    switch ($method) {
        case 'GET':
            if (is_numeric($lastPart) && $lastPart !== 'payments') {
                getPaymentById($db, $lastPart);
            } else {
                listPayments($db);
            }
            break;

        case 'POST':
            createPayment($db);
            break;

        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Payment API error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}

/**
 * List all payments
 */
function listPayments($db) {
    // Require admin/finance for listing
    $user = getCurrentUser();
    if (!$user || !in_array($user['role'], ['super_admin', 'admin', 'finance'])) {
        // For public, only show by order number
        $orderNumber = $_GET['order_number'] ?? null;
        if (!$orderNumber) {
            errorResponse('Authentication required', 401);
        }
        $stmt = $db->prepare('SELECT * FROM payments WHERE booking_order_number = ? ORDER BY created_at DESC');
        $stmt->execute([$orderNumber]);
    } else {
        // Admin/Finance can see all
        $status = $_GET['status'] ?? null;
        $bookingId = $_GET['booking_id'] ?? null;
        $orderNumber = $_GET['order_number'] ?? null;

        $where = ['1=1'];
        $params = [];

        if ($status) {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        if ($bookingId) {
            $where[] = 'booking_id = ?';
            $params[] = $bookingId;
        }
        if ($orderNumber) {
            $where[] = 'booking_order_number = ?';
            $params[] = $orderNumber;
        }

        $whereClause = implode(' AND ', $where);
        $stmt = $db->prepare("SELECT * FROM payments WHERE $whereClause ORDER BY created_at DESC");
        $stmt->execute($params);
    }

    $payments = $stmt->fetchAll();

    $data = array_map(function($payment) {
        return [
            'id' => $payment['id'],
            'bookingId' => $payment['booking_id'],
            'bookingOrderNumber' => $payment['booking_order_number'],
            'customerName' => $payment['customer_name'] ?? '',
            'amount' => (float)$payment['amount'],
            'method' => $payment['method'],
            'status' => $payment['status'],
            'type' => $payment['payment_type'] ?? 'dp',
            'proofImage' => $payment['proof_image_url'] ?? '',
            'notes' => $payment['notes'] ?? '',
            'verifiedBy' => $payment['verified_by'] ?? '',
            'verifiedAt' => $payment['verified_at'] ?? '',
            'createdAt' => $payment['created_at']
        ];
    }, $payments);

    successResponse($data);
}

/**
 * Get payment by ID
 */
function getPaymentById($db, $id) {
    $stmt = $db->prepare('SELECT * FROM payments WHERE id = ?');
    $stmt->execute([$id]);
    $payment = $stmt->fetch();

    if (!$payment) {
        errorResponse('Payment not found', 404);
    }

    $data = [
        'id' => $payment['id'],
        'bookingId' => $payment['booking_id'],
        'bookingOrderNumber' => $payment['booking_order_number'],
        'customerName' => $payment['customer_name'] ?? '',
        'amount' => (float)$payment['amount'],
        'method' => $payment['method'],
        'status' => $payment['status'],
        'type' => $payment['payment_type'] ?? 'dp',
        'proofImage' => $payment['proof_image_url'] ?? '',
        'notes' => $payment['notes'] ?? '',
        'verifiedBy' => $payment['verified_by'] ?? '',
        'verifiedAt' => $payment['verified_at'] ?? '',
        'createdAt' => $payment['created_at']
    ];

    successResponse($data);
}

/**
 * Create new payment
 */
function createPayment($db) {
    $body = getRequestBody();

    $errors = validateRequired($body, ['booking_order_number', 'amount']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $id = makeUUID();

    $stmt = $db->prepare("
        INSERT INTO payments
        (id, booking_id, booking_order_number, customer_name, amount, method, payment_type,
         status, proof_image_url, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $id,
        sanitize($body['booking_id'] ?? ''),
        sanitize($body['booking_order_number']),
        sanitize($body['customer_name'] ?? ''),
        (float)$body['amount'],
        sanitize($body['method'] ?? 'transfer'),
        sanitize($body['type'] ?? 'dp'),
        'pending',
        sanitize($body['proof_image'] ?? $body['proofImage'] ?? ''),
        sanitize($body['notes'] ?? '')
    ]);

    // Log if admin created
    if (isAuthenticated()) {
        logActivity(
            getCurrentUserId(),
            getCurrentUser()['username'],
            'create_payment',
            'payments',
            $id,
            "Created payment for order: " . $body['booking_order_number']
        );
    }

    http_response_code(201);
    successResponse(['id' => $id], 'Payment created');
}

/**
 * Verify payment
 */
function verifyPayment($db) {
    requireRole('super_admin', 'admin', 'finance');
    $body = getRequestBody();

    $errors = validateRequired($body, ['payment_id']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $user = getCurrentUser();
    $timestamp = date('Y-m-d H:i:s');

    // Update payment status
    $stmt = $db->prepare("
        UPDATE payments
        SET status = 'verified', verified_by = ?, verified_at = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$user['username'], $timestamp, $body['payment_id']]);

    // Get payment details for booking update
    $stmt = $db->prepare('SELECT * FROM payments WHERE id = ?');
    $stmt->execute([$body['payment_id']]);
    $payment = $stmt->fetch();

    if ($payment && !empty($payment['booking_order_number'])) {
        // Update booking paid amount
        $stmt = $db->prepare("
            UPDATE bookings
            SET paid_amount = paid_amount + ?, remaining_amount = total_amount - (paid_amount + ?), updated_at = NOW()
            WHERE order_number = ?
        ");
        $stmt->execute([$payment['amount'], $payment['amount'], $payment['booking_order_number']]);

        // Update booking status if needed
        $stmt = $db->prepare("
            UPDATE bookings
            SET status = 'confirmed', updated_at = NOW()
            WHERE order_number = ? AND status = 'pending'
        ");
        $stmt->execute([$payment['booking_order_number']]);
    }

    logActivity(
        getCurrentUserId(),
        $user['username'],
        'verify_payment',
        'payments',
        $body['payment_id'],
        "Verified payment for order: " . ($payment['booking_order_number'] ?? 'unknown')
    );

    successResponse(null, 'Payment verified');
}

/**
 * Reject payment
 */
function rejectPayment($db) {
    requireRole('super_admin', 'admin', 'finance');
    $body = getRequestBody();

    $errors = validateRequired($body, ['payment_id']);
    if ($errors !== null) {
        errorResponse('Missing required fields', 400, $errors);
    }

    $user = getCurrentUser();
    $timestamp = date('Y-m-d H:i:s');

    // Update payment status
    $stmt = $db->prepare("
        UPDATE payments
        SET status = 'rejected', verified_by = ?, verified_at = ?, notes = CONCAT(IFNULL(notes, ''), ?), updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([
        $user['username'],
        $timestamp,
        $body['notes'] ? "\nRejected: " . sanitize($body['notes']) : '',
        $body['payment_id']
    ]);

    logActivity(
        getCurrentUserId(),
        $user['username'],
        'reject_payment',
        'payments',
        $body['payment_id'],
        "Rejected payment"
    );

    successResponse(null, 'Payment rejected');
}
