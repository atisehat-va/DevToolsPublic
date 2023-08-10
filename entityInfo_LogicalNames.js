/*function fetchEntityFields() {
	closeIframe();
	var entityName = Xrm.Page.data.entity.getEntityName();
	var entityId = Xrm.Page.data.entity.getId();
	var url = Xrm.Page.context.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + entityName + "')/Attributes?$select=LogicalName,AttributeType";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			if (this.status === 200) {
				var results = JSON.parse(this.responseText);
				var fieldList = results.value
					.filter(function(field) {
						return field.AttributeType !== 'Virtual';
					})
					.map(function(field, index) {
						return '<li>' + (index + 1) + '. ' + field.LogicalName + ' (' + field.AttributeType + ')</li>';
					})
					.join('');
				var html = '<html><head><title>Enitity Info & Fields</title><style>ul {columns: 4; -webkit-columns: 4; -moz-columns: 4;}</style></head><body><h2>Entity: ' + entityName + '</h2><h2>Record ID: ' + entityId + '</h2><h2>Fields:</h2><ul>' + fieldList + '</ul></body></html>';
				var newWindow = window.open();
				newWindow.document.write(html);
				newWindow.document.close();
			} else {
				alert("Error: " + this.statusText);
			}
		}
	};
	xhr.send();
}*/
function fetchEntityFields() {
	closeIframe();
	var entityName = Xrm.Page.data.entity.getEntityName();
	var entityId = Xrm.Page.data.entity.getId();
	var url = Xrm.Page.context.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + entityName + "')/Attributes?$select=LogicalName,AttributeType";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			if (this.status === 200) {
				var results = JSON.parse(this.responseText);
				var fieldList = results.value
					.filter(function(field) {
						return field.AttributeType !== 'Virtual';
					})
					.map(function(field, index) {
						return '<li>' + (index + 1) + '. ' + field.LogicalName + ' (' + field.AttributeType + ')</li>';
					})
					.join('');
				        var html = '<h2>Entity: ' + entityName + '</h2><h2>Record ID: ' + entityId + '</h2><h2>Fields:</h2><ul style="columns: 4; -webkit-columns: 4; -moz-columns: 4;">' + fieldList + '</ul>';
				var newWindow = window.open();
				showContent('alert', html);
			} else {
				alert("Error: " + this.statusText);
			}
		}
	};
	xhr.send();
}

function renameHeaderFields() {
    closeIframe();
    var headerControls = Xrm.Page.ui.controls.get(function (control, index) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(renameControlAndUpdateOptionSet);   
}

function renameTabsSectionsFields() {
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {        
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
    
    renameHeaderFields();
    
    logicalNameBtnClickStatus = true; 
    lastUpdatedFormId = currentFormId;
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
       if(option.text !== "") {
           control.removeOption(option.value);
           control.addOption({
              value: option.value,
              text: option.value.toString() + " (" + option.text + ")"
           }, option.value); 
        }
	});   
}
