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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.0/dist/sweetalert2.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>

<body>
    <div class="page-transition active"></div>
    
    <?php include 'includes/navbar.php'; ?>

    <main>

        <section class="hero-section fade-in" style="padding: 80px 0;">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-6 order-2 order-lg-1">
                        <h1 class="display-4 fw-bold mb-3 font-elegant fade-in fade-in-delay-1" style="color: var(--gold-dark);"><?php echo $shop_name; ?></h1>
                        <p class="lead mb-4 fade-in fade-in-delay-2" style="color: var(--text-gray); font-size: 1.1rem; line-height: 1.8;">
                            สวยงาม หรูหรา สไตล์คุณ<br>
                            จองชุดแต่งงาน และสินค้าสำหรับงานพิเศษ
                        </p>
                        <div class="d-flex flex-wrap gap-3 fade-in fade-in-delay-3">
                            <a href="#products" class="btn btn-gold btn-lg px-5 py-3">ดูสินค้า</a>
                            <a href="#contact" class="btn btn-outline-gold btn-lg px-5 py-3">ติดต่อเรา</a>
                        </div>
                    </div>
                    <div class="col-lg-6 order-1 order-lg-2 text-center mb-4 mb-lg-0">
                        <div class="fade-in fade-in-delay-2" style="width: 350px; height: 350px; background: linear-gradient(135deg, var(--champagne) 0%, var(--gold) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 20px 60px rgba(102,54,29,0.2);">
                            <i class="bi bi-heart-fill" style="font-size: 120px; color: white;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Products -->
        <section class="py-5 bg-white reveal" id="products">
            <div class="container">
                <h2 class="text-center fw-bold mb-2 font-elegant" style="color: var(--gold);">สินค้าแนะนำ</h2>
                <p class="text-center text-muted mb-4">คัดสรรสินค้าดีที่สุดให้คุณ</p>

                    <?php if (empty($featured_products)): ?>
                <div class="text-center py-5">
                    <p class="text-muted mb-4">ยังไม่มีสินค้า</p>
                </div>
            <?php else: ?>
                <div class="row g-4">
                    <?php foreach ($featured_products as $p): ?>
                        <div class="col-6 col-md-4 col-lg-4">
                            <div class="card h-100 border-0 shadow-sm reveal" style="border-radius: 16px; overflow: hidden;">
                                <a href="pages/product_detail.php?id=<?php echo $p['id']; ?>">
                                    <img src="<?php echo $p['image'] ? 'assets/uploads/products/' . $p['image'] : 'https://placehold.co/600x400?text=No+Image'; ?>" class="w-100" style="height: 250px; object-fit: cover;">
                                </a>
                                <div class="card-body p-3">
                                    <span class="badge mb-1" style="background: <?php echo $p['type'] === 'rent' ? 'var(--champagne)' : 'var(--gold)'; ?>; color: <?php echo $p['type'] === 'rent' ? '#333' : 'white'; ?>;"><?php echo $p['type'] === 'rent' ? 'จอง' : 'ซื้อ'; ?></span>
                                    <h5 class="fw-bold mb-1" style="font-size: 1rem;"><?php echo $p['name']; ?></h5>
                                    <p class="mb-2" style="color: var(--gold-dark); font-weight: 700;">฿ <?php echo number_format($p['price']); ?></p>
                                    <a href="pages/product_detail.php?id=<?php echo $p['id']; ?>" class="btn btn-outline-gold w-100 py-2">ดูรายละเอียด</a>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="text-center mt-4">
                    <a href="pages/products.php" class="btn btn-gold px-5 py-3">ดูสินค้าทั้งหมด</a>
                </div>
            <?php endif; ?>
            </div>
        </section>

        <!-- Why Choose Us -->
        <section class="py-5" style="background: var(--cream-light);">
            <div class="container">
                <h2 class="text-center fw-bold mb-2 font-elegant" style="color: var(--gold-dark);">ทำไมต้องเลือกเรา</h2>
                <p class="text-center text-muted mb-4">บริการที่ดีที่สุดสำหรับคุณ</p>
                <div class="row g-4 text-center">
                    <div class="col-md-4">
                        <div class="p-4 h-100">
                            <div class="mb-3" style="width: 60px; height: 60px; background: var(--champagne); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <i class="bi bi-check-circle" style="font-size: 30px; color: var(--gold-dark);"></i>
                            </div>
                            <h5 class="fw-bold mb-2 font-elegant">สินค้าคุณภาพ</h5>
                            <p class="text-muted mb-0">สินค้าทุกชิ้นผ่านการคัดสรรอย่างดี</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-4 h-100">
                            <div class="mb-3" style="width: 60px; height: 60px; background: var(--champagne); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <i class="bi bi-heart" style="font-size: 30px; color: var(--gold-dark);"></i>
                            </div>
                            <h5 class="fw-bold mb-2 font-elegant">บริการด้วยใจ</h5>
                            <p class="text-muted mb-0">พร้อมให้คำปรึกษาด้วยความจริงใจ</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-4 h-100">
                            <div class="mb-3" style="width: 60px; height: 60px; background: var(--champagne); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <i class="bi bi-clock" style="font-size: 30px; color: var(--gold-dark);"></i>
                            </div>
                            <h5 class="fw-bold mb-2 font-elegant">ราคาพิเศษ</h5>
                            <p class="text-muted mb-0">ราคาที่คุ้มค่าที่สุดในท้องตลาด</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Why Choose Us - Details -->
        <section class="py-5" style="background: var(--white);">
            <div class="container">
                <h2 class="text-center fw-bold mb-2 font-elegant" style="color: var(--gold);">ทำไมถึงเลือกเรา</h2>
                <p class="text-center text-muted mb-5">ข้อดีที่คุณจะได้รับเมื่อใช้บริการ</p>

                <div class="row g-4">
                    <!-- 1. ชุดสวยทันสมัย -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card reveal">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-check-circle" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">ชุดสวยทันสมัย</h5>
                            <p class="text-muted text-center small mb-0">คัดเลือกชุดใหม่ล่าสุดจากแบรนด์ดัง ทุกฤดูกาล มีให้เลือกหลากหลายไทล์ เหมาะกับทุกงบประมาณ</p>
                        </div>
                    </div>

                    <!-- 2. คุณภาพดีเยี่ยม -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-gem" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">คุณภาพดีเยี่ยม</h5>
                            <p class="text-muted text-center small mb-0">ผ้าชั้นดี ตัดเย็บปักละเอียด ทนทาน ตรวจสอบคุณภาพทุกชิ้นก่อนส่งมอบให้ลูกค้า</p>
                        </div>
                    </div>

                    <!-- 3. บริการครบวงจร -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-clipboard-check" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">บริการครบวงจร</h5>
                            <p class="text-muted text-center small mb-0">วัดตัว ปรับชุด แต่งหน้า ถ่ายรูปพรีออนเรา บริการครบจบที่เดียว</p>
                        </div>
                    </div>

                    <!-- 4. ราคาชัดเจน -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-currency-dollar" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">ราคาชัดเจน</h5>
                            <p class="text-muted text-center small mb-0">ไม่มีค่าซ่อน แพ็กเกจพร้อมใช้งาน จ่ายเท่าที่เห็น ชัดเจนทุกรายการ</p>
                        </div>
                    </div>

                    <!-- 5. ใส่ใจทุกรายละเอียด -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-star-fill" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">ใส่ใจทุกรายละเอียด</h5>
                            <p class="text-muted text-center small mb-0">ให้คำปรึกษาฟรี ติดตามงานจนถึงวันสำคัญ ดูแลเหมือนคนในครอบครัว</p>
                        </div>
                    </div>

                    <!-- 6. ส่งมอบรวดเร็ว -->
                    <div class="col-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm p-4 feature-card">
                            <div class="text-center mb-3">
                                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-truck" style="font-size: 35px; color: white;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-center mb-3 font-elegant" style="color: var(--gold);">ส่งมอบรวดเร็ว</h5>
                            <p class="text-muted text-center small mb-0">จัดส่งชุดถึงมือคุณทันที พร้อมตรวจเช็คความเรียบร้อยก่อนวันงาน</p>
                        </div>
                    </div>
                </div>
            </div>

<!-- Stats -->
                <div class="row g-4 mt-5 pt-4 reveal" style="border-top: 2px solid var(--champagne);">
                <div class="col-4">
                    <div class="text-center">
                        <h3 class="fw-bold mb-1 font-elegant" style="color: var(--gold);">500+</h3>
                        <p class="text-muted mb-0">คู่รัก</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <h3 class="fw-bold mb-1 font-elegant" style="color: var(--gold);">5+</h3>
                        <p class="text-muted mb-0">ปี</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <h3 class="fw-bold mb-1 font-elegant" style="color: var(--gold);">4.8</h3>
                        <p class="text-muted mb-0">คะแนนรีวิว</p>
                    </div>
                </div>
            </div>
            </div>
        </section>

        <?php include 'includes/footer.php'; ?>

<script src="assets/js/main.js"></script>