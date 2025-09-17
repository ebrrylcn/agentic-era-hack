# Tour Guidance App - Frontend

A modern, responsive tour guidance web application built with vanilla HTML, CSS, and JavaScript following Google Material Design principles. This app helps users plan and discover travel routes and destinations with an intuitive interface and intelligent chat assistant.

## 🌟 Features

### Planning & Discovery (Page 1)
- **Multi-step Form**: 6-step guided form with progress indicators
- **Real-time JSON Generation**: Live preview and export of form data
- **Smart Validation**: Real-time validation with helpful error messages
- **Auto-save**: Automatic form data persistence
- **Flexible Chat Panel**: Resizable chat assistant with context-aware responses

### Routes & Places Dashboard (Page 2)
- **Interactive Maps**: Google Maps integration with custom markers
- **Daily Itineraries**: Detailed day-by-day schedule with timing
- **Route Optimization**: Walking routes with time estimates
- **Place Details**: Rich information about attractions and restaurants
- **Export Functionality**: Download itinerary as text file

### Chat Assistant
- **Context-Aware**: Responses based on form data and current page
- **Flexible Layout**: Resizable panel (20%-75% width)
- **Quick Suggestions**: Smart suggestion chips
- **Conversation History**: Persistent chat storage
- **Multiple Modes**: Peek, standard, and focus modes

## 🎨 Design System

