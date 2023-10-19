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
//test
//test
 async function runCSWAutomation() {
        debugger;
        var csw = Microsoft.Apm;
        var recordSessionIdMap = new Map();
        var testSession = [];

        if (csw) {
            //Test              
            
            var entitySession = {};

            let allSessions = Microsoft.Apm.getAllSessions();

            for (let session of allSessions) {
                await csw.getSession(session).getContext().then(function (context) {
                    let params = context.parameters;
                    let sessionId = session;

                    // Initialize object
                    if (!entitySession.hasOwnProperty(sessionId)) {
                        entitySession[sessionId] = {
                            entityName: null, 
                            interactionId: null,
                            vetId: null
                        };
                    }
                    
                    if (params.hasOwnProperty('anchor.entityName')) {
                        entitySession[sessionId].entityName = params['anchor.entityName'];
                    }

                    
                    if (params.hasOwnProperty('csw_custom_interactionid')) {
                        entitySession[sessionId].interactionId = params['csw_custom_interactionid'];
                    }
                    
                    if (params.hasOwnProperty('csw_custom_contactid')) {
                        entitySession[sessionId].vetId = params['csw_custom_contactid'];
                    }
                    
                    console.log(entitySession);
                });
            }
            
            //EndTest

            // if chat hide mpi tab
            await csw.getFocusedSession().getContext().then(function (context) {
                var liveWorkItemId = context.parameters["LiveWorkItemId"] ? context.parameters["LiveWorkItemId"] : "";
                if (liveWorkItemId != "") {
                    CommCare.Shared.FormContext.ui.tabs.get("tab_2").setVisible(false);
                }
            });

            var interactionId = CommCare.Shared.FormContext.data.entity.getId().replace("{", "").replace("}", "");
            var contactLookup = CommCare.Shared.GetFieldValue("bah_veteranid");
            var virpLookup = CommCare.Shared.GetFieldValue("mcs_vethomevirpregistrant");
            var contactId = contactLookup ? contactLookup[0].id.replace("{", "").replace("}", "") : null;

            if (contactId) {
                var contactName = contactLookup[0].name;
                const allSessions = csw.getAllSessions();

                for (let sessionId of allSessions) {
                    await csw.getSession(sessionId).getContext().then(function (context) {
                        //var sessionContactId = context.parameters["anchor.bah_veteranid"];
                        if (contactId) {
                            //recordSessionIdMap.set(sessionContactId.toLowerCase(), sessionId);
                            recordSessionIdMap.set(contactId, sessionId);
                        }
                    });
                }

                function createTabsForSession() {
                    csw.createTab({ templateName: "mcs_vethomecontact", appContext: new Map().set("entityName", "contact").set("entityId", contactId), isFocused: false });
                    csw.createTab({ templateName: "mcs_vh_clinical", appContext: new Map().set("entityName", "mcs_clinical").set("entityId", contactId), isFocused: false });
                    if (virpLookup) {
                        var virpLookupId = virpLookup[0].id.replace("{", "").replace("}", "");
                        Microsoft.Apm.createTab({ templateName: "mcs_vethomevirpregistrant", appContext: new Map().set("entityName", "mcs_vethomevirpregistrant").set("entityId", virpLookupId), isFocused: false });
                    }
                }

                var arrayKeys = Array.from(recordSessionIdMap.keys());
                var sessionWithIntId = arrayKeys.includes(contactId);
                if (sessionWithIntId) {
                    const session = recordSessionIdMap.get(contactId);
                    csw.getSession(session).getAllTabs().forEach(tabId => {
                        const tab = csw.getSession(session).getTab(tabId);
                        tab.close();

                        // change tab labels
                        const thisSession = Microsoft.Apm.getFocusedSession();
                        const interactionTab = thisSession.getFocusedTab();
                        thisSession.title = contactName;
                        interactionTab.title = "Interaction";

                        // update context variables for reuse elsewhere
                        thisSession.updateContext({
                            "csw_custom_interactionid": interactionId,
                            "csw_custom_contactid": contactId,
                            "customerRecordId": contactId,
                            "customerEntityName": "contact"
                        });

                        createTabsForSession();
                    });
                } else {
                    try {
                        let x = new Map().set("parametersStr", '[["entityName", "bah_interactions"], ["entityId", "' + interactionId + '"]]');
                        let newSession = await Microsoft.Apm.createSession({ templateName: "mcs_vh_interaction_session_template", sessionContext: x, isFocused: true });

                        // change tab labels
                        const thisSession = Microsoft.Apm.getFocusedSession();
                        const interactionTab = thisSession.getFocusedTab();
                        thisSession.title = contactName;
                        interactionTab.title = "Interaction";

                        thisSession.updateContext({
                            "csw_custom_interactionid": interactionId,
                            "csw_custom_contactid": contactId,
                            "customerRecordId": contactId,
                            "customerEntityName": "contact"
                        });

                        createTabsForSession();
                    } catch (error) {
                        console.error("Error during session creation:", error);
                    }
                }
            }
        }
    }
