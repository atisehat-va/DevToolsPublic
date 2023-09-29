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
function LaunchAddendum(primaryControl) {
	var formContext = primaryControl;
    var vetHomeCaseId = formContext.data.entity.getId();
    var parentRecord = {};
    var entityFormOptions = {};
    entityFormOptions["entityName"] = "mcs_vethomecase"; 
    
    //Default parent attributes 
    
    var veteran = formContext.getAttribute("mcs_veteranid").getValue();
    var exposureRegistries = formContext.getAttribute("mcs_mandatedregistries").getValue();
    var nonExposureRegistries = formContext.getAttribute("mcs_nonmandatedregistry").getValue();
    //var Consult
    var providerClosedConsult = formContext.getAttribute("mcs_providerclosedconsult").getValue();
    var assignedFacility = formContext.getAttribute("mcs_assignedfacility").getValue();
    var vetHomeProvider = formContext.getAttribute("mcs_vethomeprovider").getValue();
    var appointmentSchTMP = formContext.getAttribute("mcs_appointmentscheduledintmp").getValue();
    var appointmentLength = formContext.getAttribute("mcs_appointmentlength").getValue();
    var preferredMethodOfContact = formContext.getAttribute("mcs_preferredmethodofcontact").getValue();
    var followUpLetterPrefMethodOfContact = formContext.getAttribute("mcs_followupletterpreferredmethodofcontact").getValue();
    var virpRegistrant = formContext.getAttribute("mcs_vethomevirpregistrant").getValue(); 
    
    
    

	var parentRecord = {
		entityType: "mcs_vethomecase",
		id: vetHomeCaseId,
        "mcs_veteranid": veteran ? veteran[0] : null,
        "mcs_mandatedregistries": exposureRegistries,
        "mcs_nonmandatedregistry": nonExposureRegistries,
        "mcs_providerclosedconsult": providerClosedConsult,
        "mcs_assignedfacility": assignedFacility ? assignedFacility[0] : null,
        "mcs_vethomeprovider": vetHomeProvider ? vetHomeProvider[0] : null,
        "mcs_appointmentscheduledintmp": appointmentSchTMP,
        "mcs_appointmentlength": appointmentLength,
        "mcs_preferredmethodofcontact": preferredMethodOfContact,
        "mcs_followupletterpreferredmethodofcontact": followUpLetterPrefMethodOfContact,
        "mcs_vethomevirpregistrant": virpRegistrant ? virpRegistrant[0] : null 
	}; 
    
    entityFormOptions["createFromEntity"] = parentRecord;

    Xrm.Navigation.openForm(entityFormOptions).then(
        function (lookup) { console.log("Successfully launched addendum (case)"); },
        function (error) { console.log("Failed to open addendum (case)"); }
    );  
}
