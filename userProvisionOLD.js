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
//newTest
function calculateAdjustedDate(executionContext) {
    debugger;
    var formContext = executionContext.getFormContext();

    function stripTimeFromDate(date) {
        return new Date(date.setHours(0,0,0,0));
    }

    function getCaseDate(caseId) {
        return Xrm.WebApi.online.retrieveRecord("mcs_vethomecase", caseId, "?$select=mcs_closuredate");
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

    function isWeekend(date) {
        return date.getUTCDay() === 0 || date.getUTCDay() === 6;
    }

    // Retrieve reference to Case from the current form
    var parentCase = formContext.getAttribute("mcs_parentvethomecaseid").getValue();
    if (!parentCase || parentCase.length === 0) {
        console.error("Case reference not found.");
        return;
    }
    var parentCaseId = parentCase[0].id;

    getCaseDate(parentCaseId)
    .then(function(caseResult) {
        var caseDate = stripTimeFromDate(new Date(caseResult.mcs_closuredate));

        var reopenReason = formContext.getAttribute("mcs_reopenreasonid").getValue();
        var reopenReasonId = reopenReason[0].id;

        return Xrm.WebApi.online.retrieveRecord("vhacrm_actionintersection", reopenReasonId, "?$top=1&$select=mcs_vethomesla")
        .then(function(slaResults) {        
            var slaNumber = slaResults.mcs_vethomesla;

            return { slaNumber: slaNumber, caseDate: caseDate };
        });
    })
    .then(function(data) {
        return getHolidaysForSchedule()
        .then(function(holidays) {
            return { holidays: holidays, slaNumber: data.slaNumber, caseDate: data.caseDate };
        });
    })
    .then(function(data) {
        var addedDays = 0;
        var closureDate = data.caseDate;
        var slaNumber = data.slaNumber;
        var holidayStrings = data.holidays.map(h => h.toISOString().split("T")[0]);

        while (addedDays < slaNumber) {
            closureDate.setDate(closureDate.getDate() + 1);
            closureDate = stripTimeFromDate(closureDate); // Ensure we're always working with date only

            if (isWeekend(closureDate) || holidayStrings.includes(closureDate.toISOString().split("T")[0])) {
                continue;
            }

            addedDays++;
        }

        var adjustedDate = closureDate;
        console.log("Adjusted Date:", adjustedDate); // Print the adjusted date
    })
    .catch(function(error) {
        console.error(error.message);
    });
}
