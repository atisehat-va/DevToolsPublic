// Global state variables
let listOfHolidays = [];
const typeNames = { 0: "Default", 1: "Customer Service", 2: "Holiday Schedule", "-1": "Inner Calendar" };
let activeCalcTab = 'daysBetween';

async function fetchAllHolidaySchedules() {
    const fetchXml = `
        <fetch>
            <entity name="calendar">
                <attribute name="name" />
                <attribute name="type" />
                <filter>
                    <condition attribute="name" operator="not-null" />
                </filter>
            </entity>
        </fetch>
    `;
    try {
        const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);
        return results.entities.map(entity => ({
            name: `${entity.name} (Type: ${typeNames[entity.type] || "Unknown"})`,
            type: entity.type
        }));
    } catch (error) {
        console.error("Error fetching holiday schedules:", error);
        return [];
    }
}

async function setupHolidayScheduleDropdown() {
    const dropdown = document.getElementById('holidayScheduleDropdown');
    let defaultScheduleName = '';    
    
    // Add default "Select a schedule" option immediately
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerText = '-- Select a Schedule --';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    
    // Show loading option
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.innerText = 'Loading schedules...';
    loadingOption.disabled = true;
    dropdown.appendChild(loadingOption);
    
    // Initialize calendar
    initCalendar([]);
    
    // Fetch schedules 
    const schedules = await fetchAllHolidaySchedules();
    
    // Remove loading option
    dropdown.removeChild(loadingOption);
    
    const options = schedules.map(schedule => {
        const option = document.createElement('option');
        option.value = schedule.name;
        option.innerText = schedule.name;

        if (schedule.type === 2) {
            defaultScheduleName = schedule.name;
        }
        return option;
    });

    dropdown.append(...options); 
    
    // If there's a default schedule (type 2), select it and load holidays
    if (defaultScheduleName) {
    dropdown.value = defaultScheduleName;
    displayHolidays(defaultScheduleName); 
    }
    
    dropdown.addEventListener('change', (e) => {
        if (e.target.value) {
        displayHolidays(e.target.value);
        }
    }); 
}

async function getHolidaysForSchedule(scheduleName) {
    const actualScheduleName = extractActualScheduleName(scheduleName);
    const fetchXml = buildFetchXmlForHolidays(actualScheduleName);
    const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);    
    return formatHolidays(results.entities);
}

