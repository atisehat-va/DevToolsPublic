function openRestBuilder(orgUrl) {
  closeIframe();
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder1.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
  
  // Check if the URL exists
  var req = new XMLHttpRequest();
  req.open('HEAD', restBuilderUrl, true);
  req.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        window.open(restBuilderUrl, "REST Builder", windowOptions);
      } else {
        Xrm.Navigation.openAlertDialog({ text: "This tool isn't available." });
      }
    }
  };
  req.send();
}

function getOrgUrl() {
  if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context) {
    return Xrm.Page.context.getClientUrl();
  } else {
    console.error('Unable to retrieve organization URL. Pleaes run this within a Dynamics CRM environment.');
    return '';
  }
}
