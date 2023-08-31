async function fetchEntityFields() {
    const {getEntityName, getId, context: {getClientUrl}} = Xrm.Page.data.entity;
    const [entityName, recordId] = [getEntityName(), getId().replace(/[{}]/g, "")];
    const url = `${getClientUrl()}/api/data/v9.1/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`;
    try {
        const response = await fetch(url);
        if (!response.ok) return alert(`Error: ${response.statusText}`);
        const results = await response.json();
        appendPopupToBody(generatePopupHtml(entityName, recordId, generateFieldListHtml(results.value)));
    } catch (error) { alert(`Error: ${error}`); }
}

const generateFieldListHtml = fields => fields.filter(({AttributeType, DisplayName}) => AttributeType !== 'Virtual' && DisplayName?.UserLocalizedLabel?.Label)
    .map(({DisplayName, LogicalName, AttributeType}, index) => `<div>${index + 1}. <strong>${DisplayName.UserLocalizedLabel.Label}</strong><div style="margin-left: 20px;"><div>Name: ${LogicalName}</div><div>Type: ${AttributeType}</div></div></div>`).join('');

const generatePopupHtml = (entityName, cleanRecordId, fieldListHtml) => `<h2>Entity: ${entityName}</h2><h2>Record ID: ${cleanRecordId}</h2><h2>Fields:</h2><br><div style="padding: 5px; columns: 2;">${fieldListHtml}</div>`;
const securityPopupCss = `
    .securityPopup { background-color: #f9f9f9; border: 3px solid #444; border-radius: 20px;width: 800px !important; height: 100% !important; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
    .section { padding: 15px; border-right: 0px solid #ccc; overflow-y: scroll; }
    .content-section { text-align: left; height: 78%; width: 100%; }
    .securityPopup-row { display: flex; height: 100%; }
    .securityPopup-header { text-align: center; padding: 10px; background-color: #444; color: #fff; font-size: 18px; border-bottom: 2px solid #333; border-radius: 20px 20px 0 0; }
    .securityTooltip { position: absolute; top: 15px; right: 15px; cursor: pointer; background-color: #fff; border: 1px solid #444; border-radius: 50%; width: 20px; height: 20px; text-align: center; font-size: 14px; line-height: 20px; }
    .securityTooltipText { visibility: visible; width: 120px; background-color: black; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1; right: 100%; top: 50%; margin-top: -15px; opacity: 0; transition: opacity 0.3s; }
`;

function appendPopupToBody(html) {
    const newContainer = document.createElement('div');
    newContainer.className = 'securityPopup';
    newContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    newContainer.innerHTML = `<div class="securityPopup-header">Copy User Security</div><div id="securityTooltip" class="securityTooltip">i<span class="securityTooltipText">This tool allows you to copy Business Unit, Teams, and Security Roles from one user to another.</span></div><style>${securityPopupCss}</style><div class="securityPopup-row"><div class="section content-section">${html}</div></div>`;
    
    document.body.appendChild(newContainer);
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
