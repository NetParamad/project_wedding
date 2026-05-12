<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'Admin Dashboard';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/dashboard.php');
    exit;
}

$orders = $conn->query("SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10");
$total_orders = $conn->query("SELECT COUNT(*) as cnt FROM orders")->fetch_assoc()['cnt'];
$total_sales = $conn->query("SELECT SUM(total_price) as total FROM orders WHERE status IN ('confirmed', 'completed')")->fetch_assoc()['total'] ?? 0;
$pending_orders = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending_payment'")->fetch_assoc()['cnt'];
$total_bookings = $conn->query("SELECT COUNT(*) as cnt FROM bookings WHERE status IN ('pending', 'confirmed')")->fetch_assoc()['cnt'];
$total_products = $conn->query("SELECT COUNT(*) as cnt FROM products WHERE status = 'active'")->fetch_assoc()['cnt'];
$recent_bookings = $conn->query("SELECT b.*, p.name as product_name FROM bookings b LEFT JOIN products p ON b.product_id = p.id ORDER BY b.created_at DESC LIMIT 5");
?>
<?php include '../includes/header.php'; ?>

<style>
.stats-card {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
    color: white;
    border-radius: 20px;
    padding: 24px;
    transition: transform 0.3s;
}
.stats-card:hover {
    transform: translateY(-5px);
}
.stats-card h3 {
    font-size: 0.9rem;
    opacity: 0.9;
}
.stats-card h2 {
    font-size: 2rem;
    font-weight: 700;
}
</style>

<div class="container py-5">
    <h1 class="gold-text mb-4 font-elegant"><?php echo $pageTitle; ?></h1>
    
    <!-- Stats Cards -->
    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="stats-card text-center">
                <h3>คำสั่งซื้อทั้งหมด</h3>
                <h2><?php echo $total_orders; ?></h2>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card text-center">
                <h3>ยอดขายรวม</h3>
                <h2><?php echo number_format($total_sales, 0); ?></h2>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card text-center" style="background: linear-gradient(135deg, var(--champagne) 0%, var(--cream-dark) 100%); color: var(--gold-dark);">
                <h3>รอชำระเงิน</h3>
                <h2><?php echo $pending_orders; ?></h2>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card text-center" style="background: linear-gradient(135deg, var(--champagne) 0%, var(--cream-dark) 100%); color: var(--gold-dark);">
                <h3>การจองที่ยังไม่เสร็จ</h3>
                <h2><?php echo $total_bookings; ?></h2>
            </div>
        </div>
    </div>
    
    <div class="row g-4">
        <!-- Recent Orders -->
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm" style="border-radius: 20px;">
                <div class="card-body">
                    <h5 class="gold-text mb-3 font-elegant">คำสั่งซื้อล่าสุด</h5>
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr style="background: var(--champagne);">
                                    <th>รหัส</th>
                                    <th>ลูกค้า</th>
                                    <th>ราคา</th>
                                    <th>สถานะ</th>
                                    <th>วันที่</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php while ($o = $orders->fetch_assoc()): ?>
                                <tr>
                                    <td>#<?php echo str_pad($o['id'], 5, '0', STR_PAD_LEFT); ?></td>
                                    <td><?php echo htmlspecialchars($o['user_name'] ?? ' guest'); ?></td>
                                    <td><?php echo number_format($o['total_price'], 0); ?> บาท</td>
                                    <td><span class="badge badge-<?php echo $o['status']; ?>"><?php echo $o['status']; ?></span></td>
                                    <td><?php echo date('d/m/Y', strtotime($o['created_at'])); ?></td>
                                    <td><a href="orders.php?id=<?php echo $o['id']; ?>" class="btn btn-sm btn-outline-gold">ดู</a></td>
                                </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                    <div class="text-center mt-3">
                        <a href="orders.php" class="btn btn-outline-gold">ดูคำสั่งซื้อทั้งหมด</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Menu -->
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm" style="border-radius: 20px;">
                <div class="card-body">
                    <h5 class="gold-text mb-3 font-elegant">เมนูจัดการ</h5>
                    <div class="d-grid gap-3">
                        <a href="products.php" class="btn btn-gold">
                            <i class="bi bi-box-seam me-2"></i>
                            จัดการสินค้า (<?php echo $total_products; ?>)
                        </a>
                        <a href="orders.php" class="btn btn-gold">
                            <i class="bi bi-receipt me-2"></i>
                            จัดการคำสั่งซื้อ
                        </a>
                        <a href="bookings.php" class="btn btn-gold">
                            <i class="bi bi-calendar-check me-2"></i>
                            จัดการการจอง
                        </a>
                        <a href="settings.php" class="btn btn-gold">
                            <i class="bi bi-gear me-2"></i>
                            ตั้งค่าร้าน
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>