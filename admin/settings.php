<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'ตั้งค่า Prompay';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/settings.php');
    exit;
}

$message = '';

$action = $_GET['action'] ?? 'list';
$shop_action = $_POST['shop_action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !verifyCsrfToken($_POST['csrf_token'])) {
        $message = 'Token ไม่ถูกต้อง';
    } else {
        $prompay_number = $_POST['prompay_number'] ?? '';
        $prompay_name = $_POST['prompay_name'] ?? '';
        
        if ($prompay_number !== '') {
            $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='prompay_number'");
            $stmt->bind_param("s", $prompay_number);
            $stmt->execute();
        }
        
        if ($prompay_name !== '') {
            $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='prompay_name'");
            $stmt->bind_param("s", $prompay_name);
            $stmt->execute();
        }
        
        if (!empty($_FILES['prompay_image']['name']) && is_uploaded_file($_FILES['prompay_image']['tmp_name'])) {
            if (!validateImageUpload($_FILES['prompay_image'])) {
                $message = 'ไฟล์ต้องเป็นรูปภาพเท่านั้น';
            } else {
                $ext = pathinfo($_FILES['prompay_image']['name'], PATHINFO_EXTENSION);
                $image = 'prompay_' . time() . '.' . $ext;
                move_uploaded_file($_FILES['prompay_image']['tmp_name'], '../assets/uploads/prompay/' . $image);
                $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='prompay_image'");
                $stmt->bind_param("s", $image);
                $stmt->execute();
            }
        }
        
        if (empty($message)) {
            $message = 'บันทึกสำเร็จ';
        }
    }
}

if ($shop_action === 'shop_info') {
    $shop_name = $_POST['shop_name'] ?? '';
    $shop_phone = $_POST['shop_phone'] ?? '';
    $shop_line = $_POST['shop_line'] ?? '';
    
    if ($shop_name !== '') {
        $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='shop_name'");
        $stmt->bind_param("s", $shop_name);
        $stmt->execute();
    }
    
    if ($shop_phone !== '') {
        $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='shop_phone'");
        $stmt->bind_param("s", $shop_phone);
        $stmt->execute();
    }
    
    if ($shop_line !== '') {
        $stmt = $conn->prepare("UPDATE settings SET value=? WHERE setting_key='shop_line'");
        $stmt->bind_param("s", $shop_line);
        $stmt->execute();
    }
    
    $message = 'บันทึกข้อมูลร้านสำเร็จ';
}

$prompay = getPrompaySettings();
$shop_name = getSetting('shop_name');
$shop_phone = getSetting('shop_phone');
$shop_line = getSetting('shop_line');
$csrf = csrfToken();
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="gold-text mb-4"><?php echo $pageTitle; ?></h1>
    
    <?php if ($message): ?>
    <div class="alert alert-success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <div class="row">
        <div class="col-md-6">
            <div class="card p-4 mb-4">
                <h5 class="gold-text mb-3">ข้อมูล Prompay</h5>
                <form method="post" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?php echo $csrf; ?>">
                    <div class="mb-3">
                        <label class="form-label">เลขที่บัญชี Prompay</label>
                        <input type="text" name="prompay_number" class="form-control" value="<?php echo sanitize($prompay['prompay_number'] ?? ''); ?>" placeholder="XXX-XXXXXX-X">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">ชื่อบัญชี</label>
                        <input type="text" name="prompay_name" class="form-control" value="<?php echo sanitize($prompay['prompay_name'] ?? ''); ?>">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">QR Code Image</label>
                        <input type="file" name="prompay_image" class="form-control" accept="image/*">
                        <?php if (!empty($prompay['prompay_image'])): ?>
                        <img src="../assets/uploads/<?php echo $prompay['prompay_image']; ?>" class="mt-2" style="max-width: 200px;">
                        <?php endif; ?>
                    </div>
                    <button type="submit" class="btn btn-gold">บันทึก</button>
                </form>
            </div>
        </div>
        
        <div class="col-md-6">
            <div class="card p-4">
                <h5 class="gold-text mb-3">ข้อมูลร้าน</h5>
                <form method="post">
                    <input type="hidden" name="csrf_token" value="<?php echo $csrf; ?>">
                    <input type="hidden" name="shop_action" value="shop_info">
                    <div class="mb-3">
                        <label class="form-label">ชื่อร้าน</label>
                        <input type="text" name="shop_name" class="form-control" value="<?php echo sanitize($shop_name); ?>">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">เบอร์โทรศัพท์</label>
                        <input type="text" name="shop_phone" class="form-control" value="<?php echo sanitize($shop_phone); ?>">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Line ID</label>
                        <input type="text" name="shop_line" class="form-control" value="<?php echo sanitize($shop_line); ?>">
                    </div>
                    <button type="submit" class="btn btn-gold">บันทึก</button>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>