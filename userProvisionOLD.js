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
function calculateAdjustedDate() {
debugger;    
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
    
    var parentCase = CommCare.Shared.GetFieldValue("mcs_parentvethomecaseid");
    var parentCaseId = CommCare.Shared.GetCleanId(parentCase);    
    
    getCaseDate(parentCaseId)
    .then(function(caseResult) {
        var caseDate = stripTimeFromDate(new Date(caseResult.mcs_closuredate));          
        var reopenReason = CommCare.Shared.GetFieldValue("mcs_reopenreasonid");
        var reopenReasonId = CommCare.Shared.GetCleanId(reopenReason);        

        return Xrm.WebApi.online.retrieveRecord("vhacrm_actionintersection", reopenReasonId, "?$select=mcs_vethomesla")       
        .then(function (slaResults) {
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
            closureDate = stripTimeFromDate(closureDate); 

            if (isWeekend(closureDate) || holidayStrings.includes(closureDate.toISOString().split("T")[0])) {
                continue;
            }
            addedDays++;
        }
        var adjustedDate = closureDate;
        console.log("Adjusted Date:", adjustedDate);
        var today = stripTimeFromDate(new Date());
        
        if (adjustedDate < today) {
           const alertStrings = {
                text: "Unable to create a Case Addendum: The associated Case exceeds the permitted timeframe for the selected Reopen Reason.",
                title: "Validation Error"
            };

            const alertOptions = { height: 200, width: 300 };
            Xrm.Navigation.openAlertDialog(alertStrings, alertOptions)
            .then(success => {
                CommCare.Shared.SetFieldValue("mcs_reopenreasonid", null); 
            })
            .catch(error => {
                console.log("Error in closing dialog", error);
            });                       
        }
    })
    .catch(function(error) {
        console.error(error.message);
    });
}


