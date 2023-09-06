// Function to append User Provision popup to body
function appendUserProvisionPopupToBody(html, iframeUrl = null) {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';    
    if (iframeUrl) {
        html += `
            <iframe src="${iframeUrl}" width="740" height="570"></iframe>
        `;
    }    
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            User Provision Info
        </div>        
        <div class="dirtyFieldsPopup-content">
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
function openUserProvision(environment) {
    debugger;
    closeIframe();
    var crmUrl;
    var clientUrl = Xrm.Page.context.getClientUrl();
    var windowName;
    var windowOptions = "height=570,width=740,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
    var timestamp = new Date().getTime();    
    switch (environment) {
        case 'dev':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "dev$2");            
            break;
        case 'int':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "int$2");            
            break;
        case 'qa':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "qa$2");
            break;
        case 'preprod':
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "preprod$2");
            break;
        default:
            return;
    }

    var entityName = "vhacrm_userprovision";
    var formUrl = crmUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord";
    
     var popupHtml = `        
    `;
    appendUserProvisionPopupToBody(popupHtml, formUrl);
    toggleDropdownMenu('dropdown-content');
}
