var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

//new
const baseUrl = 'https://atisehat-va.github.io/DevToolsPublic/';
// Load external scripts dynamically
function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = baseUrl + src;
  script.onload = callback;
  document.head.appendChild(script);
}

// Load related JavaScript files
loadScript('advanceFind_userProvision.js', () => console.log('Advanced find & User Provision loaded!'));
loadScript('entityInfo_LogicalNames.js', () => console.log('EntityInfo and Field Logical Names loaded!'));
loadScript('showHiddenItems_UnlockFields.js', () => console.log('Show Hidden Items and Unlock Fields loaded!'));
loadScript('showDirtyFields.js', () => console.log('Show Modified Fields loaded!'));
loadScript('RestBuilder.js', () => console.log('Rest Builder loaded!'));

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
        .container.expanded-iframe { width: 900px; height: 500px; }
	.container.expanded-alert { width: 900px; height: 248px;}
        .container.expanded-html { width: 900px; height: 500px;}
        .button-container { width: 400px; }
        .iframe-container { display: none; flex-grow: 1; position: relative; padding: 20px; }
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
	.alert-message { text-align: center; boarder-radius: 5px; background-color: #fee; padding: 10px; margin: 10px font-weight: bold; color: #900; }
 	.html { overflow-y: scroll; width: 100%; height: 450px; background-color: #fee; color: #900; padding: 1px; display: block; }        
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
					<button onclick="copySecurity();">Copy Security</button>
     					<button onclick="renameTabsSectionsFields();">Change Security</button>					
				</div>
				<div class="button-row">
					<button onclick="fetchEntityFields();">Entity Info & Fields</button>
     					<button onclick="renameTabsSectionsFields();">Show Logical Names</button>					
				</div>
				<div class="button-row">
					<button onclick="showAllTabsAndSections();">Show Hidden Items</button>
					<button onclick="unlockAllFields();">Unlock All Fields</button>
				</div>
				<div class="button-row">
					<button onclick="showDirtyFields();">Show Modified Fields</button>
					<button onclick="openRestBuilder(getOrgUrl());">Open REST Builder</button>
				</div>      
					<button onclick="closePopup();">Close</button>				
			</div>
            <div class="iframe-container" id="iframe-container">                
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
function copySecurity() {
  var url = baseUrl + 'copySecurity.html';
  showContent('iframe', url);
}
function showContent(contentType, url) {
  debugger;
  var contentDiv = document.getElementById('popupContent');
  var containerDiv = document.getElementById('container');
  var iframeContainer = document.getElementById('iframe-container');  
	
  // Clear previous content
  contentDiv.innerHTML = '';
  containerDiv.classList.remove('expanded-iframe');
  containerDiv.classList.remove('expanded-alert');
  containerDiv.classList.remove('expanded-html');

    switch (contentType) {
    case 'iframe':
      url += (url.indexOf('?') >= 0 ? '&' : '?') + 'navbar=off';
      contentDiv.innerHTML = `<iframe src="${url}" width="100%" height="450" frameborder="0"></iframe>`;
      iframeContainer.style.display = 'block'; // Show iframe container
      containerDiv.classList.add('expanded-iframe');
      break;
    case 'alert':     
      var alertDiv = document.createElement('div');      
      alertDiv.className = 'alert-message';      
      alertDiv.innerHTML = url;
      contentDiv.appendChild(alertDiv);      
      iframeContainer.style.display = 'block';
      containerDiv.classList.add('expanded-alert');
      break;
    case 'html': 
      var htmlDiv = document.createElement('div');      
      htmlDiv.className = 'html';      
      htmlDiv.innerHTML = url;
      contentDiv.appendChild(htmlDiv);
      iframeContainer.style.display = 'block';
      containerDiv.classList.add('expanded-html');
      break;
    default:
      console.error('Invalid content type');
      return;
  } 

  // horizontal expansion
  containerDiv.classList.add('expanded');
  contentDiv.style.display = 'block'; // Show content
}

function closeIframe(url) { 
  var contentDiv = document.getElementById('popupContent');
  var containerDiv = document.getElementById('container');
  var iframeContainer = document.getElementById('iframe-container');
  
  contentDiv.style.display = 'none';
  iframeContainer.style.display = 'none';  
  //containerDiv.classList.remove('expanded');
  containerDiv.classList.remove('expanded-iframe');
  containerDiv.classList.remove('expanded-alert');
  containerDiv.classList.remove('expanded-html');
}

function makePopupMovable(popupDiv) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  popupDiv.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    //new
    var iframeContainer = document.getElementById('iframe-container');
    if (iframeContainer.contains(e.target)) {
	return;
    }
    //newEnd
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
	closeIframe();
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
