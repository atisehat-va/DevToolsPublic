var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function renameTabsSectionsFields() {     
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
        showCustomAlert('Show Logical Names button has already been clicked!!');
        //return;
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
    renameHeaderFields();
    processAndRenameFieldsInFormComponents();
}

function renameHeaderFields() {    
    var headerControls = Xrm.Page.ui.controls.get(function(control) {
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

function processAndRenameFieldsInFormComponents() {
    Xrm.Page.ui.controls.forEach(function(control) {
        if (control.getControlType() === "lookup") {
            // Use the naming pattern to fetch the Form Component
            var formComponentControlName = control.getName() + "1"; 
            var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);
            
            if (formComponentControl) {
                var formComponentData = formComponentControl.data.entity.attributes;
                
                // Rename the fields of the Form Component
                formComponentData.forEach(function(attribute) {
                    var logicalName = attribute._attributeName;
                    var formComponentFieldControl = formComponentControl.getControl(logicalName);
                    if (formComponentFieldControl && typeof formComponentFieldControl.setLabel === 'function') {
                        formComponentFieldControl.setLabel(logicalName);
                    }
                });

                // Rename the sections of the Form Component
                formComponentControl.ui.tabs.forEach(function(tab) {
                    tab.sections.forEach(function(section) {
                        var logicalName = section.getName();
                        section.setLabel(logicalName);
                    });
                });
            }
        }
    });
}
