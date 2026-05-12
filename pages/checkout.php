<?php 
$pageTitle = 'ชำระเงิน';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php?redirect=checkout.php');
    exit;
}

$cart_items = [];
$cart_total = 0;
$stock_errors = [];
if (!empty($_SESSION['cart'])) {
    foreach ($_SESSION['cart'] as $pid => $qty) {
        $product = getProductById($pid);
        if ($product) {
            if (!checkStock($pid, $qty)) {
                $stock_errors[] = $product['name'] . ' - สินค้าไม่เพียงพอ';
                unset($_SESSION['cart'][$pid]);
            } else {
                $cart_items[] = $product;
                $cart_total += $product['price'] * $qty;
            }
        }
    }
}

if (!empty($stock_errors)) {
    $_SESSION['error'] = implode(', ', $stock_errors);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($stock_errors)) {
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
    if ($order_id) {
        foreach ($items as $item) {
            updateStock($item['product_id'], $item['quantity'], 'decrease');
        }
    }
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
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_FILES['payment_slip']['name'])) {
    $file = $_FILES['payment_slip'];
    $order_id = (int)$_POST['order_id'];
    $customer_name = $_POST['customer_name'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $address = $_POST['address'] ?? '';
    if ($_POST['address_option'] ?? 'old' === 'new') {
        $address = $_POST['new_address'] ?? '';
    }
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $upload_errors = [
            UPLOAD_ERR_INI_SIZE => 'ไฟล์ใหญ่เกินไป',
            UPLOAD_ERR_FORM_SIZE => 'ไฟล์ใหญ่เกินไป',
            UPLOAD_ERR_PARTIAL => 'ไฟล์อัปโหลดไม่สมบูรณ์',
            UPLOAD_ERR_NO_FILE => 'ไม่พบไฟล์'
        ];
        $upload_error = $upload_errors[$file['error']] ?? 'เกิดข้อผิดพลาด';
    } elseif (!is_uploaded_file($file['tmp_name'])) {
        $upload_error = 'ไฟล์ไม่ถูกต้อง';
    } else {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png'];
        
        if (!in_array($ext, $allowed)) {
            $upload_error = 'อนุญาตเฉพาะไฟล์ JPG, PNG เท่านั้น';
        } else {
            $filename = 'slip_' . $order_id . '_' . time() . '.' . $ext;
            $target = __DIR__ . '/../assets/uploads/slips/' . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $target)) {
                $stmt = $conn->prepare("UPDATE orders SET payment_slip = ?, status = 'pending_payment', customer_name = ?, phone = ?, address = ? WHERE id = ?");
                $stmt->bind_param("sssi", $filename, $customer_name, $phone, $address, $order_id);
                $stmt->execute();
                $_SESSION['success'] = 'อัปโหลดสลิปสำเร็จ รอการตรวจสอบ';
                header('Location: checkout.php?order_id=' . $order_id);
                exit;
            } else {
                $upload_error = 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่';
            }
        }
    }
}

