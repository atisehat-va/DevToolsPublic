async function fetchEntityFields() {
    // Check if form
    if (!requireFormContext('Table & Fields Info')) {
        return;
    }
    
    const entityName = Xrm.Page.data.entity.getEntityName();
    const recordId = Xrm.Page.data.entity.getId();
    const cleanRecordId = recordId.replace(/[{}]/g, "").toLowerCase();
    const clientUrl = Xrm.Page.context.getClientUrl();
    
    try {
        // Fetch entity metadata
        const [metadataResponse, pluralResponse] = await Promise.all([
            fetch(`${clientUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType,DisplayName`),
            fetch(`${clientUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$select=LogicalCollectionName`)
        ]);
        
        if (!metadataResponse.ok || !pluralResponse.ok) {
            throw new Error(metadataResponse.statusText || pluralResponse.statusText);
        }
        
        const [metadata, pluralData] = await Promise.all([
            metadataResponse.json(),
            pluralResponse.json()
        ]);
        
        const pluralName = pluralData.LogicalCollectionName;
        
        // Get field values
        const fieldValues = {};
        const fieldMetadata = {};
        const attributes = Xrm.Page.data.entity.attributes.get();
        
        attributes.forEach(attr => {
            const logicalName = attr.getName();
            fieldValues[logicalName] = formatFieldValue(attr);
            fieldMetadata[logicalName] = {
                type: attr.getAttributeType(),
                rawValue: attr.getValue()
            };
        });
        
        // Get complete record data for fields not on form
        const recordResponse = await fetch(`${clientUrl}/api/data/v9.2/${pluralName}(${cleanRecordId})`, {
            headers: { 'Prefer': 'odata.include-annotations="*"' }
        });        
        if (recordResponse.ok) {
            const recordData = await recordResponse.json();            
            // Populate values
            metadata.value.forEach(field => {
                const logicalName = field.LogicalName;
                if (!fieldValues[logicalName]) {
                    fieldValues[logicalName] = formatFieldValueFromAPI(recordData[logicalName], field.AttributeType, recordData, logicalName);
                    fieldMetadata[logicalName] = {
                        type: field.AttributeType,
                        rawValue: recordData[logicalName]
                    };
                }
            });
        }
        
        const fieldListHtml = generateFieldListHtml(metadata.value, fieldValues, fieldMetadata);
        appendEntityInfoPopupToBody(entityName, cleanRecordId, pluralName, fieldListHtml);        
    } catch (error) {
        showToast('Error loading entity info: ' + error.message, 'error', 4000);
    }
}

function formatFieldValueFromAPI(value, attributeType, recordData, logicalName) {
    try {
        // Lookups must be checked first — their value lives at _fieldname_value,
        // not fieldname, so `value` (recordData[logicalName]) is always undefined for them.
        if (attributeType === 'Lookup' || attributeType === 'Customer' || attributeType === 'Owner') {
            const lookupValue = recordData[`_${logicalName}_value`];
            const lookupFormatted = recordData[`_${logicalName}_value@OData.Community.Display.V1.FormattedValue`];
            return lookupFormatted || lookupValue || '(empty)';
        }

        if (value === null || value === undefined) {
            return '(empty)';
        }        
        // Boolean
        if (attributeType === 'Boolean') {
            return value ? 'Yes' : 'No';
        }        
        // Optionsets
        if (attributeType === 'Picklist' || attributeType === 'State' || attributeType === 'Status') {
            const formattedValue = recordData[`${logicalName}@OData.Community.Display.V1.FormattedValue`];
            if (formattedValue && value !== null && value !== undefined) {
                return `${value} (${formattedValue})`;
            }
            return formattedValue || value.toString();
        }        
        // Multiselect
        if (attributeType === 'MultiSelectPicklist') {
            const formattedValue = recordData[`${logicalName}@OData.Community.Display.V1.FormattedValue`];
            return formattedValue || value;
        }        
        // Datetime
        if (attributeType === 'DateTime') {
            return new Date(value).toLocaleString();
        }        
        // Money
        if (attributeType === 'Money') {
            return '$' + parseFloat(value).toFixed(2);
        }         
        return value.toString();
    } catch (error) {
        return '(empty)';
    }
}

