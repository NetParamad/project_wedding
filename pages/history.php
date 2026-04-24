<?php 
$pageTitle = 'ประวัติการสั่งซื้อ';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=history.php');
    exit;
}

$orders = getOrders($_SESSION['user_id']);
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
    
    <?php if (empty($orders)): ?>
    <div class="text-center py-5">
        <p class="text-muted mb-4">ยังไม่มีประวัติการสั่งซื้อ</p>
        <a href="products.php" class="btn btn-pink">เลือกซื้อสินค้า</a>
    </div>
    <?php else: ?>
    <div class="row g-4">
        <?php foreach ($orders as $order): ?>
        <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100" style="border-radius: 16px;">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <strong>คำสั่งซื้อ #<?php echo str_pad($order['id'], 5, '0', STR_PAD_LEFT); ?></strong>
                        <span class="badge badge-<?php echo $order['status']; ?>">
                            <?php 
                            $status_text = [
                                'pending' => 'รอคอนเฟิร์ม',
                                'pending_payment' => 'รอชำระเงิน',
                                'confirmed' => 'คอนเฟิร์มแล้ว',
                                'cancelled' => 'ยกเลิก',
                                'completed' => 'เสร็จสิ้น'
                            ];
                            echo $status_text[$order['status']] ?? $order['status'];
                            ?>
                        </span>
                    </div>
                    <p class="text-muted small mb-2">วันที่: <?php echo date('d/m/Y H:i', strtotime($order['created_at'])); ?></p>
                    <p class="fw-bold" style="color: var(--primary-dark);">รวม: ฿ <?php echo number_format($order['total_price']); ?></p>
                    
                    <?php 
                    $items = getOrderItems($order['id']);
                    foreach ($items as $item): 
                    ?>
                    <div class="d-flex align-items-center mb-2">
                        <img src="<?php echo $item['image'] ? '../assets/uploads/products/' . $item['image'] : 'https://via.placeholder.com/50/F8C8DC/E8A0C0?text='; ?>" 
                             class="rounded me-2" style="width: 50px; height: 50px; object-fit: cover;">
                        <div>
                            <small class="fw-bold"><?php echo $item['name']; ?></small><br>
                            <small class="text-muted">x<?php echo $item['quantity']; ?> - ฿ <?php echo number_format($item['price']); ?></small>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    
                    <?php if ($order['payment_slip']): ?>
                    <hr>
                    <p class="mb-1"><small><strong>หลักฐานการโอน:</strong></small></p>
                    <img src="../assets/uploads/slips/<?php echo $order['payment_slip']; ?>" class="img-fluid rounded" style="max-width: 150px;">
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>