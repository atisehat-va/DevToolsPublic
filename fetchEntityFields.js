function fetchEntityFields() {
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
}

function unlockAllFields() {
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && unlockAllFieldsBtnClickStatus) {        
        return;
    }
	var allControls = Xrm.Page.ui.controls.get();
	for (var i in allControls) {
		var control = allControls[i];
		if (control) {
			control.setDisabled(false);
		}
	}
    unlockAllFieldsBtnClickStatus = true;
    lastUpdatedFormId = currentFormId;
}

function showAllTabsAndSections() {
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && showAllTabsAndSectionsBtnClickStatus) {        
        return;
    }
	Xrm.Page.ui.tabs.forEach(function(tab) {
		if (!tab.getVisible()) {
			tab.setVisible(true);			
		}
		tab.sections.forEach(function(section) {
			if (!section.getVisible()) {
				section.setVisible(true);
			}
			section.controls.forEach(function(control) {
				if (!control.getVisible()) {
					control.setVisible(true);
				}
			});
		});
	});
    showAllTabsAndSectionsBtnClickStatus = true;
    lastUpdatedFormId = currentFormId;
    
}

function renameHeaderFields() {
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

function openUrl(environment, pageType) {  
    var crmUrl;
    var clientUrl = Xrm.Page.context.getClientUrl();
    var windowName;
    var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
    var timestamp = new Date().getTime();    
    switch (environment) {
        case 'dev':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "dev$2");            
            break;
        case 'int':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "int$2");            
            break;
        case 'qa':            
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "qa$2");
            break;
        case 'preprod':
            crmUrl = clientUrl.replace(/(\w+)(\.crm9)/, "preprod$2");
            break;
        default:
            return;
    }
    if (pageType === "advanceFind") {
        var advancedFindPath = '/main.aspx?pagetype=advancedfind';
        var advancedFindUrl = crmUrl + advancedFindPath;        
        windowName = "Advanced Find Classic " + timestamp;        
        window.open(advancedFindUrl, windowName, windowOptions);
        toggleDropdownMenu('dropdown-content-advanced-find');
    } else if (pageType === "userProvision") {
        var entityName = "vhacrm_userprovision";
        var formUrl = crmUrl + "/main.aspx?etn=" + entityName + "&pagetype=entityrecord"; 
        showContent(formUrl);
        //window.open(formUrl, "New " + entityName + " Record", "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,titlebar=no,toolbar=no");
        toggleDropdownMenu('dropdown-content');       
    }
}

function openRestBuilder(orgUrl) {
  var restBuilderPath = '/WebResources/lat_/CRMRESTBuilder/Xrm.RESTBuilder.htm#';
  var restBuilderUrl = orgUrl + restBuilderPath;
  var windowOptions = "height=600,width=800,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=no,toolbar=no";
  window.open(restBuilderUrl, "REST Builder", windowOptions);
}

function getOrgUrl() {
  if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context) {
    return Xrm.Page.context.getClientUrl();
  } else {
    console.error('Unable to retrieve organization URL. Pleaes run this within a Dynamics CRM environment.');
    return '';
  }
}
//New
function getDirtyFields() {
  var attributes = Xrm.Page.data.entity.attributes.get();
  var dirtyAttributes = attributes.filter(function(attribute) {
    return attribute.getIsDirty();
  });  
    
  var dirtyFieldList = dirtyAttributes.map(function(attribute) {
    var displayName = attribute.controls.get()[0].getLabel();
    var logicalName = attribute.getName();
    return '<li>' + displayName + ' (' + logicalName + ')' + '</li>';
  }).join('');

  return '<ul>' + dirtyFieldList + '</ul>';
}

// Show dirty fields
function showDirtyFields() {
  var dirtyFieldsHtml = getDirtyFields();

  var popupContent = `
    <style>
      .dirty-fields-popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; width: 300px; padding: 20px; }
      .dirty-fields-popup h3 { color: #002050; margin-bottom: 10px; }
      .dirty-fields-popup button { display: block; width: 100%; padding: 10px; background-color: #002050; color: white; border: none; }
      .dirty-fields-popup ul { padding: 0; margin: 10px 0; list-style: none; }
      .dirty-fields-popup li { padding: 5px; font-size: 14px; }
    </style>
    <div class="dirty-fields-popup">
      <h3>Modified Fields</h3>
      ${dirtyFieldsHtml}
      <button onclick="closeDirtyFieldsPopup();">Close</button>
    </div>
  `;

  var popupDiv = document.createElement('div');
  popupDiv.innerHTML = popupContent;
  popupDiv.style.position = 'absolute';
  popupDiv.style.zIndex = '10001'; 
  popupDiv.style.left = '50%';
  popupDiv.style.top = '50%';
  popupDiv.style.transform = 'translate(-50%, -50%)';
  popupDiv.style.backgroundColor = 'white';
  
  document.body.appendChild(popupDiv);
  
  makePopupMovable(popupDiv);
}