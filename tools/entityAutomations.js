// Table Automations Tool
async function showEntityAutomations() {
    // Check if form
    if (!requireFormContext()) {
        return;
    }
    
    try {
        const entityName = Xrm.Page.data.entity.getEntityName();
        const clientUrl = Xrm.Page.context.getClientUrl();        
        // Show loading
        if (typeof showLoadingDialog === 'function') {
            showLoadingDialog('Loading table automations...');
        }
        
        // Fetch all automation data
        const [workflows, dialogs, businessRules, businessProcessFlows, customApis, customActions] = await Promise.all([
            fetchWorkflows(entityName, clientUrl),
            fetchDialogs(entityName, clientUrl),
            fetchBusinessRules(entityName, clientUrl),
            fetchBusinessProcessFlows(entityName, clientUrl),
            fetchCustomApis(entityName, clientUrl),
            fetchCustomActions(entityName, clientUrl)
        ]);
        
        // Owner information if missing
        const allItems = [...workflows, ...dialogs, ...businessRules, ...businessProcessFlows, ...customApis, ...customActions];
        await enrichWithOwnerNames(allItems, clientUrl);
        
        // All items with solution info
        await enrichWithSolutionInfo(allItems, clientUrl);        
        // Hide loading before popup
        if (typeof hideLoadingDialog === 'function') {
            hideLoadingDialog();
        }        
        // Display popup after loading
        createAutomationsPopup(entityName, workflows, dialogs, businessRules, businessProcessFlows, customApis, customActions);        
    } catch (error) {
        if (typeof hideLoadingDialog === 'function') {
            hideLoadingDialog();
        }
        if (typeof showToast === 'function') {
            showToast('Error loading table automations: ' + error.message, 'error');
        }
    }
}

// Workflows (Classic Workflows)
async function fetchWorkflows(entityName, clientUrl) {
    try {
        // Try with expand
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/workflows?$select=name,category,statecode,statuscode,primaryentity,type,workflowid,parentworkflowid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=primaryentity eq '${entityName}' and category eq 0&$orderby=name asc`
        );        
        // Try without expand
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/workflows?$select=name,category,statecode,statuscode,primaryentity,type,workflowid,parentworkflowid,_ownerid_value&$filter=primaryentity eq '${entityName}' and category eq 0&$orderby=name asc`
            );
        }        
        if (!response.ok) return [];
        const data = await response.json();
        
        // Filter out child workflows and only show Definition workflows
        const filteredWorkflows = (data.value || []).filter(workflow => {
            return workflow.type === 1;
        });        
        return filteredWorkflows;
    } catch (error) {
        return [];
    }
}

// Dialogs
async function fetchDialogs(entityName, clientUrl) {
    try {
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=primaryentity eq '${entityName}' and category eq 1&$orderby=name asc`
        );
        
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$filter=primaryentity eq '${entityName}' and category eq 1&$orderby=name asc`
            );
        }
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        return [];
    }
}

// Business Rules
async function fetchBusinessRules(entityName, clientUrl) {
    try {
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=primaryentity eq '${entityName}' and category eq 2&$orderby=name asc`
        );
        
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$filter=primaryentity eq '${entityName}' and category eq 2&$orderby=name asc`
            );
        }
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        return [];
    }
}

// Business Process Flows
async function fetchBusinessProcessFlows(entityName, clientUrl) {
    try {
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=primaryentity eq '${entityName}' and category eq 4&$orderby=name asc`
        );
        
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/workflows?$select=name,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$filter=primaryentity eq '${entityName}' and category eq 4&$orderby=name asc`
            );
        }
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        return [];
    }
}

// Custom APIs
async function fetchCustomApis(entityName, clientUrl) {
    try {
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/customapis?$select=uniquename,displayname,bindingtype,boundentitylogicalname,isfunction,customapiid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=boundentitylogicalname eq '${entityName}'&$orderby=uniquename asc`
        );
        
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/customapis?$select=uniquename,displayname,bindingtype,boundentitylogicalname,isfunction,customapiid,_ownerid_value&$filter=boundentitylogicalname eq '${entityName}'&$orderby=uniquename asc`
            );
        }
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        return [];
    }
}

