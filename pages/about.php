<?php 
$pageTitle = 'เกี่ยวกับร้าน';
if (session_status() === PHP_SESSION_NONE) session_start();
include __DIR__ . '/../config/db.php';
include __DIR__ . '/../includes/functions.php';

$shop_name = getSetting('shop_name');
$shop_phone = getSetting('shop_phone');
$shop_line = getSetting('shop_line');
$prompay = getPrompaySettings();
?>
<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="fw-bold mb-4 text-center font-elegant" style="color: var(--gold-dark);"><?php echo $pageTitle; ?></h1>
    
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 20px;">
                <div class="card-body p-4">
                    <h3 class="fw-bold mb-3 font-elegant" style="color: var(--gold-dark);"><?php echo htmlspecialchars($shop_name); ?></h3>
                    <p class="text-muted">ยินดีต้อนรับสู่ร้านของเราค่ะ บริการจองชุดแต่งงานสวยๆ มากมายให้เลือกและขายสินค้าคุณภาพดี</p>
                </div>
            </div>
            
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 20px;">
                <div class="card-body p-4">
                    <h4 class="fw-bold mb-3 font-elegant" style="color: var(--gold-dark);">บริการของเรา</h4>
                    <ul class="list-unstyled">
                        <li class="mb-2"><strong>จองชุดแต่งงาน</strong> - ชุดเจ้าสาว ชุดราตรี ชุดไทย สวยๆ หลากหลาย</li>
                        <li class="mb-2"><strong>ขายสินค้า</strong> - เครื่องประดับ อุปกรณ์แต่งงาน</li>
                        <li><strong>จองล่วงหน้า</strong> - วางมัดจำ 50% จองได้เลย</li>
                    </ul>
                </div>
            </div>
            
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 20px;">
                <div class="card-body p-4">
                    <h4 class="fw-bold mb-3 font-elegant" style="color: var(--gold-dark);">ติดต่อเรา</h4>
                    <ul class="list-unstyled">
                        <?php if ($shop_phone): ?>
                        <li class="mb-2"><strong>โทร:</strong> <?php echo htmlspecialchars($shop_phone); ?></li>
                        <?php endif; ?>
                        <?php if ($shop_line): ?>
                        <li class="mb-2"><strong>LINE:</strong> <?php echo htmlspecialchars($shop_line); ?></li>
                        <?php endif; ?>
                        <li class="mb-2">
                            <a href="https://m.me/ChinKornMakeUp" target="_blank" class="btn btn-gold">
                                Messenger
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            
            <?php if ($prompay['prompay_number']): ?>
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 20px;">
                <div class="card-body p-4">
                    <h4 class="fw-bold mb-3 font-elegant" style="color: var(--gold-dark);">ชำระเงินผ่าน Prompay</h4>
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <p class="mb-1">เลขที่บัญชี: <strong><?php echo htmlspecialchars($prompay['prompay_number']); ?></strong></p>
                            <p class="mb-0">ชื่อบัญชี: <strong><?php echo htmlspecialchars($prompay['prompay_name']); ?></strong></p>
                        </div>
                        <?php if ($prompay['prompay_image']): ?>
                        <div class="col-md-6 text-center">
                            <img src="../assets/uploads/<?php echo $prompay['prompay_image']; ?>" class="img-fluid" style="max-width: 150px; border-radius: 12px;">
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <div class="text-center">
                <a href="products.php" class="btn btn-gold btn-lg">เลือกชุดและสินค้า</a>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>