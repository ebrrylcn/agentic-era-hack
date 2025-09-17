# NPM Setup Guide for Tour Guidance App

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

3. **Open in Browser**: The app will automatically open at `http://localhost:8000`

## 📋 Available Scripts

### Development
- **`npm start`** or **`npm run dev`** - Start development server with live reload
- **`npm run serve`** - Same as dev (alias)
- **`npm run serve-node`** - Use Node.js Express server
- **`npm run serve-python`** - Use Python server (fallback)

### Building
- **`npm run build`** - Build production files (CSS + JS minification)
- **`npm run build-css`** - Build and minify CSS only
- **`npm run concat-css`** - Combine all CSS files
- **`npm run minify-css`** - Minify combined CSS
- **`npm run minify-js`** - Minify JavaScript files

### Development Tools
- **`npm run watch`** - Watch for file changes (CSS + JS)
- **`npm run watch-css`** - Watch CSS files for changes
- **`npm run lint`** - Run ESLint on JavaScript files
- **`npm run lint-fix`** - Fix ESLint issues automatically
- **`npm run format`** - Format code with Prettier

### Utilities
- **`npm run clean`** - Remove build artifacts
- **`npm run validate`** - Run linting and build
- **`npm run preview`** - Preview routes page on port 8080
- **`npm run setup`** - Install dependencies and create directories

## 🔧 Configuration Features

### Live Server Configuration
- **Port**: 8000 (configurable)
- **Auto-reload**: Enabled for HTML, CSS, JS changes
- **CORS**: Enabled for API requests
- **Custom middleware**: Serves `.env` file from parent directory

### Build Configuration
- **CSS**: Concatenates and minifies all stylesheets
- **JavaScript**: Minifies with source maps
- **Output**: `dist/` folder with optimized files

### Code Quality
- **ESLint**: JavaScript linting with Google-style rules
- **Prettier**: Code formatting
- **Browser targets**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+

## 🎨 Color Contrast Fixes

The following contrast issues have been addressed:

### High Contrast Mode
- ✅ Enhanced border visibility (2px borders)
- ✅ Improved text contrast ratios
- ✅ Better form element visibility
- ✅ Clearer button states

### Dark Mode Support
- ✅ Proper dark theme colors
- ✅ Sufficient contrast for all text
- ✅ Visible borders and separators
- ✅ Readable message bubbles

### Accessibility Improvements
- ✅ WCAG 2.1 AA compliance
- ✅ High contrast color schemes
- ✅ Clear focus indicators
- ✅ Proper semantic markup

## 🔗 Environment Configuration

The app automatically loads your Google Maps API key from `../.env`:

```bash
# Your .env file (in parent directory)
GOOGLE_MAPS_API_KEY="your_api_key_here"
GOOGLE_API_KEY="your_api_key_here"  # Alternative format
```

## 📦 Dependencies

### Development Dependencies
- **live-server**: Development server with live reload
- **concurrently**: Run multiple commands simultaneously
- **chokidar-cli**: File watching for hot reload
- **concat-cli**: Concatenate CSS files
- **clean-css-cli**: CSS minification
- **terser**: JavaScript minification
- **eslint**: JavaScript linting
- **prettier**: Code formatting
- **rimraf**: Cross-platform file removal

### No Runtime Dependencies
- Pure vanilla JavaScript application
- No framework dependencies
- Uses CDN for Material Design Web components

## 🛠️ Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Kill process on port 8000
npx kill-port 8000
# Or use different port
npm run preview  # Uses port 8080
```

**Module not found**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Live reload not working**:
```bash
# Check if browser supports WebSocket
# Try hard refresh (Ctrl+F5)
```

**Maps not loading**:
- Verify `.env` file exists in parent directory
- Check API key in browser console
- Ensure Maps JavaScript API is enabled

## 🎯 Production Deployment

1. **Build optimized files**:
   ```bash
   npm run build
   ```

2. **Serve from `dist/` folder** or use individual files

3. **Update API configuration** for production environment

## 🔄 Development Workflow

1. **Start development**: `npm start`
2. **Edit files**: Auto-reload on save
3. **Lint code**: `npm run lint-fix`
4. **Format code**: `npm run format`
5. **Build for production**: `npm run build`

The development server includes:
- Hot reload for instant updates
- CORS enabled for API testing
- Custom .env file serving
- Error overlay for debugging