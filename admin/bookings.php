<?php 
session_start();
$pageTitle = 'จัดการการจอง';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/bookings.php');
    exit;
}

$bookings = $conn->query("SELECT b.*, p.name as product_name FROM bookings b LEFT JOIN products p ON b.product_id = p.id ORDER BY b.id DESC");
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="gold-text mb-4"><?php echo $pageTitle; ?></h1>
    
    <?php if (!$bookings || $bookings->num_rows === 0): ?>
    <div class="alert alert-info">ยังไม่มีการจอง</div>
    <?php else: ?>
    <div class="table-responsive">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>สินค้า</th>
                    <th>ลูกค้า</th>
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
                    <td><?php echo date('d/m/Y', strtotime($b['start_date'])); ?> - <?php echo date('d/m/Y', strtotime($b['end_date'])); ?></td>
                    <td><?php echo number_format($b['total_price']); ?> บาท</td>
                    <td><span class="badge bg-<?php echo $b['status']==='confirmed'?'success':($b['status']==='cancelled'?'danger':'warning'); ?>">
                        <?php echo $b['status']==='pending'?'รอยืนยัน':($b['status']==='confirmed'?'ยืนยันแล้ว':'ยกเลิก'); ?>
                    </span></td>
                    <td>
                        <?php if ($b['status'] === 'pending'): ?>
                        <a href="?action=confirm&id=<?php echo $b['id']; ?>" class="btn btn-sm btn-success">ยืนยัน</a>
                        <a href="?action=cancel&id=<?php echo $b['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('ยกเลิก?')">ยกเลิก</a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
    
    <a href="dashboard.php" class="btn btn-secondary mt-3">กลับ</a>
</div>

<?php 
if (isset($_GET['action']) && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $action = $_GET['action'];
    if ($action === 'confirm') {
        $conn->query("UPDATE bookings SET status='confirmed' WHERE id=$id");
    } elseif ($action === 'cancel') {
        $conn->query("UPDATE bookings SET status='cancelled' WHERE id=$id");
    }
    header('Location: bookings.php');
    exit;
}
?>

<?php include '../includes/footer.php'; ?>