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
	      <ul id="holidaysList"></ul>     			      
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
    displayHolidays();
}

async function getHolidaysForSchedule() {
    const fetchXml = `
        <fetch>
            <entity name="calendar">
                <filter>
                    <condition attribute="name" operator="eq" value="Federal Holiday Schedule" />
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

async function displayHolidays() {
    try {
        const holidays = await getHolidaysForSchedule();
        const holidaysList = document.getElementById('holidaysList');

        // Formatting the list with a two-column grid layout
        holidaysList.innerHTML = holidays.map(holiday => {
            const formattedDate = `${holiday.date.split(' ')[0]} - ${("0" + (new Date(holiday.date).getMonth() + 1)).slice(-2)}/${("0" + new Date(holiday.date).getDate()).slice(-2)}/${new Date(holiday.date).getFullYear()}`;
            return `<div class="holidayRow"><div class="holidayName"><b>${holiday.name}</b></div><div class="holidayDate">${formattedDate}</div></div>`;
        }).join('');

        // CSS for the grid layout and scrollable list
        const styles = `
            #holidaysList {
                max-height: 85%
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
	    display: flex;      /* Added this line to use flexbox */
	    align-items: center; /* Vertically center the text */
	    justify-content: center; /* Horizontally center the text */
	    text-align: left;       /* Ensure text remains aligned to the left */
	}
        `;

        // Append styles to the document
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}