function extractActualScheduleName(scheduleName) {
    const matchedScheduleName = scheduleName.match(/^(.*?) \(Type:/);
    return matchedScheduleName ? matchedScheduleName[1] : scheduleName;
}

function buildFetchXmlForHolidays(scheduleName) {
    return `
        <fetch>
            <entity name="calendar">
                <filter>
                    <condition attribute="name" operator="eq" value="${scheduleName}" />
                </filter>
                <link-entity name="calendarrule" from="calendarid" to="calendarid" alias="rule">
                    <attribute name="name" />
                    <attribute name="starttime" />
                    <filter>
                        <condition attribute="starttime" operator="this-year" />
                    </filter>
                </link-entity>
            </entity>
        </fetch>
    `;
} 

function formatHolidays(entities) {
    return entities.map(entity => ({
        name: entity["rule.name"],
        date: new Date(entity["rule.starttime"])
    }));
}

async function displayHolidays(scheduleName) {
    const holidaysList = document.getElementById('holidaysList');
    
    try {
        // Show loading state
        holidaysList.innerHTML = '<div style="padding: 10px; text-align: center; color: #666;">Loading holidays...</div>';
        
        const holidays = await getHolidaysForSchedule(scheduleName);       
        listOfHolidays = holidays.map(holiday => holiday.date.toISOString());              
        holidays.sort((a, b) => a.date - b.date);
                
        const fragment = document.createDocumentFragment();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        holidays.forEach(holiday => {
           const dateObj = new Date(holiday.date);
           const dayOfWeek = dayNames[dateObj.getUTCDay()];
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const year = dateObj.getUTCFullYear();
            const formattedDate = `${dayOfWeek} - ${month}/${day}/${year}`;
            
            const holidayDiv = document.createElement('div');
            holidayDiv.className = 'holiday-item';
            holidayDiv.innerHTML = `
                <div class="holiday-item-name">${holiday.name}</div>
                <div class="holiday-item-date">${formattedDate}</div>
            `;
            fragment.appendChild(holidayDiv);
        });
        
        holidaysList.innerHTML = '';
        holidaysList.appendChild(fragment);
       
        // Update calendar with new holidays
           initCalendar(holidays);
    } catch (error) {
        console.error("Error fetching holidays: ", error);
        holidaysList.innerHTML = '<div style="padding: 10px; text-align: center; color: #e81123;">Error loading holidays</div>';
    }
}

function createModalContent() {
    const container = document.createElement('div');
    container.className = 'commonPopup';
    
    container.innerHTML = `
        <div class="commonPopup-header">
            <span style="color: white;">Date Calculator</span>
            <span class="close-button">&times;</span>
        </div>
        <div class="popup-body">
            <div class="dateCalc-redesigned-layout">
                <!-- Left Panel: Schedule & Calendar -->
                <div class="dateCalc-left-panel">
                    <!-- Holiday Schedule Section -->
                    <div class="dateCalc-schedule-section">
                        <div class="dateCalc-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <h3>System Schedule</h3>
                        </div>
                        <select id="holidayScheduleDropdown" class="dateCalc-dropdown"></select>
                        <div class="dateCalc-schedule-hint">
                            Select a schedule to view this year's scheduled events
                        </div>
                        <div class="holidays-scroll" id="holidaysList"></div>
                    </div>
                    
                    <!-- Calendar Section -->
                    <div class="dateCalc-calendar-section">
                        <div class="dateCalc-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <h3>Calendar View</h3>
                </div>
                    <div class="calendar">
                        <div class="calendarHeader">
                            <button id="prevMonth">&lt;</button>
                            <span id="monthYearLabel"></span>
                            <button id="nextMonth">&gt;</button>
                        </div>
                        <div class="calendarDays">
                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                        </div>
                        <div class="calendarDates" id="calendarDates"></div>
                    </div>
                </div>
            </div>
            
                <!-- Right Panel: Calculations -->
                <div class="dateCalc-right-panel">
                    <!-- Tab Navigation -->
                    <div class="dateCalc-tab-navigation">
                        <button class="dateCalc-tab-btn active" data-tab="daysBetween">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Days Between Dates
                        </button>
                        <button class="dateCalc-tab-btn" data-tab="addDays">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Days to Date
                        </button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="dateCalc-tab-content" id="dateCalcTabContent">
                        <!-- Content will be dynamically rendered -->
                    </div>
                </div>
            </div>
        </div>
    `;    
    return container;    
}

function validateScheduleSelection(checkboxId) {
    const dropdown = document.getElementById('holidayScheduleDropdown');
    const checkbox = document.getElementById(checkboxId);
    
    if (checkbox && checkbox.checked && (!dropdown.value || dropdown.value === '')) {
        checkbox.checked = false;
        showCustomAlert('Please select a System Schedule first before excluding schedule days.');
        return false;
    }
    return true;
}

function renderCalcTab() {
    const tabContent = document.getElementById('dateCalcTabContent');
    
    if (activeCalcTab === 'daysBetween') {
        renderDaysBetweenTab(tabContent);
    } else if (activeCalcTab === 'addDays') {
        renderAddDaysTab(tabContent);
    }
    
    // Update tab button active states
    document.querySelectorAll('.dateCalc-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === activeCalcTab);
    });
    
    // Attach schedule validation to checkboxes
    const excludeScheduleCheckbox = document.getElementById('excludeSchedule');
    const addScheduleCheckbox = document.getElementById('addSchedule');
    
    if (excludeScheduleCheckbox) {
        excludeScheduleCheckbox.addEventListener('change', () => {
            validateScheduleSelection('excludeSchedule');
        });
    }
    
    if (addScheduleCheckbox) {
        addScheduleCheckbox.addEventListener('change', () => {
            validateScheduleSelection('addSchedule');
        });
    }
}

