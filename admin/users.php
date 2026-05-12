<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'จัดการสมาชิก';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/users.php');
    exit;
}

$message = '';
$search = $_GET['search'] ?? '';
$action = $_GET['action'] ?? 'list';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$csrf = csrfToken();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !verifyCsrfToken($_POST['csrf_token'])) {
        $message = 'Token ไม่ถูกต้อง';
    } else {
        $name = trim($_POST['name']);
        $phone = trim($_POST['phone']);
        $address = trim($_POST['address']);
        $role = $_POST['role'];
        
        if ($id > 0) {
            updateUserProfile($id, $name, $phone, $address);
            $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->bind_param("si", $role, $id);
            $stmt->execute();
            $message = 'อัปเดตสำเร็จ';
        }
    }
}

if ($action === 'delete' && $id > 0) {
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ? AND role != 'admin'");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $message = 'ลบสำเร็จ';
    $action = 'list';
}

if ($action === 'reset_password' && $id > 0) {
    $new_password = 'password123';
    if (updateUserPassword($id, null, $new_password)) {
        $message = 'รีเซ็ตรหัสผ่านสำเร็จ (password123)';
    }
    $action = 'list';
}

if ($search) {
    $stmt = $conn->prepare("SELECT * FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC");
    $search_term = "%$search%";
    $stmt->bind_param("ss", $search_term, $search_term);
    $stmt->execute();
    $result = $stmt->get_result();
    $users = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
} else {
    $users = getAllUsers();
}

$user = $id > 0 ? getUserById($id) : null;
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="gold-text font-elegant"><?php echo $pageTitle; ?></h1>
    </div>
    
    <?php if ($message): ?>
    <div class="alert alert-success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <?php if ($action === 'edit'): ?>
    <div class="card p-4 mb-4">
        <h5 class="fw-bold mb-3">แก้ไขสมาชิก</h5>
        <form method="post">
            <input type="hidden" name="csrf_token" value="<?php echo $csrf; ?>">
            <input type="hidden" name="id" value="<?php echo $id; ?>">
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">ชื่อ-นามสกุล</label>
                        <input type="text" name="name" class="form-control" value="<?php echo sanitize($user['name'] ?? ''); ?>" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">อีเมล</label>
                        <input type="email" class="form-control" value="<?php echo sanitize($user['email'] ?? ''); ?>" disabled>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">เบอร์โทรศัพท์</label>
                        <input type="tel" name="phone" class="form-control" value="<?php echo sanitize($user['phone'] ?? ''); ?>">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">สถานะ</label>
                        <select name="role" class="form-select form-control">
                            <option value="user" <?php echo ($user['role'] ?? 'user') === 'user' ? 'selected' : ''; ?>>สมาชิก</option>
                            <option value="admin" <?php echo ($user['role'] ?? '') === 'admin' ? 'selected' : ''; ?>>ผู้ดูแล</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">ที่อยู่</label>
                <textarea name="address" class="form-control" rows="2"><?php echo sanitize($user['address'] ?? ''); ?></textarea>
            </div>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-gold">บันทึก</button>
                <a href="users.php" class="btn btn-secondary">ยกเลิก</a>
                <a href="users.php?action=reset_password&id=<?php echo $id; ?>" class="btn btn-warning" onclick="return confirm('รีเซ็ตรหัสผ่านเป็น password123?')">รีเซ็ตรหัสผ่าน</a>
            </div>
        </form>
    </div>
    <?php else: ?>
    
    <div class="card p-3 mb-4">
        <form method="get" class="d-flex gap-2">
            <input type="hidden" name="action" value="list">
            <input type="text" name="search" class="form-control" placeholder="ค้นหาชื่อหรืออีเมล..." value="<?php echo sanitize($search); ?>">
            <button type="submit" class="btn btn-gold"><i class="bi bi-search"></i> ค้นหา</button>
            <a href="users.php" class="btn btn-secondary">ทั้งหมด</a>
        </form>
    </div>
    
    <div class="card">
        <table class="table table-hover mb-0">
            <thead style="background: var(--champagne);">
                <tr>
                    <th>ID</th>
                    <th>ชื่อ</th>
                    <th>อีเมล</th>
                    <th>เบอร์</th>
                    <th>ที่อยู่</th>
                    <th>สถานะ</th>
                    <th>วันที่สมัคร</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($users as $u): ?>
                <tr>
                    <td><?php echo $u['id']; ?></td>
                    <td><?php echo sanitize($u['name']); ?></td>
                    <td><?php echo sanitize($u['email']); ?></td>
                    <td><?php echo sanitize($u['phone'] ?? '-'); ?></td>
                    <td><?php echo $u['address'] ? '<i class="bi bi-check-circle text-success"></i>' : '-'; ?></td>
                    <td><span class="badge bg-<?php echo $u['role'] === 'admin' ? 'warning' : 'success'; ?>">
                        <?php echo $u['role'] === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'; ?>
                    </span></td>
                    <td><?php echo date('d/m/Y', strtotime($u['created_at'])); ?></td>
                    <td>
                        <a href="users.php?action=edit&id=<?php echo $u['id']; ?>" class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></a>
                        <?php if ($u['role'] !== 'admin'): ?>
                        <a href="users.php?action=delete&id=<?php echo $u['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('ยืนยันการลบ?')"><i class="bi bi-trash"></i></a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>