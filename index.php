<?php 
$pageTitle = 'หน้าหลัก';
if (session_status() === PHP_SESSION_NONE) session_start();
include 'config/db.php';
include 'includes/functions.php';
$shop_name = getSetting('shop_name');
$products = getProducts();
$featured_products = array_slice($products, 0, 6);
$is_login = isset($_SESSION['user_id']);
$is_admin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - <?php echo $shop_name; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.0/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>

<?php include 'includes/navbar.php'; ?>

<main>

<section class="hero-section" style="padding: 80px 0;">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 order-2 order-lg-1">
                <h1 class="display-4 fw-bold mb-3" style="color: var(--primary-dark);"><?php echo $shop_name; ?></h1>
                <p class="lead mb-4" style="color: var(--text-gray); font-size: 1.1rem; line-height: 1.8;">
                    สวยงาม หรูหรา สไตล์คุณ<br>
                    จองชุดแต่งงาน และสินค้าสำหรับงานพิเศษ
                </p>
                <div class="d-flex flex-wrap gap-3">
                    <a href="#products" class="btn btn-pink btn-lg px-5 py-3">ดูสินค้า</a>
                    <a href="#contact" class="btn btn-outline-pink btn-lg px-5 py-3">ติดต่อเรา</a>
                </div>
            </div>
            <div class="col-lg-6 order-1 order-lg-2 text-center mb-4 mb-lg-0">
                <svg viewBox="0 0 400 400" style="max-width: 350px;">
                    <defs>
                        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#F8C8DC"/>
                            <stop offset="100%" style="stop-color:#E8A0C0"/>
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="180" fill="url(#g)" opacity="0.2"/>
                    <circle cx="200" cy="200" r="140" fill="url(#g)" opacity="0.4"/>
                    <circle cx="200" cy="200" r="100" fill="url(#g)" opacity="0.6"/>
                    <text x="200" y="220" text-anchor="middle" font-size="100" fill="#D488A8">❤</text>
                </svg>
            </div>
        </div>
    </div>
</section>

<!-- Products -->
<section class="py-5 bg-white" id="products">
    <div class="container">
        <h2 class="text-center fw-bold mb-2" style="color: var(--primary-dark);">สินค้าแนะนำ</h2>
        <p class="text-center text-muted mb-4">คัดสรรสินค้าดีที่สุดให้คุณ</p>
        
        <?php if (empty($featured_products)): ?>
        <div class="text-center py-5">
            <p class="text-muted mb-4">ยังไม่มีสินค้า</p>
        </div>
        <?php else: ?>
        <div class="row g-4">
            <?php foreach ($featured_products as $p): ?>
            <div class="col-6 col-md-4 col-lg-4">
                <div class="card h-100 border-0 shadow-sm" style="border-radius: 16px; overflow: hidden;">
                    <a href="pages/product_detail.php?id=<?php echo $p['id']; ?>">
                        <img src="<?php echo $p['image'] ? 'assets/uploads/products/' . $p['image'] : 'https://placehold.co/600x400?text=' . urlencode($p['name']); ?>" class="w-100" style="height: 250px; object-fit: cover;">
                    </a>
                    <div class="card-body p-3">
                        <span class="badge mb-1" style="background: <?php echo $p['type']==='rent'?'#F8C8DC':'#E8A0C0'; ?>;"><?php echo $p['type']==='rent'?'จอง':'ซื้อ'; ?></span>
                        <h5 class="fw-bold mb-1" style="font-size: 1rem;"><?php echo $p['name']; ?></h5>
                        <p class="mb-2" style="color: var(--primary-dark); font-weight: 700;">฿ <?php echo number_format($p['price']); ?></p>
                        <a href="pages/product_detail.php?id=<?php echo $p['id']; ?>" class="btn btn-outline-pink w-100 py-2">ดูรายละเอียด</a>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <div class="text-center mt-4">
            <a href="pages/products.php" class="btn btn-pink px-5 py-3">ดูสินค้าทั้งหมด</a>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- Why Choose Us -->
<section class="py-5">
    <div class="container">
        <h2 class="text-center fw-bold mb-2" style="color: var(--primary-dark);">ทำไมต้องเลือกเรา</h2>
        <p class="text-center text-muted mb-4">บริการที่ดีที่สุดสำหรับคุณ</p>
        <div class="row g-4 text-center">
            <div class="col-md-4">
                <div class="p-4 h-100">
                    <div class="mb-3" style="width: 60px; height: 60px; background: var(--primary-light); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="var(--primary-dark)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                    <h5 class="fw-bold mb-2">สินค้าคุณภาพ</h5>
                    <p class="text-muted mb-0">สินค้าทุกชิ้นผ่านการคัดสรรอย่างดี</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-4 h-100">
                    <div class="mb-3" style="width: 60px; height: 60px; background: var(--primary-light); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="var(--primary-dark)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <h5 class="fw-bold mb-2">บริการด้วยใจ</h5>
                    <p class="text-muted mb-0">พร้อมให้คำปรึกษาด้วยความจริงใจ</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-4 h-100">
                    <div class="mb-3" style="width: 60px; height: 60px; background: var(--primary-light); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="var(--primary-dark)"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    </div>
                    <h5 class="fw-bold mb-2">ราคาพิเศษ</h5>
                    <p class="text-muted mb-0">ราคาที่คุ้มค่าที่สุดในท้องตลาด</p>
                </div>
            </div>
        </div>
    </div>
</section>


<?php include 'includes/footer.php'; ?>