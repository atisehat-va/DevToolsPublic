async function fetchAllHolidaySchedules() {
    const fetchXml = `
        <fetch>
            <entity name="calendar">
                <attribute name="name" />
                <filter>
                    <condition attribute="name" operator="not-null" />
                </filter>
            </entity>
        </fetch>
    `;

    try {
        const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);
        return results.entities.map(entity => entity.name);
    } catch (error) {
        console.error("Error fetching holiday schedules:", error);
        return []; // Return an empty array in case of an error or adjust as needed
    }
}

async function setupHolidayScheduleDropdown() {
    const schedules = await fetchAllHolidaySchedules();

    const dropdown = document.createElement('select');
    dropdown.id = 'holidayScheduleDropdown';

    schedules.forEach(schedule => {
        const option = document.createElement('option');
        option.value = schedule;
        option.innerText = schedule;
        dropdown.appendChild(option);
    });

    // Get the container of the "Calendar Info" header
    const container = document.querySelector('.calcDate-section-row1 h3');
    
    // Insert the dropdown right after the header
    container.parentNode.insertBefore(dropdown, container.nextSibling);

    dropdown.addEventListener('change', (e) => {
        displayHolidays(e.target.value);
    });
}


async function getHolidaysForSchedule(scheduleName = 'Federal Holiday Schedule') {
    const fetchXml = `
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

    const results = await Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`);
    return results.entities.map(entity => ({
        name: entity["rule.name"],
        date: new Date(entity["rule.starttime"]).toDateString()
    }));
}

async function displayHolidays(scheduleName) {
    try {
        const holidays = await getHolidaysForSchedule(scheduleName);

        // Sort holidays by date
        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        const holidaysList = document.getElementById('holidaysList');

        // Formatting the list with a two-column grid layout
        holidaysList.innerHTML = holidays.map(holiday => {
            const dateObject = new Date(holiday.date);
            const fullDayName = dateObject.toLocaleString('en-US', { weekday: 'long' });
            const formattedDate = `${fullDayName} - ${("0" + (dateObject.getMonth() + 1)).slice(-2)}/${("0" + dateObject.getDate()).slice(-2)}/${dateObject.getFullYear()}`;
            return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
        }).join('');
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}

function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
         <div class="commonPopup-header">Copy User Security</div>
         <button class="commonback-button" id="commonback-button">Back</button>
   
         <div class="securityPopup-row">
             <div class="calcDate-section-row1" id="section1">
                 <h3>Calendar Info</h3>
                 <div id="holidaysList"></div>     			      
             </div>     
         </div> 
      	
         <div class="securityPopup-row">
             <div class="commonSection details-section-row" id="section2">
                 <h3>Calendar 1</h3>			      			      
             </div>       
             <div class="commonSection details-section-row" id="section3">
                 <h3>Calendar 2</h3>			      			      
             </div>
         </div>  	  

         <div class="submit-button-container">
             <button id="submitButton">Submit</button>
         </div>
    `;	
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
        newContainer.remove();
        openPopup();  
    });
    makePopupMovable(newContainer); 

    // Fetch and display holidays
    setupHolidayScheduleDropdown();
    displayHolidays('Federal Holiday Schedule'); 
}

const styles = `
    #holidaysList {
        max-height: 85%;
        overflow-y: auto;
        display: grid;
        margin-top: 15px;
        margin-left: 10px;
    }
    .holidayRow {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
    }
    .holidayName, .holidayDate {
        padding: 4px 8px;
        border: 1px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: left;
    }
    .calcDate-section-row1 {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    #holidayScheduleDropdown {
        margin-left: 10px; /* adjust spacing as necessary */
    }
`;

// Append styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
