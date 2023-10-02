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
            name: `${entity.name} (Type: ${entity.type})`,
            type: entity.type
        }));
    } catch (error) {
        console.error("Error fetching holiday schedules:", error);
        return []; // Return an empty array in case of an error or adjust as needed
    }
}

async function setupHolidayScheduleDropdown() {
    const schedules = await fetchAllHolidaySchedules();

    const dropdown = document.getElementById('holidayScheduleDropdown');
    let defaultScheduleName = '';
    
    schedules.forEach(schedule => {
        const option = document.createElement('option');
        option.value = schedule.name;
        option.innerText = schedule.name;
        dropdown.appendChild(option);

        // Check if the schedule type is 2 and set it as the default
        if (schedule.type === 2) {
            defaultScheduleName = schedule.name;
        }
    });

    dropdown.value = defaultScheduleName;  // Set the default calendar type 2
    displayHolidays(defaultScheduleName);  // Display holidays of the default schedule

    dropdown.addEventListener('change', (e) => {
        displayHolidays(e.target.value);
    });
}


async function getHolidaysForSchedule(scheduleName = 'Federal Holiday Schedule') {
    const matchedScheduleName = scheduleName.match(/^(.*?) \(Type:/);
    const actualScheduleName = matchedScheduleName ? matchedScheduleName[1] : scheduleName;
    
    const fetchXml = `
        <fetch>
            <entity name="calendar">
                <filter>
                    <condition attribute="name" operator="eq" value="${actualScheduleName}" />
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
    console.log("Displaying holidays for:", scheduleName); // Log for debugging

    try {
        const holidays = await getHolidaysForSchedule(scheduleName);

        console.log("Fetched holidays:", holidays); // Log for debugging

        // Sort holidays by date
        holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        const holidaysList = document.getElementById('holidaysList');

           holidaysList.innerHTML = holidays.map(holiday => {
        const formattedDate = `${holiday.date.split(' ')[0]} - ${("0" + (new Date(holiday.date).getMonth() + 1)).slice(-2)}/${("0" + new Date(holiday.date).getDate()).slice(-2)}/${new Date(holiday.date).getFullYear()}`;
        return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
    }).join('');
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}

async function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
         <div class="commonPopup-header">Copy User Security</div>
         <button class="commonback-button" id="commonback-button">Back</button>
   
         <div class="securityPopup-row">
            <div class="calcDate-section-row1" id="section1">
                <div class="headerWrapper">
                    <h3>Calendar Info</h3>
                    <select id="holidayScheduleDropdown"></select> <!-- Directly embedded dropdown -->
                </div>
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

    // Setup dropdown and then display holidays of the default schedule
    const defaultSchedule = await setupHolidayScheduleDropdown();
    displayHolidays(defaultSchedule); 
}

const styles = `
    #holidaysList {
        max-height: 75%;
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
    .holidayName {
        padding: 4px 8px;
        border: 1px solid #ddd;        
        text-align: left;
    }    
    .holidayDate {
        padding: 4px 8px;
        border: 1px solid #ddd;        
        text-align: left;
        width:20%;
    }    
    .headerWrapper {
       margin-left: 10px;
    }    
    .calcDate-section-row1 { 
        display: inline-block; 
        width: 70%; 
        height: 300px; 
        padding: 10px; 
        border-bottom: 3px solid #ccc; 
        box-sizing: border-box; 
        text-align: left;
    }   
`;

// Append styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
