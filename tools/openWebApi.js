// Open Web API Tool
function openWebApi() {
    // Check if form
    if (!requireFormContext()) {
        return;
    }    
    try {        
        const entityName = Xrm.Page.data.entity.getEntityName();
        const recordId = Xrm.Page.data.entity.getId();
        const cleanRecordId = recordId.replace(/[{}]/g, "").toLowerCase();
        const clientUrl = Xrm.Page.context.getClientUrl();                
        fetchEntityPluralName(entityName, clientUrl).then(function(pluralName) {
            if (!pluralName) {
                if (typeof showToast === 'function') {
                    showToast('Unable to determine entity collection name', 'error');
                }
                return;
            }            
            // Construct Web API URL
            const webApiUrl = `${clientUrl}/api/data/v9.2/${pluralName}(${cleanRecordId})`;            
            // Open in new tab
            const timestamp = new Date().getTime();
            const windowName = `WebAPI_${entityName}_${timestamp}`;
            window.open(webApiUrl, windowName);            
            if (typeof showToast === 'function') {
                showToast('Web API endpoint opened in new tab', 'success');
            }
        }).catch(function(error) {
            if (typeof showToast === 'function') {
                showToast('Error: ' + error.message, 'error');
            }
        });        
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast('Error opening Web API endpoint', 'error');
        }
    }
}
// Helper function
async function fetchEntityPluralName(entityName, clientUrl) {
    try {
        const response = await fetch(`${clientUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$select=LogicalCollectionName`);
        
        if (!response.ok) {
            throw new Error('Unable to fetch entity metadata');
        }
        
        const data = await response.json();
        return data.LogicalCollectionName;
        
    } catch (error) {
        throw error;
    }
}

