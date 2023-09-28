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
function calculateNewDateBasedOnHolidays(recordId) {
    var initialDateField = "your_date_field_name";
    var initialDate = new Date(Xrm.Page.getAttribute(initialDateField).getValue());

    function getHolidays() {
        return Xrm.WebApi.online.retrieveMultipleRecords("your_holiday_entity_name", "?$select=your_date_field_in_holiday_entity");
    }

    function isWeekend(date) {
        var day = date.getUTCDay();
        return day === 0 || day === 6;
    }

    function getDaysToAdd(recordId) {
        return Xrm.WebApi.online.retrieveRecord("your_entity_name", recordId, "?$select=days_to_add_field_name");
    }

    return getDaysToAdd(recordId).then(
        function(result) {
            var daysToAdd = result.days_to_add_field_name;
            return getHolidays().then(
                function(results) {
                    var holidays = results.entities.map(function(entity) {
                        return new Date(entity.your_date_field_in_holiday_entity);
                    });

                    var currentDate = initialDate;
                    var addedDays = 0;
                    while (addedDays < daysToAdd) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        if (isWeekend(currentDate) || holidays.some(h => h.toISOString().split("T")[0] === currentDate.toISOString().split("T")[0])) {
                            continue;
                        }
                        addedDays++;
                    }
                    // Set the new date to the field
                    Xrm.Page.getAttribute(initialDateField).setValue(currentDate);
                }
            );
        }
    ).catch(function(error) {
        console.error(error.message);
    });
}
