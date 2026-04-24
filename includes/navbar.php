<?php 
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
include __DIR__ . '/../config/db.php';
$shop_name = getSetting('shop_name');
$is_login = isset($_SESSION['user_id']);
$is_admin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
?>

<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
    <div class="container">
        <a class="navbar-brand" href="../index.php">
            <?php echo htmlspecialchars($shop_name); ?>
        </a>
        
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="../index.php">หน้าหลัก</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../pages/products.php">สินค้าทั้งหมด</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../pages/products.php?type=rent">จองชุดแต่งงาน</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../pages/products.php?type=sale">ซื้อสินค้า</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="../pages/about.php">เกี่ยวกับ</a>
                </li>
            </ul>
            
            <ul class="navbar-nav">
                <?php if ($is_login): ?>
                <li class="nav-item">
                    <a class="nav-link" href="../pages/cart.php">
                        ตะกร้า 
                        <?php if (isset($_SESSION['cart']) && count($_SESSION['cart']) > 0): ?>
                        <span class="badge ms-1" style="background: var(--primary-dark); color: white;"><?php echo count($_SESSION['cart']); ?></span>
                        <?php endif; ?>
                    </a>
                </li>
                <?php if ($is_admin): ?>
                <li class="nav-item">
                    <a class="nav-link" href="../admin/dashboard.php" style="color: var(--primary-dark); font-weight: 600;">
                        แผนควบคุม
                    </a>
                </li>
                <?php endif; ?>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <?php echo htmlspecialchars($_SESSION['name']); ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="../pages/history.php">ประวัติการสั่งซื้อ</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="../pages/logout.php">ออกจากระบบ</a></li>
                    </ul>
                </li>
                <?php else: ?>
                <li class="nav-item">
                    <a class="nav-link btn-pink px-3 py-2 ms-2" href="../pages/login.php" style="border-radius: 50px;">
                        เข้าสู่ระบบ
                    </a>
                </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>