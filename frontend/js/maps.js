// Maps and routes functionality for the Tour Guidance App

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.routes = [];
        this.infoWindow = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.placesService = null;
        this.currentDay = 1;
        this.routeData = null;
        this.isMapLoaded = false;

        // Don't call init() here - it's now async and called separately
    }

    /**
     * Initialize map functionality
     */
    async init() {
        console.log('🗺️ Initializing map manager...');

        // Load route data first from output.json
        await this.loadRouteData();
        console.log('✅ Route data loaded');

        this.setupEventListeners();
        this.setupPageVisibilityListener();
        this.initializeMDCComponents();

        // Wait for both configuration and Google Maps API to load
        await this.waitForMapInitialization();

        console.log('✅ Map initialization complete');
    }

    /**
     * Wait for configuration and Google Maps to be ready
     */
    async waitForMapInitialization() {
        try {
            // Wait for configuration to load
            if (window.appConfig && !window.appConfig.isLoaded()) {
                console.log('Waiting for configuration to load...');
                await window.appConfig.waitForLoad();
            }

            // Wait for Google Maps API to load
            if (typeof google === 'undefined' || !google.maps) {
                console.log('Waiting for Google Maps API...');
                // Google Maps will call initMap when ready
                return;
            }

            this.initializeMap();
        } catch (error) {
            console.error('Error during map initialization:', error);
            this.showMapError('Failed to initialize map');
        }
    }

    /**
     * Show map error message
     */
    showMapError(message) {
        const mapLoading = document.getElementById('mapLoading');
        if (mapLoading) {
            mapLoading.innerHTML = `
                <div class="loading-spinner">
                    <p style="color: #EA4335;">${message}</p>
                    <p style="font-size: 12px; color: #5F6368;">Please refresh the page to try again</p>
                </div>
            `;
        }
    }

    /**
     * Load route data from output.json via API
     */
    async loadRouteData() {
        try {
            // Try to load from output.json first
            const response = await fetch('/api/output');

            if (response.ok) {
                const outputData = await response.json();
                this.routeData = this.convertOutputToRouteData(outputData);
                console.log('✅ Route data loaded from output.json:', this.routeData);
                this.updateUIWithRouteData();

                // If map is already loaded, refresh it with new data
                if (this.map) {
                    this.loadDay(1);
                }
            } else if (response.status === 404) {
                // No output.json exists, generate sample route for demo
                console.log('⚠️ No output.json found, using sample route data');
                this.routeData = this.generateSampleRoute();
            }
        } catch (error) {
            console.error('Error loading route data:', error);
            // Fallback to sample route
            this.routeData = this.generateSampleRoute();
        }

        console.log('Route data loaded:', this.routeData);
    }

    /**
     * Convert output.json data to route data format
     */
    convertOutputToRouteData(outputData) {
        // Extract hotel information
        const hotel = outputData.hotel_information;

        // Convert day plans to our route format
        const days = outputData.day_plans.map(day => ({
            day: day.order,
            date: day.date,
            items: day.places.map(place => ({
                time: place.time,
                duration: '2h', // Default duration, could be calculated
                name: place.name,
                type: place.place_type || this.detectPlaceType(place.name),
                description: place.travel ? place.travel.to_go : '',
                coordinates: { lat: place.lat, lng: place.lon },
                placeId: place.place_id,
                travelMode: place.travel ? place.travel.mode : 'start',
                order: place.order
            }))
        }));

        // Calculate center based on hotel or first place
        let center = { lat: 41.0082, lng: 28.9784 }; // Default center
        if (hotel && hotel.lat && hotel.lon) {
            center = { lat: hotel.lat, lng: hotel.lon };
        } else if (days.length > 0 && days[0].items.length > 0) {
            const firstPlace = days[0].items[0];
            center = firstPlace.coordinates;
        }

        return {
            destination: {
                city: hotel ? hotel.address.split(',').slice(-2, -1)[0].trim() : 'Unknown',
                country: hotel ? hotel.address.split(',').slice(-1)[0].trim() : 'Unknown'
            },
            numberOfDays: days.length,
            days,
            hotel: {
                name: hotel?.name,
                coordinates: hotel ? { lat: hotel.lat, lng: hotel.lon } : null,
                address: hotel?.address,
                checkIn: hotel?.check_in,
                checkOut: hotel?.check_out,
                nights: hotel?.nights,
                placeId: hotel?.place_id
            },
            center,
            totalStats: this.calculateTotalStats(days.length)
        };
    }

    /**
     * Detect place type from name
     */
    detectPlaceType(name) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('restaurant') || nameLower.includes('pizzeria') ||
            nameLower.includes('cafe') || nameLower.includes('ristorante') ||
            nameLower.includes('taberna') || nameLower.includes('sobrino')) {
            return 'restaurant';
        } else if (nameLower.includes('hotel')) {
            return 'hotel';
        } else if (nameLower.includes('museum') || nameLower.includes('gallery') ||
                   nameLower.includes('museo') || nameLower.includes('müze')) {
            return 'museum';
        } else if (nameLower.includes('park') || nameLower.includes('garden') ||
                   nameLower.includes('retiro')) {
            return 'park';
        } else if (nameLower.includes('palace') || nameLower.includes('palacio') ||
                   nameLower.includes('saray')) {
            return 'landmark';
        } else if (nameLower.includes('flamenco') || nameLower.includes('show')) {
            return 'event';
        } else if (nameLower.includes('chocolate') || nameLower.includes('dessert')) {
            return 'dessert';
        } else if (nameLower.includes('market') || nameLower.includes('mercado')) {
            return 'other';
        } else {
            return 'attraction';
        }
    }

    /**
     * Update UI with loaded route data
     */
    updateUIWithRouteData() {
        // Update day selector if exists
        const daySelector = document.querySelector('.day-selector');
        if (daySelector && this.routeData) {
            // Update day tabs
            const dayTabs = daySelector.querySelector('.day-tabs');
            if (dayTabs) {
                dayTabs.innerHTML = '';
                for (let i = 1; i <= this.routeData.numberOfDays; i++) {
                    const tab = document.createElement('button');
                    tab.className = `day-tab ${i === 1 ? 'active' : ''}`;
                    tab.textContent = `Day ${i}`;
                    tab.addEventListener('click', () => this.selectDay(i));
                    dayTabs.appendChild(tab);
                }
            }
        }

        // Refresh the map if it's loaded
        if (this.map) {
            this.loadDay(1);
        }
    }

    /**
     * Generate route from form data
     */
    generateRouteFromFormData(formData) {
        const numberOfDays = formData.date.number_of_days || 3;
        const city = formData.city || 'Istanbul';
        const country = formData.country || 'Turkey';

        return {
            destination: { city, country },
            numberOfDays,
            days: this.generateDailyItinerary(numberOfDays, formData),
            preferences: formData.preferences,
            center: this.getCityCoordinates(city),
            totalStats: this.calculateTotalStats(numberOfDays)
        };
    }

    /**
     * Generate sample route for demo
     */
    generateSampleRoute() {
        return {
            destination: { city: 'Istanbul', country: 'Turkey' },
            numberOfDays: 3,
            center: { lat: 41.0082, lng: 28.9784 },
            days: [
                {
                    day: 1,
                    date: '2024-01-15',
                    items: [
                        {
                            time: '09:00',
                            duration: '2h',
                            name: 'Hagia Sophia',
                            type: 'attraction',
                            description: 'Historic architectural marvel, former church and mosque',
                            coordinates: { lat: 41.0086, lng: 28.9802 },
                            rating: 4.8,
                            price: '€15',
                            openingHours: '09:00 - 17:00',
                            website: 'https://muze.gov.tr'
                        },
                        {
                            time: '11:30',
                            duration: '1.5h',
                            name: 'Blue Mosque',
                            type: 'attraction',
                            description: 'Stunning Ottoman mosque with six minarets',
                            coordinates: { lat: 41.0054, lng: 28.9768 },
                            rating: 4.7,
                            price: 'Free',
                            openingHours: 'Always open (prayer times excluded)'
                        },
                        {
                            time: '13:00',
                            duration: '1h',
                            name: 'Pandeli Restaurant',
                            type: 'restaurant',
                            description: 'Traditional Ottoman cuisine in historic setting',
                            coordinates: { lat: 41.0166, lng: 28.9739 },
                            rating: 4.5,
                            price: '€€€',
                            cuisine: 'Turkish',
                            phone: '+90 212 527 3909'
                        },
                        {
                            time: '15:00',
                            duration: '2h',
                            name: 'Grand Bazaar',
                            type: 'attraction',
                            description: 'One of the oldest covered markets in the world',
                            coordinates: { lat: 41.0106, lng: 28.9681 },
                            rating: 4.3,
                            price: 'Free entry',
                            openingHours: '09:00 - 19:00'
                        },
                        {
                            time: '19:00',
                            duration: '2h',
                            name: 'Mikla Restaurant',
                            type: 'restaurant',
                            description: 'Modern Turkish cuisine with panoramic city views',
                            coordinates: { lat: 41.0369, lng: 28.9744 },
                            rating: 4.9,
                            price: '€€€€',
                            cuisine: 'Modern Turkish'
                        }
                    ]
                },
                {
                    day: 2,
                    date: '2024-01-16',
                    items: [
                        {
                            time: '09:30',
                            duration: '2h',
                            name: 'Topkapi Palace',
                            type: 'attraction',
                            description: 'Former Ottoman palace with treasury and harem',
                            coordinates: { lat: 41.0115, lng: 28.9833 },
                            rating: 4.6,
                            price: '€20',
                            openingHours: '09:00 - 16:45'
                        },
                        {
                            time: '12:00',
                            duration: '1h',
                            name: 'Hamdi Restaurant',
                            type: 'restaurant',
                            description: 'Famous for kebabs and traditional Turkish dishes',
                            coordinates: { lat: 41.0187, lng: 28.9739 },
                            rating: 4.4,
                            price: '€€',
                            cuisine: 'Turkish'
                        },
                        {
                            time: '14:00',
                            duration: '1.5h',
                            name: 'Basilica Cistern',
                            type: 'attraction',
                            description: 'Ancient underground water reservoir',
                            coordinates: { lat: 41.0084, lng: 28.9778 },
                            rating: 4.5,
                            price: '€12',
                            openingHours: '09:00 - 17:30'
                        },
                        {
                            time: '16:00',
                            duration: '2h',
                            name: 'Galata Tower Area',
                            type: 'attraction',
                            description: 'Medieval tower with panoramic views',
                            coordinates: { lat: 41.0256, lng: 28.9744 },
                            rating: 4.4,
                            price: '€10',
                            openingHours: '09:00 - 20:00'
                        }
                    ]
                },
                {
                    day: 3,
                    date: '2024-01-17',
                    items: [
                        {
                            time: '10:00',
                            duration: '2h',
                            name: 'Dolmabahce Palace',
                            type: 'attraction',
                            description: 'Opulent 19th-century Ottoman palace',
                            coordinates: { lat: 41.0391, lng: 29.0001 },
                            rating: 4.7,
                            price: '€18',
                            openingHours: '09:00 - 16:00'
                        },
                        {
                            time: '13:00',
                            duration: '1h',
                            name: 'Karakoy Lokantasi',
                            type: 'restaurant',
                            description: 'Elegant restaurant serving Ottoman cuisine',
                            coordinates: { lat: 41.0253, lng: 28.9741 },
                            rating: 4.6,
                            price: '€€€',
                            cuisine: 'Ottoman'
                        },
                        {
                            time: '15:00',
                            duration: '2h',
                            name: 'Bosphorus Cruise',
                            type: 'activity',
                            description: 'Scenic boat tour along the Bosphorus strait',
                            coordinates: { lat: 41.0204, lng: 28.9744 },
                            rating: 4.8,
                            price: '€25',
                            duration: '2h'
                        }
                    ]
                }
            ],
            totalStats: {
                walkingDistance: '12.5 km',
                totalTime: '18h 30m',
                estimatedCost: '€280-350',
                weatherInfo: '18°C, Partly Cloudy'
            }
        };
    }

    /**
     * Get city coordinates (simplified lookup)
     */
    getCityCoordinates(city) {
        const coordinates = {
            'Istanbul': { lat: 41.0082, lng: 28.9784 },
            'Paris': { lat: 48.8566, lng: 2.3522 },
            'London': { lat: 51.5074, lng: -0.1278 },
            'New York': { lat: 40.7128, lng: -74.0060 },
            'Tokyo': { lat: 35.6762, lng: 139.6503 },
            'Rome': { lat: 41.9028, lng: 12.4964 }
        };

        return coordinates[city] || { lat: 41.0082, lng: 28.9784 };
    }

    /**
     * Generate daily itinerary based on preferences
     */
    generateDailyItinerary(numberOfDays, formData) {
        // This would integrate with a real places API in production
        // For now, return sample data
        return this.generateSampleRoute().days.slice(0, numberOfDays);
    }

    /**
     * Calculate total statistics
     */
    calculateTotalStats(numberOfDays) {
        return {
            walkingDistance: `${(numberOfDays * 4.2).toFixed(1)} km`,
            totalTime: `${numberOfDays * 6}h 30m`,
            estimatedCost: `€${numberOfDays * 90}-${numberOfDays * 120}`,
            weatherInfo: '18°C, Partly Cloudy'
        };
    }

    /**
     * Initialize Google Maps
     */
    initializeMap() {
        if (!this.routeData) {
            console.error('No route data available');
            return;
        }

        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        // Map options
        const mapOptions = {
            center: this.routeData.center,
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.getMapStyles(),
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: false
        };

        // Create map
        this.map = new google.maps.Map(mapElement, mapOptions);

        // Initialize services
        this.infoWindow = new google.maps.InfoWindow();
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 4,
                strokeOpacity: 0.8
            }
        });
        this.directionsRenderer.setMap(this.map);
        this.placesService = new google.maps.places.PlacesService(this.map);

        // Load initial day
        this.loadDay(this.currentDay);

        // Hide loading overlay
        this.hideMapLoading();

        this.isMapLoaded = true;
        console.log('Google Maps initialized successfully');
    }

    /**
     * Get custom map styles
     */
    getMapStyles() {
        return [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ];
    }

    /**
     * Setup page visibility listener to refresh data when page becomes visible
     */
    setupPageVisibilityListener() {
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                console.log('🔄 Page became visible, refreshing route data...');
                try {
                    await this.loadRouteData();
                    if (this.map && this.routeData && this.routeData.days && this.routeData.days.length > 0) {
                        // Refresh current day view
                        const currentDay = this.getCurrentDay();
                        this.loadDay(currentDay);
                        Utils.showNotification('Route data refreshed!', 'success', 2000);
                    }
                } catch (error) {
                    console.error('Error refreshing route data:', error);
                }
            }
        });
    }

    /**
     * Get current day number (1-based)
     */
    getCurrentDay() {
        const activeButton = document.querySelector('.day-btn.active');
        return activeButton ? parseInt(activeButton.textContent.replace('Day ', '')) : 1;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Return to form button
        document.getElementById('returnToFormBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Back button (legacy, if exists)
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Map controls
        document.getElementById('mapTypeBtn')?.addEventListener('click', () => {
            this.showMapTypeMenu();
        });

        document.getElementById('trafficBtn')?.addEventListener('click', () => {
            this.toggleTraffic();
        });

        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('zoomInBtn')?.addEventListener('click', () => {
            this.zoomIn();
        });

        document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
            this.zoomOut();
        });

        document.getElementById('myLocationBtn')?.addEventListener('click', () => {
            this.goToMyLocation();
        });

        // Day navigation
        document.getElementById('prevDayBtn')?.addEventListener('click', () => {
            this.previousDay();
        });

        document.getElementById('nextDayBtn')?.addEventListener('click', () => {
            this.nextDay();
        });

        // Summary controls
        document.getElementById('expandSummaryBtn')?.addEventListener('click', () => {
            this.toggleSummaryExpansion();
        });

        document.getElementById('exportItineraryBtn')?.addEventListener('click', () => {
            this.exportItinerary();
        });

        // Header actions
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareRoute();
        });

        document.getElementById('saveBtn')?.addEventListener('click', () => {
            this.saveRoute();
        });
    }

    /**
     * Initialize Material Design Components
     */
    initializeMDCComponents() {
        // Initialize buttons
        const buttons = document.querySelectorAll('.mdc-button');
        buttons.forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });

        // Initialize icon buttons
        const iconButtons = document.querySelectorAll('.mdc-icon-button');
        iconButtons.forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });

        // Initialize dialog
        const dialog = document.getElementById('placeDetailsDialog');
        if (dialog) {
            this.placeDetailsDialog = mdc.dialog.MDCDialog.attachTo(dialog);
        }

        // Initialize menu
        const mapTypeMenu = document.getElementById('mapTypeMenu');
        if (mapTypeMenu) {
            this.mapTypeMenu = mdc.menu.MDCMenu.attachTo(mapTypeMenu);
        }
    }

    /**
     * Load and display a specific day
     */
    loadDay(dayNumber) {
        if (!this.routeData || !this.routeData.days[dayNumber - 1]) {
            console.error('Day data not available:', dayNumber);
            return;
        }

        this.currentDay = dayNumber;
        const dayData = this.routeData.days[dayNumber - 1];

        // Clear existing markers
        this.clearMarkers();

        // Add markers for the day
        this.addDayMarkers(dayData);

        // Update daily schedule
        this.updateDailySchedule(dayData);

        // Update day chips
        this.updateDayChips();

        // Update route statistics
        this.updateRouteStats();

        // Calculate and display route
        this.calculateRoute(dayData);
    }

    /**
     * Add markers for a day's activities
     */
    addDayMarkers(dayData) {
        dayData.items.forEach((item, index) => {
            const marker = new google.maps.Marker({
                position: item.coordinates,
                map: this.map,
                title: item.name,
                icon: this.getMarkerIcon(item.type, index + 1),
                animation: google.maps.Animation.DROP
            });

            // Add info window
            marker.addListener('click', () => {
                this.showInfoWindow(marker, item);
            });

            this.markers.push(marker);
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            this.markers.forEach(marker => {
                bounds.extend(marker.getPosition());
            });
            this.map.fitBounds(bounds);
        }
    }

    /**
     * Get custom marker icon
     */
    getMarkerIcon(type, number) {
        const colors = {
            restaurant: '#FF6B35',
            attraction: '#4285F4',
            hotel: '#34A853',
            activity: '#FBBC04',
            transport: '#EA4335',
            landmark: '#9333EA',
            museum: '#8B5CF6',
            park: '#10B981',
            event: '#EC4899',
            dessert: '#F59E0B',
            cafe: '#8B4513',
            other: '#6B7280'
        };

        const color = colors[type] || '#4285F4';

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 12,
            labelOrigin: new google.maps.Point(0, 0)
        };
    }

    /**
     * Show info window for a place
     */
    showInfoWindow(marker, item) {
        const content = `
            <div class="info-window">
                <h3>${item.name}</h3>
                <p class="place-type">${item.type.toUpperCase()}</p>
                <p>${item.description}</p>
                <div class="info-meta">
                    ${item.rating ? `<div><span class="material-icons">star</span> ${item.rating}</div>` : ''}
                    ${item.price ? `<div><span class="material-icons">attach_money</span> ${item.price}</div>` : ''}
                    ${item.openingHours ? `<div><span class="material-icons">schedule</span> ${item.openingHours}</div>` : ''}
                </div>
                <div class="info-actions">
                    <button class="mdc-button mdc-button--raised"
                            onclick="window.mapManager.showPlaceDetailsByCoords(${item.coordinates.lat}, ${item.coordinates.lng}, '${item.name.replace(/'/g, "\\'")}')">
                        <span class="mdc-button__label">View Details</span>
                    </button>
                    <button class="mdc-button mdc-button--outlined"
                            onclick="window.mapManager.getDirections(${item.coordinates.lat}, ${item.coordinates.lng})">
                        <span class="mdc-button__label">Directions</span>
                    </button>
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    /**
     * Find place by coordinates and name
     */
    findPlaceByLocation(lat, lon, name, callback) {
        if (!this.placesService) {
            console.error('Places service not available');
            callback(null);
            return;
        }

        console.log(`🔍 Searching for place: ${name} at ${lat}, ${lon}`);

        const request = {
            location: new google.maps.LatLng(lat, lon),
            radius: 100, // 100 meters radius
            keyword: name
        };

        this.placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                // Find the best match by name similarity
                let bestMatch = results[0];
                for (const place of results) {
                    if (place.name.toLowerCase().includes(name.toLowerCase()) ||
                        name.toLowerCase().includes(place.name.toLowerCase())) {
                        bestMatch = place;
                        break;
                    }
                }
                console.log('✅ Found place:', bestMatch.name, 'with ID:', bestMatch.place_id);
                callback(bestMatch.place_id);
            } else {
                console.log('⚠️ No place found, trying text search...');
                // Fallback to text search
                this.findPlaceByTextSearch(lat, lon, name, callback);
            }
        });
    }

    /**
     * Fallback text search for places
     */
    findPlaceByTextSearch(lat, lon, name, callback) {
        const request = {
            query: name,
            location: new google.maps.LatLng(lat, lon),
            radius: 500
        };

        this.placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                console.log('✅ Found place via text search:', results[0].name);
                callback(results[0].place_id);
            } else {
                console.log('❌ Could not find place');
                callback(null);
            }
        });
    }

    /**
     * Fetch place details from Google Places API
     */
    fetchPlaceDetails(placeId, callback) {
        if (!this.placesService || !placeId) {
            console.error('Places service not available or no place ID provided');
            callback(null);
            return;
        }

        const request = {
            placeId: placeId,
            fields: ['name', 'photos', 'formatted_address', 'rating',
                     'user_ratings_total', 'opening_hours', 'website',
                     'formatted_phone_number', 'reviews', 'price_level',
                     'types', 'geometry', 'url', 'vicinity', 'place_id']
        };

        this.placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log('✅ Place details fetched:', place);
                callback(place);
            } else {
                console.error('❌ Failed to fetch place details:', status);
                callback(null);
            }
        });
    }

    /**
     * Show place details by coordinates
     */
    showPlaceDetailsByCoords(lat, lon, name) {
        console.log(`📍 Fetching details for: ${name} at ${lat}, ${lon}`);

        // Show loading state
        this.showPlaceDetailsModal(null, true);

        // First find the place by location
        this.findPlaceByLocation(lat, lon, name, (placeId) => {
            if (placeId) {
                // Fetch full details
                this.fetchPlaceDetails(placeId, (place) => {
                    if (place) {
                        this.showPlaceDetailsModal(place, false);
                    } else {
                        this.showBasicPlaceDetailsByCoords(lat, lon, name);
                    }
                });
            } else {
                // No place found, show basic details
                this.showBasicPlaceDetailsByCoords(lat, lon, name);
            }
        });
    }

    /**
     * Show place details modal (legacy - for backwards compatibility)
     */
    showPlaceDetails(placeId) {
        console.log('Fetching details for place:', placeId);

        // Find the place item from route data
        let placeItem = null;
        if (this.routeData && this.routeData.days) {
            for (const day of this.routeData.days) {
                const found = day.items.find(item => item.placeId === placeId);
                if (found) {
                    placeItem = found;
                    break;
                }
            }
        }

        // If we have coordinates, use the new method
        if (placeItem && placeItem.coordinates) {
            this.showPlaceDetailsByCoords(
                placeItem.coordinates.lat,
                placeItem.coordinates.lng,
                placeItem.name
            );
            return;
        }

        if (!placeId || placeId === 'undefined' || placeId.match(/^\d+$/)) {
            // If no valid placeId, show basic info
            this.showBasicPlaceDetails(placeItem);
            return;
        }

        // Show loading state
        this.showPlaceDetailsModal(null, true);

        // Fetch detailed information
        this.fetchPlaceDetails(placeId, (place) => {
            if (place) {
                this.showPlaceDetailsModal(place, false);
            } else {
                // Fallback to basic details
                this.showBasicPlaceDetails(placeItem);
            }
        });
    }

    /**
     * Display place details in modal
     */
    showPlaceDetailsModal(place, isLoading) {
        let modal = document.getElementById('placeDetailsModal');

        // Create modal if it doesn't exist
        if (!modal) {
            modal = this.createPlaceDetailsModal();
        }

        if (isLoading) {
            modal.querySelector('.modal-content').innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading place details...</p>
                </div>
            `;
            modal.style.display = 'block';
            return;
        }

        // Build modal content
        const photosHtml = this.buildPhotoGallery(place.photos);
        const ratingHtml = this.buildRatingSection(place.rating, place.user_ratings_total);
        const hoursHtml = this.buildOpeningHours(place.opening_hours);
        const reviewsHtml = this.buildReviews(place.reviews);

        modal.querySelector('.modal-content').innerHTML = `
            <span class="close-modal" onclick="document.getElementById('placeDetailsModal').style.display='none'">&times;</span>
            ${photosHtml}
            <div class="place-details-info">
                <h2>${place.name}</h2>
                ${ratingHtml}
                <div class="place-meta">
                    ${place.formatted_address ? `<p><span class="material-icons">location_on</span> ${place.formatted_address}</p>` : ''}
                    ${place.formatted_phone_number ? `<p><span class="material-icons">phone</span> ${place.formatted_phone_number}</p>` : ''}
                    ${place.website ? `<p><span class="material-icons">language</span> <a href="${place.website}" target="_blank">Visit Website</a></p>` : ''}
                    ${place.price_level ? `<p><span class="material-icons">attach_money</span> ${'$'.repeat(place.price_level)}</p>` : ''}
                </div>
                ${hoursHtml}
                ${reviewsHtml}
                <div class="place-actions">
                    <a href="${place.url}" target="_blank" class="mdc-button mdc-button--raised">
                        <span class="mdc-button__label">View on Google Maps</span>
                    </a>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    /**
     * Build photo gallery HTML
     */
    buildPhotoGallery(photos) {
        if (!photos || photos.length === 0) {
            return '<div class="no-photos">No photos available</div>';
        }

        const photoUrls = photos.slice(0, 5).map((photo, index) => {
            const url = photo.getUrl({ maxWidth: 800, maxHeight: 600 });
            return `
                <div class="photo-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${url}" alt="Place photo ${index + 1}">
                </div>
            `;
        }).join('');

        return `
            <div class="photo-gallery">
                <div class="photo-container">
                    ${photoUrls}
                </div>
                ${photos.length > 1 ? `
                    <button class="photo-nav prev" onclick="mapManager.navigatePhotos(-1)">‹</button>
                    <button class="photo-nav next" onclick="mapManager.navigatePhotos(1)">›</button>
                    <div class="photo-indicators">
                        ${photos.slice(0, 5).map((_, i) => `
                            <span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Navigate photo gallery
     */
    navigatePhotos(direction) {
        const slides = document.querySelectorAll('.photo-slide');
        const indicators = document.querySelectorAll('.photo-indicators .indicator');

        let currentIndex = 0;
        slides.forEach((slide, index) => {
            if (slide.classList.contains('active')) {
                currentIndex = index;
            }
        });

        slides[currentIndex].classList.remove('active');
        indicators[currentIndex]?.classList.remove('active');

        currentIndex = (currentIndex + direction + slides.length) % slides.length;

        slides[currentIndex].classList.add('active');
        indicators[currentIndex]?.classList.add('active');
    }

    /**
     * Build rating section HTML
     */
    buildRatingSection(rating, totalRatings) {
        if (!rating) return '';

        const stars = Array(5).fill(0).map((_, i) => {
            if (i < Math.floor(rating)) {
                return '<span class="material-icons star filled">star</span>';
            } else if (i < rating) {
                return '<span class="material-icons star half">star_half</span>';
            }
            return '<span class="material-icons star">star_outline</span>';
        }).join('');

        return `
            <div class="rating-section">
                <div class="stars">${stars}</div>
                <span class="rating-text">${rating.toFixed(1)} (${totalRatings} reviews)</span>
            </div>
        `;
    }

    /**
     * Build opening hours HTML
     */
    buildOpeningHours(openingHours) {
        if (!openingHours || !openingHours.weekday_text) return '';

        const today = new Date().getDay();
        const isOpen = openingHours.isOpen ? openingHours.isOpen() : false;

        return `
            <div class="opening-hours">
                <h3>
                    <span class="material-icons">schedule</span>
                    Hours
                    <span class="status ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open Now' : 'Closed'}</span>
                </h3>
                <ul>
                    ${openingHours.weekday_text.map((day, index) => `
                        <li class="${index === today ? 'today' : ''}">${day}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Build reviews HTML
     */
    buildReviews(reviews) {
        if (!reviews || reviews.length === 0) return '';

        const topReviews = reviews.slice(0, 3);

        return `
            <div class="reviews-section">
                <h3><span class="material-icons">rate_review</span> Reviews</h3>
                ${topReviews.map(review => `
                    <div class="review">
                        <div class="review-header">
                            <img src="${review.profile_photo_url}" alt="${review.author_name}">
                            <div>
                                <strong>${review.author_name}</strong>
                                <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                            </div>
                        </div>
                        <p>${review.text}</p>
                        <small>${review.relative_time_description}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Create place details modal element
     */
    createPlaceDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'placeDetailsModal';
        modal.className = 'place-modal';
        modal.innerHTML = `<div class="modal-content"></div>`;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Show basic place details when no API data available
     */
    showBasicPlaceDetails(item) {
        if (!item) return;

        let modal = document.getElementById('placeDetailsModal');
        if (!modal) {
            modal = this.createPlaceDetailsModal();
        }

        modal.querySelector('.modal-content').innerHTML = `
            <span class="close-modal" onclick="document.getElementById('placeDetailsModal').style.display='none'">&times;</span>
            <div class="place-details-info">
                <h2>${item.name}</h2>
                <p class="place-type">${item.type.toUpperCase()}</p>
                <p>${item.description}</p>
                <div class="place-meta">
                    ${item.time ? `<p><span class="material-icons">schedule</span> Scheduled at ${item.time}</p>` : ''}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    /**
     * Show basic place details by coordinates
     */
    showBasicPlaceDetailsByCoords(lat, lon, name) {
        let modal = document.getElementById('placeDetailsModal');
        if (!modal) {
            modal = this.createPlaceDetailsModal();
        }

        // Find item from route data
        let item = null;
        if (this.routeData && this.routeData.days) {
            for (const day of this.routeData.days) {
                const found = day.items.find(i =>
                    i.coordinates.lat === lat &&
                    i.coordinates.lng === lon
                );
                if (found) {
                    item = found;
                    break;
                }
            }
        }

        modal.querySelector('.modal-content').innerHTML = `
            <span class="close-modal" onclick="document.getElementById('placeDetailsModal').style.display='none'">&times;</span>
            <div class="no-photos">No photos available</div>
            <div class="place-details-info">
                <h2>${name}</h2>
                ${item ? `
                    <p class="place-type">${item.type.toUpperCase()}</p>
                    <p>${item.description || ''}</p>
                    <div class="place-meta">
                        ${item.time ? `<p><span class="material-icons">schedule</span> Scheduled at ${item.time}</p>` : ''}
                        <p><span class="material-icons">location_on</span> ${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
                    </div>
                ` : `
                    <div class="place-meta">
                        <p><span class="material-icons">location_on</span> ${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
                    </div>
                `}
                <div class="place-actions">
                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank" class="mdc-button mdc-button--raised">
                        <span class="mdc-button__label">View on Google Maps</span>
                    </a>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    /**
     * Clear all markers from map
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    /**
     * Update daily schedule display with photos
     */
    updateDailySchedule(dayData) {
        const container = document.getElementById('dailySchedule');
        if (!container) return;

        container.innerHTML = dayData.items.map((item, index) => `
            <div class="schedule-item" data-place="${item.name}" data-index="${index}"
                 onclick="window.mapManager.showPlaceDetailsByCoords(${item.coordinates.lat}, ${item.coordinates.lng}, '${item.name.replace(/'/g, "\\'")}')"
                 style="cursor: pointer;">
                <div class="schedule-photo" id="schedule-photo-${index}">
                    <div class="photo-placeholder">
                        <span class="material-icons">${this.getPlaceIcon(item.type)}</span>
                    </div>
                </div>
                <div class="schedule-time">
                    <div class="time-display">${item.time}</div>
                    <div class="time-duration">${item.duration || '2h'}</div>
                </div>
                <div class="schedule-content">
                    <div class="schedule-header">
                        <div class="place-info">
                            <div class="place-name">${item.name}</div>
                            <div class="place-type">${item.type}</div>
                            <div class="place-description">${item.description}</div>
                        </div>
                    </div>
                    <div class="place-actions">
                        <button class="mdc-icon-button"
                                onclick="event.stopPropagation(); window.mapManager.showPlaceDetailsByCoords(${item.coordinates.lat}, ${item.coordinates.lng}, '${item.name.replace(/'/g, "\\'")}')"
                                title="View Details">
                            <span class="material-icons">info</span>
                        </button>
                        <button class="mdc-icon-button"
                                onclick="event.stopPropagation(); window.mapManager.getDirections(${item.coordinates.lat}, ${item.coordinates.lng})"
                                title="Get Directions">
                            <span class="material-icons">directions</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Initialize ripple effects for new elements
        container.querySelectorAll('.mdc-icon-button').forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });

        // Load photos for each schedule item
        dayData.items.forEach((item, index) => {
            this.loadScheduleItemPhoto(item, index);
        });
    }

    /**
     * Get icon for place type
     */
    getPlaceIcon(type) {
        const icons = {
            restaurant: 'restaurant',
            cafe: 'local_cafe',
            dessert: 'cake',
            landmark: 'account_balance',
            museum: 'museum',
            park: 'park',
            hotel: 'hotel',
            event: 'event',
            attraction: 'attractions',
            activity: 'directions_run',
            transport: 'directions',
            other: 'place'
        };
        return icons[type] || 'place';
    }

    /**
     * Load photo for schedule item
     */
    loadScheduleItemPhoto(item, index) {
        if (!this.placesService) return;

        // Find place and get photo
        this.findPlaceByLocation(item.coordinates.lat, item.coordinates.lng, item.name, (placeId) => {
            if (placeId) {
                // Get place details for photo
                const request = {
                    placeId: placeId,
                    fields: ['photos', 'name']
                };

                this.placesService.getDetails(request, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place.photos && place.photos.length > 0) {
                        const photo = place.photos[0];
                        const photoUrl = photo.getUrl({ maxWidth: 150, maxHeight: 150 });

                        // Update the photo container
                        const photoContainer = document.getElementById(`schedule-photo-${index}`);
                        if (photoContainer) {
                            photoContainer.innerHTML = `
                                <img src="${photoUrl}" alt="${item.name}"
                                     style="width: 100%; height: 100%; object-fit: cover;">
                            `;
                        }
                    }
                });
            }
        });
    }

    /**
     * Update day chips
     */
    updateDayChips() {
        const container = document.getElementById('dayChips');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 1; i <= this.routeData.numberOfDays; i++) {
            const chip = document.createElement('div');
            chip.className = `mdc-chip ${i === this.currentDay ? 'mdc-chip--selected' : ''}`;
            chip.setAttribute('role', 'row');
            chip.innerHTML = `
                <div class="mdc-chip__ripple"></div>
                <span role="gridcell">
                    <span role="radio" class="mdc-chip__primary-action" tabindex="0">
                        <span class="mdc-chip__text">Day ${i}</span>
                    </span>
                </span>
            `;

            chip.addEventListener('click', () => {
                this.loadDay(i);
            });

            container.appendChild(chip);

            // Initialize MDC chip
            mdc.chips.MDCChip.attachTo(chip);
        }
    }

    /**
     * Update route statistics
     */
    updateRouteStats() {
        const stats = this.routeData.totalStats;

        document.getElementById('walkingDistance').textContent = stats.walkingDistance;
        document.getElementById('totalTime').textContent = stats.totalTime;
        document.getElementById('estimatedCost').textContent = stats.estimatedCost;
        document.getElementById('weatherInfo').textContent = stats.weatherInfo;
    }

    /**
     * Calculate and display route between points
     */
    calculateRoute(dayData) {
        if (!this.directionsService || dayData.items.length < 2) return;

        const waypoints = dayData.items.slice(1, -1).map(item => ({
            location: item.coordinates,
            stopover: true
        }));

        const request = {
            origin: dayData.items[0].coordinates,
            destination: dayData.items[dayData.items.length - 1].coordinates,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.WALKING,
            optimizeWaypoints: true
        };

        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(result);
            } else {
                console.error('Directions request failed:', status);
            }
        });
    }

    /**
     * Navigate to previous day
     */
    previousDay() {
        if (this.currentDay > 1) {
            this.loadDay(this.currentDay - 1);
        }
    }

    /**
     * Navigate to next day
     */
    nextDay() {
        if (this.currentDay < this.routeData.numberOfDays) {
            this.loadDay(this.currentDay + 1);
        }
    }

    /**
     * Highlight a specific place
     */
    highlightPlace(placeName) {
        const marker = this.markers.find(m => m.getTitle() === placeName);
        if (marker) {
            this.map.panTo(marker.getPosition());
            this.map.setZoom(16);

            // Animate marker
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
        }

        // Highlight in schedule
        document.querySelectorAll('.schedule-item').forEach(item => {
            item.classList.remove('selected');
        });

        const scheduleItem = document.querySelector(`[data-place="${placeName}"]`);
        if (scheduleItem) {
            scheduleItem.classList.add('selected');
            scheduleItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Show place details modal
     */
    showPlaceDetails(placeName) {
        const dayData = this.routeData.days[this.currentDay - 1];
        const place = dayData.items.find(item => item.name === placeName);

        if (!place) return;

        const dialogTitle = document.getElementById('placeDetailsTitle');
        const dialogContent = document.getElementById('placeDetailsContent');

        if (dialogTitle) {
            dialogTitle.textContent = place.name;
        }

        if (dialogContent) {
            dialogContent.innerHTML = `
                <div class="place-details-content">
                    ${place.image ? `<img src="${place.image}" alt="${place.name}" class="place-image">` : ''}
                    <div class="place-details-info">
                        <div class="place-details-section">
                            <div class="section-title">Description</div>
                            <div class="section-content">${place.description}</div>
                        </div>
                        ${place.openingHours ? `
                            <div class="place-details-section">
                                <div class="section-title">Opening Hours</div>
                                <div class="section-content">${place.openingHours}</div>
                            </div>
                        ` : ''}
                        ${place.phone || place.website ? `
                            <div class="place-details-section">
                                <div class="section-title">Contact Information</div>
                                <div class="contact-info">
                                    ${place.phone ? `
                                        <div class="contact-item">
                                            <span class="material-icons">phone</span>
                                            <span>${place.phone}</span>
                                        </div>
                                    ` : ''}
                                    ${place.website ? `
                                        <div class="contact-item">
                                            <span class="material-icons">language</span>
                                            <a href="${place.website}" target="_blank">${place.website}</a>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        <div class="place-details-section">
                            <div class="section-title">Visit Details</div>
                            <div class="section-content">
                                <div class="meta-item"><span class="material-icons">schedule</span> ${place.time} (${place.duration})</div>
                                ${place.rating ? `<div class="meta-item"><span class="material-icons">star</span> ${place.rating} rating</div>` : ''}
                                ${place.price ? `<div class="meta-item"><span class="material-icons">attach_money</span> ${place.price}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.placeDetailsDialog) {
            this.placeDetailsDialog.open();
        }
    }

    /**
     * Get directions to a place
     */
    getDirections(lat, lng) {

        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Open Google Maps with directions
                const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
                window.open(url, '_blank');
            }, (error) => {
                // Fallback: open Google Maps with destination only
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(url, '_blank');
            });
        } else {
            // Fallback: open Google Maps with destination only
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            window.open(url, '_blank');
        }
    }

    /**
     * Show map type menu
     */
    showMapTypeMenu() {
        if (this.mapTypeMenu) {
            this.mapTypeMenu.open = true;

            // Handle menu item clicks
            const menuItems = document.querySelectorAll('#mapTypeMenu .mdc-list-item');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    const mapType = item.dataset.mapType;
                    this.changeMapType(mapType);
                    this.mapTypeMenu.open = false;
                });
            });
        }
    }

    /**
     * Change map type
     */
    changeMapType(type) {
        if (!this.map) return;

        const mapTypes = {
            roadmap: google.maps.MapTypeId.ROADMAP,
            satellite: google.maps.MapTypeId.SATELLITE,
            hybrid: google.maps.MapTypeId.HYBRID,
            terrain: google.maps.MapTypeId.TERRAIN
        };

        this.map.setMapTypeId(mapTypes[type] || google.maps.MapTypeId.ROADMAP);
    }

    /**
     * Toggle traffic layer
     */
    toggleTraffic() {
        if (!this.map) return;

        const trafficBtn = document.getElementById('trafficBtn');

        if (!this.trafficLayer) {
            this.trafficLayer = new google.maps.TrafficLayer();
        }

        if (this.trafficLayer.getMap()) {
            this.trafficLayer.setMap(null);
            trafficBtn.classList.remove('active');
        } else {
            this.trafficLayer.setMap(this.map);
            trafficBtn.classList.add('active');
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const mapSection = document.getElementById('mapSection');
        const summarySection = document.getElementById('summarySection');

        if (mapSection.classList.contains('fullscreen')) {
            mapSection.classList.remove('fullscreen');
            summarySection.style.display = 'flex';
        } else {
            mapSection.classList.add('fullscreen');
            summarySection.style.display = 'none';
        }

        // Trigger map resize
        setTimeout(() => {
            if (this.map) {
                google.maps.event.trigger(this.map, 'resize');
            }
        }, 300);
    }

    /**
     * Zoom in
     */
    zoomIn() {
        if (this.map) {
            this.map.setZoom(this.map.getZoom() + 1);
        }
    }

    /**
     * Zoom out
     */
    zoomOut() {
        if (this.map) {
            this.map.setZoom(this.map.getZoom() - 1);
        }
    }

    /**
     * Go to user's location
     */
    goToMyLocation() {
        if (!navigator.geolocation) {
            Utils.showNotification('Geolocation is not supported', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            this.map.setCenter(pos);
            this.map.setZoom(15);

            // Add user location marker
            if (this.userLocationMarker) {
                this.userLocationMarker.setMap(null);
            }

            this.userLocationMarker = new google.maps.Marker({
                position: pos,
                map: this.map,
                title: 'Your Location',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 3,
                    scale: 8
                }
            });

        }, (error) => {
            console.error('Geolocation error:', error);
            Utils.showNotification('Unable to get your location', 'error');
        });
    }

    /**
     * Toggle summary section expansion
     */
    toggleSummaryExpansion() {
        const summarySection = document.getElementById('summarySection');
        const expandBtn = document.getElementById('expandSummaryBtn');
        const mapSection = document.getElementById('mapSection');

        if (summarySection.classList.contains('expanded')) {
            summarySection.classList.remove('expanded');
            mapSection.style.flex = '0 0 70%';
            expandBtn.querySelector('.material-icons').textContent = 'expand_less';
        } else {
            summarySection.classList.add('expanded');
            mapSection.style.flex = '0 0 40%';
            expandBtn.querySelector('.material-icons').textContent = 'expand_more';
        }

        // Trigger map resize
        setTimeout(() => {
            if (this.map) {
                google.maps.event.trigger(this.map, 'resize');
            }
        }, 300);
    }

    /**
     * Export itinerary
     */
    exportItinerary() {
        const itinerary = this.generateItineraryText();
        const filename = `${this.routeData.destination.city}-itinerary-${Date.now()}.txt`;
        Utils.downloadFile(itinerary, filename, 'text/plain');
        Utils.showNotification('Itinerary exported!', 'success');
    }

    /**
     * Generate itinerary text
     */
    generateItineraryText() {
        let text = `${this.routeData.destination.city}, ${this.routeData.destination.country} - Travel Itinerary\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n`;
        text += `Duration: ${this.routeData.numberOfDays} days\n\n`;
        text += '='.repeat(50) + '\n\n';

        this.routeData.days.forEach(day => {
            text += `DAY ${day.day} - ${day.date}\n`;
            text += '-'.repeat(30) + '\n\n';

            day.items.forEach(item => {
                text += `${item.time} - ${item.name} (${item.duration})\n`;
                text += `Type: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}\n`;
                text += `Description: ${item.description}\n`;
                if (item.rating) text += `Rating: ${item.rating} stars\n`;
                if (item.price) text += `Price: ${item.price}\n`;
                if (item.openingHours) text += `Hours: ${item.openingHours}\n`;
                text += '\n';
            });

            text += '\n';
        });

        text += 'TRIP STATISTICS\n';
        text += '-'.repeat(30) + '\n';
        text += `Walking Distance: ${this.routeData.totalStats.walkingDistance}\n`;
        text += `Total Time: ${this.routeData.totalStats.totalTime}\n`;
        text += `Estimated Cost: ${this.routeData.totalStats.estimatedCost}\n`;
        text += `Weather: ${this.routeData.totalStats.weatherInfo}\n\n`;

        text += 'Generated with Tour Guidance App\n';

        return text;
    }

    /**
     * Share route
     */
    shareRoute() {
        const shareData = {
            title: `${this.routeData.destination.city} Travel Route`,
            text: `Check out my ${this.routeData.numberOfDays}-day itinerary for ${this.routeData.destination.city}!`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            Utils.copyToClipboard(shareText).then(() => {
                Utils.showNotification('Route details copied to clipboard!', 'success');
            });
        }
    }

    /**
     * Save route
     */
    saveRoute() {
        const routeName = `${this.routeData.destination.city} - ${new Date().toLocaleDateString()}`;

        // Save to localStorage
        const savedRoutes = JSON.parse(localStorage.getItem('tour_guidance_saved_routes') || '[]');
        savedRoutes.unshift({
            id: Utils.generateId(),
            name: routeName,
            data: this.routeData,
            savedAt: Date.now()
        });

        // Keep only last 10 saved routes
        while (savedRoutes.length > 10) {
            savedRoutes.pop();
        }

        localStorage.setItem('tour_guidance_saved_routes', JSON.stringify(savedRoutes));
        Utils.showNotification('Route saved!', 'success');
    }

    /**
     * Hide map loading overlay
     */
    hideMapLoading() {
        const loading = document.getElementById('mapLoading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 300);
        }
    }
}

// Initialize map manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting Map Manager initialization...');
    window.mapManager = new MapManager();

    // Initialize the map manager asynchronously
    await window.mapManager.init();

    console.log('✅ Map Manager fully initialized');
});

// Global function for Google Maps API callback
window.initMap = function() {
    console.log('📍 Google Maps API loaded, initializing map...');
    if (window.mapManager) {
        window.mapManager.initializeMap();
    }
};