//EndTEst
//Test2
var entitySession = {};

let allSessions = Microsoft.Apm.getAllSessions();

for (let session of allSessions) {
    Microsoft.Apm.getSession(session).getContext().then(function (context) {
        let params = context.parameters;
        let sessionId = session.sessionId;

        // Initialize the object for sessionId only if it doesn't exist
        if (!entitySession.hasOwnProperty(sessionId)) {
            entitySession[sessionId] = {
                entityName: null, // Initialize to null
                interactionId: null // Initialize to null
            };
        }

        // If 'anchor.entityName' exists, set it
        if (params.hasOwnProperty('anchor.entityName')) {
            entitySession[sessionId].entityName = params['anchor.entityName'];
        }

        // If 'anchor.interactionId' exists, set it
        if (params.hasOwnProperty('anchor.interactionId')) {
            entitySession[sessionId].interactionId = params['anchor.interactionId'];
        }

        // Logging for verification
        console.log(entitySession);
    });
}

Microsoft.Apm.getFocusedSession().getContext().then(function (context) {
        let params = context.parameters;
     if (params.hasOwnProperty('anchor.entityName')) {

     }
 });
//TestHTMLJS Working
<!DOCTYPE html>
<html>
<head>
    <title>Navigate to Entity</title>
    <script>
        function navigateToEntity() {            
            if (window.parent.Microsoft.Apm) {debugger;
            
                window.parent.Microsoft.Apm.getSession("session-id-0").getContext().then(function (context) {
                let params = context.parameters;
                    if (params.hasOwnProperty('interactionTabId') && params['interactionTabId'] != null) {
                        interactionParam = params['interactionTabId'];
                        
                        var tab = window.parent.Microsoft.Apm.getFocusedSession().getFocusedTab();
                        tab.close();
                        
                        window.parent.Microsoft.Apm.getSession("session-id-0").focus();                        
                        window.parent.Microsoft.Apm.focusTab(interactionParam);
                        console.log(interactionParam);
                    }
                    else {
                        var thisSession = window.parent.Microsoft.Apm.getFocusedSession();
                        var thistab = thisSession.getFocusedTab();                
                        thisSession.updateContext({ 
                            "interactionTabId": thistab.tabId
                        });
                        
                        
                        // Prepare entity and view information
                        var entityName = "bah_interactions"; 
                        
                        // Page Input
                        var pageInput = {
                            pageType: "entitylist",
                            entityName: entityName
                        };
                        
                        // Navigation options
                        var navigationOptions = {
                            target: 1  
                        };

                        // Navigate to the entity list
                        parent.Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
                            function success() {
                                console.log("Navigation successful.");
                            },
                            function error() {
                                console.log("Navigation error.");
                            }
                        );                     
                    }
                });
                
            } else {
               //
            }            
        }
    </script>
</head>
<body onload="navigateToEntity()">
</body>
</html>
//ENDTestHTMLJS