function renderDaysBetweenTab(container) {
    container.innerHTML = `
        <div class="dateCalc-tab-panel">
            <!-- Date Inputs Section with Exclusion Options -->
            <div class="dateCalc-panel-section">
                <h4 class="dateCalc-panel-title">Date Range & Exclusion Options</h4>
                <div class="dateCalc-inputs-grid">
                    <div class="dateCalc-input-field">
                        <label for="startDate1">Start Date</label>
                        <input type="date" id="startDate1">
                    </div>
                    <div class="dateCalc-input-field">
                        <label for="endDate1">End Date</label>
                        <input type="date" id="endDate1">
                    </div>
                </div>
                <div class="dateCalc-options-divider"></div>
                <div class="dateCalc-options-grid">
                    <label class="dateCalc-option-item">
                            <input type="checkbox" id="excludeSchedule">
                            <span>Exclude System Schedule Days</span>
                        </label>
                    <label class="dateCalc-option-item">
                            <input type="checkbox" id="excludeWeekends">
                            <span>Exclude Weekends</span>
                        </label>
                    <div class="dateCalc-additional-days-input">
                        <label for="daysCount">Exclude Additional Days:</label>
                        <input type="number" id="daysCount" min="0" step="1" placeholder="0" oninput="this.value = Math.max(0, parseInt(this.value) || 0)">
                    </div>
                        </div>
                    </div>
                    
            <!-- Results Section -->
            <div class="dateCalc-panel-section dateCalc-results-section">
                <h4 class="dateCalc-panel-title">Calculation Results</h4>
                <div class="dateCalc-results-grid">
                    <div class="dateCalc-result-item">
                        <span class="result-label">Days from Start to End:</span>
                        <span class="result-value" data-result="totalDays">--</span>
                        </div>
                    <div class="dateCalc-result-item">
                        <span class="result-label">Excluded Schedule Days:</span>
                        <span class="result-value" data-result="scheduleDays">--</span>
                        </div>
                    <div class="dateCalc-result-item">
                        <span class="result-label">Excluded Weekends:</span>
                        <span class="result-value" data-result="weekendDays">--</span>
                        </div>
                    <div class="dateCalc-result-item">
                        <span class="result-label">Excluded Additional Days:</span>
                        <span class="result-value" data-result="additionalDays">--</span>
                    </div>
                    <div class="dateCalc-result-divider"></div>
                    <div class="dateCalc-result-item dateCalc-result-total">
                        <span class="result-label">Net Business Days:</span>
                        <span class="result-value" data-result="finalTotal">--</span>
                    </div>
                </div>
                
                <div class="dateCalc-info-note" id="daysBetweenNote" style="display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span><strong>Note:</strong> The calculation is inclusive - both Start Date and End Date are counted as full days. Holidays on weekends are not double-counted.</span>
                </div>
            </div>
            
            <!-- Action Button -->
            <div class="dateCalc-actions">
                <button class="dateCalc-action-btn" id="calculateDaysBetweenBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Calculate Days Between
                </button>
            </div>
        </div>
    `;
    
    // Attach event listener
    document.getElementById('calculateDaysBetweenBtn').addEventListener('click', calculateDaysBetween);
}

