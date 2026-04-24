<?php
header('Content-Type: application/json');

include '../config/db.php';
include '../includes/functions.php';

$product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
$start = isset($_GET['start']) ? $_GET['start'] : '';
$end = isset($_GET['end']) ? $_GET['end'] : '';
$action = $_GET['action'] ?? '';

if (!$product_id) {
    echo json_encode(['available' => false, 'message' => 'Invalid product']);
    exit;
}

$product = getProductById($product_id);
if (!$product) {
    echo json_encode(['available' => false, 'message' => 'Product not found']);
    exit;
}

if ($product['type'] !== 'rent') {
    echo json_encode(['available' => false, 'message' => 'This is not a rental product']);
    exit;
}

if ($action === 'get_disabled') {
    $month = isset($_GET['month']) ? $_GET['month'] : date('Y-m');
    $disabled = getAvailableDatesForProduct($product_id, $month);
    echo json_encode(['disabled' => $disabled]);
    exit;
}

if (!$start || !$end) {
    echo json_encode(['available' => false, 'message' => 'Please select dates']);
    exit;
}

$available = checkAvailableDates($product_id, $start, $end);
$unavailable_dates = [];

foreach ($available as $date => $count) {
    if ($count <= 0) {
        $unavailable_dates[] = $date;
    }
}

if (!empty($unavailable_dates)) {
    echo json_encode([
        'available' => false,
        'unavailable_dates' => $unavailable_dates,
        'message' => 'Some dates are not available'
    ]);
    exit;
}

$start_ts = strtotime($start);
$end_ts = strtotime($end);
$days = (($end_ts - $start_ts) / 86400) + 1;
$total_price = $product['price'] * $days;

echo json_encode([
    'available' => true,
    'total_price' => $total_price,
    'days' => $days,
    'price_per_day' => $product['price']
]);