function formatFieldValue(attribute) {
    try {
        const value = attribute.getValue();        
        if (value === null || value === undefined) {
            return '(empty)';
        }
        
        const attrType = attribute.getAttributeType();        
        // Lookups
        if (attrType === 'lookup') {
            if (Array.isArray(value) && value.length > 0) {
                return value.map(v => v.name).join(', ');
            }
            return '(empty)';
        }        
        // Boolean
        if (attrType === 'boolean') {
            return value ? 'Yes' : 'No';
        }        
        // Optionset
        if (attrType === 'optionset' || attrType === 'multiselectoptionset') {
            try {
                // Try to get formatted value first
                if (typeof attribute.getFormattedValue === 'function') {
                    const formattedValue = attribute.getFormattedValue();
                    if (formattedValue && value !== null && value !== undefined) {
                        return `${value} (${formattedValue})`;
                    }
                }
                
                // Try to get label from options
                if (attribute.controls && attribute.controls.getLength() > 0) {
                    const control = attribute.controls.get(0);
                    if (typeof control.getOptions === 'function') {
                        const options = control.getOptions();
                        if (attrType === 'optionset' && value !== null && value !== undefined) {
                            const option = options.find(opt => opt.value === value);
                            if (option && option.text) {
                                return `${value} (${option.text})`;
                            }
                        } else if (attrType === 'multiselectoptionset' && Array.isArray(value)) {
                            const texts = value.map(v => {
                                const option = options.find(opt => opt.value === v);
                                return option && option.text ? `${v} (${option.text})` : v;
                            });
                            return texts.join(', ');
                        }
                    }
                }
            } catch (e) {
                // Fallback
            }
            return value.toString();
        }        
        // Datetime
        if (attrType === 'datetime' && value instanceof Date) {
            return value.toLocaleString();
        }
        //Money
        if (attrType === 'money') {
            return '$' + value.toFixed(2);
        }        
        // Multiselect
        if (Array.isArray(value)) {
            return value.join(', ');
        }        
        
        return value.toString();
    } catch (error) {
        return '(error)';
    }
}

function categorizeFields(fields) {
    const categories = {
        'TextFields': [],
        'ChoiceFields': [],
        'NumberFields': [],
        'DateTimeFields': [],
        'LookupFields': [],
        'FileMediaFields': [],
        'ComputedFields': [],
        'OtherFields': []
    };
    
    const typeMapping = {
        'String': 'TextFields',
        'Memo': 'TextFields',
        'Boolean': 'ChoiceFields',
        'Picklist': 'ChoiceFields',
        'MultiSelectPicklist': 'ChoiceFields',
        'State': 'ChoiceFields',
        'Status': 'ChoiceFields',
        'Integer': 'NumberFields',
        'Decimal': 'NumberFields',
        'Double': 'NumberFields',
        'Money': 'NumberFields',
        'BigInt': 'NumberFields',
        'DateTime': 'DateTimeFields',
        'Lookup': 'LookupFields',
        'Customer': 'LookupFields',
        'Owner': 'LookupFields',
        'PartyList': 'LookupFields',
        'File': 'FileMediaFields',
        'Image': 'FileMediaFields',
        'Calculated': 'ComputedFields',
        'Rollup': 'ComputedFields'
    };
    
    fields.forEach(field => {
        if (field.AttributeType === 'Virtual' || !field.DisplayName || !field.DisplayName.UserLocalizedLabel || !field.DisplayName.UserLocalizedLabel.Label) {
            return;
        }
        
        const category = typeMapping[field.AttributeType] || 'OtherFields';
        categories[category].push(field);
    });
    
    return categories;
}

