var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

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
        alert('Unlock All Fields button has already been clicked!!');
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
        alert('Show (Tabs, Section & Fields) button has already been clicked!!');
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

function renameTabsSectionsFields() {
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
        alert('LogicalNames button has already been clicked!!');
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
        window.open(formUrl, "New " + entityName + " Record", windowOptions);
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

function openPopup() {
  var isAdmin = false;
  var userName = Xrm.Utility.getGlobalContext().userSettings.userName; //Only for Adrian Solis
  var roles = Xrm.Utility.getGlobalContext().userSettings.roles;  
  for (var i = 0; i< roles.getLength(); i++) {
    var role = roles.get(i);
    if (role.name == "System Administrator") {
        isAdmin = true;
        break;
    }
  }  
  if (!isAdmin && userName !== "Adrian Solis") {
    Xrm.Navigation.openAlertDialog({ text: "You do not have permission to execute this action."});
    return;    
  }  
  var popupHtml = `
    <style>
      .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; width: 300px; padding: 20px; }
      .popup button { display: block; width: 100%; margin-bottom: 10px; padding: 10px; background-color: #002050; color: white; border: none; }
      .popup button:last-child { margin-bottom: 0; }
      .dropdown { position: relative; display: inline-block; width: 100%; }
      .dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 100%; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1; }
      .dropdown-content button { display: block; background-color: white; color: black; padding: 10px; text-align: left; border: none; width: 100%; }
    </style>
    <div class="popup">      
      <div class="dropdown">
        <button onclick="toggleDropdownMenu('dropdown-content-advanced-find');">Advanced Find Classic</button>
        <div id="dropdown-content-advanced-find" class="dropdown-content">
          <button onclick="openUrl('dev', 'advanceFind');">Advanced Find DEV</button>
          <button onclick="openUrl('int', 'advanceFind');">Advanced Find INT</button>
          <button onclick="openUrl('qa', 'advanceFind');">Advanced Find QA</button>
          <button onclick="openUrl('preprod', 'advanceFind');">Advanced Find Pre-Prod</button>
        </div>
      </div>
      <button onclick="fetchEntityFields();">Entity Info & Fields</button>
      <button onclick="unlockAllFields();">Unlock All Fields</button>
      <button onclick="showAllTabsAndSections();">Show (Tabs, Sections & Fields)</button>
      <button onclick="renameTabsSectionsFields();">LogicalNames (Tabs, Sections & Fields)</button>
      <div class="dropdown">
        <button onclick="toggleDropdownMenu('dropdown-content');">User Provision</button>
        <div id="dropdown-content" class="dropdown-content">
          <button onclick="openUrl('dev', 'userProvision');">User Provision DEV</button>
          <button onclick="openUrl('int', 'userProvision');">User Provision INT</button>
          <button onclick="openUrl('qa', 'userProvision')">User Provision QA</button>
          <button onclick="openUrl('preprod', 'userProvision');">User Provision Pre-Prod</button>
        </div>
      </div>
      <button onclick="openRestBuilder(getOrgUrl());">REST Builder</button>
      <button onclick="closePopup();">Close</button>      
    </div>
  `;
  var popupDiv = document.createElement('div');
  popupDiv.id = 'bookmarkletPopup';
  popupDiv.innerHTML = popupHtml;
  popupDiv.style.position = 'fixed';
  popupDiv.style.zIndex = '10000';
  popupDiv.style.left = '50%';
  popupDiv.style.top = '50%';
  popupDiv.style.transform = 'translate(-50%, -50%)';
  popupDiv.style.backgroundColor = 'white';  
  document.body.appendChild(popupDiv);
}

function toggleDropdownMenu(dropdownId) {
  var dropdownContent = document.getElementById(dropdownId);
  if (dropdownContent.style.display === 'block') {
    dropdownContent.style.display = 'none';
  } else {
    dropdownContent.style.display = 'block';
  }
}

function closePopup() {
	var popupDiv = document.getElementById('bookmarkletPopup');
	if (popupDiv) {
		popupDiv.remove();
	}
} 

window.fetchEntityFields = fetchEntityFields;
window.unlockAllFields = unlockAllFields;
window.showAllTabsAndSections = showAllTabsAndSections;
window.renameTabsSectionsFields = renameTabsSectionsFields;
window.toggleDropdownMenu = toggleDropdownMenu;
window.closePopup = closePopup;
window.openUrl = openUrl;
