<?php 
if (session_status() === PHP_SESSION_NONE) session_start();
if (!isset($conn)) {
    include __DIR__ . '/../config/db.php';
}
$is_login = isset($_SESSION['user_id']);
?>

</main>

<footer class="pt-5">
    <div class="container">
        <!-- Footer Brand & Social -->
        <div class="row g-4 mb-5">
            <div class="col-lg-6 mx-auto text-center">
                <div class="footer-brand">
                    <div class="footer-brand-icon">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <h3 class="mb-2"><?php echo htmlspecialchars(getSetting('shop_name')); ?></h3>
                    <p>บริการจองชุดแต่งงานและสินค้าสำหรับงานพิเศษ<br>ด้วยความประณีและคุณภาพ</p>
                    <div class="footer-social">
                        <a href="https://m.me/ChinKornMakeUp" target="_blank" title="Messenger">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-2h2v-3c0-2.21 1.79-4 4-4h2c2.21 0 4 1.79 4 4v3h2v2h-2v3.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/></svg>
                        </a>
                        <a href="https://line.me/ti/p/~<?php echo getSetting('shop_line'); ?>" target="_blank" title="LINE">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.53l-3.08-2.67c-.37-.32-.95-.36-1.37-.1l-1.53.96c-.37.23-.9.19-1.23-.1l-2.03-1.76c-.52-.45-.64-1.23-.27-1.82l1.52-2.4c.37-.58.99-.79 1.55-.53l1.92.89c.43.2.95.13 1.31-.18l1.89-1.6c.39-.33 1-.35 1.42-.04l2.49 1.87c.45.34.57.98.28 1.48l-1.25 2.24c-.29.52-.91.68-1.43.37l-1.83-1.1z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Links & Contact -->
        <div class="row g-4">
            <div class="col-md-4">
                <div class="footer-section">
                    <h5>📌 ลิงก์นำทาง</h5>
                    <ul class="footer-links">
                        <li><a href="../index.php">หน้าหลัก</a></li>
                        <li><a href="../pages/products.php">สินค้าทั้งหมด</a></li>
                        <li><a href="../pages/products.php?type=rent">จองชุดแต่งงาน</a></li>
                        <li><a href="../pages/products.php?type=sale">ซื้อสินค้า</a></li>
                        <li><a href="../pages/about.php">เกี่ยวกับ</a></li>
                        <?php if (!isset($is_login)): ?>
                        <li><a href="../pages/login.php">เข้าสู่ระบบ</a></li>
                        <?php else: ?>
                        <li><a href="../pages/history.php">ประวัติการสั่งซื้อ</a></li>
                        <?php endif; ?>
                    </ul>
                </div>
            </div>
            <div class="col-md-4">
                <div class="footer-section">
                    <h5>📞 ติดต่อเรา</h5>
                    <?php if (getSetting('shop_phone')): ?>
                    <div class="footer-contact-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.71-.17-1.07-.11-1.45.23-2.83.95-3.87 2.22-1.17 1.42-1.81 3.29-1.55 5.12.03.22.08.43.13.64.35.87.85 1.65 1.48 2.34.63.69 1.4 1.16 2.27 1.4.32.09.66.13 1 .13.96 0 1.84-.22 2.63-.63.79-.41 1.43-1.02 1.89-1.8.46-.78.72-1.68.77-2.67.06-1.32-.38-2.65-1.15-3.76-.77-1.11-1.83-1.94-3.02-2.38-.59-.22-1.22-.33-1.85-.33z"/></svg>
                        <span><?php echo getSetting('shop_phone'); ?></span>
                    </div>
                    <?php endif; ?>
                    <?php if (getSetting('shop_line')): ?>
                    <div class="footer-contact-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.53l-3.08-2.67c-.37-.32-.95-.36-1.37-.1l-1.53.96c-.37.23-.9.19-1.23-.1l-2.03-1.76c-.52-.45-.64-1.23-.27-1.82l1.52-2.4c.37-.58.99-.79 1.55-.53l1.92.89c.43.2.95.13 1.31-.18l1.89-1.6c.39-.33 1-.35 1.42-.04l2.49 1.87c.45.34.57.98.28 1.48l-1.25 2.24c-.29.52-.91.68-1.43.37l-1.83-1.1z"/></svg>
                        <span><?php echo getSetting('shop_line'); ?></span>
                    </div>
                    <?php endif; ?>
                    <div class="footer-contact-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
                        <span>contact@weddingshop.com</span>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="footer-section">
                    <h5>🏪 ที่อยู่ร้าน</h5>
                    <div class="footer-contact-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        <span>กรุงเทพมหานคร ประเทศไทย</span>
                    </div>
                    <div class="footer-contact-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                        <span>เปิดบริการ: 09:00 - 20:00 น.</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer Bottom -->
        <div class="footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars(getSetting('shop_name')); ?>. สงวนลิขสิทธิ์ทุกสิทธิ์</p>
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