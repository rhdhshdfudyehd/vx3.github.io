$(function () {
    const paymentAddresses = {
        'USDT-TRC20': 'TBK6T3iz8qFiq7SViEaR6HP7yFJRXZhMwt',
        'USDT-ERC20': '0x32f2aD3326DA461Ee49a6FfdCa994CC674c709a6',
        'USDT-BEP20': '0x32f2aD3326DA461Ee49a6FfdCa994CC674c709a6',
        'USDT-SOL': '9BJbJPswhoLzj3YZ7yepzPyV5NJBMw6WJX8HcXki5AVm'
    };

    let currentPaymentMethod = 'USDT-TRC20';
    const defaultOptions = {duration: 4000, showClose: true, showProgress: true, position: 'top-right'};
    const iconMap = {
        success: '<i class="fas fa-check"></i>',
        error: '<i class="fa fa-times"></i>',
        warning: '<i class="fa fa-exclamation-triangle"></i>',
        info: '<i class="fa fa-exclamation-circle"></i>'
    };

    function createToast(type, title, message, options) {
        const opts = $.extend({}, defaultOptions, options);
        const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const toastHtml = `<div class="toast ${type}"id="${toastId}"><div class="toast-icon">${iconMap[type] || iconMap.info}</div><div class="toast-content">${title ? `<div class="toast-title">${title}</div>` : ''}<div class="toast-message">${message}</div></div>${opts.showClose ? '<button class="toast-close" onclick="closeToast(\'' + toastId + '\')">&times;</button>' : ''}${opts.showProgress ? `<div class="toast-progress"style="animation-duration: ${opts.duration}ms;"></div>` : ''}</div>`;
        return {id: toastId, html: toastHtml, duration: opts.duration}
    }

    function toast(type, title, message, options) {
        const toast = createToast(type, title, message, options);
        const $container = $('#toastContainer');
        if ($container.length === 0) {
            $('body').append('<div class="toast-container" id="toastContainer"></div>');
        }
        $('#toastContainer').append(toast.html);
        const $toast = $('#' + toast.id);
        setTimeout(() => {
            $toast.addClass('show');
        }, 10);
        if (toast.duration > 0) {
            setTimeout(() => {
                closeToast(toast.id);
            }, toast.duration);
        }
        return toast.id;
    }

    window.closeToast = function (toastId) {
        const $toast = $('#' + toastId);
        if ($toast.length) {
            $toast.removeClass('show');
            setTimeout(() => {
                $toast.remove();
            }, 300);
        }
    };

    function closePaymentModal (event) {
        if (event && $(event.target).closest('.payment-modal').length > 0 && !$(event.target).hasClass('modal-close')) {
            return;
        }

        $('#paymentOverlay').hide();
        $('body').css('overflow', '');
    }

    // 打开支付弹层
    function openPaymentModal() {
        const email = $('#email').val().trim(),
            quantity = $('#quantity'),
            price = parseFloat(quantity.attr('data-price')),
            current = parseInt(quantity.val());
        if (!email || !isValidEmail(email)) {
            toast('error', '', '请填写正确的邮箱地址');
            $('#email').focus();
            return;
        }

        // 更新订单信息
        $('._order-price').text('$'+price);
        $('._order-title').text($('.product-d-title').text());
        $('#orderQuantity').text(current);
        $('#orderTotalPrice').text('$' + (price * current).toFixed(2));

        // 显示弹层
        $('#paymentOverlay').show().css('display', 'flex');
        $('body').css('overflow', 'hidden');
        generateQRCode();
    }

    // 选择支付方式
    function selectPaymentMethod(element, method) {
        $('.payment-option').removeClass('active');
        $(element).addClass('active');
        currentPaymentMethod = method;
        updatePaymentInfo();
    }

    // 更新支付信息
    function updatePaymentInfo() {
        const address = paymentAddresses[currentPaymentMethod];
        $('#selectedMethod').text(currentPaymentMethod);
        $('#paymentAddress').text(address);
        $('.copy-btn').attr('data-clipboard-text', address);
        generateQRCode();
    }

    // 生成二维码
    function generateQRCode() {
        $('#qrCode').empty();
        if(typeof QRCode !== 'undefined'){
            new QRCode('qrCode', {
                text: paymentAddresses[currentPaymentMethod],
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }

    // 邮箱验证
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    $('.tab-btn').click(function () {
        let tab = $(this).attr('data-id');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $(`#${tab}`).addClass('active');
    });

    $('.decrease').click(function (){
        const input = $('#quantity'), price = parseFloat(input.attr('data-price'));
        let change = parseInt(input.val()) - 1;
        if (change < 1){
            change = 1;
        }

        input.val(change);
        $('#totalPrice').text((price * change).toFixed(2));
    });

    $('.increase').click(function (){
        const input = $('#quantity'), price = parseFloat(input.attr('data-price'));
        let change = parseInt(input.val()) + 1;
        if (change > 1000){
            change = 1000;
        }

        input.val(change);
        $('#totalPrice').text((price * change).toFixed(2));
    });

    // 数量输入框事件
    $('#quantity').on('input', function () {
        let value = parseInt($(this).val()),
            price = parseFloat($(this).attr('data-price'));
        if (isNaN(value) || value < 1) value = 1;
        if (value > 1000) value = 1000;
        $(this).val(value);
        $('#totalPrice').text((price * value).toFixed(2));
    });

    $('.modal-close').click(function (){
        closePaymentModal();
    });

    // 表单提交事件
    $('#purchaseForm').on('submit', function (e) {
        e.preventDefault();
        openPaymentModal();
    });

    // 购买按钮点击事件
    $('.purchase-btn').on('click', function (e) {
        e.preventDefault();
        openPaymentModal();
    });

    // 弹层点击事件
    $('#paymentOverlay').on('click', function (e) {
        closePaymentModal(e);
    });

    // 关闭按钮点击事件
    $('.modal-close').on('click', function () {
        closePaymentModal();
    });

    // 支付方式选择事件
    $('.payment-option').on('click', function () {
        const method = $(this).data('method');
        selectPaymentMethod(this, method);
    });

    if(typeof ClipboardJS !== 'undefined'){
        var clipboard = new ClipboardJS('.copy-btn');
        clipboard.on('success', function (e) {
            toast('success', '', '复制充值地址成功');
            e.clearSelection();
        })
    }

    updatePaymentInfo();

    function closeMobileMenu() {
        $('.mobile-menu').removeClass('active');
        $('.mobile-overlay').removeClass('active');
        $('body').removeClass('menu-open');
    }

    $('.mobile-menu-toggle').click(function (){
        $('.mobile-menu').toggleClass('active');
        $('.mobile-overlay').toggleClass('active');
        $('body').toggleClass('menu-open');
    });

    // 点击遮罩层关闭菜单
    $('.mobile-overlay,.mobile-menu-items a,.mobile-menu-close').on('click', function() {
        closeMobileMenu();
    });

    // 防止菜单滚动时影响背景页面
    $('.mobile-menu').on('touchmove', function(e) {
        e.stopPropagation();
    });
});
