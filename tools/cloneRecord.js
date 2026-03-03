async function cloneRecord() {
    if (!requireFormContext()) {
        return;
    }
    
    try {
        const entityId = Xrm.Page.data.entity.getId();
        if (!entityId) {
            if (typeof showToast === 'function') {
                showToast('Please open an existing record to clone', 'warning');
            }
            return;
        }
                
        const existingPopups = document.querySelectorAll('.commonPopup');
        existingPopups.forEach(popup => popup.remove());
        
        const entityName = Xrm.Page.data.entity.getEntityName();
        const cleanEntityId = entityId.replace(/[{}]/g, '');
        const fieldAnalysis = await analyzeAllFields(entityName, cleanEntityId);
        const popupContainer = createCloneRecordPopup(fieldAnalysis);
        document.body.appendChild(popupContainer);
        
        setupCloneRecordHandlers(popupContainer, fieldAnalysis, entityName);
                
        if (typeof makePopupMovable === 'function') {
            makePopupMovable(popupContainer);
        }
        
    } catch (error) {
        console.error('Error opening Clone Record tool:', error);
        if (typeof showToast === 'function') {
            showToast('Error opening tool', 'error');
        }
    }
}

async function analyzeAllFields(entityName, entityId) {
    const fields = {
        lookup: [],
        string: [],
        memo: [],
        boolean: [],
        datetime: [],
        decimal: [],
        double: [],
        integer: [],
        money: [],
        optionset: [],
        multiselectoptionset: [],
        bigint: [],
        other: []
    };

    const formAttributeMap = {};
    //Read all attributes on the form
    try {
        const attributes = Xrm.Page.data.entity.attributes.get();

        attributes.forEach(attribute => {
            try {
                const attrType = attribute.getAttributeType();
                const attrName = attribute.getName();
                const controls = attribute.controls.get();

                let displayName = attrName;
                if (controls && controls.length > 0 && typeof controls[0].getLabel === 'function') {
                    const label = controls[0].getLabel();
                    if (label) displayName = label;
                }

                const requiredLevel = attribute.getRequiredLevel();
                const isRequired = requiredLevel === 'required';
                const isRecommended = requiredLevel === 'recommended';
                const currentValue = attribute.getValue();

                const fieldInfo = {
                    name: attrName,
                    displayName: displayName,
                    type: attrType,
                    isRequired: isRequired,
                    isRecommended: isRecommended,
                    currentValue: currentValue,
                    attribute: attribute
                };

                if (attrType === 'optionset' || attrType === 'multiselectoptionset') {
                    if (controls && controls.length > 0 && typeof controls[0].getOptions === 'function') {
                        fieldInfo.options = controls[0].getOptions();
                    }
                }

                formAttributeMap[attrName] = fieldInfo;

                if (fields[attrType] !== undefined) {
                    fields[attrType].push(fieldInfo);
                } else {
                    fields.other.push(fieldInfo);
                }
            } catch (e) {}
        });
    } catch (error) {
        console.error('Error analyzing form fields:', error);
    }

    //Fetch full record
    try {
        const apiRecord = await Xrm.WebApi.retrieveRecord(entityName, entityId);
        const processedNames = new Set(Object.keys(formAttributeMap));

        // Process lookup fields
        Object.keys(apiRecord).forEach(key => {
            if (!key.startsWith('_') || !key.endsWith('_value') || key.includes('@')) return;
            const fieldName = key.slice(1, -6);
            if (processedNames.has(fieldName)) return;
            const guidValue = apiRecord[key];
            if (!guidValue) return;

            const displayNameValue = apiRecord[`${key}@OData.Community.Display.V1.FormattedValue`] || '';
            const entityType = apiRecord[`${key}@Microsoft.Dynamics.CRM.lookuplogicalname`] || '';
            fields.lookup.push({
                name: fieldName,
                displayName: fieldName,
                type: 'lookup',
                isRequired: false,
                isRecommended: false,
                currentValue: [{ id: guidValue, name: displayNameValue, entityType: entityType }],
                attribute: null,
                isFromApi: true
            });
            processedNames.add(fieldName);
        });

        // Process non-lookup
        Object.keys(apiRecord).forEach(key => {
            if (key.startsWith('@') || key.includes('@') || key.startsWith('_')) return;
            if (processedNames.has(key)) return;

            const value = apiRecord[key];
            if (value === null || value === undefined) return;

            const formattedValue = apiRecord[`${key}@OData.Community.Display.V1.FormattedValue`];

            let attrType;
            let processedValue = value;

            if (typeof value === 'boolean') {
                attrType = 'boolean';
            } else if (typeof value === 'number') {                
                if (formattedValue && isNaN(Number(formattedValue))) {
                    attrType = 'optionset';
                } else {
                    attrType = Number.isInteger(value) ? 'integer' : 'decimal';
                }
            } else if (typeof value === 'string') {
                if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
                    attrType = 'datetime';
                    processedValue = new Date(value);
                } else {
                    attrType = 'string';
                }
            } else {
                attrType = 'other';
            }

            const fieldInfo = {
                name: key,
                displayName: key,
                type: attrType,
                isRequired: false,
                isRecommended: false,
                currentValue: processedValue,
                attribute: null,
                isFromApi: true,
                formattedValue: formattedValue
            };
            if (fields[attrType] !== undefined) {
                fields[attrType].push(fieldInfo);
            } else {
                fields.other.push(fieldInfo);
            }
            processedNames.add(key);
        });

    } catch (error) {
        console.error('Error fetching full record via Web API:', error);        
    }
    return fields;
}

