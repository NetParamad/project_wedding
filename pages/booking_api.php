<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json');

include '../config/db.php';
include '../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$product_id = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$guest_name = sanitize($_POST['guest_name'] ?? '');
$guest_phone = sanitize($_POST['guest_phone'] ?? '');
$booking_dates = $_POST['booking_dates'] ?? '';

if (!$product_id || !$guest_name || !$guest_phone || !$booking_dates) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
    exit;
}

$product = getProductById($product_id);
if (!$product || $product['type'] !== 'rent') {
    echo json_encode(['status' => 'error', 'message' => 'สินค้าไม่ถูกต้อง']);
    exit;
}

$dates = explode(' to ', $booking_dates);
if (count($dates) !== 2) {
    echo json_encode(['status' => 'error', 'message' => 'กรุณาเลือกวันที่ให้ถูกต้อง']);
    exit;
}

$start_date = trim($dates[0]);
$end_date = trim($dates[1]);

$start_ts = strtotime($start_date);
$end_ts = strtotime($end_date);
if ($start_ts === false || $end_ts === false || $end_ts < $start_ts) {
    echo json_encode(['status' => 'error', 'message' => 'วันที่ไม่ถูกต้อง']);
    exit;
}

if (!isDateAvailable($product_id, $start_date, $end_date)) {
    echo json_encode(['status' => 'error', 'message' => 'วันที่เลือกไม่มีที่ว่าง กรุณาเลือกวันที่อื่น']);
    exit;
}

$days = (($end_ts - $start_ts) / 86400) + 1;
$total_price = $product['price'] * $days;

$booking_id = saveBooking($product_id, $guest_name, $guest_phone, $start_date, $end_date, $total_price);

if ($booking_id) {
    echo json_encode([
        'status' => 'success', 
        'message' => 'จองสำเร็จ! รหัสการจอง: #' . str_pad($booking_id, 5, '0', STR_PAD_LEFT),
        'booking_id' => $booking_id
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาด กรุณาลองใหม่']);
}
