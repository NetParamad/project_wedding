<?php
if (session_status() === PHP_SESSION_NONE) session_start();
if (!isset($conn)) {
    include __DIR__ . '/../config/db.php';
}
$is_login = isset($_SESSION['user_id']);
?>

</main>

<footer class="py-5" style="background: linear-gradient(180deg, var(--cream) 0%, var(--champagne) 100%);">
    <div class="container">
        <!-- Single Row - Compact -->
        <div class="row g-4 text-center text-md-start">
<!-- Brand -->
            <div class="col-lg-3 col-md-6">
                <div class="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                    <div class="me-3" style="width: 50px; height: 50px; background: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-heart-fill" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <h5 class="mb-0 ms-2" style="color: var(--gold); font-weight: 700;"><?php echo htmlspecialchars(getSetting('shop_name')); ?></h5>
                </div>
                <p class="text-muted small mb-0">บริการจองชุดแต่งงานและสินค้าสำหรับงานพิเศษ ด้วยความประณีและคุณภาพ</p>
            </div>
            
            <!-- Links -->
            <div class="col-lg-3 col-md-6">
                <h6 class="mb-3" style="color: var(--gold); font-weight: 700;"> ลิงก์นำทาง</h6>
                <ul class="list-unstyled mb-0" style="font-size: 0.9rem;">
                    <li class="mb-1"><a href="../index.php" class="text-decoration-none" style="color: var(--text-gray);">หน้าหลัก</a></li>
                    <li class="mb-1"><a href="../pages/products.php" class="text-decoration-none" style="color: var(--text-gray);">สินค้าทั้งหมด</a></li>
                    <li class="mb-1"><a href="../pages/products.php?type=rent" class="text-decoration-none" style="color: var(--text-gray);">จองชุดแต่งงาน</a></li>
                    <li class="mb-1"><a href="../pages/products.php?type=sale" class="text-decoration-none" style="color: var(--text-gray);">ซื้อสินค้า</a></li>
                    <li class="mb-1"><a href="../pages/about.php" class="text-decoration-none" style="color: var(--text-gray);">เกี่ยวกับ</a></li>
                    <?php if (!isset($is_login)): ?>
                        <li class="mb-1"><a href="../pages/login.php" class="text-decoration-none" style="color: var(--text-gray);">เข้าสู่ระบบ</a></li>
                    <?php else: ?>
                        <li class="mb-1"><a href="../pages/history.php" class="text-decoration-none" style="color: var(--text-gray);">ประวัติสั่งซื้อ</a></li>
                    <?php endif; ?>
                </ul>
            </div>

            <!-- Contact -->
            <div class="col-lg-3 col-md-6">
                <h6 class="mb-3" style="color: var(--primary-dark); font-weight: 700;">ติดต่อ</h6>
                <ul class="list-unstyled mb-0" style="font-size: 0.9rem;">
                    <?php if (getSetting('shop_phone')): ?>
                        <li class="mb-1" style="color: var(--text-gray);"> <?php echo getSetting('shop_phone'); ?></li>
                    <?php endif; ?>
                    <?php if (getSetting('shop_line')): ?>
                        <li class="mb-1" style="color: var(--text-gray);"> <?php echo getSetting('shop_line'); ?></li>
                    <?php endif; ?>
                    <li class="mb-1" style="color: var(--text-gray);">contact@weddingshop.com</li>
                </ul>
            </div>
            <div class="col-lg-3 col-md-6">
<h6 class="mb-3" style="color: var(--gold); font-weight: 700;">ติดตาม</h6>
                <div class="d-flex justify-content-center justify-content-md-start gap-3">
                    <a href="https://m.me/ChinKornMakeUp" target="_blank" style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--gold); text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s;">
                        <i class="bi bi-messenger"></i>
                    </a>
                    <a href="https://line.me/ti/p/~<?php echo getSetting('shop_line'); ?>" target="_blank" style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--gold); text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s;">
                        <i class="bi bi-line"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Copyright -->
        <div class="text-center mt-4 pt-3" style="border-top: 1px solid rgba(255,255,255,0.5);">
            <p class="mb-0" style="color: var(--text-gray); font-size: 0.85rem;">© <?php echo date('Y'); ?> <?php echo htmlspecialchars(getSetting('shop_name')); ?>. สงวนลิขสิทธิ์ทุกสิทธิ์</p>
        </div>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.0/dist/sweetalert2.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/th.js"></script>
<script src="../assets/js/main.js"></script>
<?php if (isset($extraJS)): ?>
    <?php echo $extraJS; ?>
<?php endif; ?>
</body>

</html>