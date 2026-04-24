<?php 
$pageTitle = 'สินค้าทั้งหมด';
include '../config/db.php';
include '../includes/functions.php';

$type = isset($_GET['type']) ? $_GET['type'] : null;
$products = getProducts($type);
?>
<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="fw-bold mb-4" style="color: var(--primary-dark);"><?php echo $pageTitle; ?></h1>
    
    <div class="d-flex flex-wrap gap-3 mb-4">
        <a href="products.php" class="category-btn <?php echo !$type ? 'active' : ''; ?>">
            ทั้งหมด
        </a>
        <a href="products.php?type=rent" class="category-btn <?php echo $type === 'rent' ? 'active' : ''; ?>">
            จองชุดแต่งงาน
        </a>
        <a href="products.php?type=sale" class="category-btn <?php echo $type === 'sale' ? 'active' : ''; ?>">
            ซื้อสินค้า
        </a>
    </div>
    
    <?php if (empty($products)): ?>
    <div class="text-center py-5">
        <p class="text-muted">ยังไม่มีสินค้า</p>
    </div>
    <?php else: ?>
    <div class="row g-4">
        <?php foreach ($products as $p): ?>
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm" style="border-radius: 16px; overflow: hidden;">
                <a href="product_detail.php?id=<?php echo $p['id']; ?>">
                    <img src="<?php echo $p['image'] ? '../assets/uploads/products/' . $p['image'] : 'https://placehold.co/400x300/F8C8DC/E8A0C0?text=' . urlencode($p['name']); ?>" 
                         class="w-100" style="height: 250px; object-fit: cover;">
                </a>
                <div class="card-body">
                    <span class="badge mb-2" style="background: <?php echo $p['type']==='rent'?'#F8C8DC':'#E8A0C0'; ?>; color: #333;">
                        <?php echo $p['type']==='rent'?'จองชุด':'ซื้อ'; ?>
                    </span>
                    <h5 class="fw-bold mb-1"><?php echo $p['name']; ?></h5>
                    <p class="mb-2" style="color: var(--primary-dark); font-weight: 700;">฿ <?php echo number_format($p['price']); ?></p>
                    <a href="product_detail.php?id=<?php echo $p['id']; ?>" class="btn btn-outline-pink w-100">
                        ดูรายละเอียด
                    </a>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>