<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
$pageTitle = 'จัดการสินค้า';
include '../config/db.php';
include '../includes/functions.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../pages/login.php?redirect=admin/products.php');
    exit;
}

$message = '';
$action = $_GET['action'] ?? 'list';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$csrf = csrfToken();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !verifyCsrfToken($_POST['csrf_token'])) {
        $message = 'Token ไม่ถูกต้อง';
    } else {
        $name = trim($_POST['name']);
        $description = trim($_POST['description']);
        $price = (float)$_POST['price'];
        $type = $_POST['type'];
        $stock = (int)$_POST['stock'];
        $status = $_POST['status'];
        
        $image = '';
        if (!empty($_FILES['image']['name']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
            if (!validateImageUpload($_FILES['image'])) {
                $message = 'ไฟล์ต้องเป็นรูปภาพเท่านั้น';
            } else {
                $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $image = time() . '_' . rand(1000, 9999) . '.' . $ext;
                move_uploaded_file($_FILES['image']['tmp_name'], '../assets/uploads/products/' . $image);
            }
        }
        
        if (empty($message)) {
            if ($id > 0) {
                if ($image) {
                    $old_product = getProductById($id);
                    if ($old_product && $old_product['image']) {
                        deleteProductImage($old_product['image']);
                    }
                    $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, type=?, image=?, stock=?, status=? WHERE id=?");
                    $stmt->bind_param("ssdsisi", $name, $description, $price, $type, $image, $stock, $status, $id);
                } else {
                    $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, type=?, stock=?, status=? WHERE id=?");
                    $stmt->bind_param("ssdisi", $name, $description, $price, $type, $stock, $status, $id);
                }
            } else {
                $stmt = $conn->prepare("INSERT INTO products (name, description, price, type, image, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssdsisi", $name, $description, $price, $type, $image, $stock, $status);
            }
            $stmt->execute();
            $message = 'บันทึกสำเร็จ';
        }
    }
}

if ($action === 'delete' && $id > 0) {
    $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $message = 'ลบสำเร็จ';
    $action = 'list';
}

$product = $id > 0 ? getProductById($id) : null;
$products = getProducts();
?>
<?php include '../includes/header.php'; ?>

<div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="gold-text"><?php echo $pageTitle; ?></h1>
        <a href="?action=add" class="btn btn-gold">+ เพิ่มสินค้า</a>
    </div>
    
    <?php if ($message): ?>
    <div class="alert alert-success"><?php echo $message; ?></div>
    <?php endif; ?>
    
    <?php if ($action === 'add' || $action === 'edit'): ?>
    <div class="card p-4 mb-4">
        <form method="post" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?php echo $csrf; ?>">
            <?php if ($id > 0): ?>
            <input type="hidden" name="id" value="<?php echo $id; ?>">
            <?php if ($product['image']): ?>
            <img src="../assets/uploads/products/<?php echo sanitize($product['image']); ?>" class="mb-3" style="max-width: 200px;">
            <?php endif; ?>
            <?php endif; ?>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">ชื่อสินค้า</label>
                        <input type="text" name="name" class="form-control" value="<?php echo sanitize($product['name'] ?? ''); ?>" required>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label">ประเภท</label>
                        <select name="type" class="form-select form-control">
                            <option value="rent" <?php echo ($product['type'] ?? '') === 'rent' ? 'selected' : ''; ?>>จอง (Rental)</option>
                            <option value="sale" <?php echo ($product['type'] ?? '') === 'sale' ? 'selected' : ''; ?>>ขาย (Sale)</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="mb-3">
                        <label class="form-label">สถานะ</label>
                        <select name="status" class="form-select form-control">
                            <option value="active" <?php echo ($product['status'] ?? '') === 'active' ? 'selected' : ''; ?>>เปิดใช้งาน</option>
                            <option value="inactive" <?php echo ($product['status'] ?? '') === 'inactive' ? 'selected' : ''; ?>>ปิดใช้งาน</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">ราคา (บาท)</label>
                        <input type="number" name="price" class="form-control" value="<?php echo $product['price'] ?? ''; ?>" required>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">จำนวนคงเหลือ</label>
                        <input type="number" name="stock" class="form-control" value="<?php echo $product['stock'] ?? 0; ?>">
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">รูปภาพ</label>
                        <input type="file" name="image" class="form-control" accept="image/*">
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">รายละเอียด</label>
                <textarea name="description" class="form-control" rows="4"><?php echo sanitize($product['description'] ?? ''); ?></textarea>
            </div>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-gold">บันทึก</button>
                <a href="products.php" class="btn btn-secondary">ยกเลิก</a>
            </div>
        </form>
    </div>
    <?php else: ?>
    
    <div class="card p-3">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>รูป</th>
                    <th>ชื่อ</th>
                    <th>ประเภท</th>
                    <th>ราคา</th>
                    <th>คงเห��ือ</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($products as $p): ?>
                <tr>
                    <td><img src="<?php echo $p['image'] ? '../assets/uploads/products/' . sanitize($p['image']) : 'https://via.placeholder.com/50'; ?>" style="width: 50px; height: 50px; object-fit: cover;" class="rounded"></td>
                    <td><?php echo sanitize($p['name']); ?></td>
                    <td><span class="badge <?php echo $p['type'] === 'rent' ? 'badge-rent' : 'badge-sale'; ?>"><?php echo $p['type'] === 'rent' ? 'จอง' : 'ขาย'; ?></span></td>
                    <td><?php echo number_format($p['price'], 0); ?> บาท</td>
                    <td><?php echo sanitize($p['stock']); ?></td>
                    <td><span class="badge bg-<?php echo $p['status'] === 'active' ? 'success' : 'secondary'; ?>"><?php echo $p['status'] === 'active' ? 'เปิด' : 'ปิด'; ?></span></td>
                    <td>
                        <a href="?action=edit&id=<?php echo $p['id']; ?>" class="btn btn-sm btn-warning">แก้ไข</a>
                        <a href="?action=delete&id=<?php echo $p['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('ยืนยันการลบ?')">ลบ</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>