function generateFieldListHtml(fields, fieldValues, fieldMetadata) {
    const categories = categorizeFields(fields);    
    // Store available sections globally for navigation buttons
    window.entityInfoAvailableSections = Object.keys(categories).filter(key => categories[key].length > 0);    
    const categoryLabels = {
        'TextFields': 'Text Fields',
        'ChoiceFields': 'Choice Fields',
        'NumberFields': 'Number Fields',
        'DateTimeFields': 'Date & Time Fields',
        'LookupFields': 'Lookup Fields',
        'FileMediaFields': 'File & Media Fields',
        'ComputedFields': 'Computed Fields',
        'OtherFields': 'Other Fields'
    };    
    const typeLabels = {
        'String': 'Single line of text',
        'Memo': 'Multiple lines of text',
        'Boolean': 'Yes/No',
        'Picklist': 'Choice',
        'MultiSelectPicklist': 'Choices',
        'State': 'Status',
        'Status': 'Status Reason',
        'Integer': 'Whole Number',
        'Decimal': 'Decimal Number',
        'Double': 'Floating Point Number',
        'Money': 'Currency',
        'BigInt': 'Big Integer',
        'DateTime': 'Date and Time',
        'Lookup': 'Lookup',
        'Customer': 'Customer',
        'Owner': 'Owner',
        'PartyList': 'Activity Party',
        'File': 'File',
        'Image': 'Image',
        'Calculated': 'Calculated',
        'Rollup': 'Rollup'
    };    
    const escapeHtml = (str) => {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    };
    
    let html = '';    
    Object.keys(categories).forEach(categoryKey => {
        const categoryFields = categories[categoryKey];
        if (categoryFields.length === 0) return;        
        // Sort fields
        categoryFields.sort((a, b) => 
            a.DisplayName.UserLocalizedLabel.Label.localeCompare(b.DisplayName.UserLocalizedLabel.Label)
        );        
        html += `
            <div id="section-${categoryKey}" style="margin-bottom: 25px;">
                <h3 style="color: #2b2b2b; margin-bottom: 15px; font-size: 18px; font-weight: bold;">${categoryLabels[categoryKey]}</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-left: 15px;">
        `;        
        categoryFields.forEach(field => {
            const typeLabel = typeLabels[field.AttributeType] || field.AttributeType;
            const displayName = field.DisplayName.UserLocalizedLabel.Label;
            const logicalName = field.LogicalName;
            const fieldValue = fieldValues[logicalName] || '(empty)';
            const metadata = fieldMetadata[logicalName];            
            const displayValue = fieldValue.length > 100 ? fieldValue.substring(0, 100) + '...' : fieldValue;                        
            let fullTooltip = `${displayName} (${logicalName})\nValue: ${fieldValue}`;
                        
            if (metadata && metadata.type === 'lookup' && metadata.rawValue && Array.isArray(metadata.rawValue) && metadata.rawValue.length > 0) {
                const lookupData = metadata.rawValue[0];
                fullTooltip = `Lookup Name: ${displayName} (${logicalName})\nEntity Name: ${lookupData.entityType || 'N/A'}\nRecord ID: ${lookupData.id || 'N/A'}\nValue: ${lookupData.name || fieldValue}`;
            }            
            html += `
                <div class="entityinfo-field-card" data-tooltip="${escapeHtml(fullTooltip)}" style="padding: 8px; background-color: #f5f5f5; border-radius: 5px; border-left: 3px solid #2b2b2b;">
                    <div class="entityinfo-field-name" data-copy-text="${escapeHtml(logicalName)}" title="Click to copy logical name" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-radius: 3px; padding: 2px 4px; margin: -2px -4px; transition: background-color 0.2s;">
                        <div style="font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${displayName} 
                            <span style="font-weight: normal; color: #666; font-size: 13px;">(${logicalName})</span>
                        </div>
                        <div style="font-size: 12px; color: #666; white-space: nowrap; margin-left: 10px;">Type: ${typeLabel}</div>
                    </div>
                    <div class="entityinfo-field-value" data-copy-text="${escapeHtml(fieldValue)}" title="Click to copy value" style="margin-top: 5px; padding: 3px 4px; border-top: 1px solid #ddd; font-size: 12px; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; border-radius: 3px; transition: background-color 0.2s;">
                        <strong>Value:</strong> <span style="font-style: italic;">${escapeHtml(displayValue)}</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <hr style="border: none; border-top: 2px solid #ddd; margin-top: 20px;">
            </div>
        `;
    });
    
    return html;
}

function appendEntityInfoPopupToBody(entityName, recordId, pluralName, fieldListHtml) {
    // Close all popups
    const existingPopups = document.querySelectorAll('.commonPopup');
    existingPopups.forEach(popup => popup.remove());    
    // Tooltip styling
    addEntityInfoTooltipStyles();
    
    // Popup container
    const popupContainer = document.createElement('div');
    popupContainer.className = 'commonPopup';
    const sectionNavHtml = generateSectionNavigationButtons();
    
    // HTML Content
    const contentHtml = `
        <div style="background-color: #f9f9f9; padding: 12px 20px; border-radius: 5px; margin-bottom: 8px;">
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; font-size: 15px;">
                <div style="white-space: nowrap;"><strong>Table Name:</strong> ${entityName}</div>
                <div style="white-space: nowrap;"><strong>Plural Name:</strong> ${pluralName}</div>
                <div style="white-space: nowrap; min-width: 200px;"><strong>Record ID:</strong> ${recordId}</div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 20px; gap: 15px; position: relative; z-index: 100; overflow: visible;">
            <div id="section-navigation" style="display: flex; flex: 1; min-width: 0; overflow: visible;">
                ${sectionNavHtml}
            </div>
            <div style="font-size: 13px; color: #666; font-style: italic; background-color: #f9f9f9; padding: 8px 12px; border-radius: 5px; border: 1px solid #ddd; white-space: nowrap; flex-shrink: 0;">
                <strong>Note:</strong> Click on any field to copy its information
            </div>
        </div>
        <div class="scroll-section" style="padding: 0 2px 20px 20px; overflow-y: auto; max-height: calc(80vh - 235px); position: relative; z-index: 1;">
            ${fieldListHtml}
        </div>
    `;
    
    // HTML Structure
    popupContainer.innerHTML = `
        <div class="commonPopup-header">
            <span style="color: white;">Table & Fields Info</span>
            <span class="close-button">&times;</span>
        </div>
        <div class="popup-body">
            <div class="commonSection content-section">
                ${contentHtml}
            </div>
        </div>
    `;    
    document.body.appendChild(popupContainer);
    
    // Close Btn
    const closeButton = popupContainer.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        popupContainer.remove();
    });
    
    // Hover effect
    closeButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#e81123';
    });
    closeButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
    });
    
    // Movable popup
    if (typeof makePopupMovable === 'function') {
        makePopupMovable(popupContainer);
    }   
    setupSectionNavigation(popupContainer);
    
    // Click to copy — field name zone copies logical name, value zone copies value
    const copyZoneHandler = (el, flashTarget) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const copyText = decodeHtmlEntities(this.getAttribute('data-copy-text'));
            const target = flashTarget ? this.closest('.entityinfo-field-card') || this : this;

            navigator.clipboard.writeText(copyText).then(() => {
                const originalBg = target.style.backgroundColor;
                target.style.backgroundColor = '#d4edda';
                setTimeout(() => target.style.backgroundColor = originalBg, 300);

                const card = this.closest('.entityinfo-field-card');
                if (card) {
                    const originalTooltip = card.getAttribute('data-tooltip');
                    card.setAttribute('data-tooltip', 'Copied to clipboard! ✓');
                    setTimeout(() => card.setAttribute('data-tooltip', originalTooltip), 1500);
                }
            }).catch(() => {
                showToast('Failed to copy to clipboard', 'error', 3000);
            });
        });

        el.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#dce8f5';
        });
        el.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    };

    popupContainer.querySelectorAll('.entityinfo-field-name').forEach(el => copyZoneHandler(el, false));
    popupContainer.querySelectorAll('.entityinfo-field-value').forEach(el => copyZoneHandler(el, false));
}

