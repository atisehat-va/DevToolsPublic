function executeCustomAction(entityId, entityName, userId) {
  // Replace with your Action's unique name
  var actionName = "new_MyCustomAction";

  // Define the request payload
  var data = {
    UserName: {
      id: userId, // GUID of the User entity
      entityType: "systemuser" // Entity logical name
    }
  };

  // Build the request URL for the bound action
  var req = new XMLHttpRequest();
  req.open(
    "POST",
    Xrm.Utility.getGlobalContext().getClientUrl() +
      "/api/data/v9.1/" +
      entityName + "s(" + entityId + ")/Microsoft.Dynamics.CRM." + actionName,
    true
  );

  // Rest of the code remains the same as above ...
}

// Invoke the function
executeCustomAction("ENTITY-GUID-HERE", "entitylogicalname", "USER-GUID-HERE");

