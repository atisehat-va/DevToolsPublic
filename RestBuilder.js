async function openRestBuilder(orgUrl) {
  closeIframe();
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";

  // Query metadata to check if the web resource exists
  try {
    var query = "/webresourceset?$filter=name eq 'lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm'";
    var results = await Xrm.WebApi.retrieveMultipleRecords("webresource", query);
    
    if (results.entities.length > 0) {
      // If the web resource is found, open it
      window.open(restBuilderUrl, "REST Builder", windowOptions);
    } else {
      alert("This tool isn't available.");
    }
  } catch (error) {
    console.error("An error occurred while querying the web resource:", error);
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
