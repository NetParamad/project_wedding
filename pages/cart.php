<?php 
$pageTitle = 'ตะกร้าสินค้า';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=cart.php');
    exit;
}

$cart_items = [];
$cart_total = 0;

if (!empty($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $pid => $qty) {
        $product = getProductById($pid);
        if ($product) {
            $cart_items[] = [
                'id' => $pid,
                'name' => $product['name'],
                'price' => $product['price'],
                'quantity' => $qty,
                'total' => $product['price'] * $qty,
                'image' => $product['image']
            ];
            $cart_total += $product['price'] * $qty;
        }
    }
}

if (isset($_GET['action']) && $_GET['action'] === 'remove' && isset($_GET['id'])) {
    $pid = (int)$_GET['id'];
    unset($_SESSION['cart'][$pid]);
    header('Location: cart.php');
    exit;
}

if (isset($_GET['action']) && $_GET['action'] === 'update' && isset($_GET['id']) && isset($_GET['qty'])) {
    $pid = (int)$_GET['id'];
    $qty = (int)$_GET['qty'];
    if ($qty > 0) {
        $_SESSION['cart'][$pid] = $qty;
    } else {
        unset($_SESSION['cart'][$pid]);
    }
    header('Location: cart.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>

<?php include __DIR__ . '/../includes/navbar.php'; ?>

<main>
<div class="container py-5">
    <h2 class="fw-bold mb-4" style="color: var(--primary-dark);"><?php echo $pageTitle; ?></h2>
    
    <?php if (empty($cart_items)): ?>
    <div class="text-center py-5">
        <p class="text-muted mb-4">ตะกร้าว่างเปล่า</p>
        <a href="products.php" class="btn btn-pink">เลือกซื้อสินค้า</a>
    </div>
    <?php else: ?>
    <div class="row">
        <div class="col-lg-8">
            <?php foreach ($cart_items as $item): ?>
            <div class="card mb-3 border-0 shadow-sm" style="border-radius: 16px;">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <img src="<?php echo $item['image'] ? '../assets/uploads/products/' . $item['image'] : 'https://via.placeholder.com/80/F8C8DC/E8A0C0?text='; ?>" 
                             class="rounded me-3" style="width: 80px; height: 80px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <h5 class="fw-bold mb-1"><?php echo $item['name']; ?></h5>
                            <p class="mb-0" style="color: var(--primary-dark); font-weight: 700;">฿ <?php echo number_format($item['price']); ?></p>
                        </div>
                        <div class="text-end">
                            <div class="d-flex align-items-center mb-2">
                                <a href="cart.php?action=update&id=<?php echo $item['id']; ?>&qty=<?php echo $item['quantity'] - 1; ?>" class="btn btn-sm btn-outline-pink">-</a>
                                <span class="mx-3 fw-bold"><?php echo $item['quantity']; ?></span>
                                <a href="cart.php?action=update&id=<?php echo $item['id']; ?>&qty=<?php echo $item['quantity'] + 1; ?>" class="btn btn-sm btn-outline-pink">+</a>
                            </div>
                            <p class="mb-0 fw-bold" style="color: var(--primary-dark);">฿ <?php echo number_format($item['total']); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm p-4" style="border-radius: 16px;">
                <h5 class="fw-bold mb-3">สรุปรายการ</h5>
                <div class="d-flex justify-content-between mb-2">
                    <span>ราคารวม</span>
                    <span>฿ <?php echo number_format($cart_total); ?></span>
                </div>
                <div class="d-flex justify-content-between mb-3">
                    <span>ค่าจัดส่ง</span>
                    <span>ฟรี</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-3">
                    <strong>รวมทั้งสิ้น</strong>
                    <strong style="color: var(--primary-dark); font-size: 1.2rem;">฿ <?php echo number_format($cart_total); ?></strong>
                </div>
                <a href="checkout.php" class="btn btn-pink w-100 py-3">ดำเนินการต่อ</a>
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>