let listOfHolidays = [];
const typeNames = {
    0: "Default",
    1: "Customer Service",
    2: "Holiday Schedule",
    "-1": "Inner Calendar"
};

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

    // Map schedules to options and find the default schedule
    const options = schedules.map(schedule => {
        const option = document.createElement('option');
        option.value = schedule.name;
        option.innerText = schedule.name;

        if (schedule.type === 2) {
            defaultScheduleName = schedule.name;
        }
        return option;
    });

    dropdown.append(...options);  // Append all options at once
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
        date: new Date(entity["rule.starttime"]).toDateString()
    }));
}

async function displayHolidays(scheduleName) {
    try {
        const holidays = await getHolidaysForSchedule(scheduleName);

        // listOfHolidays with the fetched holidays
        listOfHolidays = holidays.map(holiday => holiday.date);      

        // Sort holidays by date
        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        const holidaysList = document.getElementById('holidaysList');

       holidaysList.innerHTML = holidays.map(holiday => {
           const formattedDate = `${holiday.date.split(' ')[0]} - ${("0" + (new Date(holiday.date).getMonth() + 1)).slice(-2)}/${("0" + new Date(holiday.date).getDate()).slice(-2)}/${new Date(holiday.date).getFullYear()}`;
           return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
       }).join('');           
           initCalendar(holidays);
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}

// Construct the modal content
function createModalContent() {
    const container = document.createElement('div');
    container.className = 'commonPopup';    
    container.innerHTML = `
        <div class="commonPopup-header">Date Calculator</div>
         <button class="commonback-button" id="commonback-button">Back</button>
   
         <div class="securityPopup-row">
            <div class="section1-row1" id="section1">
                <div class="headerWrapper">
                    <h3 style="margin-bottom: 20px;">Calendar Info</h3>                    
                    <select id="holidayScheduleDropdown"></select> <!-- Directly embedded dropdown -->
                </div>
                <div id="holidaysList"></div>     			      
            </div>
            <div class="section1-row1" id="section2">
                <h3 style="margin-bottom: 20px;">Calendar</h3>
                <div id="calendar">
                    <div id="calendarHeader">
                        <button id="prevMonth">&lt;</button>
                        <span id="monthYearLabel"></span>
                        <button id="nextMonth">&gt;</button>
                    </div>
                    <div id="calendarDays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>
                    <div id="calendarDates"></div>
                </div>     
            </div>
        </div>       	
         <div class="securityPopup-row">
            <div class="commonSection details-section-row" id="section3">
                <h3>Calendar 1</h3>
            
                <label for="excludeSchedule">
                    <input type="checkbox" id="excludeSchedule" name="excludeOptions" value="excludeSchedule">
                    Exclude Selected Schedule Days
                </label>
            
                <label for="excludeWeekends">
                    <input type="checkbox" id="excludeWeekends" name="excludeOptions" value="excludeWeekends">
                    Exclude Weekends
                </label>
            
                <div class="excludeSpecificDaysWrapper">
                    <label for="excludeSpecificDays">
                        <input type="checkbox" id="excludeSpecificDays" name="excludeOptions" value="excludeSpecificDays">
                        Exclude Days
                    </label>
            
                    <label for="daysCount">Number of days to exclude:</label>
                    <input type="number" id="daysCount" name="daysCount" min="1" step="1" placeholder="Enter number">
                </div>
            
                <label for="startDate1">Start Date:</label>
                <input type="date" id="startDate1" name="startDate1">
                
                <label for="endDate1">End Date:</label>
                <input type="date" id="endDate1" name="endDate1">
            </div>   
            
             <div class="commonSection details-section-row" id="section4">
                 <h3>Calendar 2</h3>			      			      
             </div>
         </div>  
         <div class="submit-button-container">
             <button id="submitButton">Submit</button>
         </div>
    `;    
    return container;
}

function attachModalEventHandlers(container) {
    const backButton = container.querySelector('#commonback-button');
    backButton.addEventListener('click', function() {
        container.remove();
        openPopup();  
    });
    makePopupMovable(container); 
}

async function dateCalc() {
    const modalContent = createModalContent();
    document.body.appendChild(modalContent);
    attachModalEventHandlers(modalContent);    
    const defaultSchedule = await setupHolidayScheduleDropdown();
    displayHolidays(defaultSchedule); 
}

const styles = `
    #holidaysList { max-height: 74%; overflow-y: auto; display: grid; margin-top: 15px; }    
    .holidayRow { display: grid; grid-template-columns: 1fr 1fr; align-items: center; }
    .holidayName { padding: 4px 8px; border: 1px solid #ddd; text-align: left; width: 290px; }    
    .holidayDate { padding: 4px; border: 1px solid #ddd; text-align: left; }    
    .headerWrapper { margin-left: 10px; }     
    .section1-row1 { display: inline-block; width: 50%; height: 310px; padding: 10px; border-bottom: 3px solid #ccc; box-sizing: border-box; text-align: left; }    
`;
const calendarStyles = ` 
    #calendar { width: 92%; height: 80%; border: 1px solid #ddd; background-color: #f9f9f9; padding: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    #calendarHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    #calendarDays, #calendarDates { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
    #calendarDays div { background-color: #102e55; color: white; padding: 5px 0; text-align: center; border-radius: 3px; margin-bottom: 5px; }
    #calendarDates div { background-color: #e9ecef; height: 23px; display: flex; align-items: center; justify-content: center; border-radius: 3px; cursor: pointer; transition: background-color 0.2s; padding: 5px; box-sizing: border-box; }
    #calendarDates div:hover { background-color: #333; color: white; }
    #calendarDates .holidayDate { color: #2196F3; }
    .todayDate { background-color: #056d05 !important; color: white; }
`;

function initCalendar(holidays) {    
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    const holidayDates = new Set(holidays.map(h => h.date));

    function displayCalendar(holidays, month, year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();    
        
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
    
        let calendarHTML = '';
    
        // Empty days before the start of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHTML += '<div></div>';
        }
    
        // Populate the days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            let currentDate = new Date(year, month, i).toDateString();
            let dateClass = '';
            let titleAttr = '';
            
            if (holidayDates.has(currentDate)) {
                const holidayName = holidays.find(h => h.date === currentDate).name;
                dateClass = 'holidayDate';
                titleAttr = `title="${holidayName}"`;
            } 

            if (i === todayDate && month === todayMonth && year === todayYear) {
                dateClass += ' todayDate'; // Adding a class for today's date
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

function appendStylesToDocument(styles) {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
appendStylesToDocument(calendarStyles);
appendStylesToDocument(styles);
