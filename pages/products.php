<?php 
$pageTitle = 'สินค้าทั้งหมด';
include '../config/db.php';
include '../includes/functions.php';

$type = isset($_GET['type']) ? $_GET['type'] : null;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';
$products = getProducts($type, $search, $sort);
?>
<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="container py-5">
    <h1 class="fw-bold mb-4 font-elegant" style="color: var(--gold-dark);"><?php echo $pageTitle; ?></h1>
    
    <!-- Search & Filter Bar -->
    <div class="row g-3 mb-4">
        <div class="col-lg-6">
            <form method="GET" class="d-flex gap-2">
                <?php if ($type): ?>
                <input type="hidden" name="type" value="<?php echo htmlspecialchars($type); ?>">
                <?php endif; ?>
                <input type="text" name="search" class="form-control" placeholder="ค้นหาสินค้า..." value="<?php echo htmlspecialchars($search); ?>">
                <button type="submit" class="btn btn-gold">
                    <i class="bi bi-search"></i>
                </button>
            </form>
        </div>
        <div class="col-lg-3">
            <form method="GET" class="d-flex gap-2">
                <?php if ($type): ?>
                <input type="hidden" name="type" value="<?php echo htmlspecialchars($type); ?>">
                <?php endif; ?>
                <?php if ($search): ?>
                <input type="hidden" name="search" value="<?php echo htmlspecialchars($search); ?>">
                <?php endif; ?>
                <select name="sort" class="form-select form-control" onchange="this.form.submit()">
                    <option value="newest" <?php echo $sort === 'newest' ? 'selected' : ''; ?>>ใหม่ล่าสุด</option>
                    <option value="price_asc" <?php echo $sort === 'price_asc' ? 'selected' : ''; ?>>ราคา: ต่ำ - สูง</option>
                    <option value="price_desc" <?php echo $sort === 'price_desc' ? 'selected' : ''; ?>>ราคา: สูง - ต่ำ</option>
                    <option value="name" <?php echo $sort === 'name' ? 'selected' : ''; ?>>ชื่อ: ก - ฮ</option>
                </select>
            </form>
        </div>
    </div>
    
    <!-- Category Buttons -->
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
                    <img src="<?php echo $p['image'] ? '../assets/uploads/products/' . $p['image'] : 'https://placehold.co/400x300?text=No+Image'; ?>" 
                         class="w-100" style="height: 250px; object-fit: cover;">
                </a>
                <div class="card-body">
                    <span class="badge mb-2" style="background: <?php echo $p['type']==='rent'?'var(--champagne)':'var(--gold)'; ?>; color: <?php echo $p['type']==='rent'?'#333':'white'; ?>;">
                        <?php echo $p['type']==='rent'?'จองชุด':'ซื้อ'; ?>
                    </span>
                    <h5 class="fw-bold mb-1"><?php echo $p['name']; ?></h5>
                    <p class="mb-2" style="color: var(--gold-dark); font-weight: 700;">฿ <?php echo number_format($p['price']); ?></p>
                    <a href="product_detail.php?id=<?php echo $p['id']; ?>" class="btn btn-outline-gold w-100">
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