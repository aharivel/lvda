

// IMMEDIATE TEST - This should show before jQuery loads
console.log('🚀 APP.JS: File parsed successfully!');
console.log('🚀 APP.JS: Environment URL:', window.location.href);
console.log('🚀 APP.JS: Current time:', new Date().toISOString());

// VISUAL CONFIRMATION - Remove this after testing
alert('🟣 APP.JS EXECUTING: Our code inside app.js is running! Environment: ' + window.location.protocol + '//' + window.location.host);

// Test if there's an error before document ready
try {
    console.log('🟣 APP.JS: About to set up document ready...');
} catch (e) {
    console.error('🟣 APP.JS: Error before document ready:', e);
    alert('🟣 APP.JS ERROR: ' + e.message);
}

try {
    console.log('🟣 APP.JS: Attempting to call jQuery document ready...');
    
    $(document).ready(function () {
        // JQUERY READY TEST
        console.log('✅ JQUERY READY FIRED from app.js!');
        console.log('✅ jQuery version from app.js:', $.fn.jquery);
        alert('🟣 JQUERY READY: Document ready fired successfully in app.js!');
        
        try {
    
    // Navbar Debug Function
    function debugNavbar() {
        console.log('🔍 NAVBAR DEBUG ANALYSIS');
        console.log('========================');
        
        const navbar = document.querySelector('.navbar');
        const navbarBrand = document.querySelector('.navbar-brand');
        const navbarBrandImg = document.querySelector('.navbar-brand img');
        const navLinks = document.querySelectorAll('.navbar .navbar-nav .nav-link');
        
        if (navbar) {
            console.log('📏 NAVBAR CONTAINER:');
            console.log('  Width:', navbar.offsetWidth + 'px');
            console.log('  Height:', navbar.offsetHeight + 'px');
            console.log('  Display:', window.getComputedStyle(navbar).display);
            console.log('  Position:', window.getComputedStyle(navbar).position);
        }
        
        if (navbarBrand) {
            console.log('🏷️ NAVBAR BRAND:');
            console.log('  Width:', navbarBrand.offsetWidth + 'px');
            console.log('  Height:', navbarBrand.offsetHeight + 'px');
            console.log('  Font Size:', window.getComputedStyle(navbarBrand).fontSize);
            console.log('  Font Weight:', window.getComputedStyle(navbarBrand).fontWeight);
        }
        
        if (navbarBrandImg) {
            console.log('🖼️ NAVBAR LOGO:');
            console.log('  Width:', navbarBrandImg.offsetWidth + 'px');
            console.log('  Height:', navbarBrandImg.offsetHeight + 'px');
            console.log('  Natural Width:', navbarBrandImg.naturalWidth + 'px');
            console.log('  Natural Height:', navbarBrandImg.naturalHeight + 'px');
            console.log('  CSS Width:', window.getComputedStyle(navbarBrandImg).width);
            console.log('  CSS Height:', window.getComputedStyle(navbarBrandImg).height);
            console.log('  Display:', window.getComputedStyle(navbarBrandImg).display);
            console.log('  Max Width:', window.getComputedStyle(navbarBrandImg).maxWidth);
            console.log('  Visibility:', window.getComputedStyle(navbarBrandImg).visibility);
            console.log('  Opacity:', window.getComputedStyle(navbarBrandImg).opacity);
        }
        
        console.log('🔗 NAV LINKS (' + navLinks.length + ' found):');
        navLinks.forEach((link, index) => {
            const computedStyle = window.getComputedStyle(link);
            console.log('  Link ' + (index + 1) + ' (' + link.textContent.trim() + '):');
            console.log('    Font Size:', computedStyle.fontSize);
            console.log('    Font Weight:', computedStyle.fontWeight);
            console.log('    Font Family:', computedStyle.fontFamily);
            console.log('    Padding Left:', computedStyle.paddingLeft);
            console.log('    Padding Right:', computedStyle.paddingRight);
            console.log('    Color:', computedStyle.color);
            console.log('    Display:', computedStyle.display);
        });
        
        console.log('📱 VIEWPORT INFO:');
        console.log('  Window Width:', window.innerWidth + 'px');
        console.log('  Window Height:', window.innerHeight + 'px');
        console.log('  Document Width:', document.documentElement.offsetWidth + 'px');
        console.log('  User Agent:', navigator.userAgent);
        
        console.log('🎨 ACTIVE CSS RULES:');
        const navLinkStyle = window.getComputedStyle(document.querySelector('.navbar .navbar-nav .nav-link'));
        console.log('  Main nav-link font-size:', navLinkStyle.fontSize);
        console.log('  Main nav-link computed font-family:', navLinkStyle.fontFamily);
        
        // Check for CSS variables
        const rootStyles = window.getComputedStyle(document.documentElement);
        console.log('🔧 CSS VARIABLES:');
        console.log('  --font-base:', rootStyles.getPropertyValue('--font-base') || 'not defined');
        console.log('  --font-sm:', rootStyles.getPropertyValue('--font-sm') || 'not defined');
        console.log('  --font-md:', rootStyles.getPropertyValue('--font-md') || 'not defined');
        
        // Environment detection
        console.log('🌍 ENVIRONMENT:');
        console.log('  Protocol:', window.location.protocol);
        console.log('  Host:', window.location.host);
        console.log('  URL:', window.location.href);
        
        console.log('========================');
    }
    
    // Run debug immediately
    debugNavbar();
    
    // Run debug again after window resize to see responsive changes
    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            console.log('🔄 RESIZE EVENT - Running navbar debug...');
            debugNavbar();
        }, 300);
    });
    
    // Run debug when fonts are loaded
    if (document.fonts) {
        document.fonts.ready.then(function() {
            console.log('✅ FONTS LOADED - Running navbar debug...');
            setTimeout(debugNavbar, 100);
        });
    }

    //Owl
    $('.hero-slider').owlCarousel({
        loop: true,
        margin: 0,
        items: 1,
        dots: false,
        navText: ["<i class='bx bxs-chevron-left bx-lg'></i>","<i class='bx bxs-chevron-right bx-lg'></i>"],
        smartSpeed: 1000,
        autoplay: false,
        autoplayTimeout: 7000,
        responsive: {
            0: {
                nav: false,
            },
            768: {
                nav: true,
            }
        }
    })

    $('#projects-slider').owlCarousel({
        loop: true,
        nav: false,
        items: 2,
        dots: true,
        smartSpeed: 600,
        center: true,
        autoplay: true,
        autoplayTimeout: 4000,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2,
                margin: 8,
            }
        }
    })

    $('.reviews-slider').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        smartSpeed: 900,
        items: 1,
        margin: 24,
        autoplay: true,
        autoplayTimeout: 7000,
    })

    // Smooth scrolling for navigation links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    // Load CAPTCHA on page load
    let captchaAnswer = null;
    
    function loadCaptcha() {
        $.get('/api/captcha', function(data) {
            $('#captchaQuestion').text(data.question);
            captchaAnswer = data.answer;
        }).fail(function() {
            $('#captchaQuestion').text('7 + 3 = ?');
            captchaAnswer = 10; // Fallback
        });
    }
    
    // Load CAPTCHA when page loads
    loadCaptcha();
    
    // Contact form handler
    $('#contactForm').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const $btnText = $submitBtn.find('.btn-text');
        const $spinner = $submitBtn.find('.spinner-border');
        const $result = $('#result');
        
        // Get form data
        const formData = {
            name: $('#name').val().trim(),
            email: $('#email').val().trim(),
            message: $('#message').val().trim(),
            captcha: $('#captcha').val(),
            captchaAnswer: captchaAnswer
        };
        
        // Client-side validation
        if (!formData.name || !formData.email || !formData.message || !formData.captcha) {
            $result.html('<div class="alert alert-danger">Veuillez remplir tous les champs obligatoires.</div>');
            return;
        }
        
        if (formData.name.length < 2 || formData.name.length > 100) {
            $result.html('<div class="alert alert-danger">Le nom doit contenir entre 2 et 100 caractères.</div>');
            return;
        }
        
        if (formData.message.length < 10 || formData.message.length > 1000) {
            $result.html('<div class="alert alert-danger">Le message doit contenir entre 10 et 1000 caractères.</div>');
            return;
        }
        
        // Show loading state
        $submitBtn.prop('disabled', true);
        $btnText.text('Envoi en cours...');
        $spinner.removeClass('d-none');
        $result.empty();
        
        // Send to backend
        $.ajax({
            type: 'POST',
            url: '/api/contact',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                $result.html('<div class="alert alert-success"><strong>Succès!</strong> ' + response.message + '</div>');
                $form[0].reset();
                loadCaptcha(); // Reload CAPTCHA
            },
            error: function(xhr) {
                let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
                
                if (xhr.status === 429) {
                    errorMessage = 'Trop de requêtes. Veuillez attendre 15 minutes avant de réessayer.';
                } else if (xhr.status === 400) {
                    const response = xhr.responseJSON;
                    if (response && response.error) {
                        if (response.error.includes('CAPTCHA')) {
                            errorMessage = 'Vérification échouée. Veuillez résoudre correctement l\'addition.';
                        } else {
                            errorMessage = response.error;
                        }
                    }
                }
                
                $result.html('<div class="alert alert-danger"><strong>Erreur:</strong> ' + errorMessage + '</div>');
                loadCaptcha(); // Reload CAPTCHA on error
            },
            complete: function() {
                // Reset button state
                $submitBtn.prop('disabled', false);
                $btnText.text('Envoyer');
                $spinner.addClass('d-none');
            }
        });
        
        } catch (innerError) {
            console.error('🟣 APP.JS: Error inside document ready:', innerError);
            alert('🟣 INNER ERROR: ' + innerError.message);
        }
    });
    
} catch (outerError) {
    console.error('🟣 APP.JS: Error setting up document ready:', outerError);
    alert('🟣 OUTER ERROR: ' + outerError.message);
}
