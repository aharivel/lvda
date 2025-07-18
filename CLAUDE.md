# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a French website for "La Voix des Animaux" (The Voice of Animals), a pet services business offering animal behavior, education, boarding, and pricing information. The site is built as a static HTML website using Bootstrap 5 and jQuery.

## Architecture

### Website Structure
- **Multi-page static site** with consistent navigation across all pages
- **Main pages**: index.html (homepage), comportement.html (behavior), education.html, pension.html (boarding), tarifs.html (pricing), contact.html
- **Shared components**: All pages use the same navbar, footer, and basic layout structure
- **French language**: All content is in French (`lang="fr"`)

### Frontend Framework
- **Bootstrap 5**: Primary CSS framework for responsive design
- **jQuery**: Used for DOM manipulation and carousel functionality
- **Owl Carousel**: For image/content sliders
- **Boxicons & LineIcons**: Icon libraries for UI elements

### File Organization
```
├── css/
│   ├── bootstrap.min.css (Bootstrap framework)
│   ├── owl.carousel.min.css (Carousel styles)
│   ├── style.css (Custom site styles)
├── js/
│   ├── app.js (Main application JavaScript)
│   ├── bootstrap.bundle.min.js (Bootstrap JavaScript)
│   ├── jquery.min.js (jQuery library)
│   ├── owl.carousel.min.js (Carousel functionality)
├── img/ (Images and logos)
├── vendor/ (Third-party libraries)
└── *.html (Individual page files)
```

### Styling System
- **CSS Custom Properties**: Uses CSS variables for consistent theming
  - `--brand: #64CADA` (primary brand color)
  - `--brand-dark: #2298A9` (darker brand variant)
  - `--comp: #935CC0` (complementary color)
- **Typography**: Frank Ruhl Libre font family as primary typeface
- **Responsive Design**: Bootstrap grid system with custom breakpoints

## Common Development Tasks

### Testing Changes
- **No build process**: Direct file editing - changes are immediately visible
- **Local development**: Open HTML files directly in browser or use a local server
- **Cross-browser testing**: Ensure compatibility across major browsers

### Adding New Pages
1. Copy structure from existing HTML file (e.g., `index.html`)
2. Update navbar active states and page-specific IDs
3. Maintain consistent head section with all required stylesheets
4. Follow the established Bootstrap component patterns

### Modifying Styles
- **Custom styles**: Edit `css/style.css` - do not modify Bootstrap or vendor CSS files
- **Color scheme**: Use existing CSS custom properties for consistency
- **Responsive**: Test changes across Bootstrap breakpoints (sm, md, lg, xl)

### JavaScript Functionality
- **Carousel configuration**: Modify settings in `js/app.js` using Owl Carousel API
- **Interactive elements**: Use jQuery for DOM manipulation following existing patterns
- **Bootstrap components**: Leverage Bootstrap's JavaScript components for modals, dropdowns, etc.

## File Conventions
- **HTML**: Use semantic HTML5 elements with French language attributes
- **CSS**: Follow existing naming conventions and maintain responsive design principles
- **Images**: Store in `img/` directory with descriptive filenames
- **Consistent navigation**: All pages should link to each other using relative paths

## Key Dependencies
- Bootstrap 5 (CSS framework)
- jQuery (JavaScript library)
- Owl Carousel (image/content carousel)
- Boxicons (icon library)
- LineIcons (additional icons)
- Google Fonts (Typography)

## Brand Guidelines
- **Logo**: Located at `img/new-logo.png` (244x180px)
- **Color palette**: Teal/cyan primary (#64CADA), purple accent (#935CC0)
- **Typography**: Frank Ruhl Libre for body text, maintain existing font weights
- **Language**: All content in French