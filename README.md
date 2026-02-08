# Velox - Complete Flight Booking Website

A comprehensive, modern flight booking platform inspired by AwardHacker with a sleek dark theme design.

## 📁 File Structure

```
velox-website/
├── index.html          # Landing page with hero section and search
├── search.html         # Search results with filters and flight listings
├── dashboard.html      # User dashboard with booking management
├── styles.css          # Global styles and components
├── script.js           # Interactive functionality
└── README.md          # This file
```

## 🎨 Pages Overview

### 1. **index.html** - Landing Page
- Hero section with animated background
- Smart search widget (Round Trip, One Way, Multi-City)
- Features section highlighting platform benefits
- Popular routes showcase
- Call-to-action section
- Responsive footer with navigation

**Features:**
- Flight search form with origin/destination
- Date picker for departure/return
- Passenger and class selection
- Tab switching between trip types
- Airport code swap functionality

### 2. **search.html** - Search Results
- Header with modifiable search parameters
- Sidebar with comprehensive filters:
  - Price range slider
  - Number of stops
  - Airlines selection
  - Departure time ranges
  - Cabin class options
- Flight results grid with:
  - Airline information
  - Route visualization with timeline
  - Price display
  - Flight details (legroom, amenities, meals)
  - Select flight button

**Features:**
- Filter by multiple criteria
- Sort by price, duration, time
- Interactive checkboxes
- Real-time result filtering
- Click to view flight details

### 3. **dashboard.html** - User Dashboard
- Interactive world map showing flight route
- Real-time flight tracking
- Seat selection interface
- Upcoming flights list
- Hot propositions/deals
- Distance and arrival information
- Currently flying status indicator

**Features:**
- Visual seat map with selection
- Animated flight path on world map
- Pulsing markers for departure/arrival
- Flight progress tracking
- Multi-passenger booking support

## 🎯 Key Features

### Design System
- **Color Palette:**
  - Primary Background: #0a0f1e (Deep Navy)
  - Secondary Background: #1a2332
  - Accent Green: #c5ff68 (Lime)
  - Accent Blue: #4a9cff
  - Text Primary: #ffffff
  - Text Secondary: #8a99b3

- **Typography:**
  - Font Family: 'Outfit' (Google Fonts)
  - Weights: 300-800
  - Modern, geometric sans-serif

- **Components:**
  - Rounded corners (border-radius: 12-30px)
  - Glass morphism effects
  - Smooth transitions and animations
  - Hover states with transform effects
  - Gradient buttons and accents

### Responsive Design
- Mobile-first approach
- Breakpoints: 600px, 900px, 1200px
- Grid layouts adapt to screen size
- Touch-friendly interactive elements
- Collapsible navigation on mobile

### Animations
- Slide-down header on load
- Fade-in-up content sections
- Smooth page transitions
- Hover effects on all interactive elements
- Animated world map with flying plane
- Pulsing markers and glowing paths
- Loading skeletons for async content

## 🚀 Interactive Features

### JavaScript Functionality
1. **Tab Switching** - Toggle between trip types
2. **Airport Swap** - Exchange origin and destination
3. **Filter System** - Real-time checkbox filtering
4. **Form Validation** - Input validation before search
5. **Price Tracking** - Save favorite routes (localStorage)
6. **Recent Searches** - Store search history
7. **Toast Notifications** - User feedback messages
8. **Smooth Scrolling** - Anchor link navigation
9. **Mobile Menu** - Responsive navigation toggle
10. **Seat Selection** - Interactive plane cabin

### User Experience
- Persistent search parameters across pages
- Smart defaults (today's date, popular routes)
- Visual feedback on all interactions
- Clear call-to-action buttons
- Intuitive navigation flow
- Accessibility considerations

## 📱 Responsive Behavior

### Desktop (1200px+)
- Full 3-column layout on dashboard
- Sidebar filters visible
- Expanded navigation menu
- Large hero text and imagery

### Tablet (900-1200px)
- 2-column layouts
- Stacked dashboard sections
- Visible filters with toggle option

### Mobile (<900px)
- Single column layouts
- Hamburger menu navigation
- Stacked form inputs
- Full-width buttons
- Touch-optimized controls

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --bg-primary: #0a0f1e;
    --accent-green: #c5ff68;
    --accent-blue: #4a9cff;
    /* ... */
}
```

### Fonts
Change in HTML head and CSS:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap">
```

### Animation Speed
Modify transition durations in CSS:
```css
transition: all 0.3s ease; /* Change 0.3s */
```

## 🔧 Future Enhancements

Potential features to add:
- [ ] User authentication system
- [ ] Payment integration
- [ ] Email notifications
- [ ] Price alerts
- [ ] Travel insurance options
- [ ] Multi-currency support
- [ ] Rewards program integration
- [ ] Social sharing
- [ ] Chat support
- [ ] Mobile app version
- [ ] API integration with real flight data
- [ ] Advanced search filters (aircraft type, amenities)
- [ ] Calendar view for flexible dates
- [ ] Map view for destination exploration
- [ ] Reviews and ratings
- [ ] Travel guides and tips

## 📄 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

## 🎯 Performance

- Optimized CSS with minimal specificity
- Efficient JavaScript with event delegation
- Lazy loading for images
- Minimal external dependencies
- Fast page load times
- Smooth 60fps animations

## 📝 Notes

- All airline logos are placeholder emojis
- Flight data is currently static (demo purposes)
- World map uses simplified SVG paths
- LocalStorage used for client-side persistence
- No backend required for demo

## 🌟 Credits

Inspired by:
- AwardHacker.com functionality
- Modern dark theme UI trends
- Aviation industry best practices

Built with pure HTML, CSS, and JavaScript - no frameworks required!

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**License:** MIT
