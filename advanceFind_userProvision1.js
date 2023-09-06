// Modified appendUserProvisionPopupToBody function
function appendUserProvisionPopupToBody(html, iframeUrl = null) {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';    
    if (iframeUrl) {
        html += `
            <iframe src="${iframeUrl}" width="800" height="600"></iframe>
        `;
    }    
    newContainer.innerHTML = `
        <div class="commonPopup-header">
            <button class="commonback-button" id="commonback-button">Back</button>
            Dirty Fields Info
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

// Modified openUrl function
function openUrl(environment, pageType) {
    closeIframe();
      var crmUrl;
      var clientUrl = Xrm.Page.context.getClientUrl();
      var windowName;
      var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
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
    if (pageType === "advanceFind") {
        var advancedFindPath = '/main.aspx?pagetype=advancedfind';
        var advancedFindUrl = crmUrl + advancedFindPath;        
        windowName = "Advanced Find Classic " + timestamp;        
        window.open(advancedFindUrl, windowName, windowOptions);
        toggleDropdownMenu('dropdown-content-advanced-find');
    } else if (pageType === "userProvision") {
        var entityName = "vhacrm_userprovision";
        var formUrl = crmUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord";
        // Prepare the content that will go inside the popup
        var popupHtml = `
            <h2 style="text-align: left;"><strong>User Provision:</strong></h2>
        `;
        // Open the form inside newContainer
        appendUserProvisionPopupToBody(popupHtml, formUrl);
        toggleDropdownMenu('dropdown-content');
    }
}
