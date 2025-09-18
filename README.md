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

## � Test Cases & Evaluation

### 📝 Comprehensive Test Prompt Collection

To help you evaluate Tourgent's capabilities across different travel scenarios, we've prepared 10 comprehensive test cases covering various destinations, budgets, and travel styles:

#### 🇪🇺 **European Destinations**

**1. Multi-City Classic Europe**
```
Plan a 5-day Paris-Amsterdam trip. First 3 days in Paris (Eiffel Tower, Louvre, Montmartre), last 2 days in Amsterdam (canals, museums, bike tours). September 21-25. Mid-range hotels, local bistro and café recommendations. Train travel between cities. Different neighborhood experiences in each city with price comparisons. Daily budget 150-250 EUR.
```

**2. Mediterranean Barcelona**
```
3-day architecture and beach vacation in Barcelona. September 21-23. Gaudí masterpieces (Sagrada Familia, Park Güell), Gothic Quarter, Las Ramblas. Beach time at Barceloneta, tapas bar crawl. Flamenco show, Picasso Museum. Boutique hotels in Gothic Quarter. Paella, sangria, Catalan cuisine experience. Daily budget €120-200.
```

**3. Eastern Europe Prague**
```
4-day cultural trip to Prague. September 20-23. Old Town Square, Prague Castle, Charles Bridge. Czech beer culture, traditional pubs, castle tours. Gothic and Baroque architecture tours. Vltava River boat cruise. Hostels or mid-range hotels near Old Town. Czech street food and traditional dishes. Daily budget €80-150.
```

**4. Imperial Cities: Vienna-Budapest**
```
5-day imperial cities tour Vienna-Budapest. First 3 days Vienna (Schönbrunn Palace, Stephansdom, coffee house culture), last 2 days Budapest (Parliament, thermal baths, Danube cruise). Classical music concerts, Habsburg history. Train travel between cities. Hotels near imperial palaces. Austrian schnitzel vs Hungarian goulash. Daily budget €100-180.
```

#### 🇺🇸🇨🇦 **North American Adventures**

**5. West Coast Los Angeles**
```
4-day entertainment vacation in Los Angeles. September 22-25. Hollywood, Beverly Hills, Santa Monica Pier, Venice Beach. Theme parks (Disneyland or Universal Studios), film studio tours. American fast-food experience vs fine dining comparison. Downtown LA or Hollywood area hotels. Car rental and traffic information. Daily budget $200-400.
```

**6. East Coast New York**
```
5-day city experience in New York. September 20-24. Manhattan (Times Square, Central Park, 9/11 Memorial), Brooklyn (hipster neighborhoods), Queens (ethnic cuisine). Broadway show, museums (MoMA, Met), Statue of Liberty. Bagel, pizza, deli culture. Midtown or Brooklyn accommodation options. Metro card and walking tours. Daily budget $250-450.
```

**7. Canadian Nature: Vancouver**
```
4-day outdoor vacation in Vancouver, Canada. September 22-25. Stanley Park, Grouse Mountain, Capilano Suspension Bridge. Whale watching, kayaking, hiking trails. Granville Island Market, Richmond Night Market. Downtown Vancouver hotels, outdoor gear rental. Canadian cuisine, seafood, multicultural food scene. Daily budget CAD $180-320.
```

**8. Southern Culture: New Orleans**
```
3-day music and culinary festival in New Orleans. September 23-25. French Quarter, jazz clubs, voodoo culture. Swamp tour, plantation visits. Creole and Cajun cuisine (jambalaya, gumbo, beignets). Bourbon Street nightlife, live music venues. Historic inns in Garden District. Hurricane cocktails, jazz brunch. Daily budget $150-280.
```

#### 🇹🇷 **Turkish Destinations**

**9. Istanbul Gastronomy**
```
3-day gastronomy tour in Istanbul. September 23-25. Fish sandwich in Eminönü, modern cuisine in Karaköy, traditional restaurant culture in Beşiktaş. Seafood along the Bosphorus, Ottoman cuisine in Sultanahmet. Traditional Turkish breakfast, street food and Michelin-recommended restaurants. Boutique hotels in Galata or Karaköy. Daily budget 1500-2500 TL.
```

**10. Cappadocia Adventure**
```
4-day adventure vacation in Cappadocia. September 24-27. Hot air balloon tour, ATV safari, underground cities (Derinkuyu), Love Valley hiking. Cave hotel experience, Göreme Open Air Museum. Pottery workshop, wine tasting. Accommodation options between Ürgüp and Göreme. Traditional Anatolian cuisine. Daily budget 2000-3500 TL.
```

### 🎯 **What These Tests Evaluate**

- ✅ **Multi-Agent Coordination**: Planning, Hotels, Events, and Maps agents working together
- ✅ **Global Coverage**: Europe, North America, and Turkey destinations
- ✅ **Budget Diversity**: From €80 to $450 daily budgets across different currencies
- ✅ **Cultural Adaptation**: Local customs, cuisines, and experiences
- ✅ **Travel Styles**: Solo, couple, family, adventure, cultural, gastronomic
- ✅ **Multi-City Planning**: Complex routing and logistics
- ✅ **Seasonal Considerations**: September 2025 specific recommendations
- ✅ **Accommodation Variety**: From hostels to luxury hotels, unique stays (cave hotels)
- ✅ **Transportation**: Walking, public transport, trains, car rentals
- ✅ **Price Comparisons**: Hotel rates, restaurant costs, activity pricing

### 🔬 **How to Use These Tests**

1. **Copy any prompt** from above
2. **Paste into Tourgent** ([live demo](https://tourgent-v6-841879234183.us-central1.run.app))
3. **Evaluate the response** for accuracy, completeness, and usefulness
4. **Test different aspects**: pricing, logistics, cultural relevance, feasibility

These prompts will thoroughly test all aspects of our multi-agent travel planning system! 🌍✈️

## �🤝 Contributing

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
