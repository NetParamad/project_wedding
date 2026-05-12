<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'จัดการการจอง';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/bookings.php');
    exit;
}

if (isset($_GET['action']) && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $action = sanitize($_GET['action']);
    
    if ($id > 0 && ($action === 'confirm' || $action === 'cancel')) {
        $stmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $action, $id);
        $stmt->execute();
    }
    header('Location: bookings.php');
    exit;
}

$stmt = $conn->prepare("SELECT b.*, p.name as product_name 
    FROM bookings b 
    LEFT JOIN products p ON b.product_id = p.id 
    ORDER BY b.id DESC");
$stmt->execute();
$bookings = $stmt->get_result();
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="gold-text mb-4 font-elegant"><?php echo $pageTitle; ?></h1>
    
    <?php if (!$bookings || $bookings->num_rows === 0): ?>
    <div class="alert alert-info">ยังไม่มีการจอง</div>
    <?php else: ?>
    <div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr style="background: var(--champagne);">
                    <th>ID</th>
                    <th>สินค้า</th>
                    <th>ลูกค้า</th>
                    <th>เบอร์โทร</th>
                    <th>วันที่</th>
                    <th>ราคารวม</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($b = $bookings->fetch_assoc()): ?>
                <tr>
                    <td>#<?php echo str_pad($b['id'], 5, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo sanitize($b['product_name']); ?></td>
                    <td><?php echo sanitize($b['guest_name'] ?: '-'); ?></td>
                    <td><?php echo sanitize($b['guest_phone'] ?: '-'); ?></td>
                    <td><?php echo date('d/m/Y', strtotime($b['start_date'])); ?> - <?php echo date('d/m/Y', strtotime($b['end_date'])); ?></td>
                    <td><?php echo number_format($b['total_price']); ?> บาท</td>
                    <td>
                        <?php
                        $status_class = $b['status'] === 'confirmed' ? 'success' : ($b['status'] === 'cancelled' ? 'danger' : 'warning');
                        $status_text = $b['status'] === 'pending' ? 'รอยืนยัน' : ($b['status'] === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิก');
                        ?>
                        <span class="badge bg-<?php echo $status_class; ?>"><?php echo $status_text; ?></span>
                    </td>
                    <td>
                        <?php if ($b['status'] === 'pending'): ?>
                        <a href="?action=confirm&id=<?php echo (int)$b['id']; ?>" class="btn btn-sm btn-success" onclick="return confirm('ยืนยันการจองนี้?')">
                            <i class="bi bi-check-circle"></i> ยืนยัน
                        </a>
                        <a href="?action=cancel&id=<?php echo (int)$b['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('ยกเลิกการจองนี้?')">
                            <i class="bi bi-x-circle"></i> ยกเลิก
                        </a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
    
    <a href="dashboard.php" class="btn btn-outline-gold mt-3">
        <i class="bi bi-arrow-left"></i> กลับ
    </a>
</div>

<?php include '../includes/footer.php'; ?>