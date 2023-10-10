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
    var entityFormOptions = {
        entityName: "mcs_vethomecase",
        createFromEntity: {
            entityType: "mcs_vethomecase",
            id: vetHomeCaseId
        }
    };

    // List of multi-select option set attributes to copy from parent to child form
    var attributesToCopy = [
        "mcs_mandatedregistries", "mcs_nonmandatedregistry"
    ];

    attributesToCopy.forEach(function(attrName) {
        var attrValue = formContext.getAttribute(attrName).getValue();

        // Directly assign the array value for multi-select option sets
        entityFormOptions.createFromEntity[attrName] = attrValue;
    });

    Xrm.Navigation.openForm(entityFormOptions).then(
        function (lookup) { console.log("Successfully launched addendum (case)"); },
        function (error) { console.log("Failed to open addendum (case)"); }
    );  
}

function runCSWAutomation() {
        console.log("here");
        if(Microsoft.Apm) {
        
            //if chat hide mpi tab
            Microsoft.Apm.getFocusedSession().getContext().then(function (context) {               
                var liveWorkItemId = context.parameters["LiveWorkItemId"] ? context.parameters["LiveWorkItemId"]  : "";
                if(liveWorkItemId != "") {
                    CommCare.Shared.FormContext.ui.tabs.get("tab_2").setVisible(false);
                }

            });
            
            var interactionId = CommCare.Shared.FormContext.data.entity.getId().replace("{", "").replace("}", "");            
            var contactLookup = CommCare.Shared.GetFieldValue("bah_veteranid");            
            var virpLookup = CommCare.Shared.GetFieldValue("mcs_vethomevirpregistrant");                     
            
            if (contactLookup != null) {
                var contactId = contactLookup[0].id.replace("{", "").replace("}", "");
                var contactName = contactLookup[0].name;                

                //change tab labels
                const thisSession = Microsoft.Apm.getFocusedSession();
                const interactionTab= thisSession.getFocusedTab();                
                thisSession.title = contactName;           
                interactionTab.title = "Interaction";  
   
                //update context variables for reuse elsewhere
                thisSession.updateContext({ 
                    "csw_custom_interactionid": interactionId, 
                    "csw_custom_contactid": contactId, 
                    "customerRecordId": contactId, 
                    "customerEntityName": "contact"
                });
                
                //Open Additional CSW tabs
                var customerTab = { templateName: "mcs_vethomecontact", appContext: new Map().set("entityName", "contact").set("entityId", contactId), isFocused: false};
                var clinicalTab = { templateName: "mcs_vh_clinical", appContext: new Map().set("entityName", "mcs_clinical").set("entityId", contactId), isFocused: false};                
                Microsoft.Apm.createTab(customerTab);
                Microsoft.Apm.createTab(clinicalTab);
                if (virpLookup) {
                    var virpLookupId = virpLookup[0].id.replace("{", "").replace("}", "");
                    var virpTab = { templateName: "mcs_vethomevirpregistrant", appContext: new Map().set("entityName", "mcs_vethomevirpregistrant").set("entityId", virpLookupId), isFocused: false};
                    Microsoft.Apm.createTab(virpTab);
                }                
            }
            else {
                //
            }   
        }
        
    }
