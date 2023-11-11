var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function renameTabsSectionsFields() {      
    try {
        var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();      
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
    } catch (e) {
        console.error("Error in renameTabsSectionsFields:", e);
    }   
}

function renameHeaderFields() {    
    try {
        var headerControls = Xrm.Page.ui.controls.get(function(control) {
            var controlType = control.getControlType();
            return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
        });
        headerControls.forEach(renameControlAndUpdateOptionSet);   
    } catch (e) {
        console.error("Error in renameHeaderFields:", e);
    }
}

function renameControlAndUpdateOptionSet(control) {
    try {
        if (control && typeof control.getAttribute === 'function') {
            var attribute = control.getAttribute();
            if (attribute && typeof attribute.getName === 'function') {
                var logicalName = attribute.getName();
                control.setLabel(logicalName);
                if (control.getControlType() === "optionset") {
                    updateOptionSetValues(control);            
                }
            }
        }
    } catch (e) {
        console.error("Error in renameControlAndUpdateOptionSet:", e);
    }
}

function updateOptionSetValues(control) {
    try {
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
    } catch (e) {
        console.error("Error in updateOptionSetValues:", e);
    }   
}

function processAndRenameFieldsInFormComponents() { 
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
                        if (formComponentFieldControl && typeof formComponentFieldControl.setLabel === 'function') {
                            formComponentFieldControl.setLabel(logicalName);
                        }
                    });

                    formComponentControl.ui.tabs.forEach(function(tab) {
                        tab.sections.forEach(function(section) {
                            var logicalName = section.getName();
                            section.setLabel(logicalName);
                        });
                    });
                }
            }
        });
    } catch (e) {
        console.error("Error in processAndRenameFieldsInFormComponents:", e);
    }
}
