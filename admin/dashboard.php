<?php 
session_start();
$pageTitle = 'Admin Dashboard';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/dashboard.php');
    exit;
}

$orders = $conn->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10");
$total_orders = $conn->query("SELECT COUNT(*) as cnt FROM orders")->fetch_assoc()['cnt'];
$total_sales = $conn->query("SELECT SUM(total_price) as total FROM orders WHERE status IN ('confirmed', 'completed')")->fetch_assoc()['total'] ?? 0;
$pending_orders = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending_payment'")->fetch_assoc()['cnt'];
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="gold-text mb-4"><?php echo $pageTitle; ?></h1>
    
    <div class="row mb-4">
        <div class="col-md-4">
            <div class="card p-4 text-center">
                <h3 class="text-muted">คำสั่งซื้อทั้งหมด</h3>
                <h2 class="gold-text"><?php echo $total_orders; ?></h2>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card p-4 text-center">
                <h3 class="text-muted">ยอดขายรวม</h3>
                <h2 class="gold-text"><?php echo number_format($total_sales, 0); ?> บาท</h2>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card p-4 text-center">
                <h3 class="text-muted">รอชำระเงิน</h3>
                <h2 class="text-warning"><?php echo $pending_orders; ?></h2>
            </div>
        </div>
    </div>
    
    <div class="row mb-4">
        <div class="col-md-6">
            <div class="card p-3">
                <h5 class="gold-text">คำสั่งซื้อล่าสุด</h5>
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>รหัส</th>
                            <th>ราคา</th>
                            <th>สถานะ</th>
                            <th>วันที่</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($o = $orders->fetch_assoc()): ?>
                        <tr>
                            <td>#<?php echo str_pad($o['id'], 5, '0', STR_PAD_LEFT); ?></td>
                            <td><?php echo number_format($o['total_price'], 0); ?> บาท</td>
                            <td><span class="badge badge-<?php echo $o['status']; ?>"><?php echo $o['status']; ?></span></td>
                            <td><?php echo date('d/m/Y', strtotime($o['created_at'])); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                <a href="orders.php" class="btn btn-outline-warning w-100">ดูทั้งหมด</a>
            </div>
        </div>
        
        <div class="col-md-6">
            <div class="card p-3">
                <h5 class="gold-text">เมนู</h5>
                <div class="d-grid gap-2">
                    <a href="products.php" class="btn btn-warning">จัดการสินค้า</a>
                    <a href="orders.php" class="btn btn-warning">จัดการคำสั่งซื้อ</a>
                    <a href="bookings.php" class="btn btn-warning">จัดการการจอง</a>
                    <a href="settings.php" class="btn btn-warning">ตั้งค่า Prompay</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>