function renderAddDaysTab(container) {
    container.innerHTML = `
        <div class="dateCalc-tab-panel">
            <!-- Date Inputs Section with Exclusion Options -->
            <div class="dateCalc-panel-section">
                <h4 class="dateCalc-panel-title">Start Date, Duration & Exclusion Options</h4>
                <div class="dateCalc-inputs-grid">
                    <div class="dateCalc-input-field">
                        <label for="pickDate">Start Date</label>
                        <input type="date" id="pickDate">
                    </div>
                    <div class="dateCalc-input-field">
                        <label for="addDaysCount">Days to Add</label>
                        <input type="number" id="addDaysCount" min="0" step="1" placeholder="0" oninput="this.value = Math.max(0, parseInt(this.value) || 0)">
                    </div>
                </div>
                <div class="dateCalc-options-divider"></div>
                <div class="dateCalc-options-grid">
                    <label class="dateCalc-option-item">
                            <input type="checkbox" id="addSchedule">
                            <span>Exclude System Schedule Days</span>
                        </label>
                    <label class="dateCalc-option-item">
                            <input type="checkbox" id="addWeekends">
                            <span>Exclude Weekends</span>
                        </label>
                </div>
                    </div>
                    
            <!-- Results Section -->
            <div class="dateCalc-panel-section dateCalc-results-section">
                <h4 class="dateCalc-panel-title">Calculation Results</h4>
                <div class="dateCalc-results-grid">
                    <div class="dateCalc-result-item">
                        <span class="result-label">Excluded Schedule Days:</span>
                        <span class="result-value" data-result="addScheduleDays">--</span>
                        </div>
                    <div class="dateCalc-result-item">
                        <span class="result-label">Excluded Weekends:</span>
                        <span class="result-value" data-result="addWeekendDays">--</span>
                        </div>
                    <div class="dateCalc-result-item">
                        <span class="result-label">Total Excluded Days:</span>
                        <span class="result-value" data-result="addTotalExcluded">--</span>
                    </div>
                    <div class="dateCalc-result-divider"></div>
                    <div class="dateCalc-result-item dateCalc-result-total">
                        <span class="result-label">Final Date:</span>
                        <span class="result-value result-value-highlight" data-result="addFinalDate">--</span>
                    </div>
                </div>
            </div>
            
            <!-- Action Button -->
            <div class="dateCalc-actions">
                <button class="dateCalc-action-btn" id="calculateAddDaysBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Calculate Final Date
                </button>
            </div>
        </div>
    `;    
    
    // Attach event listener
    document.getElementById('calculateAddDaysBtn').addEventListener('click', calculateAddDays);
}

function calculateDaysBetween() {
    const startDate = document.getElementById('startDate1').value;
    const endDate = document.getElementById('endDate1').value;

    if (!startDate || !endDate) {
        showCustomAlert('Please provide both Start Date and End Date.');
        resetResults('daysBetween');
            return; 
        }
        
    const startDateObj = createDateObject(startDate);
    const endDateObj = createDateObject(endDate);
        
        if (endDateObj < startDateObj) {
        showCustomAlert('End Date cannot be less than Start Date.');
        resetResults('daysBetween');
            return; 
        }

    const daysDifference = calculateDateDifference(startDate, endDate);
        const isExcludeWeekendsChecked = document.getElementById('excludeWeekends').checked;        
        const isExcludeScheduleChecked = document.getElementById('excludeSchedule').checked;
    
    // Validate schedule selection if trying to exclude schedule days
    if (isExcludeScheduleChecked) {
        const dropdown = document.getElementById('holidayScheduleDropdown');
        if (!dropdown.value || dropdown.value === '') {
            showCustomAlert('Please select a System Schedule before excluding schedule days.');
            resetResults('daysBetween');
            return;
        }
    }
    
    const holidaysCount = isExcludeScheduleChecked ? getHolidaysBetweenDates(startDate, endDate, isExcludeWeekendsChecked) : 0;
    const weekendsCount = isExcludeWeekendsChecked ? countWeekendsBetweenDates(startDate, endDate) : 0;
        
    const remainingDays = daysDifference - holidaysCount - weekendsCount;
    const additionalExcludedDays = Math.min(remainingDays, parseInt(document.getElementById('daysCount').value) || 0);
        const totalDays = remainingDays - additionalExcludedDays;

    document.querySelector('[data-result="totalDays"]').textContent = `${daysDifference} Day(s)`;
    document.querySelector('[data-result="scheduleDays"]').textContent = `${holidaysCount} Day(s)`;
    document.querySelector('[data-result="weekendDays"]').textContent = `${weekendsCount} Day(s)`;
    document.querySelector('[data-result="additionalDays"]').textContent = `${additionalExcludedDays} Day(s)`;
    document.querySelector('[data-result="finalTotal"]').textContent = `${totalDays} Day(s)`;
        
    const noteElement = document.getElementById('daysBetweenNote');
        if (noteElement) {
        noteElement.style.display = 'flex';
        }        
}

