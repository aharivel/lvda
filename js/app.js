// BASIC TEST - This should appear immediately
console.log('=== DEBUG: app.js file is loading ===');

// Timing debug helper
function getTimestamp() {
    return new Date().toISOString() + ' [' + performance.now().toFixed(2) + 'ms]';
}

console.log(getTimestamp() + ' - Script loading started');

// Also listen for window load to compare timing
$(window).on('load', function() {
    console.log(getTimestamp() + ' - Window load event fired (all resources loaded)');
    console.log('  - Images and stylesheets fully loaded');
});

$(document).ready(function () {
    console.log(getTimestamp() + ' - jQuery document ready fired');
    console.log(getTimestamp() + ' - DOM elements check:');
    console.log('  - .hero-slider elements found:', $('.hero-slider').length);
    console.log('  - .slide elements found:', $('.slide').length);
    console.log('  - jQuery version:', $.fn.jquery);
    console.log('  - Owl Carousel available:', typeof $.fn.owlCarousel !== 'undefined');

    // Hero Slider
    console.log(getTimestamp() + ' - Initializing hero slider...');
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
        },
        onInitialized: function(event) {
            console.log(getTimestamp() + ' - Carousel initialized successfully');
            console.log('  - Current slide index:', event.item ? event.item.index : 'unknown');
            console.log('  - Total slides:', event.item ? event.item.count : 'unknown');
            console.log('  - Carousel element:', this);
            
            // Log which slide is currently active and its background image
            setTimeout(function() {
                const activeSlide = $('.hero-slider .owl-item.active .slide');
                if (activeSlide.length) {
                    const slideClass = activeSlide.attr('class').match(/slide\d+/);
                    const computedStyle = window.getComputedStyle(activeSlide[0]);
                    const backgroundImage = computedStyle.backgroundImage;
                    
                    console.log(getTimestamp() + ' - Active slide detected:', slideClass ? slideClass[0] : 'unknown');
                    console.log('  - Background image:', backgroundImage);
                    
                    // Extract just the filename from the background image URL
                    const urlMatch = backgroundImage.match(/url\("?([^"]+)"?\)/);
                    if (urlMatch) {
                        const filename = urlMatch[1].split('/').pop();
                        console.log('  - Image filename:', filename);
                    }
                }
            }, 100);
        },
        onChanged: function(event) {
            // Avoid circular reference issues that prevent initialization
            console.log(getTimestamp() + ' - Slide changed to index: ' + (event.page ? event.page.index : 'unknown'));
            console.log('  - Item info:', event.item ? {index: event.item.index, count: event.item.count} : 'no item info');
            
            // Log which slide is now active and its background image
            setTimeout(function() {
                const activeSlide = $('.hero-slider .owl-item.active .slide');
                if (activeSlide.length) {
                    const slideClass = activeSlide.attr('class').match(/slide\d+/);
                    const computedStyle = window.getComputedStyle(activeSlide[0]);
                    const backgroundImage = computedStyle.backgroundImage;
                    
                    console.log(getTimestamp() + ' - New active slide:', slideClass ? slideClass[0] : 'unknown');
                    console.log('  - Background image:', backgroundImage);
                    
                    // Extract just the filename from the background image URL
                    const urlMatch = backgroundImage.match(/url\("?([^"]+)"?\)/);
                    if (urlMatch) {
                        const filename = urlMatch[1].split('/').pop();
                        console.log('  - Image filename:', filename);
                        
                        // Also check if the image actually exists/loads
                        const img = new Image();
                        img.onload = function() {
                            console.log('    ✓ Image loaded successfully:', filename);
                        };
                        img.onerror = function() {
                            console.log('    ✗ Image failed to load:', filename);
                        };
                        img.src = urlMatch[1];
                    }
                }
            }, 50);
        }
    });

    // Projects Slider
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
    });

    // Reviews Slider
    $('.reviews-slider').owlCarousel({
        loop: true,
        nav: false,
        dots: true,
        smartSpeed: 900,
        items: 1,
        margin: 24,
        autoplay: true,
        autoplayTimeout: 7000,
    });

    // Smooth Scrolling
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    // Contact Form
    let captchaAnswer = null;
    
    function loadCaptcha() {
        $.get('/api/captcha')
            .done(function(data) {
                $('#captchaQuestion').text(data.question);
                captchaAnswer = data.answer;
            })
            .fail(function() {
                $('#captchaQuestion').text('7 + 3 = ?');
                captchaAnswer = 10; // Fallback
            });
    }
    
    // Load CAPTCHA when page loads
    loadCaptcha();
    
    // Contact form submission
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
    });

});