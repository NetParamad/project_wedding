<?php
include __DIR__ . '/../config/db.php';

function getSetting($key) {
    global $conn;
    $stmt = $conn->prepare("SELECT value FROM settings WHERE setting_key = ?");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    return $row ? $row['value'] : '';
}

function getProducts($type = null) {
    global $conn;
    $sql = "SELECT * FROM products WHERE status = 'active'";
    $params = [];
    $types = "";
    if ($type) {
        $sql .= " AND type = ?";
        $params[] = $type;
        $types .= "s";
    }
    $sql .= " ORDER BY id DESC";
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function getProductById($id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_assoc() : null;
}

function getMaxBookingsPerDay() {
    return 3;
}

function checkAvailableDates($product_id, $start_date, $end_date) {
    global $conn;
    $max_per_day = getMaxBookingsPerDay();
    
    $dates = [];
    $current = strtotime($start_date);
    $end = strtotime($end_date);
    while ($current <= $end) {
        $dates[] = date('Y-m-d', $current);
        $current = strtotime('+1 day', $current);
    }
    
    $available = [];
    foreach ($dates as $date) {
        $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM bookings WHERE product_id = ? AND status IN ('pending', 'confirmed') AND ((start_date <= ? AND end_date >= ?))");
        $stmt->bind_param("iss", $product_id, $date, $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $available[$date] = $max_per_day - $row['cnt'];
    }
    return $available;
}

function isDateAvailable($product_id, $start_date, $end_date) {
    $available = checkAvailableDates($product_id, $start_date, $end_date);
    foreach ($available as $count) {
        if ($count <= 0) {
            return false;
        }
    }
    return true;
}

function getAvailableDatesForProduct($product_id, $month = null) {
    global $conn;
    $max_per_day = getMaxBookingsPerDay();
    
    if (!$month) {
        $month = date('Y-m');
    }
    
    $start_of_month = $month . '-01';
    $end_of_month = date('Y-m-t', strtotime($start_of_month));
    
    $stmt = $conn->prepare("SELECT start_date, end_date FROM bookings WHERE product_id = ? AND status IN ('pending', 'confirmed') AND ((start_date <= ? AND end_date >= ?))");
    $stmt->bind_param("iss", $product_id, $end_of_month, $start_of_month);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $booked_dates = [];
    while ($row = $result->fetch_assoc()) {
        $current = strtotime($row['start_date']);
        $end = strtotime($row['end_date']);
        while ($current <= $end) {
            $d = date('Y-m-d', $current);
            if (!isset($booked_dates[$d])) {
                $booked_dates[$d] = 0;
            }
            $booked_dates[$d]++;
            $current = strtotime('+1 day', $current);
        }
    }
    
    $disabled = [];
    foreach ($booked_dates as $date => $count) {
        if ($count >= $max_per_day) {
            $disabled[] = $date;
        }
    }
    
    return $disabled;
}

function saveOrder($user_id, $items, $total_price) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO orders (user_id, total_price, status, created_at) VALUES (?, ?, 'pending', NOW())");
    $stmt->bind_param("id", $user_id, $total_price);
    $stmt->execute();
    $order_id = $conn->insert_id;
    
    foreach ($items as $item) {
        $stmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiid", $order_id, $item['product_id'], $item['quantity'], $item['price']);
        $stmt->execute();
    }
    
    return $order_id;
}

function getOrders($user_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function getOrderItems($order_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function updateOrderPayment($order_id, $slip_path) {
    global $conn;
    $stmt = $conn->prepare("UPDATE orders SET payment_slip = ?, status = 'pending_payment' WHERE id = ?");
    $stmt->bind_param("si", $slip_path, $order_id);
    return $stmt->execute();
}

function getOrderById($order_id, $user_id = null) {
    global $conn;
    if ($user_id) {
        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $order_id, $user_id);
    } else {
        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->bind_param("i", $order_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_assoc() : null;
}

function loginUser($email, $password) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result ? $result->fetch_assoc() : null;
    
    if ($user && password_verify($password, $user['password'])) {
        return $user;
    }
    return null;
}

function registerUser($name, $email, $password) {
    global $conn;
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, 'user', NOW())");
    $stmt->bind_param("sss", $name, $email, $hash);
    if ($stmt->execute()) {
        return $conn->insert_id;
    }
    return false;
}

function getPrompaySettings() {
    global $conn;
    $settings = [];
    $result = $conn->query("SELECT setting_key, value FROM settings WHERE setting_key IN ('prompay_number', 'prompay_name', 'prompay_image')");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['value'];
        }
    }
    return $settings;
}

function savePrompaySettings($number, $name, $image_path) {
    global $conn;
    $stmt = $conn->prepare("UPDATE settings SET value = ? WHERE setting_key = 'prompay_number'");
    $stmt->bind_param("s", $number);
    $stmt->execute();
    
    $stmt = $conn->prepare("UPDATE settings SET value = ? WHERE setting_key = 'prompay_name'");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    
    if ($image_path) {
        $stmt = $conn->prepare("UPDATE settings SET value = ? WHERE setting_key = 'prompay_image'");
        $stmt->bind_param("s", $image_path);
        $stmt->execute();
    }
}

function csrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function sanitize($data) {
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function validateImageUpload($file) {
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        return false;
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    return in_array($mime, $allowed);
}