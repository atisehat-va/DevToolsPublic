async function openRestBuilder(orgUrl) {
  closeIframe();
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";

  // Check if the web resource is available
  try {
    const response = await fetch(restBuilderUrl, {
      method: 'HEAD' // Using 'HEAD' to just fetch the headers and not the entire body
    });
    
    // If the web resource is available, open the window
    if (response.ok) {
      window.open(restBuilderUrl, "REST Builder", windowOptions);
    } else {
      alert("This tool isn't available.");
    }
  } catch (error) {
    // Handle any network errors
    console.error('Network error occurred:', error);
    alert("This tool isn't available.");
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
