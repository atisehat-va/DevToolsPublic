var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function getFormContext() {
    try {
        // Check if access to parent window is allowed and Xrm.Page exists
        if (window.parent && window.parent.Xrm && window.parent.Xrm.Page) {
            return window.parent.Xrm.Page;
        }
    } catch (e) {
        // Access denied or other error
    }
    // Fallback to direct access if above fails
    return Xrm.Page;
}

function renameTabsSectionsFields() { 
    var formContext = getFormContext();
    var currentFormId = formContext.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
        showCustomAlert('Show Logical Names button has already been clicked!!');	   
        return;
    }
    formContext.ui.tabs.forEach(function(tab) {
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
    var formContext = getFormContext();
    closeIframe();
    var headerControls = formContext.ui.controls.get(function (control, index) {
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
