var entity = {};
entity["vhacrm_systemuserid@odata.bind"] = "/systemusers(AE2280C2-84B8-ED11-83FE-001DD8070A7E)";
entity.mcs_removecurrentroles = false;
entity["vhacrm_userprovisionroleid@odata.bind"] = "/vhacrm_userprovisionroles(AE2280C2-84B8-ED11-83FE-001DD8070A7E)";

var req = new XMLHttpRequest();
req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/vhacrm_userprovisions", true);
req.setRequestHeader("OData-MaxVersion", "4.0");
req.setRequestHeader("OData-Version", "4.0");
req.setRequestHeader("Accept", "application/json");
req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
req.onreadystatechange = function() {
    if (this.readyState === 4) {
        req.onreadystatechange = null;
        if (this.status === 204) {
            var uri = this.getResponseHeader("OData-EntityId");
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(uri);
            var newEntityId = matches[1];
        } else {
            Xrm.Utility.alertDialog(this.statusText);
        }
    }
};
req.send(JSON.stringify(entity));
