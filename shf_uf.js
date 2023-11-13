var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function unlockAllFields() {
    closeIframe();
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
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
    closeIframe();	
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();  
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