function createCloneRecordPopup(fieldAnalysis) {
    const container = document.createElement('div');
    container.className = 'commonPopup';
    
    container.innerHTML = `
        <div class="commonPopup-header">
            <span style="color: white;">Clone Record</span>
            <span class="close-button">&times;</span>
        </div>
        <div class="popup-body">
            <div class="commonSection content-section">
                
                <!-- Instructions -->
                <div style="background-color: white; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6; border-right: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
                        <strong>Note:</strong> Selected field(s) will be cloned to a new record. Fields marked with <span style="color: #ef4444; font-weight: bold;">*</span> are required and could require a manual save if left unchecked.
                    </p>
                </div>
                
                <!-- Fields by Type -->
                <div class="scroll-section" style="overflow-y: auto; max-height: calc(80vh - 240px); padding-right: 10px;">
                    ${generateFieldsHTML(fieldAnalysis)}
                </div>
                
                <!-- Action Buttons -->
                <div style="position: relative; display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px;">
                    <!-- Copies input anchored to the left -->
                    <div style="position: absolute; left: 0; display: flex; align-items: center; gap: 8px;">
                        <label for="cloneCountInput" style="font-size: 14px; font-weight: bold; color: #2b2b2b; white-space: nowrap;">Copies:</label>
                        <input
                            type="number"
                            id="cloneCountInput"
                            min="1"
                            max="10"
                            value="1"
                            style="width: 58px; padding: 10px 6px; font-size: 14px; font-weight: 600; text-align: center; border: 2px solid #d1d5db; border-radius: 8px; background: white; color: #2b2b2b; outline: none; box-shadow: 0 2px 4px rgba(0,0,0,0.08);"
                            onfocus="this.style.borderColor='#2b2b2b';"
                            onblur="this.style.borderColor='#d1d5db'; this.value = Math.min(Math.max(parseInt(this.value)||1,1),10);"
                        >
                    </div>
                    <!-- Centred buttons -->
                    <button 
                        id="selectAllButton"
                        style="padding: 10px 24px; font-size: 14px; font-weight: 600; background-color: #6b7280; color: white; border: none; cursor: pointer; border-radius: 8px; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);"
                        onmouseover="this.style.backgroundColor='#4b5563'; this.style.transform='translateY(-1px)';"
                        onmouseout="this.style.backgroundColor='#6b7280'; this.style.transform='translateY(0)';"
                    >
                        Select All
                    </button>
                    <button 
                        id="cloneRecordButton"
                        style="padding: 12px 32px; font-size: 15px; font-weight: 600; width: auto; min-width: 180px; background-color: #2b2b2b; color: white; border: none; cursor: pointer; border-radius: 8px; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);"
                        onmouseover="this.style.backgroundColor='#1a1a1a'; this.style.boxShadow='0 4px 10px rgba(0, 0, 0, 0.3)'; this.style.transform='translateY(-1px)';"
                        onmouseout="this.style.backgroundColor='#2b2b2b'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.2)'; this.style.transform='translateY(0)';"
                    >
                        Clone Record
                    </button>
                </div>
                
            </div>
        </div>
    `;
    
    return container;
}

