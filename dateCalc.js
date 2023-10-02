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

        // Formatting the list with holiday names in bold and formatted date
        holidaysList.innerHTML = holidays.map(holiday => {
            const formattedDate = `${holiday.date.split(' ')[0]} - ${("0" + (new Date(holiday.date).getMonth() + 1)).slice(-2)}/${("0" + new Date(holiday.date).getDate()).slice(-2)}/${new Date(holiday.date).getFullYear()}`;
            return `<li style="text-align: left; margin-left: 16px; font-size: 16px;"><b>${holiday.name}</b>: ${formattedDate}</li>`;
        }).join('');
    } catch (error) {
        console.error("Error fetching holidays: ", error);
    }
}