if ($order && $order['payment_slip']) {
    $uploaded = true;
}
?>
<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="fw-bold mb-4 font-elegant" style="color: var(--gold-dark);"><?php echo $pageTitle; ?></h1>
    
    <?php if (isset($_SESSION['error'])): ?>
    <div class="alert alert-danger"><?php echo $_SESSION['error']; unset($_SESSION['error']); ?></div>
    <?php endif; ?>
    <?php if (isset($_SESSION['success'])): ?>
    <div class="alert alert-success"><?php echo $_SESSION['success']; unset($_SESSION['success']); ?></div>
    <?php endif; ?>
    <?php if ($upload_error): ?>
    <div class="alert alert-danger"><?php echo $upload_error; ?></div>
    <?php endif; ?>
    
    <div class="row">
        <div class="col-lg-8">
            <?php if (!$order): ?>
            <form method="post">
                <div class="card p-3 mb-3 border-0 shadow-sm" style="border-radius: 16px;">
                    <h5 class="fw-bold mb-3" style="color: var(--gold-dark);">รายการสินค้า</h5>
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
                <button type="submit" class="btn btn-gold w-100">ยืนยันคำสั่งซื้อ</button>
            </form>
            <?php else: ?>
            
            <?php if (!$uploaded): ?>
            <div class="card p-4 mb-3 border-0 shadow-sm" style="border-radius: 16px;">
                <h5 class="fw-bold mb-3" style="color: var(--gold-dark);">ข้อมูลการจัดส่ง</h5>
                
                <div class="mb-3">
                    <label class="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" name="customer_name" class="form-control" value="<?php echo $_SESSION['name']; ?>" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">เบอร์โทรศัพท์</label>
                    <input type="tel" name="phone" class="form-control" value="<?php echo $_SESSION['phone'] ?? ''; ?>" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">ที่อยู่</label>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="address_option" id="address_old" value="old" checked>
                        <label class="form-check-label" for="address_old">
                            ที่อยู่ตามที่สมัคร
                        </label>
                    </div>
                    <div id="old_address" class="mb-2 p-2 rounded" style="background: #f8f9fa;">
                        <?php echo nl2br($_SESSION['address'] ?? 'ยังไม่มีที่อยู่'); ?>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="address_option" id="address_new" value="new">
                        <label class="form-check-label" for="address_new">
                            ที่อยู่ใหม่
                        </label>
                    </div>
                    <textarea name="new_address" id="new_address_field" class="form-control" rows="2" placeholder="บ้านเลขที่/หมู่บ้าน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" style="display: none;"></textarea>
                </div>
                
                <h5 class="fw-bold mb-3 mt-4" style="color: var(--gold-dark);">ขั้นตอนการชำระเงิน</h5>
                
                <div class="text-center mb-4">
                    <h5 style="color: var(--gold-dark);">ชำระเงินผ่าน Prompay</h5>
                    <p class="mb-2">เลขที่บัญชี: <strong><?php echo $prompay['prompay_number'] ?: 'XXX-XXXXXXX'; ?></strong></p>
                    <p class="mb-2">ชื่อบัญชี: <strong><?php echo $prompay['prompay_name'] ?: 'XXX'; ?></strong></p>
                    <?php if ($prompay['prompay_image']): ?>
                    <img src="../assets/uploads/prompay/<?php echo $prompay['prompay_image']; ?>" class="img-fluid mt-3" style="max-width: 200px;" alt="QR Code">
                    <?php endif; ?>
                </div>
                
                <form method="post" action="checkout.php?order_id=<?php echo $order_id; ?>" enctype="multipart/form-data" id="paymentForm">
                    <input type="hidden" name="order_id" value="<?php echo $order_id; ?>">
                    <input type="hidden" name="customer_name" value="<?php echo $_SESSION['name']; ?>">
                    <input type="hidden" name="phone" value="<?php echo $_SESSION['phone'] ?? ''; ?>">
                    <input type="hidden" name="address" value="<?php echo $_SESSION['address'] ?? ''; ?>">
                    <div class="mb-3">
                        <label class="form-label">อัปโหลดสลิปการโอน</label>
                        <input type="file" name="payment_slip" class="form-control" accept="image/jpeg,image/png" required>
                    </div>
                    <button type="submit" class="btn btn-gold w-100">อัปโหลดสลิป</button>
                </form>
            </div>
            <script>
            document.querySelectorAll('input[name="address_option"]').forEach(function(radio) {
                radio.addEventListener('change', function() {
                    var newField = document.getElementById('new_address_field');
                    var oldAddress = document.getElementById('old_address');
                    if (this.value === 'new') {
                        newField.style.display = 'block';
                        oldAddress.style.display = 'none';
                    } else {
                        newField.style.display = 'none';
                        oldAddress.style.display = 'block';
                    }
                });
            });
            </script>
            <?php else: ?>
            <div class="alert alert-success">
                <h5>✓ อัปโหลดสลิปแล้ว</h5>
                <p class="mb-0">รอการตรวจสอบจากทางร้าน จะติดต่อกลับภายใน 24 ชั่วโมง</p>
            </div>
            <a href="history.php" class="btn btn-gold">ดูประวัติการสั่งซื้อ</a>
            <?php endif; ?>
            
            <?php endif; ?>
        </div>
        
        <div class="col-lg-4">
            <div class="card p-3 border-0 shadow-sm" style="border-radius: 16px;">
                <h5 class="fw-bold" style="color: var(--gold-dark);">สถานะคำสั่งซื้อ</h5>
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

<?php include __DIR__ . '/../includes/footer.php'; ?>