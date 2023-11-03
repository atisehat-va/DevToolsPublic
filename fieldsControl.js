var lastUpdatedFormId = null;
var logicalNameBtnClickStatus = false;
var unlockAllFieldsBtnClickStatus = false;
var showAllTabsAndSectionsBtnClickStatus = false;

function renameTabsSectionsFields() {      
    try {
        var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
     /*   if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
            showCustomAlert('Show Logical Names button has already been clicked!!');
            return;
        } */
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
            // Wait for the subform to be fully loaded
            waitForSubformToLoad(control, function() {
                var attribute = control.getAttribute();
                if (attribute && typeof attribute.getName === 'function') {
                    var logicalName = attribute.getName();
                    control.setLabel(logicalName);
                    if (control.getControlType() === "optionset") {
                        updateOptionSetValues(control);            
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error in renameControlAndUpdateOptionSet:", e);
    }
}

function waitForSubformToLoad(control, callback) {
    // Example function to wait for subform to load - implementation may vary
    var checkLoaded = setInterval(function() {
        if (control.getFormContext && control.getFormContext().ui) { // Check if subform is loaded
            clearInterval(checkLoaded);
            callback(); // Call your function after subform is confirmed to be loaded
        }
    }, 500); // Check every 500ms - adjust as needed
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

function processAndRenameFieldsInFormComponents() { debugger;
    try {
        Xrm.Page.ui.controls.forEach(function(control) {
            if (control.getControlType() === "lookup") {
                var formComponentControlName = control.getName() + "1"; 
                var formComponentControl = Xrm.Page.ui.controls.get(formComponentControlName);

                // Check if formComponentControl and formComponentControl.data are defined
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

(function updateFieldDisplayNames() {
    // Query all the labels of the form controls
    var labels = document.querySelectorAll('label');

    // Loop over each label element
    labels.forEach(function(label) {
        // Attempt to find a corresponding input or select element
        var input = document.querySelector('#' + label.htmlFor) || document.querySelector('[data-id="' + label.htmlFor + '"]');
        
        if(input) {
            // Get the name of the field from the input's data attributes or other attributes
            var fieldName = input.getAttribute('data-fieldname') || input.name;
            
            if(fieldName) {
                // For demonstration, just appending '(Updated)' to the original label text
                // Here you would replace with the actual logic you need to determine the new label text
                label.textContent = fieldName + ' (Updated)';
            }
        }
    });
})();
