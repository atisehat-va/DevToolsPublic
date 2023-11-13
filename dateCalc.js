let listOfHolidays = [];
let calcDateDays = { startDate: null, endDate: null };
const typeNames = { 0: "Default", 1: "Customer Service", 2: "Holiday Schedule", "-1": "Inner Calendar" };

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
    const schedules = await fetchAllHolidaySchedules();
    const dropdown = document.getElementById('holidayScheduleDropdown');
    let defaultScheduleName = '';    
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
    dropdown.value = defaultScheduleName;
    displayHolidays(defaultScheduleName); 

    dropdown.addEventListener('change', (e) => {
        displayHolidays(e.target.value);
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
    try {
        const holidays = await getHolidaysForSchedule(scheduleName);       
        listOfHolidays = holidays.map(holiday => holiday.date.toISOString());              
        holidays.sort((a, b) => a.date - b.date);

        const holidaysList = document.getElementById('holidaysList');

       holidaysList.innerHTML = holidays.map(holiday => {
           const dateObj = new Date(holiday.date);
           const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
           const dayOfWeek = dayNames[dateObj.getUTCDay()];
           const formattedDate = `${dayOfWeek} - ${("0" + (dateObj.getUTCMonth() + 1)).slice(-2)}/${("0" + dateObj.getUTCDate()).slice(-2)}/${dateObj.getUTCFullYear()}`;
           return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
       }).join('');               
           initCalendar(holidays);
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}

function createModalContent() {
    const container = document.createElement('div');
    container.className = 'commonPopup';    
    container.innerHTML = `
        <div class="commonPopup-header">Date Calculator</div>
         <button class="commonback-button" id="commonback-button">Back</button>
   
         <div class="securityPopup-row">
            <div class="section1-row1" id="section1">
                <div class="headerWrapper">
                    <h3 style="margin-bottom: 12px;">System Schedule(s):</h3>                    
                    <select id="holidayScheduleDropdown"></select> <!-- Directly embedded dropdown -->
                </div>
                <div class="holidaysList" id="holidaysList"></div>     			      
            </div>
            <div class="section1-row1" id="section2">
                <h3 style="margin-bottom: 12px;">Calendar:</h3>
                <div class="calendar" id="calendar">
                    <div class="calendarHeader" id="calendarHeader">
                        <button id="prevMonth">&lt;</button>
                        <span id="monthYearLabel"></span>
                        <button id="nextMonth">&gt;</button>
                    </div>
                    <div class="calendarDays" id="calendarDays">
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
         <div class="securityPopup-row">
            <div class="commonSection section1-row2" id="section3">
                <div class="excludeSettingsWrapper">
                    <h4>Days Between Two Dates:</h4>                    
                    <div class="checkboxWrapper">
                        <input type="checkbox" id="excludeSchedule" name="excludeOptions" value="excludeSchedule">
                        <label for="excludeSchedule">Exclude System Schedule Days</label>
                    </div>                    
                    <div class="checkboxWrapper">
                        <input type="checkbox" id="excludeWeekends" name="excludeOptions" value="excludeWeekends">
                        <label for="excludeWeekends">Exclude Weekends</label>
                    </div>                    
                    <div class="checkboxWrapper excludeSpecificDaysWrapper">                        
                        <label for="excludeSpecificDays">Exclude Additional Days</label>
                        <input type="number" id="daysCount" name="daysCount" min="1" step="1" placeholder="Enter number">
                    </div>
                </div>                
                <div class="dateSection">
                <div class="dateRow">
                    <div>
                        <label for="startDate1">Start Date:</label>
                        <input type="date" id="startDate1" name="startDate1">
                    </div>
                    <div>
                        <label for="endDate1">End Date:</label>
                        <input type="date" id="endDate1" name="endDate1">
                    </div>
                </div>                          
                <div class="calculationsWrapper">
                    <div class="calculationRow">
                        <span>Days from Start Date to End Date:</span>
                        <span>--  </span>
                    </div>
                    <div class="calculationRow">
                        <span>Excluded Schedule Days:</span>
                        <span>--  </span>
                    </div>
                    <div class="calculationRow">
                        <span>Excluded Weekends:</span>
                        <span>--  </span>
                    </div>
                    <div class="calculationRow">
                        <span>Excluded Additional Days:</span>
                        <span>--  </span>
                    </div>                   
                    <hr class="separator">
                    <div class="calculationRow">
                        <span><strong>Total Days:</strong></span>
                        <span><strong>--  </strong></span>
                    </div>                    
                </div>                
            </div>
            <div class="section3-submitBtn">
                <button id="section3SubmitBtn">Submit</button>
            </div>
            <div class="notes">
                <strong>Note:</strong>                
                <span>Calculation will count the End Date as a full date (1 Day)</span>                          
            </div>
            </div>            
             <div class="commonSection section1-row2" id="section4">                                 
                    <div class="addSettingsWrapper">
                        <h4>Add Days to a Date:</h4>                    
                        <div class="checkboxWrapper">
                            <input type="checkbox" id="addSchedule" name="addOptions" value="addSchedule">
                            <label for="addSchedule">Exclude System Schedule Days</label>
                        </div>                    
                        <div class="checkboxWrapper">
                            <input type="checkbox" id="addWeekends" name="addOptions" value="addWeekends">
                            <label for="addWeekends">Exclude Weekends</label>
                        </div>                                            
                    </div>                
                    <div class="dateSection">
                    <div class="addDateRow">
                        <div>
                            <label for="pickDate">Start Date:</label>
                            <input type="date" id="pickDate" name="pickDate">
                        </div>
                        <div>
                            <label for="addSpecificDays">Days to add</label>
                            <input type="number" id="addDaysCount" name="addDaysCount" min="1" step="1" placeholder="Enter number">
                        </div>
                    </div>                          
                    <div class="addCalculationsWrapper">                        
                        <div class="calculationRow">
                            <span>Excluded Schedule Days:</span>
                            <span>--  </span>
                        </div>
                        <div class="calculationRow">
                            <span>Excluded Weekends:</span>
                            <span>--  </span>
                        </div>
                        <div class="calculationRow">
                            <span>Excluded Days:</span>
                            <span>--  </span>
                        </div>                   
                        <hr class="addDateSeparator">
                        <div class="calculationRow">
                            <span><strong>Final Date:</strong></span>
                            <span><strong>--  </strong></span>
                        </div>
                    </div>                
                </div>
                <div class="section4-submitBtn">
                    <button id="section4SubmitBtn">Submit</button>
                </div>                
             </div>
         </div>           
    `;    
    return container;    
}

function setupDateFormListeners() {
    document.getElementById('section3SubmitBtn').addEventListener('click', function() {
        calcDateDays.startDate = document.getElementById('startDate1').value;
        calcDateDays.endDate = document.getElementById('endDate1').value;

        if (!calcDateDays.startDate || !calcDateDays.endDate) {
            showCustomAlert(`Please provide both Start Date and End Date.`);            
            document.querySelectorAll('.calculationRow span:nth-child(2)').forEach(span => span.textContent = "-- ");
            return; 
        }
        if (calcDateDays.endDate < calcDateDays.startDate) {
            showCustomAlert("End Date cannot be less than Start Date.");
            document.querySelectorAll('.calculationRow span:nth-child(2)').forEach(span => span.textContent = "-- ");
            return; 
        }

        const daysDifference = calculateDateDifference(calcDateDays.startDate, calcDateDays.endDate);        
        const isExcludeWeekendsChecked = document.getElementById('excludeWeekends').checked;        
        const isExcludeScheduleChecked = document.getElementById('excludeSchedule').checked;
        const holidaysCount = isExcludeScheduleChecked ? getHolidaysBetweenDates(calcDateDays.startDate, calcDateDays.endDate, isExcludeWeekendsChecked) : 0;        
        const weekendsCount = isExcludeWeekendsChecked ? countWeekendsBetweenDates(calcDateDays.startDate, calcDateDays.endDate) : 0;
        
        let remainingDays = daysDifference - holidaysCount - weekendsCount;        
        const additionalExcludedDays = Math.min(remainingDays, document.getElementById('daysCount').value || 0);

        document.querySelector(".calculationRow span:nth-child(2)").textContent = `${daysDifference} Day(s)`;        
        document.querySelector(".calculationRow:nth-child(2) span:nth-child(2)").textContent = `${holidaysCount} Day(s)`;        
        document.querySelector(".calculationRow:nth-child(3) span:nth-child(2)").textContent = `${weekendsCount} Day(s)`;
        document.querySelector(".calculationRow:nth-child(4) span:nth-child(2)").textContent = `${additionalExcludedDays} Day(s)`;

        // Set total days
        const totalDays = remainingDays - additionalExcludedDays;
        document.querySelector(".calculationRow:nth-child(6) span:nth-child(2)").textContent = 
            totalDays < 0 ? `${totalDays} Day(s)` : `${totalDays} Day(s)`;
        
        // Show note
        const noteElement = document.querySelector('.notes');
        if (noteElement) {
            noteElement.style.display = 'block';
        }        
    });
}

function setupSection4FormListeners() {
    const section4SubmitBtn = document.getElementById('section4SubmitBtn');

    section4SubmitBtn.addEventListener('click', function() {
        const startDateStr = document.getElementById('pickDate').value;
        const daysToAdd = parseInt(document.getElementById('addDaysCount').value, 10);

        if (!startDateStr || isNaN(daysToAdd)) {
            showCustomAlert("Please provide both Start Date and Days to Add.");
            return;
        }

        const isAddWeekendsChecked = document.getElementById('addWeekends').checked;
        const isAddScheduleChecked = document.getElementById('addSchedule').checked;
        let startDate = createDateObject(startDateStr);
        let finalDate = new Date(startDate);

        let totalAddedDays = 0;
        let weekendsCount = 0;
        let holidaysCount = 0;
        
        while (totalAddedDays < daysToAdd) {
            finalDate.setUTCDate(finalDate.getUTCDate() + 1); 
            const currentDateString = finalDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
            
            if (isAddWeekendsChecked && (finalDate.getUTCDay() === 6 || finalDate.getUTCDay() === 0)) {
                weekendsCount++;
                continue; 
            }
            if (isAddScheduleChecked && listOfHolidays.includes(currentDateString)) {
                holidaysCount++;
                continue; 
            }            
            totalAddedDays++; 
        }
        
        const formattedFinalDate = `${finalDate.getUTCMonth() + 1}-${finalDate.getUTCDate()}-${finalDate.getUTCFullYear()}`;
        document.querySelector('.addCalculationsWrapper .calculationRow:nth-child(1) span:nth-child(2)').textContent = `${holidaysCount} Day(s)`;
        document.querySelector('.addCalculationsWrapper .calculationRow:nth-child(2) span:nth-child(2)').textContent = `${weekendsCount} Day(s)`;
        document.querySelector('.addCalculationsWrapper .calculationRow:nth-child(3) span:nth-child(2)').textContent = `${daysToAdd} Day(s)`;
        document.querySelector('.addCalculationsWrapper .calculationRow:nth-child(5) span:nth-child(2)').textContent = formattedFinalDate;
    });
}

function attachModalEventHandlers(container) {
    const backButton = container.querySelector('#commonback-button');
    backButton.addEventListener('click', function() {
        container.remove();
        openPopup();  
    });
    makePopupMovable(container); 
    setupDateFormListeners();
    setupSection4FormListeners();
}

async function dateCalc() {
    const modalContent = createModalContent();
    document.body.appendChild(modalContent);
    attachModalEventHandlers(modalContent);    
    const defaultSchedule = await setupHolidayScheduleDropdown();   
}

const styles = `
    .holidaysList { max-height: 74%; overflow-y: auto; display: grid; margin-top: 15px; padding-left: 10px; }    
    .holidayRow { display: grid; grid-template-columns: 1fr 1fr; align-items: center; }
    .holidayName { padding: 4px 8px; border: 1px solid #ddd; text-align: left; width: 290px; }    
    .holidayDate { padding: 4px; border: 1px solid #ddd; text-align: left; }    
    .headerWrapper { margin-left: 10px; }     
    .section1-row1 { display: inline-block; width: 50%; height: 310px; padding: 10px; border-bottom: 5px solid #ccc; box-sizing: border-box; text-align: left; }
    .section1-row2 { display: inline-block; width: 50%; height: 475px; margin-left: 20px; vertical-align: top; box-sizing: border-box; text-align: left; } 
    .calendar { width: 92%; height: 80%; border: 1px solid #ddd; background-color: #f9f9f9; padding: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .calendarHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .calendarDays, .calendarDates { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
    .calendarDays div { background-color: #102e55; color: white; padding: 5px 0; text-align: center; border-radius: 3px; margin-bottom: 5px; }
    .calendarDates div { background-color: #e9ecef; height: 23px; display: flex; align-items: center; justify-content: center; border-radius: 3px; cursor: pointer; transition: background-color 0.2s; padding: 5px; box-sizing: border-box; }
    .calendarDates div:hover { background-color: #333; color: white; }
    .calendarDates .holidayDate { color: #2196F3; }
    .todayDate { background-color: #056d05 !important; color: white; }
    .excludeSettingsWrapper { border: 1px solid #d4d4d4; padding: 10px; border-radius: 5px; margin-bottom: 10px; margin-top: 10px; background-color: #f5f5f5; }
    .excludeSettingsWrapper h4 { margin-top: 0; border-bottom: 1px solid #d4d4d4; padding-bottom: 5px; margin-bottom: 10px; }    
    .checkboxWrapper { margin-bottom: 5px; }  
    .dateRow { display: flex; }
    .dateRow > div { margin-right: 10px; } 
    .dateSection { border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-top: 10px; }     
    .calculationsWrapper { margin-top: 20px; }    
    .calculationRow { display: flex; justify-content: space-between; margin-bottom: 5px; } 
    .calculationRow:last-child span { font-size: 16px; font-weight: bold; }
    .section3-submitBtn { margin-top: 15px; text-align: center; }
    #section3SubmitBtn { padding: 8px; font-size: 15px; width: 150px; background-color: #102e55; color: white; cursor: pointer; border-radius: 20px; transition: background-color 0.3s; }
    #section3SubmitBtn:hover { background-color: #103e89; }
    .separator { border-top: 2px solid black; margin: 10px 0; } 
    .notes { display: none; padding: 12px; }

    /* Right Section */ 
    .addSettingsWrapper { border: 1px solid #d4d4d4; padding: 11px; border-radius: 5px; margin-bottom: 10px; margin-top: 10px; background-color: #f5f5f5; }
    .addSettingsWrapper h4 { margin-top: 0; border-bottom: 1px solid #d4d4d4; padding-bottom: 5px; margin-bottom: 10px; }
    .addDateRow { display: flex; margin-top: 20px; }
    .addCalculationsWrapper { margin-top: 30px; }
    .addDateSeparator { border-top: 2px solid black; margin-top: 30px; margin-bottom: 10px; } 
    .section4-submitBtn { margin-top: 15px; text-align: center; }
    #section4SubmitBtn { padding: 8px; font-size: 15px; width: 150px; background-color: #102e55; color: white; cursor: pointer; border-radius: 20px; transition: background-color 0.3s; }
    #section4SubmitBtn:hover { background-color: #103e89; }
`;

function initCalendar(holidays) {    
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    // Converting dates to string.
    const holidayDates = new Set(holidays.map(h => (h.date instanceof Date ? h.date.toISOString() : h.date).split('T')[0]));

    function displayCalendar(holidays, month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();    
        
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
    
        let calendarHTML = '';            
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHTML += '<div></div>';
        }    
        
        for (let i = 1; i <= daysInMonth; i++) {
            let currentDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`; 
            let dateClass = '';
            let titleAttr = '';
            
            if (holidayDates.has(currentDate)) {
                const holidayObject = holidays.find(h => {
                    const formattedDate = (h.date instanceof Date ? h.date.toISOString() : h.date).split('T')[0];
                    return formattedDate === currentDate;
                });
                const holidayName = holidayObject ? holidayObject.name : "Unknown Holiday";
                dateClass = 'holidayDate';
                titleAttr = `title="${holidayName}"`;
            } 
            if (i === todayDate && month === todayMonth && year === todayYear) {
                dateClass += ' todayDate'; 
            }    
            calendarHTML += `<div class="${dateClass}" ${titleAttr}>${i}</div>`;
        }
    
        document.getElementById('calendarDates').innerHTML = calendarHTML;    
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('monthYearLabel').innerText = `${monthNames[month]} ${year}`;
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

    // Initial display
    displayCalendar(holidays, currentMonth, currentYear);    
}

function createDateObject(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
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
        const dayOfWeek = holiday.getUTCDay();
        
        if (holiday >= start && holiday <= end) {
            if (excludeWeekends) {
                if (dayOfWeek !== 6 && dayOfWeek !== 0) {
                    count++;
                }
            } else {
                count++;
            }
        }
        return count;
    }, 0);
}

function countWeekendsBetweenDates(startDate, endDate) {
    const start = createDateObject(startDate);
    const end = createDateObject(endDate);
    
    let count = 0;
    while (start <= end) {
        if (start.getDay() === 6 || start.getDay() === 0) {
            count++;
        }
        start.setDate(start.getDate() + 1);
    }
    return count;
}

function appendStylesToDocument(styles) {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
appendStylesToDocument(styles);
