// Form management and validation for the Tour Guidance App

class FormManager {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 6;
        this.formData = this.initializeFormData();
        this.validationRules = this.initializeValidationRules();
        this.autoSaveEnabled = Storage.form.getAutoSaveEnabled();
        this.autoSaveInterval = null;

        // Don't call init() here - it's now async and called separately
    }

    /**
     * Initialize default form data structure
     */
    initializeFormData() {
        return {
            city: null,
            country: null,
            date: {
                start_date: null,
                end_date: null,
                number_of_days: null
            },
            people: {
                number_of_people: null,
                people_details: null
            },
            preferences: {
                events: null,
                cousines: null,
                places: null,
                budget_amount: 250, // Default budget amount
                currency: null,
                general_notes: null
            },
            dislikes: {
                events: null,
                cousines: null,
                places: null,
                general_note: null
            },
            hotel: {
                hotel_type: null,
                location_preference: null,
                budget_per_night: null,
                amenities: null,
                room_type: null,
                special_requests: null
            }
        };
    }

    /**
     * Initialize validation rules
     */
    initializeValidationRules() {
        return {
            city: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s\-']+$/
            },
            country: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s\-']+$/
            },
            start_date: {
                required: false,
                format: 'date'
            },
            end_date: {
                required: false,
                format: 'date',
                afterStartDate: true
            },
            number_of_days: {
                required: false,
                min: 1,
                max: 365
            },
            number_of_people: {
                required: false,
                min: 1,
                max: 50
            }
        };
    }

    /**
     * Initialize form functionality
     */
    async init() {
        // Load form data FIRST to clear everything before setting up listeners
        await this.loadFormData();
        
        this.initializeMDCComponents();
        this.setupEventListeners();
        this.setupCityAutocomplete();
        this.setupDatePickers();
        this.setupBudgetSlider();

        this.updateProgressIndicator();
        this.updateStepIndicators(); // Initialize step indicators
        this.setupAutoSave();

        // Initialize JSON preview with our cleared data (don't call updateFormData)
        await this.initializeJSONPreviewWithCurrentData();

        // Set default end date
        this.calculateEndDate();

        // Setup unload handler to reset values
        this.setupUnloadHandler();

    }

    /**
     * Initialize Material Design Components
     */
    initializeMDCComponents() {
        // Initialize text fields
        const textFields = document.querySelectorAll('.mdc-text-field');
        textFields.forEach(textField => {
            mdc.textField.MDCTextField.attachTo(textField);
        });

        // Initialize buttons
        const buttons = document.querySelectorAll('.mdc-button');
        buttons.forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });

        // Initialize chips
        const chipSets = document.querySelectorAll('.mdc-chip-set');
        chipSets.forEach(chipSet => {
            const mdcChipSet = mdc.chips.MDCChipSet.attachTo(chipSet);

            // Check if this is a single-select container
            const container = chipSet.closest('[data-single-select="true"]');
            if (container) {
                // Add single selection behavior
                chipSet.addEventListener('click', (e) => {
                    const clickedChip = e.target.closest('.mdc-chip');
                    if (clickedChip && !clickedChip.classList.contains('custom-chip')) {
                        // Deselect all other chips in this set
                        chipSet.querySelectorAll('.mdc-chip--selected').forEach(chip => {
                            if (chip !== clickedChip) {
                                chip.classList.remove('mdc-chip--selected');
                            }
                        });
                        // Toggle the clicked chip
                        clickedChip.classList.toggle('mdc-chip--selected');

                        // Update form data
                        this.updateFormData();
                        this.updateJSONPreview();
                        this.saveFormData();
                    }
                });
            }
        });

        // Initialize radio buttons
        const radios = document.querySelectorAll('.mdc-radio');
        radios.forEach(radio => {
            mdc.radio.MDCRadio.attachTo(radio);
        });

        // Initialize selects
        const selects = document.querySelectorAll('.mdc-select');
        selects.forEach(select => {
            const mdcSelect = mdc.select.MDCSelect.attachTo(select);
            // Add change event listener
            mdcSelect.listen('MDCSelect:change', () => {
                this.updateFormData();
                this.updateJSONPreview();
                this.saveFormData();
            });
        });

        // Initialize linear progress
        const progressBar = document.querySelector('.mdc-linear-progress');
        if (progressBar) {
            this.progressIndicator = mdc.linearProgress.MDCLinearProgress.attachTo(progressBar);
        }

        // Initialize icon buttons
        const iconButtons = document.querySelectorAll('.mdc-icon-button');
        iconButtons.forEach(button => {
            mdc.ripple.MDCRipple.attachTo(button);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons - with null checks
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previousStep();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        // Date option toggle
        document.querySelectorAll('input[name="date-option"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleDateOption());
        });

        // Form inputs
        document.getElementById('tourPlanningForm').addEventListener('input', Utils.debounce(async () => {
            this.updateFormData();
            this.validateCurrentStep();
            await this.updateJSONPreview();
        }, 300));

        // Custom chip inputs
        this.setupCustomChipInputs();

        // Step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator) => {
            indicator.addEventListener('click', () => {
                const step = parseInt(indicator.getAttribute('data-step'));
                if (step) {
                    this.goToStep(step);
                }
            });
        });

        // JSON preview toggle
        document.getElementById('jsonToggle').addEventListener('click', () => this.toggleJSONPreview());

        // JSON actions
        document.getElementById('copyJsonBtn').addEventListener('click', () => this.copyJSON());
        document.getElementById('downloadJsonBtn').addEventListener('click', () => this.downloadJSON());

        // Auto-save toggle (if you add a UI element for it)
        // document.getElementById('autoSaveToggle').addEventListener('change', (e) => {
        //     this.setAutoSave(e.target.checked);
        // });
    }

    /**
     * Setup city autocomplete
     */
    setupCityAutocomplete() {
        const cityInput = document.getElementById('city');
        const suggestionsContainer = document.getElementById('citySuggestions');

        if (!cityInput || !suggestionsContainer) return;

        // Popular destinations
        const popularCities = [
            { name: 'Paris', country: 'France', icon: 'location_city', popular: true },
            { name: 'Tokyo', country: 'Japan', icon: 'location_city', popular: true },
            { name: 'New York', country: 'USA', icon: 'location_city', popular: true },
            { name: 'London', country: 'UK', icon: 'location_city', popular: true },
            { name: 'Rome', country: 'Italy', icon: 'location_city', popular: true },
            { name: 'Barcelona', country: 'Spain', icon: 'location_city', popular: true },
            { name: 'Dubai', country: 'UAE', icon: 'location_city', popular: true },
            { name: 'Singapore', country: 'Singapore', icon: 'location_city', popular: true },
            { name: 'Bangkok', country: 'Thailand', icon: 'location_city', popular: true },
            { name: 'Istanbul', country: 'Turkey', icon: 'location_city', popular: true },
            { name: 'Sydney', country: 'Australia', icon: 'location_city', popular: true },
            { name: 'Amsterdam', country: 'Netherlands', icon: 'location_city', popular: true }
        ];

        let currentFocus = -1;

        // Show suggestions on focus
        cityInput.addEventListener('focus', () => {
            showSuggestions(popularCities);
        });

        // Filter suggestions on input
        cityInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            if (value.length === 0) {
                showSuggestions(popularCities);
            } else {
                const filtered = popularCities.filter(city =>
                    city.name.toLowerCase().startsWith(value) ||
                    city.country.toLowerCase().startsWith(value)
                );
                // If no matches with startsWith, try includes
                if (filtered.length === 0) {
                    const lessFiltered = popularCities.filter(city =>
                        city.name.toLowerCase().includes(value) ||
                        city.country.toLowerCase().includes(value)
                    );
                    showSuggestions(lessFiltered);
                } else {
                    showSuggestions(filtered);
                }
            }
        });

        // Handle keyboard navigation
        cityInput.addEventListener('keydown', (e) => {
            const items = suggestionsContainer.querySelectorAll('.city-suggestion-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                setActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
                setActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });

        // Hide suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSuggestions();
            }
        });

        function showSuggestions(cities) {
            suggestionsContainer.innerHTML = '';
            currentFocus = -1;

            if (cities.length === 0) {
                suggestionsContainer.classList.remove('active');
                return;
            }

            // Limit to only 2 suggestions
            const limitedCities = cities.slice(0, 2);

            // Add city items (no header for compact view)
            limitedCities.forEach((city, index) => {
                const item = document.createElement('div');
                item.className = `city-suggestion-item ${city.popular ? 'popular' : ''}`;
                item.innerHTML = `
                    <span class="material-icons">${city.icon}</span>
                    <span>${city.name}, ${city.country}</span>
                `;

                item.addEventListener('click', () => {
                    // Update city input
                    cityInput.value = city.name;

                    // Update MDC component for city field
                    const cityField = cityInput.closest('.mdc-text-field');
                    const cityMDC = cityField ? mdc.textField.MDCTextField.attachTo(cityField) : null;
                    if (cityMDC) {
                        cityMDC.value = city.name;
                    }

                    // Also set country if available
                    const countryInput = document.getElementById('country');
                    if (countryInput) {
                        countryInput.value = city.country;

                        // Update MDC component for country field
                        const countryField = countryInput.closest('.mdc-text-field');
                        const countryMDC = countryField ? mdc.textField.MDCTextField.attachTo(countryField) : null;
                        if (countryMDC) {
                            countryMDC.value = city.country;
                        }
                    }

                    hideSuggestions();
                    cityInput.dispatchEvent(new Event('input'));

                    // Save form when city is selected
                    setTimeout(() => {
                        this.saveFormData().then(() => {
                        });
                    }, 100);
                });

                suggestionsContainer.appendChild(item);
            });

            suggestionsContainer.classList.add('active');
        }

        function hideSuggestions() {
            suggestionsContainer.classList.remove('active');
            currentFocus = -1;
        }

        function setActive(items) {
            removeActive(items);
            if (currentFocus >= 0 && currentFocus < items.length) {
                items[currentFocus].classList.add('selected');
            }
        }

        function removeActive(items) {
            items.forEach(item => item.classList.remove('selected'));
        }
    }

    /**
     * Setup date pickers
     */
    setupDatePickers() {
        const startDateInput = document.getElementById('start_date');
        const endDateInput = document.getElementById('end_date');
        const numberOfDaysInput = document.getElementById('number_of_days');

        if (startDateInput) {
            // Convert to date input type for native calendar
            startDateInput.type = 'date';
            startDateInput.min = new Date().toISOString().split('T')[0];
            startDateInput.placeholder = '';

            startDateInput.addEventListener('change', async () => {
                this.calculateEndDate();
                // Set minimum end date to start date
                if (endDateInput) {
                    endDateInput.min = startDateInput.value;
                }
                await this.updateJSONPreview(); // Update JSON when date changes
                await this.saveFormData();
            });
        }

        if (endDateInput) {
            // Convert to date input type for native calendar
            endDateInput.type = 'date';
            endDateInput.min = new Date().toISOString().split('T')[0];
            endDateInput.placeholder = '';

            endDateInput.addEventListener('change', async () => {
                this.updateDurationFromDates();
                await this.updateJSONPreview(); // Update JSON when date changes
                await this.saveFormData();
            });
        }

        if (numberOfDaysInput) {
            numberOfDaysInput.addEventListener('change', async () => {
                this.calculateEndDate();
                await this.updateJSONPreview(); // Update JSON when number of days changes
                await this.saveFormData();
            });
        }
    }

    /**
     * Setup budget slider
     */
    setupBudgetSlider() {
        const budgetSlider = document.getElementById('budgetSlider');
        const budgetValue = document.getElementById('budgetValue');
        const budgetLevel = document.getElementById('budgetLevel');
        const customBudgetContainer = document.getElementById('customBudgetContainer');
        const customBudgetInput = document.getElementById('customBudget');

        if (!budgetSlider || !budgetValue) return;

        const budgetLevels = ['Low', 'Budget', 'Normal', 'Premium', 'Luxury', 'Custom'];
        const budgetAmounts = [50, 100, 250, 500, 1000, null];

        // Update display when slider changes
        budgetSlider.addEventListener('input', async (e) => {
            const value = parseInt(e.target.value);

            // Show/hide custom input
            if (value === 6) { // Custom option
                if (customBudgetContainer) {
                    customBudgetContainer.style.display = 'block';
                    // Initialize MDC text field
                    const customField = customBudgetContainer.querySelector('.mdc-text-field');
                    if (customField) {
                        mdc.textField.MDCTextField.attachTo(customField);
                    }
                }
                budgetValue.textContent = 'Enter custom amount';
                if (budgetLevel) {
                    budgetLevel.textContent = 'Custom';
                }
            } else {
                if (customBudgetContainer) {
                    customBudgetContainer.style.display = 'none';
                }
                const amount = budgetAmounts[value - 1];
                const level = budgetLevels[value - 1];

                // Update display
                budgetValue.textContent = `$${amount} per day`;
                if (budgetLevel) {
                    budgetLevel.textContent = level;
                }

                // Update form data as number
                this.formData.preferences.budget_amount = amount;
            }

            // Update background gradient
            const percentage = ((value - 1) / 5) * 100;
            budgetSlider.style.background = `linear-gradient(to right, #1A73E8 0%, #1A73E8 ${percentage}%, #E8EAED ${percentage}%, #E8EAED 100%)`;

            // Save form after budget change
            await this.updateJSONPreview();
            await this.saveFormData();
        });

        // Handle custom budget input
        if (customBudgetInput) {
            customBudgetInput.addEventListener('input', Utils.debounce(async (e) => {
                const customAmount = parseInt(e.target.value);
                if (customAmount && customAmount > 0) {
                    budgetValue.textContent = `$${customAmount} per day`;
                    // Store as number, not string
                    this.formData.preferences.budget_amount = customAmount;
                    await this.updateJSONPreview();
                    await this.saveFormData();
                }
            }, 500));
        }

        // Set initial values
        const initialValue = parseInt(budgetSlider.value);
        const initialAmount = budgetAmounts[initialValue - 1];
        budgetValue.textContent = `$${initialAmount} per day`;
        if (budgetLevel) {
            budgetLevel.textContent = budgetLevels[initialValue - 1];
        }

        // Set initial background
        const initialPercentage = ((initialValue - 1) / 5) * 100;
        budgetSlider.style.background = `linear-gradient(to right, #1A73E8 0%, #1A73E8 ${initialPercentage}%, #E8EAED ${initialPercentage}%, #E8EAED 100%)`;
    }

    /**
     * Setup custom chip inputs
     */
    setupCustomChipInputs() {
        const chipContainers = ['events', 'cuisines', 'dislike-events'];

        chipContainers.forEach(containerId => {
            const container = document.getElementById(`${containerId}-chips`);
            if (!container) return;

            const customChip = container.querySelector('.custom-chip');
            const customInput = document.getElementById(`${containerId}-custom`);
            const addButton = customInput?.querySelector('.add-custom-btn');
            const textField = customInput?.querySelector('.mdc-text-field__input');

            if (customChip) {
                customChip.addEventListener('click', () => {
                    if (customInput) {
                        const isVisible = customInput.style.display !== 'none';
                        customInput.style.display = isVisible ? 'none' : 'flex';
                        if (!isVisible && textField) {
                            textField.focus();
                        }
                    }
                });
            }

            if (addButton && textField) {
                addButton.addEventListener('click', () => this.addCustomChip(containerId, textField.value));
                textField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addCustomChip(containerId, textField.value);
                    }
                });
            }
        });
    }

    /**
     * Add custom chip to a container
     */
    addCustomChip(containerId, value) {
        if (!value.trim()) return;

        const container = document.getElementById(`${containerId}-chips`);
        const chipSet = container.querySelector('.mdc-chip-set');
        const customChip = chipSet.querySelector('.custom-chip');
        const textField = document.getElementById(`${containerId}-custom`).querySelector('.mdc-text-field__input');

        // Create new chip
        const newChip = document.createElement('div');
        newChip.className = 'mdc-chip mdc-chip--filter';
        newChip.setAttribute('role', 'row');
        newChip.innerHTML = `
            <div class="mdc-chip__ripple"></div>
            <span class="mdc-chip__checkmark">
                <svg class="mdc-chip__checkmark-svg" viewBox="-2 -3 30 30">
                    <path class="mdc-chip__checkmark-path" fill="none" stroke="black" d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                </svg>
            </span>
            <span role="gridcell">
                <span role="checkbox" class="mdc-chip__primary-action" tabindex="0">
                    <span class="mdc-chip__text">${Utils.sanitizeHtml(value.trim())}</span>
                </span>
            </span>
            <span role="gridcell">
                <button class="mdc-chip__trailing-action" tabindex="-1">
                    <span class="mdc-chip__trailing-action__ripple"></span>
                    <span class="material-icons mdc-chip__trailing-action__icon">close</span>
                </button>
            </span>
        `;

        // Insert before custom chip
        chipSet.insertBefore(newChip, customChip);

        // Initialize MDC chip
        mdc.chips.MDCChip.attachTo(newChip);

        // Add remove functionality
        const removeButton = newChip.querySelector('.mdc-chip__trailing-action');
        removeButton.addEventListener('click', () => {
            newChip.remove();
            this.updateFormData();
            this.updateJSONPreview();
        });

        // Clear input and hide
        textField.value = '';
        document.getElementById(`${containerId}-custom`).style.display = 'none';

        // Update form data
        this.updateFormData();
        this.updateJSONPreview();
    }

    /**
     * Toggle date input option
     */
    toggleDateOption() {
        const endDateField = document.getElementById('end-date-field');
        const durationField = document.getElementById('duration-field');
        const selectedOption = document.querySelector('input[name="date-option"]:checked').value;

        if (selectedOption === 'end-date') {
            endDateField.style.display = 'block';
            durationField.style.display = 'none';
        } else {
            endDateField.style.display = 'none';
            durationField.style.display = 'block';
            this.calculateEndDate();
        }
    }

    /**
     * Calculate end date based on start date and number of days
     */
    calculateEndDate() {
        const startDateInput = document.getElementById('start_date');
        const numberOfDaysInput = document.getElementById('number_of_days');
        const endDateInput = document.getElementById('end_date');

        if (startDateInput.value && numberOfDaysInput.value) {
            const startDate = new Date(startDateInput.value);
            const numberOfDays = parseInt(numberOfDaysInput.value);

            if (startDate && numberOfDays > 0) {
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + numberOfDays);
                // Format as yyyy-mm-dd for HTML date input
                const year = endDate.getFullYear();
                const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                const day = endDate.getDate().toString().padStart(2, '0');
                endDateInput.value = `${year}-${month}-${day}`;
            }
        }
    }

    /**
     * Update form data from form inputs
     */
    updateFormData() {
        // Basic text inputs
        this.formData.city = document.getElementById('city').value.trim();
        this.formData.country = document.getElementById('country').value.trim();

        // Date inputs - convert from HTML date format (yyyy-mm-dd) to dd.mm.yyyy if needed
        const startDateInput = document.getElementById('start_date').value;
        const endDateInput = document.getElementById('end_date').value;

        // Convert dates to dd.mm.yyyy format for the JSON
        if (startDateInput) {
            const [year, month, day] = startDateInput.split('-');
            this.formData.date.start_date = `${day}.${month}.${year}`;
        } else {
            this.formData.date.start_date = '';
        }

        if (endDateInput) {
            const [year, month, day] = endDateInput.split('-');
            this.formData.date.end_date = `${day}.${month}.${year}`;
        } else {
            this.formData.date.end_date = '';
        }

        this.formData.date.number_of_days = parseInt(document.getElementById('number_of_days').value) || null;

        // People inputs
        this.formData.people.number_of_people = parseInt(document.getElementById('number_of_people').value) || null;
        this.formData.people.people_details = document.getElementById('people_details').value.trim() || null;

        // Preferences
        this.formData.preferences.events = this.getSelectedChips('events-chips');
        this.formData.preferences.cousines = this.getSelectedChips('cuisines-chips');
        this.formData.preferences.places = this.getSelectedChips('places-chips');
        this.formData.preferences.budget_amount = this.getSelectedBudget();
        this.formData.preferences.currency = this.getSelectedCurrency();
        this.formData.preferences.general_notes = document.getElementById('general_notes').value.trim() || null;

        // Dislikes
        this.formData.dislikes.events = this.getSelectedChips('dislike-events-chips');
        this.formData.dislikes.cousines = this.getSelectedChips('dislike-cuisines-chips');
        this.formData.dislikes.places = this.getSelectedChips('dislike-places-chips');
        this.formData.dislikes.general_note = document.getElementById('general_dislikes').value.trim() || null;

        // Hotel
        this.formData.hotel.hotel_type = this.getSelectedHotelType();
        this.formData.hotel.location_preference = this.getSelectedChips('location-chips');
        this.formData.hotel.budget_per_night = this.getSelectedHotelBudget();
        this.formData.hotel.amenities = this.getSelectedChips('amenities-chips');
        this.formData.hotel.room_type = this.getSelectedRoomType();
        this.formData.hotel.special_requests = document.getElementById('special_requests').value.trim() || null;

        // Auto-calculate end date if using duration
        const selectedOption = document.querySelector('input[name="date-option"]:checked');
        if (selectedOption && selectedOption.value === 'duration') {
            this.calculateEndDate();
            this.formData.date.end_date = document.getElementById('end_date').value;
        }
    }

    /**
     * Get selected chips from a container
     */
    getSelectedChips(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Get only actually selected chips (excluding the "Other" custom-chip button)
        const selectedChips = container.querySelectorAll('.mdc-chip--selected:not(.custom-chip)');
        
        if (selectedChips.length === 0) return null;

        return Array.from(selectedChips).map(chip => {
            return chip.querySelector('.mdc-chip__text').textContent.trim();
        });
    }

    /**
     * Get selected budget as a number
     */
    getSelectedBudget() {
        const budgetSlider = document.getElementById('budgetSlider');
        if (!budgetSlider) return 250; // Default to 250 if slider not found
        
        const value = parseInt(budgetSlider.value) || 3; // Default to position 3 (250) if no value
        const budgetAmounts = [50, 100, 250, 500, 1000, null];

        // Handle custom budget
        if (value === 6) {
            const customBudgetInput = document.getElementById('customBudget');
            if (customBudgetInput && customBudgetInput.value) {
                return parseFloat(customBudgetInput.value);
            }
            return 250; // Default to 250 if custom but no value entered
        }

        return budgetAmounts[value - 1] || 250; // Default to 250 if invalid value
    }

    /**
     * Get selected currency
     */
    getSelectedCurrency() {
        const currencyChips = document.getElementById('currency-chips');
        if (!currencyChips) return null;

        const selectedChip = currencyChips.querySelector('.mdc-chip--selected');
        if (selectedChip) {
            return selectedChip.querySelector('.mdc-chip__text').textContent.trim();
        }
        return null;
    }

    /**
     * Get selected hotel type
     */
    getSelectedHotelType() {
        const hotelChips = document.getElementById('hotel-type-chips');
        if (!hotelChips) return null;

        const selectedChip = hotelChips.querySelector('.mdc-chip--selected');
        if (selectedChip) {
            const value = selectedChip.getAttribute('data-value');
            return value || null;
        }
        return null;
    }

    /**
     * Get selected hotel budget
     */
    getSelectedHotelBudget() {
        // This would be implemented similar to main budget if you add hotel budget chips
        return null;
    }

    /**
     * Get selected room type
     */
    getSelectedRoomType() {
        // This would be implemented if you add room type select
        return null;
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        const step = this.currentStep;
        let isValid = true;
        const errors = [];

        switch (step) {
            case 1: // Destination
                // Allow moving to next step even with empty fields for demo
                // In production, you might want stricter validation

                // For now, always allow progression for demo purposes
                // Remove these comments and uncomment below for strict validation
                /*
                if (!this.validateField('city', this.formData.city)) {
                    isValid = false;
                    errors.push('Please enter a valid city name');
                }
                if (!this.validateField('country', this.formData.country)) {
                    isValid = false;
                    errors.push('Please enter a valid country name');
                }
                */
                break;

            case 2: // Dates
                // Removed date format validation - HTML5 date inputs handle this
                if (this.formData.date.start_date && this.formData.date.end_date) {
                    // Parse dates properly from dd.mm.yyyy format
                    const startParts = this.formData.date.start_date.split('.');
                    const endParts = this.formData.date.end_date.split('.');

                    if (startParts.length === 3 && endParts.length === 3) {
                        const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
                        const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);

                        if (endDate <= startDate) {
                            isValid = false;
                            errors.push('End date must be after start date');
                        }
                    }
                }
                break;

            case 3: // People
                if (this.formData.people.number_of_people < 1) {
                    isValid = false;
                    errors.push('Number of people must be at least 1');
                }
                break;

            case 4: // Preferences
            case 5: // Dislikes
            case 6: // Hotel
                // These steps are optional, no validation required
                break;
        }

        this.updateStepValidation(step, isValid, errors);
        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(fieldName, value) {
        const rules = this.validationRules[fieldName];
        if (!rules) return true;

        if (rules.required && (!value || value.trim() === '')) {
            return false;
        }

        if (value && rules.minLength && value.length < rules.minLength) {
            return false;
        }

        if (value && rules.pattern && !rules.pattern.test(value)) {
            return false;
        }

        if (value && rules.format === 'date' && !Utils.isValidDateFormat(value)) {
            return false;
        }

        if (value && rules.min && parseFloat(value) < rules.min) {
            return false;
        }

        if (value && rules.max && parseFloat(value) > rules.max) {
            return false;
        }

        return true;
    }

    /**
     * Update step validation UI
     */
    updateStepValidation(step, isValid, errors) {
        const stepIndicator = document.querySelector(`.step-indicator[data-step="${step}"]`);
        if (stepIndicator) {
            stepIndicator.classList.toggle('error', !isValid);
        }

        // Update next button state
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (step === this.maxSteps) {
            if (submitBtn) {
                submitBtn.disabled = !isValid;
                submitBtn.style.opacity = isValid ? '1' : '0.5';
            }
        } else {
            if (nextBtn) {
                nextBtn.disabled = !isValid;
                nextBtn.style.opacity = isValid ? '1' : '0.5';
            }
        }

        // Show/hide errors
        if (errors.length > 0 && !isValid) {
            this.showStepErrors(errors);
        } else {
            this.hideStepErrors();
        }
    }

    /**
     * Show step errors
     */
    showStepErrors(errors) {
        // Remove existing error messages
        this.hideStepErrors();

        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'step-errors';
        errorContainer.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <div class="error-text">
                    ${errors.map(error => `<p>${Utils.sanitizeHtml(error)}</p>`).join('')}
                </div>
            </div>
        `;

        // Add to current step
        const currentStepElement = document.querySelector('.form-step.active');
        if (currentStepElement) {
            currentStepElement.appendChild(errorContainer);
        }
    }

    /**
     * Hide step errors
     */
    hideStepErrors() {
        const errorContainers = document.querySelectorAll('.step-errors');
        errorContainers.forEach(container => container.remove());
    }

    /**
     * Go to next step
     */
    nextStep() {

        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < this.maxSteps) {
            this.goToStep(this.currentStep + 1);
        } else {
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    /**
     * Go to specific step
     */
    goToStep(step) {
        if (step < 1 || step > this.maxSteps) return;

        // Hide all steps first
        const allSteps = document.querySelectorAll('.form-step');
        allSteps.forEach(stepElement => {
            stepElement.classList.remove('active');
        });

        // Show target step
        const targetStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStepElement) {
            targetStepElement.classList.add('active');
        }

        // Update current step
        this.currentStep = step;

        // Update UI
        this.updateProgressIndicator();
        this.updateNavigationButtons();
        this.updateStepIndicators();
        this.updateJSONPreview(); // Update JSON when switching tabs

        // Save current step
        Storage.form.setLastFormStep(step);

        // Focus first input in new step
        this.focusFirstInput();

        // Validate new step
        this.validateCurrentStep();
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator() {
        if (this.progressIndicator) {
            const progress = (this.currentStep - 1) / (this.maxSteps - 1);
            this.progressIndicator.progress = progress;
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }

        // Next/Submit button
        if (this.currentStep === this.maxSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    /**
     * Update step indicators
     */
    updateStepIndicators() {
        const indicators = document.querySelectorAll('.step-indicator');

        indicators.forEach((indicator) => {
            const stepNumber = parseInt(indicator.getAttribute('data-step'));

            // Remove all classes first
            indicator.classList.remove('active', 'completed');

            if (stepNumber === this.currentStep) {
                indicator.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                indicator.classList.add('completed');
            }
        });
    }

    /**
     * Focus first input in current step
     */
    focusFirstInput() {
        setTimeout(() => {
            const currentStep = document.querySelector('.form-step.active');
            const firstInput = currentStep?.querySelector('input, textarea, select');
            if (firstInput && !Utils.isMobile()) {
                firstInput.focus();
            }
        }, 100);
    }

    /**
     * Load form data from form.json file via API
     */
    async loadFormData() {
        // Clear any existing form data on initialization to start fresh
        Storage.form.clearFormData();
        
        // Clear the last form step to always start from step 1
        Storage.form.setLastFormStep(1);
        
        // Clear server-side form.json by resetting to default empty state
        try {
            await this.clearServerFormData();
        } catch (error) {
            console.warn('Could not clear server form data:', error);
        }

        // Reset to initial form state
        this.formData = this.initializeFormData();
        
        // Clear the actual HTML form to remove any cached/default values
        this.clearHTMLForm();
        
        // Always start from step 1
        this.goToStep(1);
        
        console.log('📋 Form initialized with fresh data and reset to step 1');
    }

    /**
     * Clear all HTML form inputs and selections
     */
    clearHTMLForm() {
        // Reset the form DOM
        const form = document.getElementById('tourPlanningForm');
        if (form) {
            form.reset();
        }

        // Clear specific inputs that might have cached values
        const inputsTolear = [
            'city', 'country', 'start_date', 'end_date', 'number_of_days',
            'number_of_people', 'people_details', 'general_notes', 
            'general_dislikes', 'special_requests', 'customBudget'
        ];

        inputsTolear.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
            }
        });

        // Reset budget slider to default position 3 (250)
        const budgetSlider = document.getElementById('budgetSlider');
        if (budgetSlider) {
            budgetSlider.value = '3'; // Default to position 3 (250)
        }

        // Clear all chip selections
        const chipSets = document.querySelectorAll('.mdc-chip-set--filter .mdc-chip');
        chipSets.forEach(chip => {
            chip.classList.remove('mdc-chip--selected');
        });

        console.log('🧹 HTML form cleared');
    }

    /**
     * Clear server-side form.json file
     */
    async clearServerFormData() {
        try {
            const response = await fetch('/api/form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });
            
            if (response.ok) {
                console.log('🗑️ Server form data cleared');
            }
        } catch (error) {
            console.warn('Error clearing server form data:', error);
        }
    }

    /**
     * Populate form with data
     */
    populateForm() {
        // Basic inputs
        this.setInputValue('city', this.formData.city);
        this.setInputValue('country', this.formData.country);
        this.setInputValue('start_date', this.formData.date.start_date);
        this.setInputValue('end_date', this.formData.date.end_date);
        this.setInputValue('number_of_days', this.formData.date.number_of_days);
        this.setInputValue('number_of_people', this.formData.people.number_of_people);
        this.setInputValue('people_details', this.formData.people.people_details);
        this.setInputValue('general_notes', this.formData.preferences.general_notes);
        this.setInputValue('general_dislikes', this.formData.dislikes.general_note);
        this.setInputValue('special_requests', this.formData.hotel.special_requests);

        // Chips and selects would need more complex population logic
        // This would be implemented based on the specific chip/select components
    }

    /**
     * Set input value helper
     */
    setInputValue(id, value) {
        const input = document.getElementById(id);
        if (input && value != null) {
            input.value = value;
        }
    }

    /**
     * Save form data to form.json file via API
     */
    async saveFormData() {
        this.updateFormData();

        try {
            const response = await fetch('/api/form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });

            const result = await response.json();

            if (result.success) {
                // Also save to localStorage as backup
                Storage.form.saveFormData(this.formData);
                return true;
            } else {
                console.error('❌ Failed to save form data:', result.error);
                Utils.showNotification('Failed to save form data', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving form data:', error);
            // Fallback to localStorage
            return Storage.form.saveFormData(this.formData);
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        if (this.autoSaveEnabled) {
            this.autoSaveInterval = setInterval(() => {
                this.saveFormData();
            }, 30000); // Auto-save every 30 seconds
        }
    }

    /**
     * Reset form data to default values (empty values, keep structure)
     */
    async resetFormValues() {
        // Reset to default empty values
        const defaultData = this.initializeFormData();
        this.formData = defaultData;

        // Save the reset data to form.json
        try {
            const response = await fetch('/api/form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            });

            if (response.ok) {
            }
        } catch (error) {
            console.error('Error resetting form data:', error);
        }
    }

    /**
     * Setup handler for page unload/close
     */
    setupUnloadHandler() {
        // Handle page unload (closing tab, navigating away)
        window.addEventListener('beforeunload', (event) => {
            // Reset form values when leaving the page
            // Note: We can't use async in beforeunload, so we use sendBeacon
            const defaultData = this.initializeFormData();
            const data = JSON.stringify(defaultData);
            const blob = new Blob([data], { type: 'application/json' });

            // Try to send reset data to server
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/form', blob);
            }
        });

        // Also handle visibility change (tab switching, minimizing)
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'hidden') {
                // When page becomes hidden, reset the form
                await this.resetFormValues();
            }
        });
    }

    /**
     * Set auto-save enabled/disabled
     */
    setAutoSave(enabled) {
        this.autoSaveEnabled = enabled;
        Storage.form.setAutoSaveEnabled(enabled);

        if (enabled) {
            this.setupAutoSave();
        } else if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Initialize JSON preview
     */
    async initializeJSONPreview() {
        await this.updateJSONPreview();
    }

    /**
     * Initialize JSON preview with current formData (without reading from DOM)
     */
    async initializeJSONPreviewWithCurrentData() {
        const jsonDisplay = document.getElementById('jsonDisplay');
        if (!jsonDisplay) return;

        try {
            // Save current formData directly to form.json (don't read from DOM)
            await this.saveFormDataDirect();

            // Then display current formData
            jsonDisplay.textContent = JSON.stringify(this.formData, null, 2);
        } catch (error) {
            console.error('Error initializing JSON preview:', error);
            // Fallback to current formData
            jsonDisplay.textContent = JSON.stringify(this.formData, null, 2);
        }
    }

    /**
     * Save current formData directly without reading from DOM
     */
    async saveFormDataDirect() {
        try {
            const response = await fetch('/api/form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });

            const result = await response.json();
            
            if (result.success) {
                // Also save to localStorage as backup
                Storage.form.saveFormData(this.formData);
                return true;
            } else {
                console.error('❌ Failed to save form data:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error saving form data:', error);
            // Fallback to localStorage
            return Storage.form.saveFormData(this.formData);
        }
    }

    /**
     * Update JSON preview - loads and displays form.json content
     */
    async updateJSONPreview() {
        const jsonDisplay = document.getElementById('jsonDisplay');
        if (!jsonDisplay) return;

        try {
            // First, save current form data to form.json
            this.updateFormData();
            await this.saveFormData();

            // Then load and display form.json content
            const response = await fetch('/api/form');

            if (response.ok) {
                const formData = await response.json();
                const formattedJSON = JSON.stringify(formData, null, 2);
                jsonDisplay.textContent = formattedJSON;
                this.highlightJSON(jsonDisplay);
            } else {
                // Fallback to in-memory data
                const formattedJSON = JSON.stringify(this.formData, null, 2);
                jsonDisplay.textContent = formattedJSON;
                this.highlightJSON(jsonDisplay);
            }
        } catch (error) {
            console.error('Error updating JSON preview:', error);
            // Fallback to in-memory data
            const formattedJSON = JSON.stringify(this.formData, null, 2);
            jsonDisplay.textContent = formattedJSON;
            this.highlightJSON(jsonDisplay);
        }
    }

    /**
     * Highlight JSON syntax
     */
    highlightJSON(element) {
        let json = element.textContent;

        // Simple JSON syntax highlighting
        json = json.replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>');
        json = json.replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>');
        json = json.replace(/: (\d+)/g, ': <span class="json-number">$1</span>');
        json = json.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
        json = json.replace(/: null/g, ': <span class="json-null">null</span>');

        element.innerHTML = json;
    }

    /**
     * Toggle JSON preview visibility
     */
    toggleJSONPreview() {
        const content = document.getElementById('jsonPreviewContent');
        const toggle = document.getElementById('jsonToggle');

        if (content && toggle) {
            const isExpanded = content.classList.contains('expanded');
            content.classList.toggle('expanded');
            toggle.classList.toggle('expanded');

            if (!isExpanded) {
                this.updateJSONPreview();
            }
        }
    }

    /**
     * Copy JSON to clipboard - from form.json file
     */
    async copyJSON() {
        try {
            // First save current data
            this.updateFormData();
            await this.saveFormData();

            // Load from form.json
            const response = await fetch('/api/form');
            let jsonString;

            if (response.ok) {
                const formData = await response.json();
                jsonString = JSON.stringify(formData, null, 2);
            } else {
                // Fallback to in-memory data
                jsonString = JSON.stringify(this.formData, null, 2);
            }

            const success = await Utils.copyToClipboard(jsonString);

            if (success) {
                Utils.showNotification('JSON copied to clipboard!', 'success');
            } else {
                Utils.showNotification('Failed to copy JSON', 'error');
            }
        } catch (error) {
            console.error('Error copying JSON:', error);
            Utils.showNotification('Failed to copy JSON', 'error');
        }
    }

    /**
     * Download JSON file - from form.json
     */
    async downloadJSON() {
        try {
            // First save current data
            this.updateFormData();
            await this.saveFormData();

            // Load from form.json
            const response = await fetch('/api/form');
            let jsonString;

            if (response.ok) {
                const formData = await response.json();
                jsonString = JSON.stringify(formData, null, 2);
            } else {
                // Fallback to in-memory data
                jsonString = JSON.stringify(this.formData, null, 2);
            }

            const filename = `form-${this.formData.city || 'unknown'}-${Date.now()}.json`;
            Utils.downloadFile(jsonString, filename, 'application/json');
            Utils.showNotification('JSON file downloaded!', 'success');
        } catch (error) {
            console.error('Error downloading JSON:', error);
            Utils.showNotification('Failed to download JSON', 'error');
        }
    }

    /**
     * Submit form
     */
    submitForm() {
        // Validate all steps
        let allValid = true;
        for (let step = 1; step <= this.maxSteps; step++) {
            const tempStep = this.currentStep;
            this.currentStep = step;
            if (!this.validateCurrentStep()) {
                allValid = false;
                this.goToStep(step);
                break;
            }
            this.currentStep = tempStep;
        }

        if (!allValid) {
            Utils.showNotification('Please fix the errors before submitting', 'error');
            return;
        }

        // Update and save form data
        this.updateFormData();
        this.saveFormData();

        // Save to history
        const formName = `${this.formData.city}, ${this.formData.country} - ${Utils.formatTimestamp(Utils.getCurrentTimestamp())}`;
        Storage.form.saveToHistory(this.formData, formName);

        // Generate travel plan using ADK agent
        this.generatePlan();
    }

    /**
     * Generate travel plan using ADK agent with validation and retry
     */
    async generatePlan() {
        const maxRetries = 3;
        let currentAttempt = 0;
        
        try {
            // Show loading modal
            const loadingModal = this.showLoadingModal();
            
            // Send to ADK agent via ChatManager if available
            if (!window.chatManager) {
                console.error('❌ ChatManager not available');
                loadingModal.remove();
                Utils.showNotification('Chat system not initialized. Please refresh the page.', 'error');
                return;
            }

            while (currentAttempt < maxRetries) {
                currentAttempt++;
                
                try {
                    // Update loading modal with current attempt
                    this.updateLoadingModal(loadingModal, currentAttempt, maxRetries);
                    
                    // Format prompt with form data
                    const promptMessage = this.formatPromptWithFormData(currentAttempt);
                    
                    console.log(`🎯 Sending to Tourgent Agent (Attempt ${currentAttempt}/${maxRetries}):`);
                    console.log('📝 Prompt:', promptMessage);
                    
                    const response = await window.chatManager.sendToADKAgent(promptMessage);
                    
                    console.log(`🤖 Tourgent Agent Response (Attempt ${currentAttempt}):`);
                    console.log(response);
                    
                    // Validate the response format
                    const validationResult = this.validateAgentResponse(response);
                    
                    if (validationResult.valid) {
                        console.log('✅ Response format is valid!');
                        
                        // Hide loading modal
                        loadingModal.remove();
                        
                        // Save response to output.json
                        await this.saveResponseToFile(response);
                        
                        // Display the response on the website
                        this.displayAgentResponse(response);
                        return;
                        
                    } else {
                        console.warn(`⚠️ Response format invalid (Attempt ${currentAttempt}): ${validationResult.error}`);
                        
                        if (currentAttempt < maxRetries) {
                            console.log(`🔄 Retrying... (${currentAttempt + 1}/${maxRetries})`);
                            // Add a small delay between retries
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                    
                } catch (attemptError) {
                    console.error(`❌ Error in attempt ${currentAttempt}:`, attemptError);
                    
                    if (currentAttempt < maxRetries) {
                        console.log(`🔄 Retrying due to error... (${currentAttempt + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            
            // All attempts failed
            loadingModal.remove();
            Utils.showNotification(
                `Failed to get properly formatted response after ${maxRetries} attempts. Please try again.`, 
                'error', 
                8000
            );
            
        } catch (error) {
            console.error('❌ Error in generatePlan:', error);
            // Hide loading modal if it exists
            const existingModal = document.querySelector('.loading-modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }
            Utils.showNotification('Failed to generate travel plan. Please try again.', 'error');
        }
    }

    /**
     * Update loading modal with retry information
     */
    updateLoadingModal(modal, currentAttempt, maxRetries) {
        const loadingContent = modal.querySelector('.loading-content');
        if (loadingContent) {
            const attemptText = currentAttempt > 1 ? 
                `<p class="retry-info">Attempt ${currentAttempt} of ${maxRetries}</p>` : '';
            
            loadingContent.innerHTML = `
                <div class="loading-spinner"></div>
                <h2>🎯 Your Route Is Being Generated...</h2>
                <p>Tourgent is crafting your perfect travel plan</p>
                ${attemptText}
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
        }
    }

    /**
     * Validate agent response and extract JSON
     */
    validateAgentResponse(response) {
        try {
            // Try to extract JSON from the response
            let jsonData;
            try {
                // Try to extract JSON from the response if it contains other text
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[0]);
                } else {
                    // If no JSON found, try parsing the entire response
                    jsonData = JSON.parse(response);
                }
            } catch (parseError) {
                return { valid: false, error: `Invalid JSON: ${parseError.message}` };
            }
            
            // Validate the structure
            return this.validateResponseFormat(jsonData);
            
        } catch (error) {
            return { valid: false, error: `Validation error: ${error.message}` };
        }
    }

    /**
     * Show loading modal while waiting for agent response
     */
    showLoadingModal() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-modal-overlay';
        overlay.innerHTML = `
            <div class="loading-modal">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <h2>🎯 Your Route Is Being Generated...</h2>
                    <p>Tourgent is crafting your perfect travel plan</p>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        // Add styles for the loading modal
        if (!document.getElementById('loading-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'loading-modal-styles';
            styles.textContent = `
                .loading-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                    backdrop-filter: blur(4px);
                }
                .loading-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    width: 90%;
                }
                .loading-content h2 {
                    margin: 20px 0 10px 0;
                    color: #1976d2;
                    font-size: 1.5em;
                    font-weight: 600;
                }
                .loading-content p {
                    margin: 0 0 30px 0;
                    color: #666;
                    font-size: 1em;
                }
                .retry-info {
                    margin: 10px 0;
                    font-size: 14px;
                    color: #ff9800;
                    font-style: italic;
                    font-weight: 500;
                }
                .loading-spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #1976d2;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .loading-dots {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                }
                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #1976d2;
                    animation: bounce 1.4s ease-in-out infinite both;
                }
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                .loading-dots span:nth-child(3) { animation-delay: 0s; }
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @media (max-width: 768px) {
                    .loading-modal {
                        padding: 30px 20px;
                    }
                    .loading-content h2 {
                        font-size: 1.3em;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * Display the agent's response on the website
     */
    displayAgentResponse(response) {
        // Create a modal or overlay to display the response
        const overlay = document.createElement('div');
        overlay.className = 'agent-response-overlay';
        overlay.innerHTML = `
            <div class="agent-response-modal">
                <div class="modal-header">
                    <h2>🎯 Your Travel Plan from Tourgent</h2>
                    <button class="close-modal" aria-label="Close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="response-text">${Utils.renderMarkdown ? Utils.renderMarkdown(response) : response.replace(/\n/g, '<br>')}</div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary copy-response">Copy Response</button>
                    <button class="btn-primary continue-btn">Continue to Routes</button>
                </div>
            </div>
        `;

        // Add styles for the modal
        if (!document.getElementById('agent-response-styles')) {
            const styles = document.createElement('style');
            styles.id = 'agent-response-styles';
            styles.textContent = `
                .agent-response-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .agent-response-modal {
                    background: white;
                    border-radius: 12px;
                    max-width: 800px;
                    max-height: 90vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                .modal-header {
                    padding: 24px 24px 0 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #e0e0e0;
                    padding-bottom: 16px;
                }
                .modal-header h2 {
                    margin: 0;
                    color: #1976d2;
                    font-size: 1.5em;
                }
                .close-modal {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                    border-radius: 4px;
                }
                .close-modal:hover {
                    background: #f5f5f5;
                    color: #333;
                }
                .modal-content {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                    line-height: 1.6;
                }
                .response-text {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    color: #333;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .modal-actions {
                    padding: 16px 24px 24px 24px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    border-top: 1px solid #e0e0e0;
                }
                .btn-secondary, .btn-primary {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .btn-secondary {
                    background: #f5f5f5;
                    color: #333;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }
                .btn-primary {
                    background: #1976d2;
                    color: white;
                }
                .btn-primary:hover {
                    background: #1565c0;
                }
                @media (max-width: 768px) {
                    .agent-response-modal {
                        margin: 10px;
                        max-height: calc(100vh - 20px);
                    }
                    .modal-actions {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(overlay);

        // Add event listeners
        const closeModal = () => {
            overlay.remove();
        };

        overlay.querySelector('.close-modal').addEventListener('click', closeModal);
        overlay.querySelector('.continue-btn').addEventListener('click', () => {
            closeModal();
            window.location.href = 'routes.html';
        });

        overlay.querySelector('.copy-response').addEventListener('click', () => {
            navigator.clipboard.writeText(response).then(() => {
                Utils.showNotification('Response copied to clipboard!', 'success');
            }).catch(() => {
                Utils.showNotification('Could not copy to clipboard', 'error');
            });
        });

        // Close modal when clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Close with Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Show success notification
        Utils.showNotification('Travel plan generated successfully!', 'success');
    }

    /**
     * Validate if the response matches the required JSON structure
     */
    validateResponseFormat(jsonData) {
        try {
            // Check if it's an object
            if (!jsonData || typeof jsonData !== 'object') {
                return { valid: false, error: 'Response is not a valid object' };
            }

            // Check required top-level keys
            if (!jsonData.hotel_information || !jsonData.day_plans) {
                return { valid: false, error: 'Missing required keys: hotel_information or day_plans' };
            }

            // Validate hotel_information structure
            const hotel = jsonData.hotel_information;
            const requiredHotelKeys = ['name', 'place_id', 'lat', 'lon', 'address', 'check_in', 'check_out', 'nights'];
            for (const key of requiredHotelKeys) {
                if (!(key in hotel)) {
                    return { valid: false, error: `Missing hotel key: ${key}` };
                }
            }

            // Validate day_plans structure
            if (!Array.isArray(jsonData.day_plans)) {
                return { valid: false, error: 'day_plans must be an array' };
            }

            if (jsonData.day_plans.length === 0) {
                return { valid: false, error: 'day_plans array is empty' };
            }

            // Validate each day plan
            for (let i = 0; i < jsonData.day_plans.length; i++) {
                const day = jsonData.day_plans[i];
                const requiredDayKeys = ['order', 'date', 'places', 'summary'];
                for (const key of requiredDayKeys) {
                    if (!(key in day)) {
                        return { valid: false, error: `Day ${i + 1} missing key: ${key}` };
                    }
                }

                // Validate places array
                if (!Array.isArray(day.places)) {
                    return { valid: false, error: `Day ${i + 1} places must be an array` };
                }

                // Validate each place
                for (let j = 0; j < day.places.length; j++) {
                    const place = day.places[j];
                    const requiredPlaceKeys = ['order', 'place_id', 'lat', 'lon', 'name', 'place_type', 'travel', 'time'];
                    for (const key of requiredPlaceKeys) {
                        if (!(key in place)) {
                            return { valid: false, error: `Day ${i + 1}, place ${j + 1} missing key: ${key}` };
                        }
                    }

                    // Validate travel object
                    if (!place.travel || typeof place.travel !== 'object') {
                        return { valid: false, error: `Day ${i + 1}, place ${j + 1} travel must be an object` };
                    }
                    if (!('mode' in place.travel)) {
                        return { valid: false, error: `Day ${i + 1}, place ${j + 1} travel missing mode` };
                    }
                }
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: `Validation error: ${error.message}` };
        }
    }

    /**
     * Save agent response to output.json file
     */
    async saveResponseToFile(response) {
        try {
            console.log('💾 Saving response to output.json...');
            
            // Parse the response if it's a JSON string
            let jsonData;
            try {
                // Try to extract JSON from the response if it contains other text
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[0]);
                } else {
                    // If no JSON found, try parsing the entire response
                    jsonData = JSON.parse(response);
                }
            } catch (parseError) {
                console.warn('⚠️ Response is not valid JSON, saving as text:', parseError);
                jsonData = { raw_response: response, timestamp: new Date().toISOString() };
            }
            
            const saveResponse = await fetch('/api/save-output', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });
            
            if (saveResponse.ok) {
                console.log('✅ Response saved to output.json successfully');
                Utils.showNotification('Travel plan saved successfully!', 'success');
            } else {
                throw new Error(`Failed to save: ${saveResponse.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error saving response to file:', error);
            Utils.showNotification('Warning: Could not save travel plan to file', 'warning');
            // Don't throw error to avoid breaking the flow
        }
    }

    /**
     * Format prompt with form data for ADK agent
     */
    formatPromptWithFormData(attemptNumber = 1) {
        const retryText = attemptNumber > 1 ? 
            `\n\nIMPORTANT: This is attempt ${attemptNumber}. The previous response did not match the required format. Please ensure your response follows the EXACT structure specified below.` : '';
        
        const basePrompt = `Here, I share you my trip preferences, I want you to create me a tour according to the information below and DO NOT ASK ANY OTHER QUESTIONS. Just provide me with my trip. Be sure to call every sub-agent possible about getting information. Gather everything as best as you can, then ONLY RETURN ME THE JSON THAT IS GENERATED AFTER plan_summary_agent IS CALLED. DO NOT SAY ANYTHING ELSE. MAKE SURE THE JSON IS VALID.

CRITICAL: Your response MUST be a valid JSON object with this EXACT structure:

{
  "hotel_information": {
    "name": "string",
    "place_id": "string", 
    "lat": number,
    "lon": number,
    "address": "string",
    "check_in": "YYYY-MM-DD",
    "check_out": "YYYY-MM-DD", 
    "nights": number,
    "price_per_night": number|null,
    "total_price": number|null,
    "booking_link": "string"|null
  },
  "day_plans": [
    {
      "order": number,
      "date": "YYYY-MM-DD",
      "places": [
        {
          "order": number,
          "place_id": "string",
          "lat": number,
          "lon": number,
          "name": "string",
          "place_type": "string",
          "travel": {
            "mode": "string",
            "to_go": "string"|null
          },
          "time": "string"
        }
      ],
      "summary": "string"
    }
  ]
}

REQUIREMENTS:
- Response must be ONLY the JSON object, no other text
- All required keys must be present
- Numbers must be actual numbers, not strings
- Dates must be in YYYY-MM-DD format
- Each day must have at least one place
- Each place must have all required keys
- Travel object must have "mode" key${retryText}

Here is my trip information:`;
        
        // Clean and format form data for better readability
        const formattedData = JSON.stringify(this.formData, null, 2);
        
        return `${basePrompt}\n\n${formattedData}`;
    }


    /**
     * Reset form
     */
    resetForm() {
        this.formData = this.initializeFormData();
        this.currentStep = 1;

        // Clear form inputs
        document.getElementById('tourPlanningForm').reset();

        // Reset UI
        this.goToStep(1);
        this.updateJSONPreview();

        // Clear storage
        Storage.form.clearFormData();

        Utils.showNotification('Form reset successfully', 'info');
    }

    /**
     * Get form completion percentage
     */
    getCompletionPercentage() {
        const requiredFields = ['city', 'country'];
        let completedFields = 0;
        let totalFields = requiredFields.length;

        // Check required fields
        requiredFields.forEach(field => {
            if (this.formData[field] && this.formData[field].trim() !== '') {
                completedFields++;
            }
        });

        // Check optional sections (give partial credit)
        totalFields += 4; // dates, people, preferences, hotel

        if (this.formData.date.start_date) completedFields += 0.5;
        if (this.formData.date.end_date || this.formData.date.number_of_days > 0) completedFields += 0.5;

        if (this.formData.people.number_of_people > 0) completedFields += 1;

        if (this.formData.preferences.events || this.formData.preferences.cousines ||
            this.formData.preferences.places || this.formData.preferences.general_notes) {
            completedFields += 1;
        }

        if (this.formData.hotel.hotel_type || this.formData.hotel.special_requests) {
            completedFields += 1;
        }

        return Math.round((completedFields / totalFields) * 100);
    }
}

// Initialize form manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {

        // Check if we're on the form page
        if (!document.getElementById('tourPlanningForm')) {
            return;
        }

        // Initialize the form manager
        window.formManager = new FormManager();

        // Wait for async initialization to complete
        await window.formManager.init();


        // Debug: Log button states
        setTimeout(() => {
            const nextBtn = document.getElementById('nextBtn');
            const prevBtn = document.getElementById('prevBtn');
            const submitBtn = document.getElementById('submitBtn');

        }, 1000);

    } catch (error) {
        console.error('❌ Failed to initialize FormManager:', error);
    }
});