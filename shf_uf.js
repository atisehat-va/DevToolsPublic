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
    unlockFieldsInFormComponents();
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

function unlockFieldsInFormComponents() { 
    try {
        Xrm.Page.ui.controls.forEach(function(control) {
            if (control.getControlType() === "formcomponent") {
                var formComponentControlName = control.getName(); 
                var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);                
                if (formComponentControl && formComponentControl.data && formComponentControl.data.entity) {
                    var formComponentData = formComponentControl.data.entity.attributes;

                    formComponentData.forEach(function(attribute) {
                        var logicalName = attribute._attributeName;
                        var formComponentFieldControl = formComponentControl.getControl(logicalName);
                        if (formComponentFieldControl && typeof formComponentFieldControl.setDisabled === 'function') {
                            formComponentFieldControl.setDisabled(false); 
                        }
                    });
                }
            }
        });
    } catch (e) {
        console.error("Error in unlockFieldsInFormComponents:", e);
    }
}
