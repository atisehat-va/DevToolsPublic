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
    const clientUrl = Xrm.Page.context.getClientUrl();
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
         
        // Check if the entity exists
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

