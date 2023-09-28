// Function to append User Provision popup to body
function appendUserProvisionPopupToBody(html, iframeUrl = null) {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';    
    if (iframeUrl) {
        html += `
            <div class="iframe-container">
                <iframe style="position:relative; top:-85px;" src="${iframeUrl}" width="960" height="860"></iframe>
            </div>
        `;
    }
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            User Provision Info
        </div>        
        <div class="userProvision-content">
            ${html}
        </div>
    `;    
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
        newContainer.remove();
        openPopup();
    });
    makePopupMovable(newContainer);
}

// Function to open User Provision
function openUrl(pageType) {            
    var clientUrl = Xrm.Page.context.getClientUrl(); 

    if (pageType === "advanceFind") {       
        var timestamp = new Date().getTime();
        var windowName = "Advanced Find Classic " + timestamp;
        var advancedFindPath = '/main.aspx?pagetype=advancedfind';
        var advancedFindUrl = clientUrl + advancedFindPath;                
        window.open(advancedFindUrl, windowName, windowOptions);
        
    } else if (pageType === "userProvision") {
        var entityName = "vhacrm_userprovision";
    var formUrl = clientUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord";
    
    var popupHtml = ` `;
    appendUserProvisionPopupToBody(popupHtml, formUrl); 
    }      
}

//test
function calculateAdjustedDate(executionContext) {
    var formContext = executionContext.getFormContext();

    function getCaseDate(caseId) {
        return Xrm.WebApi.online.retrieveRecord("Case", caseId, "?$select=new_caseDate");
    }

    function getHolidays() {
        return Xrm.WebApi.online.retrieveMultipleRecords("your_holiday_entity_name", "?$select=your_date_field_in_holiday_entity");
    }

    function isWeekend(date) {
        var day = date.getUTCDay();
        return day === 0 || day === 6;
    }

    // Retrieve reference to Case from the current form (assuming a lookup/reference field)
    var caseReference = formContext.getAttribute("your_case_lookup_field_name").getValue();
    if (!caseReference || caseReference.length === 0) {
        console.error("Case reference not found.");
        return;
    }

    var caseId = caseReference[0].id;

    // 1. Get the date from the Case entity
    getCaseDate(caseId)
    .then(function(caseResult) {
        var caseDate = new Date(caseResult.new_caseDate);

        // 2. Get the SLA number
        return Xrm.WebApi.online.retrieveMultipleRecords("SLA", "?$top=1&$select=new_slaNumber");
    })
    .then(function(slaResults) {
        if (slaResults.entities.length) {
            var slaNumber = slaResults.entities[0].new_slaNumber;

            // 3. Get the list of holidays
            return getHolidays();
        } else {
            throw new Error("No SLA record found.");
        }
    })
    .then(function(holidaysResult) {
        var holidays = holidaysResult.entities.map(function(entity) {
            return new Date(entity.your_date_field_in_holiday_entity);
        });

        var addedDays = 0;
        var caseDate = new Date(formContext.getAttribute("new_caseDate").getValue()); // Assuming the initial date is fetched here
        while (addedDays < slaNumber) {
            caseDate.setDate(caseDate.getDate() + 1);

            if (isWeekend(caseDate) || holidays.some(h => h.toISOString().split("T")[0] === caseDate.toISOString().split("T")[0])) {
                continue;
            }

            addedDays++;
        }

        var adjustedDate = caseDate;
        console.log("Adjusted Date:", adjustedDate); // Print the adjusted date
    })
    .catch(function(error) {
        console.error(error.message);
    });
}

function getHolidaysForSchedule() {
    // FetchXML query to retrieve days for the "Holiday Schedule" calendar
    var fetchXml = `
        <fetch>
            <entity name="calendar">
                <filter>
                    <condition attribute="name" operator="eq" value="Federal Holiday Schedule" />
                </filter>
                <link-entity name="calendarrule" from="calendarid" to="calendarid" alias="rule">
                    <attribute name="name" />
                    <attribute name="starttime" />
                </link-entity>
            </entity>
        </fetch>
    `;

    Xrm.WebApi.retrieveMultipleRecords("calendar", "?fetchXml=" + encodeURIComponent(fetchXml)).then(
        function success(results) {
            results.entities.forEach(result => {
                console.log("Calendar Name:", result["name"]);  // Should always be "Holiday Schedule"

                // Link-entity results
                var calendar_calendar_rules_name = result["rule.name"]; // Text
                var calendar_calendar_rules_starttime = result["rule.starttime"]; // Date Time
                
                console.log("Holiday Name:", calendar_calendar_rules_name);
                console.log("Holiday Date:", calendar_calendar_rules_starttime);
            });
        },
        function error(err) {
            console.log(err.message);
        }
    );
}

// Execute the function to get the holidays for "Holiday Schedule"
getHolidaysForSchedule();
