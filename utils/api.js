// User API calls
function fetchUsers(callback) {        
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,firstname,lastname,fullname,_businessunitid_value,applicationid&$filter=(isdisabled eq false) and (accessmode ne 3) and (accessmode ne 5) and (applicationid eq null)').then(callback);
}

function fetchBusinessUnitName(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=businessunitid($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
}

// Business Unit API calls
function fetchBusinessUnits(callback) {
	Xrm.WebApi.retrieveMultipleRecords('businessunit', '?$select=businessunitid,name').then(callback);
}

// Team API calls
function fetchTeamsForUser(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name,teamtype)&$filter=systemuserid eq ${userId}`).then(callback);
}

function fetchTeams(callback) {
	Xrm.WebApi.retrieveMultipleRecords('team', '?$select=teamid,name&$expand=businessunitid($select=name)&$filter=(teamtype eq 0 or teamtype eq 1) and isdefault eq false').then(callback);
}

// Role API calls
function fetchRolesForUser(userId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
}

function fetchSecurityRoles(businessUnitId, callback) {
	Xrm.WebApi.retrieveMultipleRecords('role', `?$select=roleid,name&$filter=_businessunitid_value eq ${businessUnitId}`).then(callback);
}

// Shared function to fetch and format role details
async function fetchRoleDetails(roleEntities) {
    const roleDetailsArr = [];
    const rolePromises = roleEntities.map(role => {
        const roleId = role['roleid'];
        return Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
            roleDetailsArr.push(roleDetail);
        });
    });
    await Promise.all(rolePromises);
    return roleDetailsArr.sort((a, b) => a.name.localeCompare(b.name));
}

