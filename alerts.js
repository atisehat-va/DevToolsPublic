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
//-------------------------------------
// Replace these with the ID of the record and the ID of the workflow
var recordId = "your-record-id";
var workflowId = "your-workflow-id";

// Create the URL for the workflow execution
var url = "/workflows(" + workflowId + ")/Microsoft.Dynamics.CRM.ExecuteWorkflow";

// Create the JSON object that contains the parameters for the workflow execution
var data = {
    "EntityId": recordId
};

// Use Xrm.WebApi to make the request
Xrm.WebApi.online.execute({
    method: "POST",
    functionName: url,
    operationType: 0, // This indicates the type of operation; 0 corresponds to a function
    operationName: "ExecuteWorkflow",
    parameters: data
}).then(
    function (success) {
        console.log("Workflow executed successfully!", success);
    },
    function (error) {
        console.error("Error executing workflow", error.message);
    }
);

