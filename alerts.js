var userId = Xrm.Utility.getGlobalContext().userSettings.userId;

var entity = {};
entity["vhacrm_systemuserid@odata.bind"] = "/systemusers(" + userId.replace("{", "").replace("}", "") + ")";
entity.mcs_removecurrentroles = false;
// Set other properties as needed

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
----------------------------------
    function executeCustomAction(userId) {
  // Replace with your Action's unique name
  var actionName = "new_MyCustomAction";

  // Define the request payload
  var data = {
    UserName: {
      id: userId, // GUID of the User entity
      entityType: "systemuser" // Entity logical name
    }
  };

  // Build the request URL
  var req = new XMLHttpRequest();
  req.open(
    "POST",
    Xrm.Utility.getGlobalContext().getClientUrl() +
      "/api/data/v9.1/" +
      actionName,
    true
  );

  req.setRequestHeader("OData-MaxVersion", "4.0");
  req.setRequestHeader("OData-Version", "4.0");
  req.setRequestHeader("Accept", "application/json");
  req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  req.onreadystatechange = function () {
    if (this.readyState === 4) {
      req.onreadystatechange = null;
      if (this.status === 204) {
        // Success - Handle as needed
        var results = JSON.parse(this.response);
      } else {
        // Error - Handle as needed
        var error = JSON.parse(this.response).error;
        console.error(error.message);
      }
    }
  };

  // Send the request with the payload
  req.send(JSON.stringify(data));
}
executeCustomAction("USER-GUID-HERE");

