<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'จัดการคำสั่งซื้อ';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/orders.php');
    exit;
}

$message = '';
$action = $_GET['action'] ?? 'list';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($action === 'update_status' && $id > 0) {
    $status = $_POST['status'];
    $valid_statuses = ['pending', 'pending_payment', 'confirmed', 'cancelled', 'completed'];
    if (!in_array($status, $valid_statuses)) {
        $message = 'สถานะไม่ถูกต้อง';
    } else {
        $stmt = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
        $stmt->bind_param("si", $status, $id);
        $stmt->execute();
        $message = 'อัปเดตสถานะสำเร็จ';
    }
}

if ($action === 'view' && $id > 0) {
    $order = $conn->query("SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $id")->fetch_assoc();
    $items = getOrderItems($id);
}

$orders = $conn->query("SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="gold-text mb-4"><?php echo $pageTitle; ?></h1>
    
    <?php if ($message): ?>
    <div class="alert alert-success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <?php if ($action === 'view' && $id > 0): ?>
    <div class="card p-4 mb-4">
        <div class="d-flex justify-content-between mb-4">
            <h4>คำสั่งซื้อ #<?php echo str_pad($id, 5, '0', STR_PAD_LEFT); ?></h4>
            <a href="orders.php" class="btn btn-secondary">กลับ</a>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <p><strong>ลูกค้า:</strong> <?php echo $order['guest_name'] ?: $order['user_name']; ?></p>
                <p><strong>วันที่:</strong> <?php echo date('d/m/Y H:i', strtotime($order['created_at'])); ?></p>
            </div>
            <div class="col-md-6">
                <form method="post" action="?action=update_status&id=<?php echo $id; ?>">
                    <label class="form-label">สถานะ</label>
                    <div class="d-flex gap-2">
                        <select name="status" class="form-select">
                            <option value="pending" <?php echo $order['status'] === 'pending' ? 'selected' : ''; ?>>รอคอนเฟิร์ม</option>
                            <option value="pending_payment" <?php echo $order['status'] === 'pending_payment' ? 'selected' : ''; ?>>รอชำระเงิน</option>
                            <option value="confirmed" <?php echo $order['status'] === 'confirmed' ? 'selected' : ''; ?>>คอนเฟิร์มแล้ว</option>
                            <option value="cancelled" <?php echo $order['status'] === 'cancelled' ? 'selected' : ''; ?>>ยกเลิก</option>
                            <option value="completed" <?php echo $order['status'] === 'completed' ? 'selected' : ''; ?>>เสร็จสิ้น</option>
                        </select>
                        <button type="submit" class="btn btn-warning">อัปเดต</button>
                    </div>
                </form>
            </div>
        </div>
        
        <h5>รายการสินค้า</h5>
        <table class="table">
            <thead>
                <tr>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคา</th>
                    <th>รวม</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $item): ?>
                <tr>
                    <td><?php echo $item['name']; ?></td>
                    <td><?php echo $item['quantity']; ?></td>
                    <td><?php echo number_format($item['price'], 0); ?> บาท</td>
                    <td><?php echo number_format($item['price'] * $item['quantity'], 0); ?> บาท</td>
                </tr>
                <?php endforeach; ?>
                <tr>
                    <td colspan="3"><strong>รวม</strong></td>
                    <td><strong><?php echo number_format($order['total_price'], 0); ?> บาท</strong></td>
                </tr>
            </tbody>
        </table>
        
        <?php if ($order['payment_slip']): ?>
        <h5 class="mt-4">หลักฐานการโอน</h5>
        <img src="../assets/uploads/<?php echo $order['payment_slip']; ?>" class="img-fluid" style="max-width: 300px;">
        <?php endif; ?>
    </div>
    <?php else: ?>
    
    <div class="card p-3">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>รหัส</th>
                    <th>ลูกค้า</th>
                    <th>ราคา</th>
                    <th>สถานะ</th>
                    <th>วันที่</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($o = $orders->fetch_assoc()): ?>
                <tr>
                    <td>#<?php echo str_pad($o['id'], 5, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo $o['guest_name'] ?: $o['user_name'] ?: 'Guest'; ?></td>
                    <td><?php echo number_format($o['total_price'], 0); ?> บาท</td>
                    <td><span class="badge badge-<?php echo $o['status']; ?>"><?php echo $o['status']; ?></span></td>
                    <td><?php echo date('d/m/Y', strtotime($o['created_at'])); ?></td>
                    <td>
                        <a href="?action=view&id=<?php echo $o['id']; ?>" class="btn btn-sm btn-warning">ดูรายละเอียด</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>