//TestHTMLJS working2
<!DOCTYPE html>
<html>
<head>
    <title>Navigate to Entity</title>
    <script>

        function getQueryParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, '\\$&');
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }

        function navigateToEntity() {            
            if (window.parent.Microsoft.Apm) {debugger;
                var dataParam = getQueryParameterByName('Data');
                var subAreaId = new URLSearchParams(dataParam).get('subAreaId');
                console.log('Sub Area ID:', subAreaId);
            
                window.parent.Microsoft.Apm.getSession("session-id-0").getContext().then(function (context) {
                let params = context.parameters;
                    if (params.hasOwnProperty('interactionTabId') && params['interactionTabId'] != null) {
                        interactionParam = params['interactionTabId'];
                        
                        var tab = window.parent.Microsoft.Apm.getFocusedSession().getFocusedTab();
                        tab.close();
                        
                        window.parent.Microsoft.Apm.getSession("session-id-0").focus();                        
                        window.parent.Microsoft.Apm.focusTab(interactionParam);
                        console.log(interactionParam);
                    }
                    else {
                        var thisSession = window.parent.Microsoft.Apm.getFocusedSession();
                        var thistab = thisSession.getFocusedTab();                
                        thisSession.updateContext({ 
                            "interactionTabId": thistab.tabId
                        });
                        
                        
                        // Prepare entity and view information
                        var entityName = "bah_interactions"; 
                        
                        // Page Input
                        var pageInput = {
                            pageType: "entitylist",
                            entityName: entityName
                        };
                        
                        // Navigation options
                        var navigationOptions = {
                            target: 1  
                        };

                        // Navigate to the entity list
                        parent.Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
                            function success() {
                                console.log("Navigation successful.");
                            },
                            function error() {
                                console.log("Navigation error.");
                            }
                        );                     
                    }
                });
                
            } else {
               //
            }            
        }
    </script>
</head>
<body onload="navigateToEntity()">
</body>
</html>
//EndTestHTMLJS working2

//EnhTestHTMLJS

<!DOCTYPE html>
<html>
<head>
    <title>Navigate to Entity</title>
    <script>        
        function getQueryParameterByName(name, url) { debugger;
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, '\\$&');
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }      

        async function navigateToEntity() {
            if (window.parent.Microsoft.Apm) {
                const dataParam = getQueryParameterByName('Data');
                const table = new URLSearchParams(dataParam).get('table');     

                try {
                    const context = await window.parent.Microsoft.Apm.getSession("session-id-0").getContext();
                    const { parameters } = context;
                    var visibleTabs = parameters.hasOwnProperty('visibleTabs') ? JSON.parse(parameters['visibleTabs']) : {};

                    if (visibleTabs.hasOwnProperty(table)) {
                        handleTabDisplay(visibleTabs[table]);
                    } else {
                        var thisSession = window.parent.Microsoft.Apm.getFocusedSession();
                        var thistab = thisSession.getFocusedTab();
                        thistab.close();
                        
                        let newTabTemp = { templateName: "test_tab", appContext: new Map().set("entityName", table), isFocused: false};
                        var newSession = window.parent.Microsoft.Apm.getSession("session-id-0");
                        var sessionFocus = newSession.focus();
                        var newTab = window.parent.Microsoft.Apm.createTab(newTabTemp);
                        var newTabFocus = window.parent.Microsoft.Apm.focusTab(newTab);
                
                        // Append the new table to visibleTabs object
                        visibleTabs[table] = newTabFocus.tabId;

                        // Update the session context
                        newSession.updateContext({
                            "visibleTabs": JSON.stringify(visibleTabs)
                        });
                       
                    }
                } catch (e) {
                    console.error("Error occurred:", e);
                }
            } else {
                console.log("Microsoft.Apm not available.");
            }
        }

        function handleTabDisplay(tabNeedFocus) {
            var tab = window.parent.Microsoft.Apm.getFocusedSession().getFocusedTab();
            tab.close();

            window.parent.Microsoft.Apm.getSession("session-id-0").focus();
            window.parent.Microsoft.Apm.focusTab(tabNeedFocus);            
        }

    </script>
</head>
<body onload="navigateToEntity()">
</body>
</html>
//EndEnhTestHTMLJS