function addEntityInfoTooltipStyles() {    
    if (document.getElementById('entityinfo-tooltip-styles')) {
        return;
    }
    
    const tooltipStyle = document.createElement('style');
    tooltipStyle.id = 'entityinfo-tooltip-styles';
    tooltipStyle.innerHTML = `
        .entityinfo-field-card[data-tooltip] {
            position: relative;
        }
        .entityinfo-field-card[data-tooltip]:hover::before {
            content: attr(data-tooltip);
            position: absolute;
            left: 0;
            top: 100%;
            margin-top: 8px;
            padding: 10px 14px;
            background-color: rgba(43, 43, 43, 0.95);
            color: white;
            border-radius: 6px;
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-wrap;
            width: 500px;
            box-sizing: border-box;
            z-index: 100000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            pointer-events: none;
            word-wrap: break-word;
        }
    `;
    document.head.appendChild(tooltipStyle);
}

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function generateSectionNavigationButtons() {
    const categoryLabels = {
        'TextFields': 'Text Fields',
        'ChoiceFields': 'Choice Fields',
        'NumberFields': 'Number Fields',
        'DateTimeFields': 'Date & Time',
        'LookupFields': 'Lookup Fields',
        'FileMediaFields': 'File & Media',
        'ComputedFields': 'Computed',
        'OtherFields': 'Other'
    };
    
    const availableSections = window.entityInfoAvailableSections || [];    
    let buttonsHtml = '<div class="nav-buttons-container" style="display: flex; gap: 8px; flex: 1; align-items: center; overflow: visible;">';    
    availableSections.forEach(categoryKey => {
        if (categoryLabels[categoryKey]) {
            buttonsHtml += `
                <button 
                    class="section-nav-btn" 
                    data-section="${categoryKey}"
                    style="
                        padding: 6px 12px;
                        background-color: #2b2b2b;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        flex-shrink: 0;
                    "
                >
                    ${categoryLabels[categoryKey]}
                </button>
            `;
        }
    });    
    // Overflow menu button
    buttonsHtml += `
        <div class="overflow-menu-container" style="position: relative; flex-shrink: 0; display: none; z-index: 10001;">
            <button 
                class="overflow-menu-btn"
                type="button"
                style="
                    padding: 6px 14px;
                    background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease, box-shadow 0.2s ease;
                    white-space: nowrap;
                    box-shadow: 0 3px 6px rgba(0, 120, 212, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                "
            >
                <span>More</span>
                <span style="font-size: 16px; font-weight: bold;">▼</span>
            </button>
            <div class="overflow-menu-dropdown" style="
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 5px;
                background-color: white;
                border: 2px solid #0078d4;
                border-radius: 5px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                min-width: 150px;
            "></div>
        </div>
    `;
    
    buttonsHtml += '</div>';    
    return buttonsHtml;
}

