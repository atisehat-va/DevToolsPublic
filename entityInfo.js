async function fetchEntityFields() {
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId();
    const cleanRecordId = recordId.replace(/[{}]/g, "").toLowerCase();
    const url = `${Xrm.Page.context.getClientUrl()}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const results = await response.json();
            const fieldListHtml = generateFieldListHtml(results.value);
            const popupHtml = generatePopupHtml(entityName, cleanRecordId, fieldListHtml);
            appendPopupToBody(popupHtml);
        } else {            
            alert(`Error: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`Error: ${error}`);
        alert(`Error: ${error}`);
    }
}

function generateFieldListHtml(fields) {
    return fields
        .filter(field => field.AttributeType !== 'Virtual' && field.DisplayName && field.DisplayName.UserLocalizedLabel && field.DisplayName.UserLocalizedLabel.Label)
        .map((field, index) => `
            <div>${index + 1}. <strong>${field.DisplayName.UserLocalizedLabel.Label}</strong>
                <div style="margin-left: 20px; margin-bottom: 10px;">
                    <div>Name: ${field.LogicalName}</div>
                    <div>Type: ${field.AttributeType}</div>
                </div>
            </div>
        `)
        .join('');
}
function generatePopupHtml(entityName, cleanRecordId, fieldListHtml) {
     return `        
        <h2 style="text-align: left;">Entity: ${entityName}</h2>
        <h2 style="text-align: left;">Record ID: ${cleanRecordId}</h2>
        <h2 style="text-align: left;">Fields:</h2>
        <br>
        <div class="scroll-section" style="padding-left: 20px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
            ${fieldListHtml}
        </div>
    `;
}
function appendPopupToBody(html, clearPrevious = false) {
	if (clearPrevious) {
        	const existingPopups = document.querySelectorAll('.commonPopup');
        	existingPopups.forEach(popup => popup.remove());
    	}    
	var newContainer = document.createElement('div');	  	
	newContainer.className = 'commonPopup';		
	newContainer.innerHTML = `
	    <div class="commonPopup-header">
                <button class="commonback-button" id="commonback-button">Back</button>
     		Entity & Fields Info
            </div>   
	    <div class="entityInfoPopup-row">
	        <div class="commonSection content-section" id="section1">
	            ${html}
	        </div>
	    </div>
	`;
	document.body.appendChild(newContainer);
	document.getElementById('commonback-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
	makePopupMovable(newContainer);
} 