### Google Material Design
- **Typography**: Google Sans font family
- **Color Palette**: Official Google colors (Blue #4285F4, Green #34A853, etc.)
- **Components**: Material Design Web (MDC-Web) components
- **Elevation**: Proper shadow system (1dp-16dp)
- **Motion**: Material Design animation curves

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: 480px, 768px, 1024px
- **Flexible Layouts**: CSS Grid and Flexbox
- **Touch-friendly**: Proper touch targets and gestures

## 📁 Project Structure

```
frontend/
├── index.html              # Page 1 - Planning & Discovery
├── routes.html             # Page 2 - Routes & Places Dashboard
├── css/
│   ├── main.css           # Global styles and variables
│   ├── material.css       # Material Design customizations
│   ├── form.css           # Form-specific styles
│   ├── chat.css           # Chat panel styles
│   └── maps.css           # Maps page styles
├── js/
│   ├── main.js            # Main application logic
│   ├── form.js            # Form handling and validation
│   ├── chat.js            # Chat functionality
│   ├── maps.js            # Maps and routes logic
│   ├── storage.js         # LocalStorage utilities
│   └── utils.js           # Helper functions
└── assets/
    ├── icons/             # Material Design icons
    └── images/            # Application images
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 14+ and npm 6+ (recommended)
- Modern web browser (Chrome 60+, Firefox 60+, Safari 12+, Edge 79+)
- Google Maps API key (for map functionality)

### Quick Start with NPM (Recommended)

1. **Install and start**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Set up Google Maps API**:
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com)
   - Enable the Maps JavaScript API and Places API
   - The app automatically loads the API key from the `.env` file in the parent directory

3. **Open in browser**: The app will automatically open at `http://localhost:8000`

### Alternative Setup Methods

```bash
# Using the included Node.js server
npm run serve-node

# Using the included Python server
npm run serve-python
# or directly: python server.py

# Using Python 3 (basic)
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

### NPM Scripts
- **`npm start`** - Start development server with live reload
- **`npm run build`** - Build production files
- **`npm run lint`** - Check code quality
- **`npm run format`** - Format code with Prettier
- **`npm run validate`** - Run all checks

See [npm-setup.md](npm-setup.md) for detailed NPM configuration.

### Development Setup

For development, you can use any local server. The app works with plain HTML/CSS/JS, no build process required.

Optional build tools for optimization:
- **Vite**: For development server and building
- **Webpack**: For bundling and optimization
- **Parcel**: For zero-config building

## 🔧 Configuration

### Environment Variables (.env)
The app automatically loads configuration from a `.env` file in the parent directory. Your `.env` file should contain:

```bash
# Google Maps API Key (required for map functionality)
GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# Alternative format (also supported)
GOOGLE_API_KEY="your_google_maps_api_key_here"
```

### Local Development Server
For security reasons, browsers block direct file access. Use the included Python server to serve the files and access the .env file:

```bash
cd frontend
python server.py
```

The server will:
- Serve files from the frontend directory
- Allow access to the .env file from the parent directory
- Add CORS headers for development
- Show helpful error messages if the API key is missing

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### Form Data Structure
The app generates JSON data matching this schema:
```json
{
  "city": "string, required",
  "country": "string, required",
  "date": {
    "start_date": "string (dd.mm.yyyy)",
    "end_date": "string (dd.mm.yyyy)",
    "number_of_days": "integer"
  },
  "people": {
    "number_of_people": "integer",
    "people_details": "string or null"
  },
  "preferences": {
    "events": "array<string> or null",
    "cousines": "array<string> or null",
    "places": "array<string> or null",
    "budget_amount": "string",
    "currency": "string",
    "general_notes": "string or null"
  },
  "dislikes": {
    "events": "array<string> or null",
    "cousines": "array<string> or null",
    "places": "array<string> or null",
    "general_note": "string or null"
  },
  "hotel": {
    "hotel_type": "string or null",
    "location_preference": "string or null",
    "budget_per_night": "string",
    "amenities": "array<string> or null",
    "room_type": "string or null",
    "special_requests": "string or null"
  }
}
```

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: 60+ ✅
- **Firefox**: 60+ ✅
- **Safari**: 12+ ✅
- **Edge**: 79+ ✅

### Required Features
- CSS Grid and Flexbox
- ES6+ JavaScript features
- LocalStorage API
- Geolocation API (optional)
- Web APIs: Intersection Observer, Performance Observer

### Fallbacks
- Graceful degradation for unsupported features
- Polyfills for older browsers (if needed)
- Progressive enhancement approach

## 🎯 Key Features Detail

### Form Management
- **Multi-step Navigation**: Smooth transitions between form steps
- **Real-time Validation**: Instant feedback on form inputs
- **Auto-save**: Form data saved every 30 seconds
- **JSON Preview**: Live preview with syntax highlighting
- **Export Options**: Copy to clipboard or download as file

### Chat System
- **Flexible Sizing**: Drag-to-resize functionality
- **Context Awareness**: Responses based on form data
- **Quick Actions**: Suggestion chips for common questions
- **Persistent History**: Conversation saved in localStorage
- **Export Chat**: Download conversation history

### Maps Integration
- **Interactive Maps**: Google Maps with custom styling
- **Custom Markers**: Different icons for different place types
- **Route Planning**: Walking directions between locations
- **Place Details**: Rich information modals
- **Multiple Views**: Roadmap, satellite, hybrid, terrain

### Responsive Behavior
- **Mobile**: Full-screen layouts with overlay panels
- **Tablet**: Maintained split-screen layouts
- **Desktop**: Full split-screen with resizable panels

## 🔐 Data & Privacy

### Local Storage
- Form data stored locally in browser
- Chat history persisted locally
- No data sent to external servers (except Google Maps)
- User can clear data anytime

### External Services
- **Google Maps**: Used for map display and places data
- **Material Fonts**: Google Fonts for typography
- **Material Icons**: Google Material Icons

## ⚡ Performance

### Optimization
- **Lazy Loading**: Images and maps loaded on demand
- **Code Splitting**: Modular JavaScript architecture
- **Caching**: Efficient use of browser caching
- **Minification**: CSS and JS can be minified for production

### Monitoring
- Performance Observer for long tasks
- Error tracking and logging
- Memory usage monitoring
- Load time measurement

## 🛠️ Customization

### Theming
Customize colors in `css/main.css`:
```css
:root {
  --google-blue: #4285F4;
  --google-green: #34A853;
  /* Add your custom colors */
}
```

### Adding New Form Fields
1. Add HTML structure in `index.html`
2. Update form validation in `js/form.js`
3. Modify JSON schema in `generateFormData()`

### Extending Chat Responses
Update `generateBotResponse()` in `js/chat.js` to add new response patterns.

## 🐛 Troubleshooting

### Common Issues

**Maps not loading**:
- Check Google Maps API key
- Verify API key has Maps JavaScript API enabled
- Check browser console for errors

**Form data not saving**:
- Check if localStorage is available
- Verify browser storage quota
- Check for JavaScript errors

**Chat not working**:
- Ensure all JavaScript files are loaded
- Check for console errors
- Verify Material Design Web is loaded

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('tour_guidance_debug', 'true');
```

## 📄 License

This project is created for demonstration purposes. The Google Material Design system and Google Maps API are subject to their respective terms of service.

## 🤝 Contributing

This is a demonstration project. For actual development:
1. Follow Material Design guidelines
2. Maintain responsive design principles
3. Test across all supported browsers
4. Keep accessibility standards (WCAG 2.1 AA)

## 📞 Support

For issues with this demonstration:
- Check browser console for errors
- Verify all required files are loaded
- Ensure Google Maps API is properly configured

---

**Built with ❤️ using Google Material Design and vanilla web technologies**