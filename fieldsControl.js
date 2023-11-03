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

function renameFormComponentFields() {
    try {
        // Select all elements with a data-control-name attribute
        var fieldElements = document.querySelectorAll('[data-control-name]');

        // Loop through each element and set its display name
        fieldElements.forEach(function(field) {
            // Extract the control name from the data-control-name attribute
            var controlName = field.getAttribute('data-control-name');

            // Attempt to find the label by assuming it's in a span within a sibling div
            var label = field.closest('div').querySelector('span');

            // Check if the label exists and update its text content
            if(label) {
                label.textContent = controlName; // Set label text to the control name
            }
        });
    } catch (e) {
        console.error("Error in renameFormComponentFields:", e);
    }
}

// Invoke the function to update field names
renameFormComponentFields();

function renameFormComponentFields() {
    try {
        // Select all elements with a data-control-name attribute that may represent various fields
        var fieldElements = document.querySelectorAll('[data-control-name]');

        // Loop through each element and set its display name
        fieldElements.forEach(function(field) {
            // Extract the control name from the data-control-name attribute
            var controlName = field.getAttribute('data-control-name');
            var label;

            // Attempt to find the label. The assumption here is that for date fields, the label might be a sibling or a child of a sibling div.
            if (field.tagName.toLowerCase() === 'input' && field.type === 'date') {
                // Date inputs might have a different structure, adjust the selector accordingly
                label = field.closest('div').previousElementSibling.querySelector('label span');
            } else {
                // For other types of inputs, assume label is in a span within a sibling div
                label = field.closest('div').querySelector('span');
            }

            // Check if the label exists and update its text content
            if(label) {
                label.textContent = controlName; // Set label text to the control name
            }
        });
    } catch (e) {
        console.error("Error in renameFormComponentFields:", e);
    }
}

// Invoke the function to update field names
renameFormComponentFields();
