function openRestBuilder(orgUrl) {
  closeIframe();
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
  window.open(restBuilderUrl, "REST Builder", windowOptions);
}
function getOrgUrl() {
  if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context) {
    return Xrm.Page.context.getClientUrl();
  } else {
    console.error('Unable to retrieve organization URL. Pleaes run this within a Dynamics CRM environment.');
    return '';
  }
}
