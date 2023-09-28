var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function getFormContext() {
    try {
        if (window.parent && window.parent.Xrm && window.parent.Xrm.Page) {
            return window.parent.Xrm.Page;
        }
    } catch (e) {}
    return Xrm.Page;
}

function renameTabsSectionsFields() { 
    var formContext = getFormContext();
    var currentFormId = formContext.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
        showCustomAlert('Show Logical Names button has already been clicked!!');
        //return;
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
    processAndRenameFieldsInFormComponents(formContext);
}

function renameHeaderFields() {
    var formContext = getFormContext();
    var headerControls = formContext.ui.controls.get(function(control) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(renameControlAndUpdateOptionSet);   
}

function renameControlAndUpdateOptionSet(control) {
    if (control && typeof control.getAttribute === 'function') {
        var attribute = control.getAttribute();
        if (attribute !== null) {
            var logicalName = attribute.getName();
            control.setLabel(logicalName);
            if (control.getControlType() === "optionset") {
                updateOptionSetValues(control);            
            }
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

function processAndRenameFieldsInFormComponents(formContext) {
    formContext.ui.controls.forEach(function(control) {
        if (control.getControlType() === "lookup") {
            // Use the naming pattern to fetch the Form Component
            var formComponentControlName = control.getName() + "1"; 
            var formComponentControl = formContext.ui.controls.get(formComponentControlName);
            
            if (formComponentControl) {
                var formComponentData = formComponentControl.data.entity.attributes;
                
                // Iterate over the attributes of the Form Component to rename them
                formComponentData.forEach(function(attribute) {
                    var logicalName = attribute.getName();
                    var formComponentFieldControl = formComponentData.getControl(logicalName);
                    if (formComponentFieldControl) {
                        formComponentFieldControl.setLabel(logicalName);
                    }
                });
            }
        }
    });
}
