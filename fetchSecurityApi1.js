function fetchUsers(callback) {
	var Xrm = window.Xrm || window.parent.Xrm;
	if (Xrm) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)').then(callback);
	} else {
		console.error("Xrm is not defined.");
	}
}

function fetchRolesForUser(userId, callback) {
	var Xrm = window.Xrm || window.parent.Xrm;
	if (Xrm) {
		Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
	} else {
		console.error("Xrm is not defined.");
	}
}

function fetchTeamsForUser(userId, callback) {
	var Xrm = window.Xrm || window.parent.Xrm;
	if (Xrm) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	} else {
		console.error("Xrm is not defined.");
	}
}

function fetchBusinessUnitName(userId, callback) {
	var Xrm = window.Xrm || window.parent.Xrm;
	if (Xrm) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=businessunitid($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	} else {
		console.error("Xrm is not defined.");
	}
}
