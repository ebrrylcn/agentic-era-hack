# Tourgent: AI-Powered Travel Planning Platform

> **Stop wasting hours planning your trips.** Let AI agents create personalized itineraries in minutes, not days.

🌟 **[Try Tourgent Live](https://tourgent-v6-841879234183.us-central1.run.app)** 🌟

## 🎯 The Problem We Solve

**Traditional travel planning is broken:**
- ⏰ **Time-consuming**: Travelers spend 8-12 hours researching destinations, comparing hotels, finding restaurants, and creating itineraries
- 🔄 **Repetitive research**: Endlessly browsing review sites, maps, and booking platforms across multiple tabs
- 😤 **Decision fatigue**: Overwhelming choices lead to analysis paralysis and suboptimal decisions
- 📱 **Fragmented experience**: Switching between different apps and websites disrupts the planning flow
- 🎯 **Generic recommendations**: Cookie-cutter suggestions that don't match personal preferences or travel style

**Tourgent transforms travel planning from a chore into an effortless experience** using intelligent AI agents that understand your preferences, budget, and travel goals.

## ✨ Key Features

### 🤖 Multi-Agent AI Planning
- **Planning Agent**: Creates comprehensive itineraries based on your preferences
- **Hotel Agent**: Finds accommodations matching your budget and location needs
- **Events Agent**: Discovers local attractions, restaurants, and activities
- **Maps Agent**: Optimizes routes and provides real-time navigation

### 🎨 Intuitive Interface
- **Material Design**: Clean, responsive web interface
- **Interactive Maps**: Visual itinerary planning with Google Maps integration
- **Real-time Updates**: Live agent responses and dynamic content loading
- **Mobile-First**: Optimized for planning on-the-go

### ⚡ Lightning Fast
- **Instant Results**: Generate complete itineraries in under 2 minutes
- **Parallel Processing**: Multiple agents work simultaneously
- **Smart Caching**: Faster subsequent requests for popular destinations

## 🌐 Live Demo

**[🚀 Use Tourgent Now](https://tourgent-v6-841879234183.us-central1.run.app)**

Experience the full power of AI-driven travel planning in production!

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   ADK Backend    │────│  External APIs  │
│   (Vanilla JS)  │    │  (Multi-Agents)  │    │ (Google Maps)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐             │
         │              │                 │             │
         └──────────────┤  Agent Router   ├─────────────┘
                        │                 │
                        └─────────────────┘
```

**Technology Stack:**
- **Backend**: ADK (Agent Development Kit) with Python
- **Frontend**: Vanilla JavaScript, Material Design Components
- **Infrastructure**: Google Cloud Platform, Docker, Cloud Run
- **APIs**: Google Maps API, Google Places API

## 🚀 Quick Start

### Local Development (Recommended)
**The simplest way to run Tourgent locally:**

```bash
# Clone the repository
git clone https://github.com/ebrrylcn/agentic-era-hack.git
cd agentic-era-hack

# Setup frontend (navigate to frontend directory)
cd frontend
npm install
npm start

# Open your browser to localhost:8002
# That's it! 🎉
```

### Alternative: Backend Development
If you want to work with the AI agents:

```bash
# Install Python dependencies
make install

# Run the playground for agent testing
make playground
```

## 📁 Project Structure

```
agentic-era-hack/
├── app/                        # Backend AI agents
│   ├── sub_agents/
│   │   ├── planner_agent/      # Main itinerary planning
│   │   ├── hotels_agent/       # Hotel recommendations
│   │   ├── events_agent/       # Activities & attractions
│   │   └── maps_agent/         # Route optimization
│   ├── agent.py                # Root agent orchestrator
│   ├── agent_engine_app.py     # App deployment logic
│   └── utils/                  # Shared utilities
├── frontend/                   # Web interface
│   ├── index.html              # Main UI
│   ├── css/                    # Stylesheets
│   ├── js/                     # JavaScript modules
│   └── package.json            # Frontend dependencies
├── deployment/                 # Cloud infrastructure
│   └── terraform/              # Infrastructure as code
├── notebooks/                  # Development & testing
├── tests/                      # Test suites
├── Dockerfile                  # Container configuration
├── Makefile                    # Development commands
└── pyproject.toml             # Python dependencies
```

## 🛠️ Development Guide

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm start           # Start development server (localhost:8002)
npm run build       # Production build
```

### Agent Configuration
Customize AI behavior by editing YAML files in `app/sub_agents/`:
- `planner_agent/index.yml` - Main itinerary creation
- `hotels_agent/index.yml` - Accommodation search
- `events_agent/index.yml` - Activity recommendations
- `maps_agent/index.yml` - Route optimization

## ⚙️ Configuration

### Environment Variables
```bash
# Required for Google Maps integration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
SERPAPI_API_KEY=your_serpapi_key
```

## 🚀 Deployment

### Live Production
**Current deployment**: [https://tourgent-v6-841879234183.us-central1.run.app](https://tourgent-v6-841879234183.us-central1.run.app)

### Cloud Deployment Process

#### Step 1: Setup Secrets in Google Cloud
```bash
# Store API keys securely in Secret Manager
gcloud secrets create GOOGLE_MAPS_API_KEY --data-file=-
# Enter your API key when prompted
```

#### Step 2: Build and Deploy
```bash
# Build Docker image and push to Google Container Registry
gcloud builds submit --tag gcr.io/{YOUR-PROJECT-ID}/tourgent .

# Deploy to Cloud Run with secrets integration
gcloud run deploy tourgent \
  --image=gcr.io/{YOUR-PROJECT-ID}/tourgent \
  --platform managed \
  --concurrency 5 \
  --update-secrets=GOOGLE_MAPS_API_KEY=projects/{YOUR-PROJECT-ID}/secrets/GOOGLE_MAPS_API_KEY:latest
```

#### Docker Configuration
The project includes a production-ready `Dockerfile` for containerized deployment on Google Cloud Run.

## 🤝 Contributing

1. **Fork the repository**: [https://github.com/ebrrylcn/agentic-era-hack](https://github.com/ebrrylcn/agentic-era-hack)
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code style**: Run `make lint` before committing
4. **Add tests**: Ensure `make test` passes
5. **Submit pull request**: Detailed description of changes

### Code Style
- **Python**: Black formatting, type hints required
- **JavaScript**: ESLint configuration in `frontend/.eslintrc.js`
- **Commits**: Conventional commit format

## 🆘 Support

Need help or have questions? Reach out to our development team:

### 👥 Development Team

**Team Lead:**
- 📧 **Ebrar Yalçın**: [ebrar.yalcin@turkcell.com.tr](mailto:ebrar.yalcin@turkcell.com.tr)

**Developers:**
- 📧 **Yusuf Güldemir**: [yusuf.guldemir@turkcell.com.tr](mailto:yusuf.guldemir@turkcell.com.tr)
- 📧 **Emirhan Gazi**: [emirhan.gazi@turkcell.com.tr](mailto:emirhan.gazi@turkcell.com.tr)
- 📧 **Burak Ercan**: [burak.ercan@turkcell.com.tr](mailto:burak.ercan@turkcell.com.tr)
- 📧 **Utku Atasoy**: [utku.atasoy@turkcell.com.tr](mailto:utku.atasoy@turkcell.com.tr)

**Response Time**: We typically respond within 24-48 hours during business days.

**For urgent issues**: Please contact our team lead directly.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for travelers who value their time**

**[🌟 Start Planning Your Trip Now](https://tourgent-v6-841879234183.us-central1.run.app)**
