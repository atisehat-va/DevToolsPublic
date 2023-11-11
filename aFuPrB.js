function appendUserProvisionPopupToBody(html, iframeUrl = null) {
    const newContainer = document.createElement('div');
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

function openUrl(pageType) {
    let clientUrl = Xrm.Page.context.getClientUrl();
    if (pageType === "advanceFind") {       
        const timestamp = new Date().getTime();
        const windowName = "Advanced Find Classic " + timestamp;
        const advancedFindPath = '/main.aspx?pagetype=advancedfind';
        const advancedFindUrl = clientUrl + advancedFindPath;
        const windowOptions = "height=650,width=950,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
        window.open(advancedFindUrl, windowName, windowOptions);        
    } else if (pageType === "userProvision") {
        const entityName = "vhacrm_userprovision";
        const formUrl = clientUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord";       
        const req = new XMLHttpRequest();
        req.open("GET", `${clientUrl}/api/data/v9.0/EntityDefinitions(LogicalName='${entityName}')`, true);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Accept", "application/json");
        req.onreadystatechange = function () {
          if (this.readyState === 4) {
            if (this.status === 200) {
              const popupHtml = ` `;
              appendUserProvisionPopupToBody(popupHtml, formUrl);
            } else if (this.status === 404) {
              showCustomAlert(`This tool isn't available.`);
            }
          }
        };
        req.send();
  }
}

async function openRestBuilder(orgUrl) {  
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
  
  try {
    var query = "?$select=displayname,name&$filter=displayname eq 'Xrm.RESTBuilder.htm'";
    var results = await Xrm.WebApi.retrieveMultipleRecords("webresource", query);
    
    if (results.entities.length > 0) {      
      var restBuilderPath = `/WebResources/${results.entities[0].name}#`;
      var restBuilderUrl = orgUrl + restBuilderPath;

      window.open(restBuilderUrl, "REST Builder", windowOptions);
    } else {
      showCustomAlert(`Unable to launch REST Builder. It appears to be missing or restricted in your Dynamics 365 environment.`);
    }
  } catch (error) {
    console.error("An error occurred while querying the web resource:", error);
    showCustomAlert(`Unable to launch REST Builder. It appears to be missing or restricted in your Dynamics 365 environment.`);
  }
}

function getOrgUrl() {
  if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context) {
    return Xrm.Page.context.getClientUrl();
  } else {
    console.error('Unable to retrieve organization URL. Please run this within a Dynamics CRM environment.');
    return '';
  }
}