// Owner names if missing
async function enrichWithOwnerNames(items, clientUrl) {    
    const itemsNeedingOwner = items.filter(item => 
        item._ownerid_value && (!item.ownerid || !item.ownerid.fullname)
    );
    
    if (itemsNeedingOwner.length === 0) return;
    
    // Owner info each owner ID
    const uniqueOwnerIds = [...new Set(itemsNeedingOwner.map(item => item._ownerid_value))];    
    const ownerPromises = uniqueOwnerIds.map(async ownerId => {
        try {            
            let response = await fetch(`${clientUrl}/api/data/v9.2/systemusers(${ownerId})?$select=fullname`);            
            if (response.ok) {
                const data = await response.json();
                return { id: ownerId, name: data.fullname, type: 'systemuser' };
            }
            
            // If not systemuser, try team
            response = await fetch(`${clientUrl}/api/data/v9.2/teams(${ownerId})?$select=name`);
            
            if (response.ok) {
                const data = await response.json();
                return { id: ownerId, name: data.name, type: 'team' };
            }
            
            return { id: ownerId, name: 'Unknown Owner', type: 'unknown' };
        } catch (error) {
            return { id: ownerId, name: 'Unknown Owner', type: 'unknown' };
        }
    });
    
    const ownerResults = await Promise.all(ownerPromises);
    const ownerMap = {};
    ownerResults.forEach(result => {
        ownerMap[result.id] = result.name;
    });
    
    // Update items with owner names
    itemsNeedingOwner.forEach(item => {
        if (!item.ownerid) {
            item.ownerid = {};
        }
        item.ownerid.fullname = ownerMap[item._ownerid_value] || 'Unknown Owner';
    });
}
// Items with solution info
async function enrichWithSolutionInfo(items, clientUrl) {
    const solutionPromises = items.map(async item => {
        try {
            let objectId;
            let componentType;            
            // Determine the object ID and component type based on item type
            if (item.workflowid) {                
                objectId = item.workflowid.replace(/[{}]/g, '').toLowerCase();
                componentType = 29; // Workflow/Business Rule/Flow/Action
            } else if (item.customapiid) {
                objectId = item.customapiid.replace(/[{}]/g, '').toLowerCase();
                componentType = 10380; 
            } else {
                return;
            }            
            
            let response = await fetch(
                `${clientUrl}/api/data/v9.2/solutioncomponents?$select=solutioncomponentid&$expand=solutionid($select=friendlyname,uniquename,ismanaged)&$filter=objectid eq ${objectId} and componenttype eq ${componentType}`
            );            
            // If expand fails
            if (!response.ok) {
                response = await fetch(
                    `${clientUrl}/api/data/v9.2/solutioncomponents?$select=solutioncomponentid,_solutionid_value&$filter=objectid eq ${objectId} and componenttype eq ${componentType}`
                );
            }
            
            if (!response.ok) {
                item.solutions = [];
                return;
            }
            const data = await response.json();            
            if (data.value && data.value.length > 0) {
                // Filter out active solution but keep default solution
                const solutions = data.value
                    .filter(sc => {                        
                        if (sc.solutionid) {
                            return sc.solutionid.uniquename !== 'Active';
                        }
                        // If expand fails include all solution components
                        return sc._solutionid_value !== undefined;
                    })
                    .map(sc => {
                        if (sc.solutionid) {
                            // Expanded solution
                            return {
                                name: sc.solutionid.friendlyname || sc.solutionid.uniquename,
                                uniquename: sc.solutionid.uniquename,
                                isManaged: sc.solutionid.ismanaged
                            };
                        } else {
                            // Fallback
                            return {
                                name: 'Solution',
                                uniquename: sc._solutionid_value,
                                isManaged: false
                            };
                        }
                    });
                
                item.solutions = solutions.length > 0 ? solutions : [{
                    name: 'Default Solution',
                    uniquename: 'Default',
                    isManaged: false
                }];
            } else {
                // If no solutions found assume it's in Default Solution                
                item.solutions = [{
                    name: 'Default Solution',
                    uniquename: 'Default',
                    isManaged: false
                }];
            }
        } catch (error) {
            // If error occurs, assume Default Solution
            item.solutions = [{
                name: 'Default Solution',
                uniquename: 'Default',
                isManaged: false
            }];
        }
    });
    
    await Promise.all(solutionPromises);
}

