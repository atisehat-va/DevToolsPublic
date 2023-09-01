async function fetchEntityFields() {
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId();
    const cleanRecordId = recordId.replace(/[{}]/g, "");
    const url = `${Xrm.Page.context.getClientUrl()}/api/data/v9.1/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`;
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
const securityPopupCss = `
    .securityPopup { background-color: #f9f9f9; border: 3px solid #002050; border-radius: 20px;width: 800px !important; height: 100% !important; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
    .section { padding: 15px; border-right: 0px solid #ccc; overflow-y: scroll; }
    .content-section { text-align: left; height: 100%; width: 100%; }
    .securityPopup-row { display: flex; height: 100%; }
    .securityPopup-header { position: relative; text-align: center; padding: 10px; background-color: #002050; color: #fff; border: none; padding: 10px; z-index: 2; }
    .scrollable-section { height: 66%; overflow-y: auto; }
    .back-button { position: absolute; top: 0; left: 0; cursor: pointer; background-color: #333; color: #fff; padding: 10px; border-bottom-right-radius: 10px; }
`;
function generateFieldListHtml(fields) {
    return fields
        .filter(field => field.AttributeType !== 'Virtual' && field.DisplayName && field.DisplayName.UserLocalizedLabel && field.DisplayName.UserLocalizedLabel.Label)
        .map((field, index) => `
            <div>${index + 1}. <strong>${field.DisplayName.UserLocalizedLabel.Label}</strong>
                <div style="margin-left: 20px;">
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
        <div class="scrollable-section" style="padding: 5px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
            ${fieldListHtml}
        </div>
    `;
}
function appendPopupToBody(html, clearPrevious = false) {
	if (clearPrevious) {
        	const existingPopups = document.querySelectorAll('.securityPopup');
        	existingPopups.forEach(popup => popup.remove());
    	}    
	var newContainer = document.createElement('div');		
	newContainer.className = 'securityPopup';	
	newContainer.style.setProperty('width', '40%', 'important');
   	newContainer.style.setProperty('height', '50%', 'important');
	newContainer.style.position = 'fixed';  		
	newContainer.style.top = '50%';
	newContainer.style.left = '50%';
	newContainer.style.transform = 'translate(-50%, -50%)'; 
		
	newContainer.innerHTML = `
	    <div class="securityPopup-header">
                <button class="back-button" id="back-button">Back</button>
     		Entity & Fields Info
            </div>	    
	    <style>${securityPopupCss}</style>
	    <div class="securityPopup-row">
	        <div class="section content-section" id="section1">
	            ${html}
	        </div>
	    </div>
	`;
	document.body.appendChild(newContainer);

	document.getElementById('back-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	});
}  

function renameTabsSectionsFields() { 
	var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
	if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
	   showContent('alert', 'Show Logical Names button has already been clicked!!');
	   return;
	}
	Xrm.Page.ui.tabs.forEach(function(tab) {
		var logicalName = tab.getName();
		tab.setLabel(logicalName);
		tab.sections.forEach(function(section) {
			var logicalName = section.getName();
			section.setLabel(logicalName);
			section.controls.forEach(renameControlAndUpdateOptionSet);
		});
	});
    logicalNameBtnClickStatus = true; 
    lastUpdatedFormId = currentFormId;
    renameHeaderFields();   
}

function renameHeaderFields() {
    closeIframe();
    var headerControls = Xrm.Page.ui.controls.get(function (control, index) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(renameControlAndUpdateOptionSet);   
}


function renameControlAndUpdateOptionSet(control) {
	var attribute = control.getAttribute();
	if (attribute !== null) {
		var logicalName = attribute.getName();
		control.setLabel(logicalName);
		if (control.getControlType() === "optionset") {
			updateOptionSetValues(control);            
		}
	}
}

function updateOptionSetValues(control) {	
	var optionSetOptions = control.getOptions();
	optionSetOptions.forEach(function(option) {
		if (option.text !== "") {			
			var originalText = option.text.split("(").pop().split(")")[0];			
			var newText = option.value.toString() + " (" + originalText + ")";						
			control.removeOption(option.value);
			control.addOption({
				value: option.value,
				text: newText
			}, option.value);
		}
	});    
}
