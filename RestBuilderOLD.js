async function openRestBuilder(orgUrl) {  
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
  
  try {
    var query = "?$select=displayname,name&$filter=displayname eq 'Xrm.RESTBuilder1.htm'";
    var results = await Xrm.WebApi.retrieveMultipleRecords("webresource", query);
    
    if (results.entities.length > 0) {
      // Check if WebResource exist
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
