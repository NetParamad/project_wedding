# Wedding Shop - ระบบจองชุดแต่งงาน + ขายสินค้า

## การติดตั้ง

### 1. สร้าง Database

เปิด MySQL (XAMPP/MAMP) แล้ว import ไฟล์ `config/database.sql` หรือรัน SQL ด้านล่าง:

```sql
CREATE DATABASE IF NOT EXISTS wedding_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wedding_shop;

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings (setting_key, value) VALUES 
('prompay_number', ''),
('prompay_name', ''),
('prompay_image', ''),
('shop_name', 'ChinKorn Make Up'),
('shop_phone', ''),
('shop_line', '');

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@wedding.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug) VALUES 
('ชุดเจ้าสาว', 'bride-dress'),
('ชุดราตรี', 'evening-dress'),
('ชุดไทย', 'thai-dress'),
('ชุดเจ้าบ่าว', 'groom-dress'),
('เครื่องประดับ', 'accessories'),
('อื่นๆ', 'others');

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    type ENUM('sale', 'rent') NOT NULL,
    image VARCHAR(255),
    stock INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT,
    category_id INT,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'pending_payment', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_slip VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 2. แก้ไขการเชื่อมต่อ Database

แก้ไข `config/db.php`:
```php
$pass = '1234'; // เปลี่ยนเป็นรหัสผ่าน MySQL ของคุณ
```

### 3. รันโปรเจค

เปิด Browser ไปที่: `http://localhost/project_wedding/`

### 4. Login Admin

- URL: `http://localhost/project_wedding/pages/login.php`
- Email: `admin@wedding.com`
- Password: `admin123`

## การใช้งาน

### ระบบจองชุด (ไม่ Login)
1. เลือกสินค้าประเภท "จอง"
2. เลือกวันที่ → ระบบเช็ควันว่าง (max 3 ที่/วัน)
3. แสดง QR Code Prompay
4. กด "ส่งไป Messenger" → ไปหา `https://m.me/ChinKornMakeUp?ref=product_X`

### ระบบขายสินค้า (ไม่ Login)
1. เลือกสินค้าประเภท "ขาย"
2. แสดง QR Code Prompay
3. กด "ส่งไป Messenger"

### ระบบขายสินค้า (Login)
1. Login ก่อน
2. เพิ่มสินค้าลงตะกร้า
3. Checkout → อัปโหลดสลิป
4. Admin อนุมัติ/ปฏิเสธ

## ไฟล์ในโปรเจค

```
project_wedding/
├── config/
│   ├── db.php          # เชื่อมต่อ database
│   └── database.sql   # SQL สร้าง tables
├── includes/
│   ├── functions.php # ฟังก์ชันร่วม
│   ├── header.php    # HTML header
│   ├── footer.php   # HTML footer
│   └── navbar.php   # เมนูนำทาง
├── pages/
│   ├── index.php          # หน้าหลัก
│   ├── products.php      # รายการสินค้า
│   ├── product_detail.php # รายละเอียดสินค้า
│   ├── cart.php          # ตะกร้า
│   ├── checkout.php      # ชำระเงิน
│   ├── login.php        # เข้าสู่ระบบ
│   ├── logout.php       # ออกจากระบบ
│   ├── history.php     # ประวัติการสั่งซื้อ
│   └── check_date.php  # API เช็ควันว่าง
├── admin/
│   ├── dashboard.php    # Dashboard
│   ├── products.php     # จัดการสินค้า
│   ├── categories.php  # จัดการหมวดหมู่
│   ├── orders.php      # จัดการคำสั่งซื้อ
│   └── settings.php   # ตั้งค่า Prompay
└── assets/
    ├── css/style.css   # CSS หลัก
    ├── js/main.js      # JavaScript
    └── uploads/       # อัปโหลดรูป
```

## ฟีเจอร์หลัก

- ✅ ระบบจองชุด (เช็ควันว่าง max 3 ที่/วัน)
- ✅ ระบบขายสินค้า (ไม่ login + login)
- ✅ Prompay + QR Code + Messenger
- ✅ Login/Register ด้วย bcrypt
- ✅ ตะกร้า + Checkout
- ✅ Admin Panel จัดการทุกอย่าง
- ✅ หมวดหมู่ (many-to-many)
- ✅ Bootstrap 5 + SweetAlert2 + Flatpickr
- ✅ Design: Pink #F8C8DC, Gold #D4AF37, Cream #FFF5E1