function generateFieldsHTML(fieldAnalysis) {
    let html = '';
    
    // Group field types
    const fieldGroups = {
        'Text Fields': ['string', 'memo'],
        'Choice Fields': ['boolean', 'optionset', 'multiselectoptionset'],
        'Number Fields': ['decimal', 'integer', 'double', 'bigint'],
        'Currency Fields': ['money'],
        'Date & Time Fields': ['datetime'],
        'Lookup Fields': ['lookup'],
        'Other Fields (Owner, State, Status, etc.)': ['other']
    };
    
    for (const [groupLabel, types] of Object.entries(fieldGroups)) {        
        let fieldsWithValues = [];
        types.forEach(type => {
            const fields = fieldAnalysis[type] || [];
            const validFields = fields.filter(f => f.currentValue !== null && f.currentValue !== undefined);
            fieldsWithValues = fieldsWithValues.concat(validFields);
        });
        
        if (fieldsWithValues.length === 0) continue;
        
        html += `
            <div style="margin-bottom: 25px;">
                <h3 style="color: #2b2b2b; margin-bottom: 15px; font-size: 18px; font-weight: bold;">${groupLabel}</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-left: 15px;">
        `;
        
        fieldsWithValues.forEach(field => {
            const requiredMark = field.isRequired ? '<span style="color: #ef4444; font-weight: bold;"> *</span>' : '';
            const recommendedMark = field.isRecommended ? '<span style="color: #f59e0b; font-weight: bold;"> ⭐</span>' : '';
            const type = field.type;            
            
            let displayValue = '';
            if (field.currentValue !== null && field.currentValue !== undefined) {
                if (type === 'boolean') {
                    displayValue = field.currentValue ? 'Yes' : 'No';
                } else if (type === 'datetime' && field.currentValue instanceof Date) {
                    displayValue = field.currentValue.toLocaleString();
                } else if (type === 'money') {
                    displayValue = '$' + field.currentValue.toFixed(2);
                } else if (type === 'lookup' || type === 'owner' || type === 'customer') {
                    if (Array.isArray(field.currentValue) && field.currentValue.length > 0) {
                        displayValue = field.currentValue.map(lv => lv.name || lv.id).join(', ');
                    } else if (field.currentValue.name) {
                        displayValue = field.currentValue.name;
                    } else if (field.currentValue.id) {
                        displayValue = 'ID: ' + field.currentValue.id.substring(0, 8) + '...';
                    } else {
                        displayValue = 'Lookup value set';
                    }
                } else if (type === 'multiselectoptionset' || type === 'optionset') {                    
                    if (type === 'optionset' && field.currentValue !== null && field.currentValue !== undefined) {
                        let formattedValue = field.formattedValue || null;
                        if (!formattedValue && field.attribute && typeof field.attribute.getFormattedValue === 'function') {
                            formattedValue = field.attribute.getFormattedValue();
                        }
                        
                        if (!formattedValue && field.options && Array.isArray(field.options)) {
                            const option = field.options.find(opt => opt.value === field.currentValue);
                            if (option && option.text) {
                                formattedValue = option.text;
                            }
                        }
                        
                        displayValue = formattedValue ? `${field.currentValue} (${formattedValue})` : String(field.currentValue);
                    } else if (type === 'multiselectoptionset' && Array.isArray(field.currentValue)) {
                        let formattedValue = field.formattedValue || null;
                        if (!formattedValue && field.attribute && typeof field.attribute.getFormattedValue === 'function') {
                            formattedValue = field.attribute.getFormattedValue();
                        }
                        
                        if (!formattedValue && field.options && Array.isArray(field.options)) {
                            const texts = field.currentValue.map(v => {
                                const option = field.options.find(opt => opt.value === v);
                                return option && option.text ? `${v} (${option.text})` : v;
                            });
                            displayValue = texts.join(', ');
                        } else {
                            displayValue = formattedValue || field.currentValue.join(', ');
                        }
                    } else {
                        displayValue = String(field.currentValue);
                    }
                } else if (type === 'other') {                    
                    if (Array.isArray(field.currentValue)) {
                        if (field.currentValue.length > 0 && field.currentValue[0].name) {
                            displayValue = field.currentValue.map(v => v.name || v).join(', ');
                        } else {
                            displayValue = field.currentValue.join(', ');
                        }
                    } else if (typeof field.currentValue === 'object' && field.currentValue !== null) {
                        displayValue = field.currentValue.name || JSON.stringify(field.currentValue);
                    } else {
                        displayValue = String(field.currentValue);
                    }
                } else {                    
                    displayValue = String(field.currentValue);
                }               
                
                if (displayValue && displayValue.length > 35) {
                    displayValue = displayValue.substring(0, 35) + '...';
                }
            }
            
            const sourceBadge = field.isFromApi
                ? `<span style="margin-left: 6px; font-size: 10px; font-weight: 500; color: #6b7280; background-color: #e5e7eb; border-radius: 4px; padding: 1px 5px; white-space: nowrap; flex-shrink: 0;">Not on Form</span>`
                : `<span style="margin-left: 6px; font-size: 10px; font-weight: 500; color: #166534; background-color: #dcfce7; border-radius: 4px; padding: 1px 5px; white-space: nowrap; flex-shrink: 0;">On Form</span>`;

            html += `
                <div style="padding: 8px; background-color: #f5f5f5; border-radius: 5px; border-left: 3px solid #2b2b2b; cursor: pointer; transition: background-color 0.2s;">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" class="field-checkbox" data-field-name="${field.name}" data-field-type="${type}" style="margin-right: 8px; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;" checked>
                        <div style="font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                            ${field.displayName}${requiredMark}${recommendedMark}
                        </div>
                        ${sourceBadge}
                    </div>
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #ddd; font-size: 12px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong>Value:</strong> <span style="font-style: italic;">${displayValue}</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <hr style="border: none; border-top: 2px solid #ddd; margin-top: 20px;">
            </div>
        `;
    }
    
    if (html === '') {
        html = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <p style="font-size: 16px; margin: 0;">No fields with values found to clone.</p>
                <p style="font-size: 14px; margin: 10px 0 0 0;">All fields on this record are empty.</p>
            </div>
        `;
    }
    
    return html;
}

function setupCloneRecordHandlers(container, fieldAnalysis, entityName) {    
    const closeButton = container.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        container.remove();
    });
    
    closeButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#e81123';
    });
    closeButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
    });    
    
    const selectAllButton = container.querySelector('#selectAllButton');
    let allSelected = true; // Start with all checked by default
    selectAllButton.textContent = 'Deselect All';
    selectAllButton.addEventListener('click', () => {
        const checkboxes = container.querySelectorAll('.field-checkbox:not([disabled])');
        allSelected = !allSelected;
        checkboxes.forEach(cb => cb.checked = allSelected);
        selectAllButton.textContent = allSelected ? 'Deselect All' : 'Select All';
    });
        
    const cloneButton = container.querySelector('#cloneRecordButton');
    cloneButton.addEventListener('click', () => handleCloneRecord(container, fieldAnalysis, entityName));
}

async function handleCloneRecord(container, fieldAnalysis, entityName) {
    try {
        const selectedCheckboxes = container.querySelectorAll('.field-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Please select at least one field to clone', 'warning');
            }
            return;
        }

        const cloneCountInput = container.querySelector('#cloneCountInput');
        const cloneCount = Math.min(Math.max(parseInt(cloneCountInput ? cloneCountInput.value : '1') || 1, 1), 10);
        
        const fieldsToClone = {};        
        selectedCheckboxes.forEach(checkbox => {
            try {
                const fieldName = checkbox.getAttribute('data-field-name');
                const fieldType = checkbox.getAttribute('data-field-type');                
                const field = fieldAnalysis[fieldType].find(f => f.name === fieldName);
                if (!field || field.currentValue === null || field.currentValue === undefined) {
                    return;
                }
                
                let valueToStore = field.currentValue;
                
                if (fieldType === 'lookup' || fieldType === 'other') {
                    if (Array.isArray(valueToStore)) {                        
                        const hasValidLookups = valueToStore.every(lv => 
                            lv && lv.id && lv.name && lv.entityType
                        );
                        if (!hasValidLookups) {
                            return;
                        }
                    } else if (typeof valueToStore === 'object' && valueToStore !== null) {                        
                        if (!valueToStore.id || !valueToStore.name || !valueToStore.entityType) {
                            return;
                        }
                    }
                }
                
                fieldsToClone[fieldName] = valueToStore;
                
            } catch (e) {
                console.error(`✗ Error collecting field value for ${fieldName}:`, e);
            }
        });
        
        if (Object.keys(fieldsToClone).length === 0) {
            if (typeof showToast === 'function') {
                showToast('No fields with values selected to clone', 'warning');
            }
            return;
        }

        //Multi-clone path
        if (cloneCount > 1) {
            container.remove();
            await cloneMultipleViaApi(fieldsToClone, fieldAnalysis, entityName, cloneCount);
            return;
        }
        
        container.remove();
        Xrm.Navigation.openForm({
            entityName: entityName,
            useQuickCreateForm: false,
            openInNewWindow: false
        }).then(function(result) {            
            const maxAttempts = 20;
            let attempts = 0;
            
            const setValues = setInterval(() => {
                attempts++;                
                try {                    
                    if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {                        
                        const newRecordId = Xrm.Page.data.entity.getId();
                        if (!newRecordId) {                            
                            let successCount = 0;
                            let errorCount = 0;                            
                            const skippedFields = {};
                            
                            Object.keys(fieldsToClone).forEach(fieldName => {
                                try {
                                    const attribute = Xrm.Page.data.entity.attributes.get(fieldName);
                                    if (attribute) {
                                        const attrType = attribute.getAttributeType();
                                        let valueToSet = fieldsToClone[fieldName];     
                                        if (attrType === 'lookup') {                                            
                                            if (valueToSet && !Array.isArray(valueToSet)) {                                                
                                                if (valueToSet.id && valueToSet.name && valueToSet.entityType) {
                                                    valueToSet = [valueToSet];
                                                }
                                            }                                            
                                            if (Array.isArray(valueToSet) && valueToSet.length > 0) {
                                                const lookup = valueToSet[0];
                                                if (!lookup.id || !lookup.name || !lookup.entityType) {
                                                    errorCount++;
                                                    return;
                                                }
                                            }
                                        }
                                        
                                        attribute.setValue(valueToSet);
                                        successCount++;
                                    } else {                              
                                        skippedFields[fieldName] = fieldsToClone[fieldName];
                                    }
                                } catch (e) {
                                    errorCount++;
                                    console.error(`✗ Could not set field ${fieldName}:`, e);
                                }
                            });
                            
                            const skippedCount = Object.keys(skippedFields).length;                                                            
                            if (skippedCount > 0) {                                
                                const entityName = Xrm.Page.data.entity.getEntityName();  
                                sessionStorage.setItem('adminplus_skipped_fields', JSON.stringify(skippedFields));
                                sessionStorage.setItem('adminplus_skipped_entity', entityName);
                                sessionStorage.setItem('adminplus_clone_timestamp', Date.now().toString());
                                sessionStorage.setItem('adminplus_waiting_for_save', 'true');                                
                                
                                try {
                                    const onCloseHandler = function() {
                                        const waiting = sessionStorage.getItem('adminplus_waiting_for_save');
                                        if (waiting === 'true') {                                            
                                            cleanupSkippedFieldsStorage();
                                        }
                                    };                                   
                                    Xrm.Page.data.entity.addOnSave(function(context) {
                                        sessionStorage.setItem('adminplus_save_in_progress', 'true');
                                    });               
                                    
                                    window.addEventListener('beforeunload', onCloseHandler);
                                    window.addEventListener('pagehide', onCloseHandler);
                                } catch (e) {
                                }                                
                                startSaveMonitoring();
                            }                            
                            
                            if (typeof showToast === 'function') {
                                if (skippedCount > 0) {
                                    showToast(`Cloned ${successCount} field(s). ${skippedCount} remaining fields will apply after save.`, 'info', 4000);
                                } else {
                                    showToast(`Successfully cloned ${successCount} field(s)!`, 'success', 3000);
                                }
                            }                                                        
                            clearInterval(setValues);
                        }
                    }
                } catch (e) {
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(setValues);
                    if (typeof showToast === 'function') {
                        showToast('Form opened but values may not be set', 'warning');
                    }
                }
            }, 500);
            
        }).catch(function(error) {
            console.error('Error opening clone form:', error);
            if (typeof showToast === 'function') {
                showToast('Error opening new record form', 'error');
            }
        });
        
    } catch (error) {
        console.error('Error cloning record:', error);
        if (typeof showToast === 'function') {
            showToast('Error cloning record', 'error');
        }
    }
}

async function cloneMultipleViaApi(fieldsToClone, fieldAnalysis, entityName, cloneCount) {
    try {
        if (typeof showToast === 'function') {
            showToast(`Creating ${cloneCount} clone(s)...`, 'info', 3000);
        }        
        const entityTypes = new Set();
        Object.keys(fieldsToClone).forEach(fieldName => {
            const value = fieldsToClone[fieldName];
            if (Array.isArray(value) && value.length > 0 && value[0].entityType) {
                entityTypes.add(value[0].entityType);
            }
        });

        const entitySetNames = {};
        for (const et of entityTypes) {
            try {
                const meta = await Xrm.Utility.getEntityMetadata(et);
                entitySetNames[et] = meta.EntitySetName;
            } catch (e) {
                entitySetNames[et] = et + 's';
            }
        }

        // Fields that cannot be set on record creation
        const skipApiFields = new Set(['statecode', 'statuscode', 'versionnumber', 'createdon', 'modifiedon', 'overriddencreatedon']);

        // Build Web API record payload
        const recordData = {};
        Object.keys(fieldsToClone).forEach(fieldName => {
            if (skipApiFields.has(fieldName)) return;
            const value = fieldsToClone[fieldName];            
            let fieldType = null;
            for (const type of Object.keys(fieldAnalysis)) {
                if (fieldAnalysis[type].find(f => f.name === fieldName)) {
                    fieldType = type;
                    break;
                }
            }

            if ((fieldType === 'lookup' || fieldType === 'other') && Array.isArray(value) && value.length > 0) {
                const lookup = value[0];
                if (lookup.id && lookup.entityType) {
                    const setName = entitySetNames[lookup.entityType] || (lookup.entityType + 's');
                    recordData[`${fieldName}@odata.bind`] = `/${setName}(${lookup.id.replace(/[{}]/g, '')})`;
                }
            } else if (value instanceof Date) {
                recordData[fieldName] = value.toISOString();
            } else if (value !== null && value !== undefined) {
                recordData[fieldName] = value;
            }
        });

        //Create each clone sequentially
        let successCount = 0;
        let lastCreatedId = null;

        for (let i = 0; i < cloneCount; i++) {
            try {
                const result = await Xrm.WebApi.createRecord(entityName, { ...recordData });
                lastCreatedId = result.id;
                successCount++;
            } catch (e) {
                console.error(`✗ Error creating clone ${i + 1}:`, e);
            }
        }

        if (successCount > 0) {
            if (typeof showToast === 'function') {
                const failCount = cloneCount - successCount;
                const msg = failCount > 0
                    ? `Created ${successCount} clone(s). ${failCount} failed.`
                    : `Successfully created ${successCount} clone(s)!`;
                showToast(msg, failCount > 0 ? 'warning' : 'success', 4000);
            }
            //Navigate to the last created record
            if (lastCreatedId) {
                Xrm.Navigation.openForm({
                    entityName: entityName,
                    entityId: lastCreatedId,
                    useQuickCreateForm: false,
                    openInNewWindow: false
                });
            }
        } else {
            if (typeof showToast === 'function') {
                showToast('Failed to create clones. Check field values and try again.', 'error', 4000);
            }
        }

    } catch (error) {
        console.error('Error in cloneMultipleViaApi:', error);
        if (typeof showToast === 'function') {
            showToast('Error creating clones', 'error');
        }
    }
}

function startSaveMonitoring() {   
    const monitorInterval = setInterval(() => {
        try {            
            const waiting = sessionStorage.getItem('adminplus_waiting_for_save');
            if (waiting !== 'true') {
                clearInterval(monitorInterval);
                return;
            }       
            
            if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data || !Xrm.Page.data.entity) {
                return; 
            }
            
            const saveInProgress = sessionStorage.getItem('adminplus_save_in_progress');            
            const recordId = Xrm.Page.data.entity.getId();            
            if (!recordId || saveInProgress !== 'true') {
                return; 
            }
            
            const expectedEntity = sessionStorage.getItem('adminplus_skipped_entity');
            const currentEntity = Xrm.Page.data.entity.getEntityName();
            if (expectedEntity && currentEntity !== expectedEntity) {
                clearInterval(monitorInterval);
                cleanupSkippedFieldsStorage();
                return;
            }           
            
            sessionStorage.removeItem('adminplus_save_in_progress');            
            clearInterval(monitorInterval);            
            
            const cleanRecordId = recordId.replace(/[{}]/g, "").toLowerCase();
            sessionStorage.setItem('adminplus_saved_record_id', cleanRecordId);
            sessionStorage.setItem('adminplus_waiting_for_save', 'false');
            
            if (typeof showToast === 'function') {
                showToast('Applying remaining fields...', 'info', 1500);
            }
            
            setTimeout(() => {
                applySkippedFields();
            }, 800); 
            
        } catch (e) {
        }
    }, 1000); 
        
    setTimeout(() => {
        clearInterval(monitorInterval);
        const waiting = sessionStorage.getItem('adminplus_waiting_for_save');
        if (waiting === 'true') {
            cleanupSkippedFieldsStorage();
        }
    }, 600000); 
}
function applySkippedFields() {
    try {                
        const skippedFieldsStr = sessionStorage.getItem('adminplus_skipped_fields');
        const entityName = sessionStorage.getItem('adminplus_skipped_entity');
        const timestamp = sessionStorage.getItem('adminplus_clone_timestamp');
        const savedRecordId = sessionStorage.getItem('adminplus_saved_record_id');
        
        if (!skippedFieldsStr) {
            return;
        }
                
        const currentEntity = Xrm.Page.data.entity.getEntityName();
        if (currentEntity !== entityName) {
            cleanupSkippedFieldsStorage();
            return;
        }
                
        const currentRecordId = Xrm.Page.data.entity.getId();
        if (!currentRecordId) {
            cleanupSkippedFieldsStorage();
            return;
        }
        
        const cleanCurrentId = currentRecordId.replace(/[{}]/g, "").toLowerCase();
        if (savedRecordId && cleanCurrentId !== savedRecordId) {
            cleanupSkippedFieldsStorage();
            return;
        }
                
        if (timestamp) {
            const age = Date.now() - parseInt(timestamp);
            if (age > 600000) { // 10 minutes
                cleanupSkippedFieldsStorage();
                return;
            }
        }
        
        const skippedFields = JSON.parse(skippedFieldsStr);
        const fieldCount = Object.keys(skippedFields).length;
        
        if (fieldCount === 0) {
            cleanupSkippedFieldsStorage();
            return;
        }
                
        let appliedCount = 0;
        let errorCount = 0;
        let stillSkippedCount = 0;        
        Object.keys(skippedFields).forEach(fieldName => {
            try {
                const attribute = Xrm.Page.data.entity.attributes.get(fieldName);
                if (attribute) {
                    const attrType = attribute.getAttributeType();
                    let valueToSet = skippedFields[fieldName];
                                      
                    if (attrType === 'lookup') {
                        if (valueToSet && !Array.isArray(valueToSet)) {
                            if (valueToSet.id && valueToSet.name && valueToSet.entityType) {
                                valueToSet = [valueToSet];
                            }
                        }
                        if (Array.isArray(valueToSet) && valueToSet.length > 0) {
                            const lookup = valueToSet[0];
                            if (!lookup.id || !lookup.name || !lookup.entityType) {
                                errorCount++;
                                return;
                            }
                        }
                    }
                    
                    attribute.setValue(valueToSet);
                    appliedCount++;
                } else {                    
                    stillSkippedCount++;
                }
            } catch (e) {
                errorCount++;
                console.error(`✗ Could not apply skipped field ${fieldName}:`, e);
            }
        });
        cleanupSkippedFieldsStorage();
        
        
        if (appliedCount > 0) {            
            Xrm.Page.data.entity.save().then(
                function() {
                    if (typeof showToast === 'function') {
                        let message = `Successfully applied and saved ${appliedCount} additional field(s)!`;
                        if (stillSkippedCount > 0) {
                            message += ` (${stillSkippedCount} not on form)`;
                        }
                        showToast(message, 'success', 4000);
                    }
                },
                function(error) {
                    console.error('✗ Error saving record:', error);
                    if (typeof showToast === 'function') {                        
                        showToast(`Applied ${appliedCount} field(s). Please complete required fields and save.`, 'info', 5000);
                    }
                }
            );
        } else if (stillSkippedCount > 0 && errorCount === 0) {            
            if (typeof showToast === 'function') {
                showToast(`${stillSkippedCount} field(s) not available on main form - skipped`, 'info', 3000);
            }
        } else if (errorCount > 0) {
            if (typeof showToast === 'function') {
                showToast(`Could not apply ${errorCount} field(s).`, 'error', 4000);
            }
        }
        
    } catch (error) {
        console.error('Error in applySkippedFields:', error);
        cleanupSkippedFieldsStorage();
    }
}

function cleanupSkippedFieldsStorage() {
    sessionStorage.removeItem('adminplus_skipped_fields');
    sessionStorage.removeItem('adminplus_skipped_entity');
    sessionStorage.removeItem('adminplus_clone_timestamp');
    sessionStorage.removeItem('adminplus_waiting_for_save');
    sessionStorage.removeItem('adminplus_saved_record_id');
    sessionStorage.removeItem('adminplus_save_in_progress');
}