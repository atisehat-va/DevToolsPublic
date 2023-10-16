function openRestBuilder(orgUrl) {
  closeIframe();
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";

  // Create a hidden iframe
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = restBuilderUrl;

  iframe.onload = function() {
    // If the iframe loads successfully, the web resource is available
    document.body.removeChild(iframe); // Remove the iframe
    window.open(restBuilderUrl, "REST Builder", windowOptions);
  };

  iframe.onerror = function() {
    // If an error occurs while loading the iframe, the web resource is unavailable
    document.body.removeChild(iframe); // Remove the iframe
    alert("This tool isn't available.");
  };

  // Append the iframe to the body to trigger loading
  document.body.appendChild(iframe);
}

function getOrgUrl() {
  if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context) {
    return Xrm.Page.context.getClientUrl();
  } else {
    console.error('Unable to retrieve organization URL. Please run this within a Dynamics CRM environment.');
    return '';
  }
}
