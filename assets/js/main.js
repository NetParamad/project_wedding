// Main JavaScript for Wedding Shop

// Page Transition on Load
document.addEventListener('DOMContentLoaded', function() {
    // Show overlay then fade out
    const overlay = document.querySelector('.page-transition');
    if (overlay) {
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 100);
    }
    
    // Page Transition on Link Click
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external links, anchors, and special links
        if (href.startsWith('http') || href.startsWith('#') || 
            href.startsWith('javascript') || href.includes('mailto:') ||
            link.target === '_blank') {
            return;
        }
        
        link.addEventListener('click', function(e) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'page-transition active';
            document.body.appendChild(newOverlay);
        });
    });
});

// Scroll Reveal Animation
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    reveals.forEach(el => observer.observe(el));
}

// Initialize flatpickr with Thai locale
document.addEventListener('DOMContentLoaded', function() {
    if (typeof flatpickr !== 'undefined') {
        window.flatpickrLocal = flatpickr.l10ns.th;
    }
    initScrollReveal();
});

// SweetAlert2 helpers
function SwalAlert(type, title, text) {
    Swal.fire({
        icon: type,
        title: title,
        text: text,
        confirmButtonColor: '#D4AF37'
    });
}

function SwalConfirm(title, text, confirmText) {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#D4AF37',
        cancelButtonColor: '#999',
        confirmButtonText: confirmText || 'ตกลง',
        cancelButtonText: 'ยกเลิก'
    });
}

function showSuccess(text) {
    Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: text,
        confirmButtonColor: '#D4AF37'
    });
}

function showError(text) {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: text,
        confirmButtonColor: '#D4AF37'
    });
}

function showLoading() {
    Swal.fire({
        title: 'กำลังโหลด...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Image preview
function readURL(input, previewId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Add to cart
function addToCart(productId, quantity = 1) {
    fetch('pages/cart.php?action=add&id=' + productId + '&qty=' + quantity)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มในตะกร้าแล้ว',
                    text: data.message,
                    confirmButtonColor: '#D4AF37',
                    willClose: () => location.reload()
                });
            } else {
                showError(data.message);
            }
        });
}

// Check date availability via AJAX
function checkDateAvailability(productId, startDate, endDate, callback) {
    fetch('pages/check_date.php?product_id=' + productId + '&start=' + startDate + '&end=' + endDate)
        .then(res => res.json())
        .then(data => {
            callback(data);
        });
}

// Open Messenger with pre-filled message
function sendToMessenger(productId, productName, price) {
    const message = encodeURIComponent(`สวัสดีค่ะ สนใจ ${productName} ราคา ${price} บาท ต้องการชำระเงินค่ะ`);
    const ref = 'product_' + productId;
    const url = `https://m.me/ChinKornMakeUp?ref=${ref}&message=${message}`;
    window.open(url, '_blank');
}

// Booking flow (no login required)
function openBookingModal(productId, productName, productType) {
    if (productType === 'rent') {
        // Show booking modal for rental
        document.getElementById('bookingProductId').value = productId;
        document.getElementById('bookingProductName').textContent = productName;
        var modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    } else {
        // Show sale modal
        document.getElementById('saleProductId').value = productId;
        document.getElementById('saleProductName').textContent = productName;
        var modal = new bootstrap.Modal(document.getElementById('saleModal'));
        modal.show();
    }
}

// Initialize date picker for booking
function initBookingDatePicker(productId, disabledDates = []) {
    const fp = flatpickr("#bookingDateRange", {
        locale: 'th',
        mode: 'range',
        minDate: 'today',
        dateFormat: 'Y-m-d',
        disable: disabledDates,
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                checkAndShowAvailability(productId, selectedDates[0], selectedDates[1]);
            }
        }
    });
    return fp;
}

// Check and show availability
function checkAndShowAvailability(productId, startDate, endDate) {
    checkDateAvailability(productId, startDate, endDate, function(data) {
        if (data.available) {
            document.getElementById('availabilityStatus').innerHTML = '<span class="text-success">✓ วันที่คุณเลือกมีที่ว่าง</span>';
            document.getElementById('confirmBookingBtn').disabled = false;
            document.getElementById('totalPriceDisplay').textContent = data.total_price + ' บาท';
        } else {
            let msg = '<span class="text-danger">✗ ไม่มีที่ว่างในวันที่เลือก</span>';
            if (data.unavailable_dates && data.unavailable_dates.length > 0) {
                msg += '<br><small>วันที่ไม่ว่าง: ' + data.unavailable_dates.join(', ') + '</small>';
            }
            document.getElementById('availabilityStatus').innerHTML = msg;
            document.getElementById('confirmBookingBtn').disabled = true;
        }
    });
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);
}