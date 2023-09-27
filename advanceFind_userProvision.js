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
        const windowOptions = "height=860,width=960,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
        window.open(advancedFindUrl, windowName, windowOptions);        
    } else if (pageType === "userProvision") {
        const entityName = "vhacrm_userprovision";
        const formUrl = clientUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord";    
        const popupHtml = ` `;
        appendUserProvisionPopupToBody(popupHtml, formUrl); 
    }      
}
