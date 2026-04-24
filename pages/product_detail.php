<?php
$pageTitle = 'รายละเอียดสินค้า';
if (session_status() === PHP_SESSION_NONE) session_start();
include '../config/db.php';
include '../includes/functions.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$product = getProductById($id);

if (!$product) {
    header('Location: products.php');
    exit;
}

$is_logged_in = isset($_SESSION['user_id']);
$prompay_number = getSetting('prompay_number');
$prompay_name = getSetting('prompay_name');
$prompay_image = getSetting('prompay_image');
?>
<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $product['name']; ?> - <?php echo $pageTitle; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.0/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>

<body>

    <?php include '../includes/navbar.php'; ?>

    <main>
        <div class="container py-5">
            <nav aria-label="breadcrumb" class="mb-4">
                <a href="products.php" class="text-decoration-none" style="color: var(--primary-dark);">← กลับไปสินค้าทั้งหมด</a>
            </nav>

            <div class="row">
                <div class="col-md-6 mb-4">
                    <img src="<?php echo $product['image'] ? '../assets/uploads/products/' . $product['image'] : 'https://via.placeholder.com/600x600/F8C8DC/E8A0C0?text=' . urlencode($product['name']); ?>"
                        class="img-fluid" style="border-radius: 20px; width: 100%;">
                </div>
                <div class="col-md-6">
                    <span class="badge <?php echo $product['type'] === 'rent' ? 'badge-rent' : 'badge-sale'; ?> mb-2">
                        <?php echo $product['type'] === 'rent' ? 'จองชุดแต่งงาน' : 'ซื้อสินค้า'; ?>
                    </span>
                    <h1 class="fw-bold mb-2" style="color: var(--primary-dark); font-size: 1.8rem;"><?php echo $product['name']; ?></h1>

                    <h2 class="fw-bold mb-4" style="color: var(--primary-dark);">฿ <?php echo number_format($product['price']); ?></h2>

                    <p class="text-muted mb-4"><?php echo nl2br($product['description'] ?? 'ไม่มีรายละเอียดสินค้า'); ?></p>

                    <?php if ($product['type'] === 'rent'): ?>
                        <!-- Booking Button -->
                        <button class="btn btn-pink btn-lg w-100 mb-3" data-bs-toggle="modal" data-bs-target="#bookingModal">
                            จองชุดนี้
                        </button>
                        <small class="text-muted d-block text-center mb-4">* ไม่ต้องเข้าสู่ระบบ จองแล้วโอนเงินผ่าน Prompay</small>
                    <?php else: ?>
                        <!-- Sale Section -->
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-pink btn-lg" data-bs-toggle="modal" data-bs-target="#saleModal">
                                สั่งซื้อ (ไม่ต้อง Login)
                            </button>
                            <?php if (!$is_logged_in): ?>
                                <a href="login.php?redirect=product_detail.php?id=<?php echo $id; ?>" class="btn btn-outline-pink btn-lg">
                                    เข้าสู่ระบบเพื่อซื้อ
                                </a>
                            <?php else: ?>
                                <button class="btn btn-outline-pink btn-lg" onclick="addToCart(<?php echo $id; ?>)">
                                    เพิ่มในตะกร้า
                                </button>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>

    <?php include '../includes/footer.php'; ?>

    <!-- ============================================ -->
    <!-- BOOKING MODAL (For Rent Products) -->
    <!-- ============================================ -->
    <?php if ($product['type'] === 'rent'): ?>
        <div class="modal fade" id="bookingModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content" style="border-radius: 20px;">
                    <div class="modal-header" style="background: var(--primary-light); border-radius: 20px 20px 0 0;">
                        <h5 class="modal-title fw-bold">จองชุด: <?php echo $product['name']; ?></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-3">
                            <small><strong>📅 เลือกวันที่:</strong> สามารถจองได้สูงสุด 3 ที่ ต่อ 1 วัน</small>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">เลือกวันที่ *</label>
                            <input type="text" id="bookingDateRange" class="form-control" placeholder="เลือกวันที่เริ่ม - วันที่สิ้นสุด">
                        </div>

                        <div id="bookingInfo" class="d-none">
                            <div class="alert alert-success mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>ราคาจอง (<?php echo number_format($product['price']); ?> บาท x <span id="bookingDays">0</span> วัน):</span>
                                    <strong id="bookingTotal">฿ 0</strong>
                                </div>
                            </div>

                            <div class="text-center">
                                <strong class="text-success">✓ มีที่ว่าง</strong>
                            </div>
                        </div>

                        <div id="bookingError" class="d-none">
                            <div class="alert alert-danger">
                                <strong>✗ ไม่มีที่ว่าง</strong>
                                <small id="errorDates" class="d-block mt-1"></small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                        <button type="button" class="btn btn-pink" id="confirmBookingBtn" disabled onclick="confirmBooking()">
                            ยืนยันการจอง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- ============================================ -->
    <!-- SALE MODAL (For Sale Products - No Login) -->
    <!-- ============================================ -->
    <div class="modal fade" id="saleModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border-radius: 20px;">
                <div class="modal-header" style="background: var(--primary-light); border-radius: 20px 20px 0 0;">
                    <h5 class="modal-title fw-bold">สั่งซื้อ: <?php echo $product['name']; ?></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <h4 style="color: var(--primary-dark);">฿ <?php echo number_format($product['price']); ?></h4>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold mb-2">💳 ชำระเงินผ่าน Prompay</h6>
                        <div class="card p-3" style="background: var(--pink-light); border-radius: 12px;">
                            <p class="mb-1"><strong>เลขที่บัญชี:</strong> <?php echo $prompay_number ?: '-'; ?></p>
                            <p class="mb-0"><strong>ชื่อบัญชี:</strong> <?php echo $prompay_name ?: '-'; ?></p>
                        </div>
                    </div>

                    <div class="alert alert-info">
                        <strong>📋 วิธีสั่งซื้อ:</strong><br>
                        1. กดปุ่ม "ส่งไป Messenger" ด้านล่าง<br>
                        2. ส่งหลักฐานการโอน slip ให้ทาง Messenger<br>
                        3. ทางร้านจะติดต่อกลับไปภายใน 24 ชม.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                    <button type="button" class="btn btn-pink" onclick="sendToMessengerSale()">
                        📱 ส่งไป Messenger
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- JavaScript -->
    <!-- ============================================ -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/th.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.0/dist/sweetalert2.min.js"></script>

    <script>
        var productId = <?php echo $id; ?>;
        var productName = '<?php echo addslashes($product['name']); ?>';
        var productPrice = <?php echo $product['price']; ?>;
        var productType = '<?php echo $product['type']; ?>';
        var selectedStartDate = null;
        var selectedEndDate = null;
        var totalDays = 0;

        // ============================================
        // Booking Modal Functions (for Rent)
        <?php if ($product['type'] === 'rent'): ?>
            // ============================================
            var bookingFp = null;

            document.getElementById('bookingModal').addEventListener('shown.bs.modal', function() {
                if (!bookingFp) {
                    bookingFp = flatpickr("#bookingDateRange", {
                        locale: 'th',
                        mode: 'range',
                        minDate: 'today',
                        dateFormat: 'Y-m-d',
                        onChange: function(selectedDates) {
                            if (selectedDates.length === 2) {
                                selectedStartDate = selectedDates[0];
                                selectedEndDate = selectedDates[1];
                                checkAvailability();
                            }
                        }
                    });
                }
            });

            function checkAvailability() {
                if (!selectedStartDate || !selectedEndDate) return;

                var days = Math.round((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
                totalDays = days;

                var startStr = flatpickr.formatDate(selectedStartDate, 'Y-m-d');
                var endStr = flatpickr.formatDate(selectedEndDate, 'Y-m-d');

                fetch('check_date.php?product_id=' + productId + '&start=' + startStr + '&end=' + endStr)
                    .then(res => res.json())
                    .then(data => {
                        if (data.available) {
                            document.getElementById('bookingDays').textContent = days;
                            document.getElementById('bookingTotal').textContent = '฿ ' + (productPrice * days).toLocaleString();
                            document.getElementById('bookingInfo').classList.remove('d-none');
                            document.getElementById('bookingError').classList.add('d-none');
                            document.getElementById('confirmBookingBtn').disabled = false;
                        } else {
                            document.getElementById('bookingDays').textContent = days;
                            document.getElementById('bookingTotal').textContent = '฿ ' + (productPrice * days).toLocaleString();
                            document.getElementById('errorDates').textContent = 'วันที่ไม่ว่าง: ' + ((data.unavailable_dates && data.unavailable_dates.length) ? data.unavailable_dates.join(', ') : '');
                            document.getElementById('bookingInfo').classList.add('d-none');
                            document.getElementById('bookingError').classList.remove('d-none');
                            document.getElementById('confirmBookingBtn').disabled = true;
                        }
                    })
                    .catch(() => {
                        document.getElementById('bookingDays').textContent = days;
                        document.getElementById('bookingTotal').textContent = '฿ ' + (productPrice * days).toLocaleString();
                        document.getElementById('bookingInfo').classList.remove('d-none');
                        document.getElementById('bookingError').classList.add('d-none');
                        document.getElementById('confirmBookingBtn').disabled = false;
                    });
            }

            function confirmBooking() {
                if (!selectedStartDate || !selectedEndDate) return;

                var startStr = flatpickr.formatDate(selectedStartDate, 'd/m/Y');
                var endStr = flatpickr.formatDate(selectedEndDate, 'd/m/Y');
                var totalPrice = (productPrice * totalDays).toLocaleString();

                var ref = 'product_' + productId;
                var message = encodeURIComponent('สวัสดีค่ะ ต้องการจองชุด ' + productName + ' วันที่ ' + startStr + ' - ' + endStr + ' ราคา ' + totalPrice + ' บาทค่ะ');
                var url = 'https://m.me/ChinKornMakeUp?ref=' + ref + '&message=' + message;

                window.open(url, '_blank');

                bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();

                Swal.fire({
                    icon: 'success',
                    title: '📨 กรุณาส่ง Slip',
                    text: 'กรุณาส่งหลักฐานการโอน slip มาให้ทาง Messenger แล้วจะติดต่อกลับไปค่ะ',
                    confirmButtonColor: '#E8A0C0'
                });
            }
        <?php endif; ?>

        // ============================================
        // Sale Modal Functions (No Login)
        // ============================================
        function sendToMessengerSale() {
            var ref = 'product_' + productId;
            var message = encodeURIComponent('สวัสดีค่ะ สนใจสินค้า ' + productName + ' ราคา ' + productPrice.toLocaleString() + ' บาท ต้องการชำระเงินค่ะ');
            var url = 'https://m.me/ChinKornMakeUp?ref=' + ref + '&message=' + message;

            window.open(url, '_blank');

            bootstrap.Modal.getInstance(document.getElementById('saleModal')).hide();

            Swal.fire({
                icon: 'success',
                title: '📨 กรุณาส่ง Slip',
                text: 'กรุณาส่งหลักฐานการโอน slip มาให้ทาง Messenger แล้วจะติดต่อกลับไปค่ะ',
                confirmButtonColor: '#E8A0C0'
            });
        }

        // ============================================
        // Add to Cart (for Login users)
        // ============================================
        function addToCart(pid) {
            fetch('cart_api.php?action=add&id=' + pid + '&qty=1')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: '✅ เพิ่มในตะกร้าแล้ว',
                            text: 'มี ' + data.cart_count + ' ชิ้นในตะกร้า',
                            confirmButtonColor: '#E8A0C0',
                            willClose: () => location.reload()
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: '❌ เกิดข้อผิดพลาด',
                            text: data.message || 'ไม่สามารถเพิ่มในตะกร้าได้',
                            confirmButtonColor: '#E8A0C0'
                        });
                    }
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: '❌ เกิดข้อผิดพลาด',
                        text: 'กรุณาลองใหม่อีกครั้ง',
                        confirmButtonColor: '#E8A0C0'
                    });
                });
        }
    </script>
</body>

</html>