function calculateAddDays() {
        const startDateStr = document.getElementById('pickDate').value;
        const daysToAdd = parseInt(document.getElementById('addDaysCount').value, 10);

        if (!startDateStr || isNaN(daysToAdd)) {
        showCustomAlert('Please provide both Start Date and Days to Add.');
        resetResults('addDays');
            return;
        }
        
    if (daysToAdd < 0) {
        showCustomAlert('Days to Add cannot be negative.');
        resetResults('addDays');
            return;
        }

        const isAddWeekendsChecked = document.getElementById('addWeekends').checked;
        const isAddScheduleChecked = document.getElementById('addSchedule').checked;
    
    // Validate schedule selection if trying to exclude schedule days
    if (isAddScheduleChecked) {
        const dropdown = document.getElementById('holidayScheduleDropdown');
        if (!dropdown.value || dropdown.value === '') {
            showCustomAlert('Please select a System Schedule before excluding schedule days.');
            resetResults('addDays');
            return;
        }
    }
    
    const startDate = createDateObject(startDateStr);
    const finalDate = new Date(startDate);
    const holidaySet = new Set(listOfHolidays);

        let totalAddedDays = 0;
        let weekendsCount = 0;
        let holidaysCount = 0;
        
        while (totalAddedDays < daysToAdd) {
        finalDate.setDate(finalDate.getDate() + 1);
            const dayOfWeek = finalDate.getDay();
            const isWeekend = (dayOfWeek === 6 || dayOfWeek === 0);
            const currentDateString = finalDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
        const isHoliday = holidaySet.has(currentDateString);
            
            if (isAddWeekendsChecked && isWeekend) {
                weekendsCount++;
                continue; 
            }
            
            if (isAddScheduleChecked && isHoliday && !(isAddWeekendsChecked && isWeekend)) {
                holidaysCount++;
                continue; 
            }
            
            totalAddedDays++; 
        }
        
        const month = String(finalDate.getMonth() + 1).padStart(2, '0');
        const day = String(finalDate.getDate()).padStart(2, '0');
        const year = finalDate.getFullYear();
        const formattedFinalDate = `${month}-${day}-${year}`;
        const totalExcludedDays = weekendsCount + holidaysCount;
        
    document.querySelector('[data-result="addScheduleDays"]').textContent = `${holidaysCount} Day(s)`;
    document.querySelector('[data-result="addWeekendDays"]').textContent = `${weekendsCount} Day(s)`;
    document.querySelector('[data-result="addTotalExcluded"]').textContent = `${totalExcludedDays} Day(s)`;
    document.querySelector('[data-result="addFinalDate"]').textContent = formattedFinalDate;
}

function resetResults(tab) {
    if (tab === 'daysBetween') {
        document.querySelectorAll('.dateCalc-tab-panel [data-result]').forEach(el => {
            el.textContent = '--';
        });
        const noteElement = document.getElementById('daysBetweenNote');
        if (noteElement) {
            noteElement.style.display = 'none';
        }
    } else if (tab === 'addDays') {
        document.querySelectorAll('.dateCalc-tab-panel [data-result]').forEach(el => {
            el.textContent = '--';
    });
    }
}

function attachModalEventHandlers(container) {
    const closeButton = container.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      container.remove();
    });
    
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = '#e81123';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });
    
    makePopupMovable(container); 
    
    // Tab switching
    document.querySelectorAll('.dateCalc-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCalcTab = btn.dataset.tab;
            renderCalcTab();
        });
    });
    
    // Initial tab render
    renderCalcTab();
}

