<?php 
$pageTitle = 'ชำระเงิน';
session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=checkout.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $total_price = 0;
    $items = [];
    
    if (!empty($_SESSION['cart'])) {
        foreach ($_SESSION['cart'] as $pid => $qty) {
            $product = getProductById($pid);
            if ($product) {
                $total_price += $product['price'] * $qty;
                $items[] = ['product_id' => $pid, 'quantity' => $qty, 'price' => $product['price']];
            }
        }
    }
    
    $order_id = saveOrder($_SESSION['user_id'], $items, $total_price);
    $_SESSION['cart'] = [];
    $_SESSION['last_order_id'] = $order_id;
    
    header('Location: checkout.php?step=payment&order_id=' . $order_id);
    exit;
}

$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : (isset($_SESSION['last_order_id']) ? $_SESSION['last_order_id'] : 0);
$order = $order_id ? getOrderById($order_id, $_SESSION['user_id']) : null;
$order_items = $order_id ? getOrderItems($order_id) : [];
$prompay = getPrompaySettings();

$uploaded = false;
$upload_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['payment_slip']) && $_FILES['payment_slip']['error'] === UPLOAD_ERR_OK) {
    $order_id = (int)$_POST['order_id'];
    $file = $_FILES['payment_slip'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png'];
    
    if (!in_array($ext, $allowed)) {
        $upload_error = 'อนุญาตเฉพาะไฟล์ JPG, PNG เท่านั้น';
    } else {
        $filename = 'slip_' . $order_id . '_' . time() . '.' . $ext;
        $target = __DIR__ . '/../assets/uploads/slips/' . $filename;
        if (move_uploaded_file($file['tmp_name'], $target)) {
            $conn->query("UPDATE orders SET payment_slip = '$filename', status = 'pending_payment' WHERE id = $order_id");
            header('Location: checkout.php?order_id=' . $order_id);
            exit;
        } else {
            $upload_error = 'อัปโหลดไม่สำเร็จ';
        }
    }
}

if ($order && $order['payment_slip']) {
    $uploaded = true;
}
?>
<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="fw-bold mb-4" style="color: var(--primary-dark);"><?php echo $pageTitle; ?></h1>
    
    <?php if ($upload_error): ?>
    <div class="alert alert-danger"><?php echo $upload_error; ?></div>
    <?php endif; ?>
    
    <div class="row">
        <div class="col-lg-8">
            <?php if (!$order): ?>
            <form method="post">
                <div class="card p-3 mb-3 border-0 shadow-sm" style="border-radius: 16px;">
                    <h5 class="fw-bold mb-3" style="color: var(--primary-dark);">รายการสินค้า</h5>
                    <?php 
                    $cart_items = [];
                    $cart_total = 0;
                    if (!empty($_SESSION['cart'])) {
                        foreach ($_SESSION['cart'] as $pid => $qty) {
                            $product = getProductById($pid);
                            if ($product) {
                                $cart_items[] = $product;
                                $cart_total += $product['price'] * $qty;
                    ?>
                    <div class="d-flex align-items-center mb-2 pb-2 border-bottom">
                        <span class="me-auto"><?php echo $product['name']; ?> x <?php echo $qty; ?></span>
                        <span><?php echo number_format($product['price'] * $qty, 0); ?> บาท</span>
                    </div>
                    <?php 
                            }
                        }
                    }
                    ?>
                    <div class="d-flex justify-content-between mt-3">
                        <strong>รวม</strong>
                        <strong><?php echo number_format($cart_total, 0); ?> บาท</strong>
                    </div>
                </div>
                <button type="submit" class="btn btn-pink w-100">ยืนยันคำสั่งซื้อ</button>
            </form>
            <?php else: ?>
            
            <?php if (!$uploaded): ?>
            <div class="card p-4 mb-3 border-0 shadow-sm" style="border-radius: 16px;">
                <h5 class="fw-bold mb-3" style="color: var(--primary-dark);">ขั้นตอนการชำระเงิน</h5>
                
                <div class="text-center mb-4">
                    <h5 style="color: var(--primary-dark);">ชำระเงินผ่าน Prompay</h5>
                    <p class="mb-2">เลขที่บัญชี: <strong><?php echo $prompay['prompay_number'] ?: 'XXX-XXXXXXX'; ?></strong></p>
                    <p class="mb-2">ชื่อบัญชี: <strong><?php echo $prompay['prompay_name'] ?: 'XXX'; ?></strong></p>
                    <?php if ($prompay['prompay_image']): ?>
                    <img src="../assets/uploads/slips/<?php echo $prompay['prompay_image']; ?>" class="img-fluid" alt="QR Code">
                    <?php endif; ?>
                </div>
                
                <form method="post" enctype="multipart/form-data" id="paymentForm">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>">
                    <div class="mb-3">
                        <label class="form-label">อัปโหลดสลิปการโอน</label>
                        <input type="file" name="payment_slip" class="form-control" accept="image/jpeg,image/png" required>
                    </div>
                    <button type="submit" class="btn btn-pink w-100">อัปโหลดสลิป</button>
                </form>
            </div>
            <?php else: ?>
            <div class="alert alert-success">
                <h5>✓ อัปโหลดสลิปแล้ว</h5>
                <p class="mb-0">รอการตรวจสอบจากทางร้าน จะติดต่อกลับภายใน 24 ชั่วโมง</p>
            </div>
            <a href="history.php" class="btn btn-pink">ดูประวัติการสั่งซื้อ</a>
            <?php endif; ?>
            
            <?php endif; ?>
        </div>
        
        <div class="col-lg-4">
            <div class="card p-3 border-0 shadow-sm" style="border-radius: 16px;">
                <h5 class="fw-bold" style="color: var(--primary-dark);">สถานะคำสั่งซื้อ</h5>
                <hr>
                <p>รหัสคำสั่งซื้อ: #<?php echo str_pad($order_id, 5, '0', STR_PAD_LEFT); ?></p>
                <p>สถานะ: 
                    <span class="badge badge-<?php echo $order['status']; ?>">
                        <?php 
                        $status_text = [
                            'pending' => 'รอคอนเฟิร์ม',
                            'pending_payment' => 'รอชำระเงิน',
                            'confirmed' => 'คอนเฟิร์มแล้ว',
                            'cancelled' => 'ยกเลิก',
                            'completed' => 'เสร็จสิ้น'
                        ];
                        echo $status_text[$order['status']] ?? $order['status'];
                        ?>
                    </span>
                </p>
            </div>
        </div>
    </div>
</div>

<?php 
if ($order && !$uploaded) {
    $extraJS = '<script>
document.getElementById("paymentForm").addEventListener("submit", function(e) {
    e.preventDefault();
    var formData = new FormData(this);
    fetch("checkout.php", {
        method: "POST",
        body: formData
    }).then(res => res.text()).then(data => {
        location.reload();
    });
});
</script>';
}
?>

<?php include __DIR__ . '/../includes/footer.php'; ?>