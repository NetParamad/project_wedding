<?php 
$pageTitle = 'เข้าสู่ระบบ / สมัคร';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

$redirect = isset($_GET['redirect']) ? $_GET['redirect'] : '../index.php';
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'login';
    
    if ($action === 'login') {
        $email = $_POST['email'];
        $password = $_POST['password'];
        $user = loginUser($email, $password);
        
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            
            // Admin ไปหน้า Admin, User ไปหน้าหลัก
            if ($user['role'] === 'admin') {
                header('Location: ../admin/dashboard.php');
            } else {
                header('Location: ' . $redirect);
            }
            exit;
        } else {
            $error = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        }
    } else {
        $name = $_POST['name'];
        $email = $_POST['email'];
        $password = $_POST['password'];
        $confirm = $_POST['confirm_password'] ?? '';
        
        if ($password !== $confirm) {
            $error = 'รหัสผ่านไม่ตรงกัน';
        } else {
            $check = $conn->query("SELECT id FROM users WHERE email = '$email'")->fetch_assoc();
            if ($check) {
                $error = 'อีเมลนี้ถูกใช้ไปแล้ว';
            } else {
                $id = registerUser($name, $email, $password);
                if ($id) {
                    $_SESSION['user_id'] = $id;
                    $_SESSION['name'] = $name;
                    $_SESSION['email'] = $email;
                    $_SESSION['role'] = 'user';
                    header('Location: ../index.php');
                    exit;
                } else {
                    $error = 'เกิดข้อผิดพลาด ลองใหม่';
                }
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
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body class="d-flex align-items-center" style="min-height: 100vh; background: linear-gradient(135deg, #fff 0%, #FFF0F5 100%);">

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5">
            <div class="card border-0 shadow-lg" style="border-radius: 20px;">
                <div class="card-body p-4">
                    <h3 class="text-center mb-4" style="color: var(--primary-dark);"><?php echo $pageTitle; ?></h3>
                    
                    <?php if ($error): ?>
                    <div class="alert alert-danger"><?php echo $error; ?></div>
                    <?php endif; ?>
                    
                    <ul class="nav nav-pills mb-3 justify-content-center" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active px-4" data-bs-toggle="pill" data-bs-target="#login">เข้าสู่ระบบ</button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link px-4" data-bs-toggle="pill" data-bs-target="#register">สมัครสมาชิก</button>
                        </li>
                    </ul>
                    
                    <div class="tab-content mt-4">
                        <div class="tab-pane fade show active" id="login">
                            <form method="post">
                                <input type="hidden" name="action" value="login">
                                <div class="mb-3">
                                    <label class="form-label">อีเมล</label>
                                    <input type="email" name="email" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">รหัสผ่าน</label>
                                    <input type="password" name="password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-pink w-100 py-3">เข้าสู่ระบบ</button>
                            </form>
                        </div>
                        
                        <div class="tab-pane fade" id="register">
                            <form method="post">
                                <input type="hidden" name="action" value="register">
                                <div class="mb-3">
                                    <label class="form-label">ชื่อ-นามสกุล</label>
                                    <input type="text" name="name" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">อีเมล</label>
                                    <input type="email" name="email" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">รหัสผ่าน</label>
                                    <input type="password" name="password" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">ยืนยันรหัสผ่าน</label>
                                    <input type="password" name="confirm_password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-pink w-100 py-3">สมัครสมาชิก</button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="text-center mt-3">
                        <a href="../index.php" style="color: var(--primary-dark);">← กลับหน้าหลัก</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>