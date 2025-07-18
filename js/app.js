

$(document).ready(function () {
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
    });
});
