var entity = {};

var req = new XMLHttpRequest();
var serverUrl = Xrm.Page.context.getClientUrl(); // Get the server URL from Dynamics 365 context
req.open("POST", serverUrl + "/api/data/v9.0/tasks", true);
req.setRequestHeader("OData-MaxVersion", "4.0");
req.setRequestHeader("OData-Version", "4.0");
req.setRequestHeader("Accept", "application/json");
req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
req.setRequestHeader("MSCRMCallerID", "60FBEAFB-7724-EB11-A813-000D3A569CF5"); // Replace with the desired user ID

req.onreadystatechange = function () {
    if (this.readyState === 4) {
        req.onreadystatechange = null;
        if (this.status === 204) {
            Xrm.Utility.alertDialog("New Task Record Created");
        } else {
            Xrm.Utility.alertDialog(this.statusText);
        }
    }
};
req.send(JSON.stringify(entity));
