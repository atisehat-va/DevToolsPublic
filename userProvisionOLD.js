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
function calculateNewDateBasedOnHolidays(executionContext) {
    var formContext = executionContext.getFormContext();

    function getInitialDate(recordId) {
        return Xrm.WebApi.online.retrieveRecord("initial_date_entity_name", recordId, "?$select=initial_date_field_name");
    }

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

    var initialDateRecordId = formContext.data.entity.getId(); // Assuming the form is for the entity containing the initial date

    return getInitialDate(initialDateRecordId).then(
        function(dateResult) {
            var initialDate = new Date(dateResult.initial_date_field_name);
            
            var daysToAddRecordId = formContext.getAttribute("reference_to_days_to_add_record").getValue()[0].id; // Assuming there's a lookup on the form pointing to the record with days to add

            return getDaysToAdd(daysToAddRecordId).then(
                function(daysResult) {
                    var daysToAdd = daysResult.days_to_add_field_name;

                    return getHolidays().then(
                        function(holidaysResult) {
                            var holidays = holidaysResult.entities.map(function(entity) {
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

                            // Here, you can set the new date to a field in the current form, or perform other operations as needed
                            formContext.getAttribute("destination_date_field_name").setValue(currentDate);
                        }
                    );
                }
            );
        }
    ).catch(function(error) {
        console.error(error.message);
    });
}
