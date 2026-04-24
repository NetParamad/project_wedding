<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json');

include '../config/db.php';
include '../includes/functions.php';

$action = $_GET['action'] ?? '';
$product_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$quantity = isset($_GET['qty']) ? (int)$_GET['qty'] : 1;

if ($action === 'add') {
    if (!isset($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }
    
    if (isset($_SESSION['cart'][$product_id])) {
        $_SESSION['cart'][$product_id] += $quantity;
    } else {
        $_SESSION['cart'][$product_id] = $quantity;
    }
    
    echo json_encode(['status' => 'success', 'cart_count' => count($_SESSION['cart'])]);
    exit;
}

if ($action === 'remove') {
    unset($_SESSION['cart'][$product_id]);
    echo json_encode(['status' => 'success', 'cart_count' => count($_SESSION['cart'])]);
    exit;
}

if ($action === 'update') {
    $quantity = isset($_GET['qty']) ? (int)$_GET['qty'] : 1;
    if ($quantity > 0) {
        $_SESSION['cart'][$product_id] = $quantity;
    } else {
        unset($_SESSION['cart'][$product_id]);
    }
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'get_cart') {
    $items = [];
    $total = 0;
    
    if (!empty($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $pid => $qty) {
            $product = getProductById($pid);
            if ($product) {
                $items[] = [
                    'id' => $pid,
                    'name' => $product['name'],
                    'price' => $product['price'],
                    'quantity' => $qty,
                    'total' => $product['price'] * $qty,
                    'image' => $product['image']
                ];
                $total += $product['price'] * $qty;
            }
        }
    }
    
    echo json_encode(['items' => $items, 'total' => $total, 'count' => count($items)]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);