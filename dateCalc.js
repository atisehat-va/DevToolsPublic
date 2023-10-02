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

function getHolidaysForSchedule() {
    return new Promise((resolve, reject) => {
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
        Xrm.WebApi.retrieveMultipleRecords("calendar", `?fetchXml=${encodeURIComponent(fetchXml)}`).then(
            results => {
                let holidays = results.entities.map(entity => stripTimeFromDate(new Date(entity["rule.starttime"])));
                resolve(holidays);
            },
            error => {
                reject(error.message);
            }
        );
    });
}

function stripTimeFromDate(date) {
    return new Date(date.setHours(0, 0, 0, 0));
}

function displayHolidays() {
    getHolidaysForSchedule().then(holidays => {
        const holidaysList = document.getElementById('holidaysList');
        holidays.forEach(holiday => {
            const listItem = document.createElement('li');
            listItem.textContent = holiday.toDateString();
            holidaysList.appendChild(listItem);
        });
    }).catch(error => {
        console.error("Error fetching holidays: ", error);
    });
}