function setupSectionNavigation(popupContainer) {
    const scrollSection = popupContainer.querySelector('.scroll-section');
    const navContainer = popupContainer.querySelector('.nav-buttons-container');
    const overflowMenuContainer = popupContainer.querySelector('.overflow-menu-container');
    const overflowMenuBtn = popupContainer.querySelector('.overflow-menu-btn');
    const overflowMenuDropdown = popupContainer.querySelector('.overflow-menu-dropdown');
    
    // Btn click and scroll in section
    const handleSectionClick = (sectionId) => {
        const targetSection = popupContainer.querySelector(`#section-${sectionId}`);        
        if (targetSection) {            
            const scrollContainer = scrollSection;            
            const targetPosition = targetSection.offsetTop - scrollContainer.offsetTop + 120;                         
            scrollContainer.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });          
            
            const originalBg = targetSection.style.backgroundColor;
            targetSection.style.backgroundColor = '#e6f3ff';
            targetSection.style.transition = 'background-color 0.3s ease';            
            setTimeout(() => {
                targetSection.style.backgroundColor = originalBg;
                setTimeout(() => {
                    targetSection.style.transition = '';
                }, 300);
            }, 600);                        
            if (overflowMenuDropdown) {
                overflowMenuDropdown.style.display = 'none';
            }
        }
    };
    
    // Navigation Btn
    const setupButton = (button) => {        
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#0078d4';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#2b2b2b';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(0)';
        });        
        
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            handleSectionClick(sectionId);
        });
    };
    
    const navButtons = popupContainer.querySelectorAll('.section-nav-btn');
    navButtons.forEach(setupButton);
    
    // Menu button
    if (overflowMenuBtn && overflowMenuDropdown) {
        overflowMenuBtn.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #106ebe 0%, #005a9e 100%)';
            this.style.boxShadow = '0 5px 10px rgba(0, 120, 212, 0.4)';
        });
        
        overflowMenuBtn.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)';
            this.style.boxShadow = '0 3px 6px rgba(0, 120, 212, 0.3)';
        });
        
        overflowMenuBtn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        overflowMenuBtn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        overflowMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (overflowMenuDropdown) {
                const isVisible = overflowMenuDropdown.style.display === 'block';
                overflowMenuDropdown.style.display = isVisible ? 'none' : 'block';
            }
        });
        
        // Close dropdown
        const closeDropdown = function(e) {
            if (overflowMenuDropdown && overflowMenuContainer && !overflowMenuContainer.contains(e.target)) {
                overflowMenuDropdown.style.display = 'none';
            }
        };        
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);        
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.removedNodes.forEach(function(node) {
                    if (node === popupContainer) {
                        document.removeEventListener('click', closeDropdown);
                        observer.disconnect();
                    }
                });
            });
        });        
        observer.observe(document.body, { childList: true });
    }    
    // Manage overflow
    const manageOverflow = () => {
        if (!navContainer || !overflowMenuContainer || !overflowMenuDropdown) {
            return;
        }        
        const buttons = Array.from(navContainer.querySelectorAll('.section-nav-btn'));
        if (buttons.length === 0) return;
        
        const containerWidth = navContainer.offsetWidth;
        const overflowBtnWidth = 80; 
        let totalWidth = overflowBtnWidth; 
        let visibleCount = 0;
        
        // Reset all btn
        buttons.forEach(btn => {
            btn.style.display = '';
        });
        overflowMenuContainer.style.display = 'none';
        overflowMenuDropdown.style.display = 'none';        
        for (let i = 0; i < buttons.length; i++) {
            totalWidth += buttons[i].offsetWidth + 8; 
            if (totalWidth <= containerWidth) {
                visibleCount++;
            } else {
                break;
            }
        }
        
        // If not all buttons fit
        if (visibleCount < buttons.length) {
            overflowMenuContainer.style.display = 'block';            
            // Hide buttons
            const hiddenButtons = buttons.slice(visibleCount);
            hiddenButtons.forEach(btn => btn.style.display = 'none');            
            // Overflow menu
            const categoryLabels = {
                'TextFields': 'Text Fields',
                'ChoiceFields': 'Choice Fields',
                'NumberFields': 'Number Fields',
                'DateTimeFields': 'Date & Time',
                'LookupFields': 'Lookup Fields',
                'FileMediaFields': 'File & Media',
                'ComputedFields': 'Computed',
                'OtherFields': 'Other'
            };
            
            overflowMenuDropdown.innerHTML = '';
            hiddenButtons.forEach(btn => {
                const sectionId = btn.getAttribute('data-section');
                const menuItem = document.createElement('div');
                menuItem.className = 'overflow-menu-item';
                menuItem.textContent = categoryLabels[sectionId] || sectionId;
                menuItem.style.cssText = `
                    padding: 10px 15px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    font-size: 12px;
                    font-weight: 500;
                    color: #2b2b2b;
                    user-select: none;
                `;
                
                menuItem.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#e8e8e8';
                });
                
                menuItem.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = 'transparent';
                });
                
                menuItem.addEventListener('click', function(e) {
                    e.stopPropagation();
                    handleSectionClick(sectionId);
                });
                
                overflowMenuDropdown.appendChild(menuItem);
            });
        }
    };    
    setTimeout(manageOverflow, 50);
    setTimeout(manageOverflow, 200);
    setTimeout(manageOverflow, 500);    
    
    let resizeTimeout;
    const handleResize = function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(manageOverflow, 100);
    };
    
    window.addEventListener('resize', handleResize);    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.removedNodes.forEach(function(node) {
                if (node === popupContainer) {
                    window.removeEventListener('resize', handleResize);
                    observer.disconnect();
                }
            });
        });
    });    
    observer.observe(document.body, { childList: true });
}
