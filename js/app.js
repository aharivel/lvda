$(document).ready(function () {

    // Hero Slider
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
        autoplayTimeout: 16000,
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

    // Service Area Map
    if (document.getElementById('serviceMap')) {
        // Coordinates for La Voix des Animaux in Seltz, France
        const seltzCoords = [48.896119, 8.108433];
        
        // Initialize map centered on Seltz with wider view (Bas-Rhin département)
        const map = L.map('serviceMap').setView(seltzCoords, 9);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add marker for La Voix des Animaux
        const marker = L.marker(seltzCoords).addTo(map);
        marker.bindPopup('<b>La Voix des Animaux</b><br>Services animaliers<br>Seltz, France').openPopup();
        
        // Add service area circle FIRST (so it goes UNDER the mask)
        const serviceCircle = L.circle(seltzCoords, {
            color: '#2298A9',
            fillColor: '#2298A9',
            fillOpacity: 0.5,
            radius: 25000 // 25km in meters
        }).addTo(map);
        
        // Load France boundaries from Nominatim and create mask effect ON TOP
        fetch('https://nominatim.openstreetmap.org/search?country=france&polygon_geojson=1&format=json')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0 && data[0].geojson) {
                    const franceGeoJSON = data[0].geojson;
                    
                    // Create a world polygon with France as a hole (mask effect)
                    const worldBounds = [
                        // Outer world boundary
                        [[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]]
                    ];
                    
                    // Add France geometry as holes in the world polygon
                    if (franceGeoJSON.type === 'MultiPolygon') {
                        // France has multiple polygons (mainland + overseas)
                        franceGeoJSON.coordinates.forEach(polygon => {
                            // Add each polygon as a hole (reverse coordinates for hole)
                            const hole = polygon[0].map(coord => [coord[1], coord[0]]).reverse();
                            worldBounds.push(hole);
                        });
                    } else if (franceGeoJSON.type === 'Polygon') {
                        // Single polygon
                        const hole = franceGeoJSON.coordinates[0].map(coord => [coord[1], coord[0]]).reverse();
                        worldBounds.push(hole);
                    }
                    
                    // Create the mask layer (world minus France = SOLID WHITE) ON TOP
                    const worldMask = L.polygon(worldBounds, {
                        color: 'transparent',
                        fillColor: '#FFFFFF',
                        fillOpacity: 1.0,
                        stroke: false,
                        interactive: false
                    }).addTo(map);
                    
                    console.log('France boundaries loaded successfully from Nominatim');
                } else {
                    throw new Error('No France data found');
                }
            })
            .catch(error => {
                console.log('Could not load France boundaries from Nominatim, using fallback approach:', error);
                // Fallback: Simple Germany overlay
                const germanyArea = L.polygon([
                    [49.5, 8.1], [49.5, 9.0], [48.5, 9.0], [48.5, 8.1], [49.5, 8.1]
                ], {
                    color: 'transparent',
                    fillColor: '#FFFFFF',
                    fillOpacity: 1.0,
                    stroke: false
                }).addTo(map);
            });
        
        // Add legend
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'legend');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            div.innerHTML = `
                <div>
                    <span style="display: inline-block; width: 12px; height: 12px; background-color: #2298A9; border-radius: 50%; opacity: 0.7; margin-right: 5px;"></span>
                    <small>Zone de service (25km)</small>
                </div>
            `;
            return div;
        };
        legend.addTo(map);
    }

});