<?php 
$pageTitle = 'โปรไฟล์';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=profile.php');
    exit;
}

$user = getUserById($_SESSION['user_id']);
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'update_profile') {
        $name = trim($_POST['name']);
        $phone = trim($_POST['phone']);
        $address = trim($_POST['address']);
        
        if (updateUserProfile($_SESSION['user_id'], $name, $phone, $address)) {
            $_SESSION['name'] = $name;
            $_SESSION['phone'] = $phone;
            $_SESSION['address'] = $address;
            $message = 'บันทึกสำเร็จ';
            $user = getUserById($_SESSION['user_id']);
        } else {
            $error = 'เกิดข้อผิดพลาด';
        }
    } elseif (isset($_POST['action']) && $_POST['action'] === 'change_password') {
        $old_password = $_POST['old_password'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];
        
        if ($new_password !== $confirm_password) {
            $error = 'รหัส�่านใหม่ไม่ตรงกัน';
        } elseif (strlen($new_password) < 6) {
            $error = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        } else {
            $result = updateUserPassword($_SESSION['user_id'], $old_password, $new_password);
            if ($result === true) {
                $message = 'เปลี่ยนรหัสผ่านสำเร็จ';
            } elseif ($result === 'wrong_password') {
                $error = 'รหัสผ่านเดิมไม่ถูกต้อง';
            } else {
                $error = 'เกิดข้อผิดพลาด';
            }
        }
    }
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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>

<?php include __DIR__ . '/../includes/navbar.php'; ?>

<main>
<div class="container py-5">
    <h2 class="fw-bold mb-4 font-elegant" style="color: var(--gold-dark);"><?php echo $pageTitle; ?></h2>
    
    <?php if ($message): ?>
    <div class="alert alert-success"><?php echo $message; ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
    <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <div class="row">
        <div class="col-lg-3">
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 16px;">
                <div class="card-body text-center">
                    <div class="rounded-circle bg-gold d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                        <i class="bi bi-person-fill text-white" style="font-size: 2.5rem;"></i>
                    </div>
                    <h5 class="fw-bold"><?php echo $_SESSION['name']; ?></h5>
                    <p class="text-muted mb-1"><?php echo $_SESSION['email']; ?></p>
                    <span class="badge bg-<?php echo $_SESSION['role'] === 'admin' ? 'warning' : 'success'; ?>">
                        <?php echo $_SESSION['role'] === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'; ?>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="col-lg-9">
            <ul class="nav nav-pills mb-3" role="tablist">
                <li class="nav-item">
                    <button class="nav-link active px-4" data-bs-toggle="pill" data-bs-target="#profile">
                        <i class="bi bi-person-lines-fill me-2"></i>ข้อมูลส่วนตัว
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link px-4" data-bs-toggle="pill" data-bs-target="#password">
                        <i class="bi bi-key-fill me-2"></i>เปลี่ยนรหัสผ่าน
                    </button>
                </li>
            </ul>
            
            <div class="tab-content">
                <div class="tab-pane fade show active" id="profile">
                    <div class="card border-0 shadow-sm" style="border-radius: 16px;">
                        <div class="card-body p-4">
                            <form method="post">
                                <input type="hidden" name="action" value="update_profile">
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
                                            <input type="tel" name="phone" class="form-control" value="<?php echo sanitize($user['phone'] ?? ''); ?>" pattern="0[0-9]{8,9}">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">ที่อยู่</label>
                                    <textarea name="address" class="form-control" rows="3"><?php echo sanitize($user['address'] ?? ''); ?></textarea>
                                </div>
                                <button type="submit" class="btn btn-gold">บันทึกการเปลี่ยนแปลง</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="password">
                    <div class="card border-0 shadow-sm" style="border-radius: 16px;">
                        <div class="card-body p-4">
                            <form method="post">
                                <input type="hidden" name="action" value="change_password">
                                <div class="mb-3">
                                    <label class="form-label">รหัสผ่านเดิม</label>
                                    <input type="password" name="old_password" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">รหัสผ่านใหม่</label>
                                    <input type="password" name="new_password" class="form-control" minlength="6" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">ยืนยันรหัสผ่านใหม่</label>
                                    <input type="password" name="confirm_password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-gold">เปลี่ยนรหัสผ่าน</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>