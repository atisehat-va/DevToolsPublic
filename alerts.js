var userIdToImpersonate = "AE2280C2-84B8-ED11-83FE-001DD8070A7E"; // The ID of the user you want to impersonate
var entityToUpdateId = "B32280D2-95B8-ED11-83FE-001DD8070B7C"; // The ID of the entity you want to update
var entityName = "vhacrm_userprovisions"; // The logical name of the entity you want to update

var entity = {};
entity.mcs_removecurrentroles = false; // Set any properties you want to update

var req = new XMLHttpRequest();
req.open("PATCH", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/" + entityName + "(" + entityToUpdateId + ")", true);
req.setRequestHeader("OData-MaxVersion", "4.0");
req.setRequestHeader("OData-Version", "4.0");
req.setRequestHeader("Accept", "application/json");
req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
req.setRequestHeader("MSCRMCallerID", userIdToImpersonate); // This header allows you to impersonate another user

req.onreadystatechange = function() {
    if (this.readyState === 4) {
        req.onreadystatechange = null;
        if (this.status === 204) {
            Xrm.Utility.alertDialog("Entity updated successfully!");
        } else {
            Xrm.Utility.alertDialog(this.statusText);
        }
    }
};
req.send(JSON.stringify(entity));
