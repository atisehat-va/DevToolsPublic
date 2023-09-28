var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function renameTabsSectionsFields(formContext) { 
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
            section.controls.forEach(function(control) {
                renameControlAndUpdateOptionSet(control, formContext);
            });
        });
    });
    logicalNameBtnClickStatus = true; 
    lastUpdatedFormId = currentFormId;
    renameHeaderFields(formContext);   
}

function renameHeaderFields(formContext) {
    closeIframe();
    var headerControls = formContext.ui.controls.get(function (control, index) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(function(control) {
        renameControlAndUpdateOptionSet(control, formContext);
    });   
}

function renameControlAndUpdateOptionSet(control, formContext) {
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
