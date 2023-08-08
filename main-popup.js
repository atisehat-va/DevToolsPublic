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

//EndNew
function openPopup() {
  var isAdmin = false;
  var userName = Xrm.Utility.getGlobalContext().userSettings.userName;
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
        .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; transition: width 0.5s; }
        .container { display: flex; flex-direction: row; width: 400px; transition: width 0.5s; }
        .container.expanded { width: 900px; height: 500px; }
        .button-container { width: 400px; }
        .iframe-container { display: none; flex-grow: 1; position: relative;}
        .popup button { display: block; width: 100%; margin-bottom: 10px; padding: 10px; background-color: #002050; color: white; border: none; }
        .button-row { display: flex; justify-content: space-between; flex-direction: row; width: 100%; }
        .button-row button { width: calc(50% - 5px); } 
        .dropdown button { width: 100%; }
        .button-row .full-width { width: 100%; }
        .dropdown-row { display: flex; justify-content: space-between; flex-direction: row; width: 100%; }
        .dropdown { position: relative; display: inline-block; width: calc(50% - 5px); }
        .dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 100%; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1; }
        .dropdown-content button { display: block; background-color: white; color: black; padding: 10px; text-align: left; border: none; width: 100%; }
        .content { display: none; width: 100%; border-top: 1px solid #888; padding-top: 10px; }        
        .close-iframe { position: absolute; right: 0; bottom: -20px; boarder: none; cursor: pointer; }            
     </style>
    <div class="popup">
		<div class="container" id="container">
			<div class="button-container">
				<div class="dropdown-row">
				  <div class="dropdown">
					<button onclick="toggleDropdownMenu('dropdown-content-advanced-find');">Advanced Find</button>
					<div id="dropdown-content-advanced-find" class="dropdown-content">
					  <button onclick="openUrl('dev', 'advanceFind');">Advanced Find DEV</button>
					  <button onclick="openUrl('int', 'advanceFind');">Advanced Find INT</button>
					  <button onclick="openUrl('qa', 'advanceFind');">Advanced Find QA</button>
					  <button onclick="openUrl('preprod', 'advanceFind');">Advanced Find Pre-Prod</button>
					</div>
				  </div>
				  <div class="dropdown">
					  <button onclick="toggleDropdownMenu('dropdown-content');">User Provision</button>
					<div id="dropdown-content" class="dropdown-content">
					  <button onclick="openUrl('dev', 'userProvision');">User Provision DEV</button>
					  <button onclick="openUrl('int', 'userProvision');">User Provision INT</button>
					  <button onclick="openUrl('qa', 'userProvision')">User Provision QA</button>
					  <button onclick="openUrl('preprod', 'userProvision');">User Provision Pre-Prod</button>
					</div>
				  </div>
				</div>            
				<div class="button-row">
					<button onclick="fetchEntityFields();">Entity Info & Fields</button>
					<button onclick="unlockAllFields();">Unlock All Fields</button>
				</div>
				<div class="button-row">
					<button onclick="showAllTabsAndSections();">Show Hidden Items</button>
					<button onclick="renameTabsSectionsFields();">LogicalNames</button>
				</div>
				<div class="button-row">
					<button onclick="showDirtyFields();">Show Modified Fields</button>
					<button onclick="openRestBuilder(getOrgUrl());">REST Builder</button>
				</div>      
					<button onclick="closePopup();">Close</button>				
			</div>
            <div class="iframe-container" id="iframe-container">
                <button class="close-iframe" onclick="closeIframe();">Close</button>
				<div id="popupContent" class="content"></div>
			</div>
		</div>
    </div>
  `;
  var popupDiv = document.createElement('div');
  popupDiv.id = 'bookmarkletPopup';
  popupDiv.innerHTML = popupHtml;
  popupDiv.style.position = 'absolute';
  popupDiv.style.zIndex = '10000';
  popupDiv.style.left = '50%';
  popupDiv.style.top = '50%';
  popupDiv.style.transform = 'translate(-50%, -50%)';
  popupDiv.style.backgroundColor = 'white';  
  document.body.appendChild(popupDiv);
  
  makePopupMovable(popupDiv);
}

function showContent(url) {
  url += (url.indexOf('?') >= 0 ? '&' : '?') + 'navbar=off';
  
  var contentDiv = document.getElementById('popupContent');
  var containerDiv = document.getElementById('container');
  var iframeContainer = document.getElementById('iframe-container');

  contentDiv.innerHTML = `<iframe src="${url}" width="100%" height="500" frameborder="0"></iframe>`;
  contentDiv.style.display = 'block';
  iframeContainer.style.display = 'block'; // Show iframe container

  // horizontal expansion
  containerDiv.classList.add('expanded');
}

function closeIframe(url) { 
  var contentDiv = document.getElementById('popupContent');
  var containerDiv = document.getElementById('container');
  var iframeContainer = document.getElementById('iframe-container');
  
  contentDiv.style.display = 'none';
  iframeContainer.style.display = 'none';  
  containerDiv.classList.remove('expanded');
}

function makePopupMovable(popupDiv) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  popupDiv.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    popupDiv.style.top = (popupDiv.offsetTop - pos2) + "px";
    popupDiv.style.left = (popupDiv.offsetLeft - pos1) + "px";
  }


    function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
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

function closeDirtyFieldsPopup() {
  var popup = document.querySelector('.dirty-fields-popup');
  if (popup) {
    popup.remove();
  }
}
 

window.fetchEntityFields = fetchEntityFields;
window.unlockAllFields = unlockAllFields;
window.showAllTabsAndSections = showAllTabsAndSections;
window.renameTabsSectionsFields = renameTabsSectionsFields;
window.toggleDropdownMenu = toggleDropdownMenu;
window.closePopup = closePopup;
window.openUrl = openUrl;
//new
window.showDirtyFields = showDirtyFields;
window.closeDirtyFieldsPopup = closeDirtyFieldsPopup;