async function dateCalc() {
    try {
    const existingPopups = document.querySelectorAll('.commonPopup');
    existingPopups.forEach(popup => popup.remove());    
        
    const modalContent = createModalContent();
    modalContent.setAttribute('data-popup-id', 'dateCalculator');
    document.body.appendChild(modalContent);
        
    attachModalEventHandlers(modalContent);    
        
        setupHolidayScheduleDropdown().catch(error => {
            console.error('Error loading schedules:', error);
            if (typeof showToast === 'function') {
                showToast('Error loading schedules. Please refresh.', 'error', 3000);
}
        });
    } catch (error) {
        console.error('Error opening Date Calculator:', error);
        showToast('Error opening Date Calculator. Check console for details.', 'error', 3000);
    }
}

function initCalendar(holidays) {    
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();    

    function displayCalendar(holidays, month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();    
        
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
    
        const holidayMap = new Map();
        holidays.forEach(h => {
            const formattedDate = (h.date instanceof Date ? h.date.toISOString() : h.date).split('T')[0];
            holidayMap.set(formattedDate, h.name);
        });
    
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            fragment.appendChild(document.createElement('div'));
        }        
        
        for (let i = 1; i <= daysInMonth; i++) {
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const currentDate = `${year}-${monthStr}-${dayStr}`;
            
            const dayDiv = document.createElement('div');
            dayDiv.textContent = i;
            
            if (holidayMap.has(currentDate)) {
                dayDiv.className = 'holidayDate';
                dayDiv.title = holidayMap.get(currentDate);
            } 
            
            if (i === todayDate && month === todayMonth && year === todayYear) {
                dayDiv.className = dayDiv.className ? dayDiv.className + ' todayDate' : 'todayDate';
            }
            
            fragment.appendChild(dayDiv);
            }    
        
        const calendarDates = document.getElementById('calendarDates');
        calendarDates.innerHTML = '';
        calendarDates.appendChild(fragment);
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('monthYearLabel').textContent = `${monthNames[month]} ${year}`;
    }

    function goToPrevMonth() {
        if(currentMonth === 0) {
            currentMonth = 11;
            currentYear -= 1;
        } else {
            currentMonth -= 1;
        }
        displayCalendar(holidays, currentMonth, currentYear);
    }

    function goToNextMonth() {
        if(currentMonth === 11) {
            currentMonth = 0;
            currentYear += 1;
        } else {
            currentMonth += 1;
        }
        displayCalendar(holidays, currentMonth, currentYear);
    }

    document.getElementById('prevMonth').addEventListener('click', goToPrevMonth);
    document.getElementById('nextMonth').addEventListener('click', goToNextMonth);    
    
    displayCalendar(holidays, currentMonth, currentYear);    
}

function createDateObject(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);    
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
}

function calculateDateDifference(startDate, endDate) {
    const start = createDateObject(startDate);
    const end = createDateObject(endDate);    
    const diffInDays = (end - start) / (1000 * 60 * 60 * 24) + 1; 
    return Math.round(diffInDays); 
}

function getHolidaysBetweenDates(startDate, endDate, excludeWeekends = false) {
    const start = createDateObject(startDate);
    const end = createDateObject(endDate);
    return listOfHolidays.reduce((count, holidayDateStr) => {
        const holiday = new Date(holidayDateStr);        
        const holidayLocal = new Date(holiday.getUTCFullYear(), holiday.getUTCMonth(), holiday.getUTCDate());
        const dayOfWeek = holiday.getUTCDay();
        
        if (holidayLocal >= start && holidayLocal <= end) {
            if (excludeWeekends && (dayOfWeek === 6 || dayOfWeek === 0)) {
                return count;
                }
                count++;
        }
        return count;
    }, 0);
}

function countWeekendsBetweenDates(startDate, endDate) {
    const start = createDateObject(startDate);
    const end = createDateObject(endDate);    
    let count = 0;    
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
        if (currentDate.getDay() === 6 || currentDate.getDay() === 0) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}

// Make the function globally accessible
window.dateCalc = dateCalc;