// Custom Actions
async function fetchCustomActions(entityName, clientUrl) {
    try {
        let response = await fetch(
            `${clientUrl}/api/data/v9.2/workflows?$select=name,uniquename,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$expand=ownerid($select=fullname)&$filter=primaryentity eq '${entityName}' and category eq 3&$orderby=name asc`
        );
        
        if (!response.ok) {
            response = await fetch(
                `${clientUrl}/api/data/v9.2/workflows?$select=name,uniquename,statecode,statuscode,primaryentity,workflowid,_ownerid_value&$filter=primaryentity eq '${entityName}' and category eq 3&$orderby=name asc`
            );
        }
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        return [];
    }
}

// Automations popup
function createAutomationsPopup(entityName, workflows, dialogs, businessRules, businessProcessFlows, customApis, customActions) {
    // Close all existing popups
    const existingPopups = document.querySelectorAll('.commonPopup');
    existingPopups.forEach(popup => popup.remove());    
    const popupContainer = document.createElement('div');
    popupContainer.className = 'commonPopup';
    
    popupContainer.innerHTML = `
        <div class="commonPopup-header">
            <span style="color: white;">Table Automations</span>
            <span class="close-button">&times;</span>
        </div>
        <div class="popup-body">
            <div class="commonSection content-section">
            <div style="background-color: #f9f9f9; padding: 12px 20px; border-radius: 5px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;">
                    <div style="flex-shrink: 0;"><strong>Table:</strong> ${entityName}</div>
                    <div style="text-align: right; font-size: 12px; color: #666; flex: 1; min-width: 250px; line-height: 1.5;">
                        <strong>Note:</strong> Cloud Flows are not included. Please visit Power Automate for Cloud Flows.
                    </div>
                </div>
            </div>
            
            <div class="scroll-section" style="overflow-y: auto; max-height: calc(80vh - 200px);">
                ${generateAutomationsHtml(workflows, dialogs, businessRules, businessProcessFlows, customApis, customActions)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(popupContainer);
    
    // Close Btn
    const closeButton = popupContainer.querySelector('.close-button');
    closeButton.addEventListener('click', () => popupContainer.remove());
    closeButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#e81123';
    });
    closeButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
    });
    
    // Movable Popup
    if (typeof makePopupMovable === 'function') {
        makePopupMovable(popupContainer);
    }
}

// Generate HTML
function generateAutomationsHtml(workflows, dialogs, businessRules, businessProcessFlows, customApis, customActions) {
    let html = '';    
    // Combine Workflows, Dialogs, Business Process Flows, and Custom Actions into one section   
    const typeOrder = {
        'Workflow Classic': 1,
        'Dialog': 2,
        'Custom Action': 3,
        'Business Process': 4
    };
    
    const workflowItems = [
        ...workflows.map(w => ({ ...w, itemType: 'Workflow Classic' })),
        ...dialogs.map(d => ({ ...d, itemType: 'Dialog' })),
        ...customActions.map(a => ({ ...a, itemType: 'Custom Action' })),
        ...businessProcessFlows.map(b => ({ ...b, itemType: 'Business Process' }))
    ].sort((a, b) => {
        // Sort by type
        const typeComparison = (typeOrder[a.itemType] || 999) - (typeOrder[b.itemType] || 999);
        if (typeComparison !== 0) return typeComparison;
        // Sort alphabetically by name 
        return (a.name || '').localeCompare(b.name || '');
    });
    
    html += generateSectionHtml('Processes', workflowItems, 'workflow');    
    // Business Rules 
    html += generateSectionHtml('Business Rules', businessRules, 'businessrule');    
    // Custom APIs 
    html += generateSectionHtml('Custom APIs', customApis, 'customapi');    
    if (html === '') {
        html = '<div style="text-align: center; padding: 40px; color: #666;">No automations or customizations found for this table.</div>';
    }    
    return html;
}

// Generate HTML for each type
function generateSectionHtml(title, items, type) {
    if (!items || items.length === 0) return '';    
    const clientUrl = Xrm.Page.context.getClientUrl();    
    let html = `
        <div style="margin-bottom: 30px;">
            <h3 style="color: #2b2b2b; margin-bottom: 15px; font-size: 18px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <span>${title}</span>
                <span style="background-color: #2b2b2b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${items.length}</span>
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
    `;
    
    items.forEach(item => {
        const baseName = item.name || item.displayname || item.uniquename || 'Unnamed';
        // Add item type label
        const itemTypeLabel = item.itemType ? ` (${item.itemType})` : '';
        const name = baseName + itemTypeLabel;        
        const owner = getOwnerName(item);
        // Don't show solutions for Business Rules
        const solutionDropdown = type === 'businessrule' ? '' : getSolutionDropdown(item);
        const status = getStatusInfo(item, type);
        const url = getItemUrl(item, type, clientUrl);        
        html += `
            <div style="padding: 12px; background-color: #f5f5f5; border-radius: 6px; border-left: 3px solid ${status.color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 10px; ${url ? 'cursor: pointer; text-decoration: underline;' : ''}" ${url ? `onclick="window.open('${url}', '_blank');"` : ''}>${name}</div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                        ${status.badge}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; flex-wrap: wrap;">
                    ${solutionDropdown}
                    <div style="font-size: 12px; color: #666; flex-shrink: 0;">
                        <strong>Owner:</strong> ${owner}
                    </div>
                    ${getTypeInfo(item, type)}
                </div>
                ${getAdditionalInfo(item, type)}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Owner from item
function getOwnerName(item) {
    if (item.ownerid && item.ownerid.fullname) {
        return item.ownerid.fullname;
    }
    return 'Unknown Owner';
}

// Solution dropdown for item
function getSolutionDropdown(item) {
    if (!item.solutions) {
        return '';
    }    
    const itemId = item.workflowid || item.customapiid || Math.random().toString(36).substr(2, 9);
    const solutionCount = item.solutions.length;    
    if (solutionCount === 0) {
        return `<div style="font-size: 12px; color: #666; position: relative;">
            <div style="display: flex; align-items: center; cursor: pointer; padding: 4px 0;" onclick="event.stopPropagation(); toggleSolutionList('${itemId}')">
                <span id="arrow-${itemId}" style="display: inline-block; margin-right: 6px; transition: transform 0.2s; font-size: 10px;">▶</span>
                <strong>Solutions (0)</strong>
            </div>
            <div id="solutions-${itemId}" style="display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 8px 12px; margin-top: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px; color: #999; font-style: italic; font-size: 11px;">
                Not in any solution
            </div>
        </div>`;
    }
    
    // Solution list
    const solutionList = item.solutions.map(sol => {
        const bgColor = sol.isManaged ? '#e3f2fd' : '#e8f5e9';
        return `<div style="padding: 6px 10px; margin-bottom: 4px; background-color: ${bgColor}; border-radius: 3px; font-size: 11px; white-space: nowrap;">
            ${sol.name}
        </div>`;
    }).join('');
    
    return `<div style="font-size: 12px; color: #666; position: relative;">
        <div style="display: flex; align-items: center; cursor: pointer; padding: 4px 0;" onclick="event.stopPropagation(); toggleSolutionList('${itemId}')">
            <span id="arrow-${itemId}" style="display: inline-block; margin-right: 6px; transition: transform 0.2s; font-size: 10px;">▶</span>
            <strong>Solutions (${solutionCount})</strong>
        </div>
        <div id="solutions-${itemId}" style="display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-top: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px; max-height: 300px; overflow-y: auto;">
            ${solutionList}
        </div>
    </div>`;
}

// URL to open item
function getItemUrl(item, type, clientUrl) {
    if (type === 'workflow') {        
        if (item.workflowid) {
            return `${clientUrl}/sfa/workflow/edit.aspx?id=${item.workflowid}`;
        }
    }    
    if (type === 'dialog') {        
        if (item.workflowid) {
            return `${clientUrl}/sfa/workflow/edit.aspx?id=${item.workflowid}`;
        }
    }    
    if (type === 'businessrule') {        
        if (item.workflowid) {
            return `${clientUrl}/sfa/workflow/edit.aspx?id=${item.workflowid}`;
        }
    }    
    if (type === 'businessprocessflow') {        
        if (item.workflowid) {
            return `${clientUrl}/sfa/workflow/edit.aspx?id=${item.workflowid}`;
        }
    }    
    if (type === 'action') {        
        if (item.workflowid) {
            return `${clientUrl}/sfa/workflow/edit.aspx?id=${item.workflowid}`;
        }
    }
    
    if (type === 'customapi' && item.customapiid) {        
        return `${clientUrl}/main.aspx?pagetype=entityrecord&etn=customapi&id=${item.customapiid}`;
    }
    
    return null;
}
// Get status info
function getStatusInfo(item, type) {
    if (type === 'customapi') {
        return {
            color: '#10b981',
            badge: '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">ACTIVE</span>'
        };
    }    
    const stateCode = item.statecode;    
    // Workflow/Business Rule/Flow status    
    if (stateCode === 1) {        
        return {
            color: '#10b981',
            badge: '<span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">ACTIVE</span>'
        };
    } else if (stateCode === 2) {        
        return {
            color: '#ef4444',
            badge: '<span style="background-color: #ef4444; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">SUSPENDED</span>'
        };
    } else {        
        return {
            color: '#f59e0b',
            badge: '<span style="background-color: #f59e0b; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">DRAFT</span>'
        };
    }
}
// Get type info
function getTypeInfo(item, type) {
    if (type === 'customapi') {
        const bindingType = item.bindingtype === 0 ? 'Global' : item.bindingtype === 1 ? 'Entity' : 'Entity Collection';
        const funcType = item.isfunction ? 'Function' : 'Action';
        return `<span style="font-size: 11px; color: #666; background-color: #e5e7eb; padding: 3px 8px; border-radius: 4px;">${funcType} | ${bindingType}</span>`;
    }    
    return '';
}

// Get additional info
function getAdditionalInfo(item, type) {
    let html = '';        
    if (type === 'customapi' && item.uniquename) {
        html += `<div style="margin-top: 8px; font-size: 12px; color: #666;"><strong>Unique Name:</strong> ${item.uniquename}</div>`;
    }    
    return html;
}
// Toggle solution list
function toggleSolutionList(itemId) {
    const solutionsDiv = document.getElementById(`solutions-${itemId}`);
    const arrow = document.getElementById(`arrow-${itemId}`);        
    document.querySelectorAll('[id^="solutions-"]').forEach(el => {
        if (el.id !== `solutions-${itemId}`) {
            el.style.display = 'none';
        }
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(el => {
        if (el.id !== `arrow-${itemId}`) {
            el.style.transform = 'rotate(0deg)';
        }
    });
    
    if (solutionsDiv.style.display === 'none' || solutionsDiv.style.display === '') {
        solutionsDiv.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
    } else {
        solutionsDiv.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Close solution dropdowns
document.addEventListener('click', function(event) {    
    if (!event.target.closest('[id^="arrow-"]') && !event.target.closest('[id^="solutions-"]')) {
        document.querySelectorAll('[id^="solutions-"]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('[id^="arrow-"]').forEach(el => {
            el.style.transform = 'rotate(0deg)';
        });
    }
});

