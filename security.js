window.updateUserDetails = async function (selectedUserId, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

 try {
    await changeBusinessUnit(userId, businessUnitId);
    await disassociateUserFromRoles(userId, clientUrl);
    await disassociateUserFromTeams(userId, clientUrl);
    await associateUserToTeam(userId, teamId, clientUrl);
    await associateUserToRole(userId, roleId, clientUrl);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

window.changeBusinessUnit = async function (selectedUserId, selectedBusinessUnitId) {
  const data1 = {
    businessunitid@odata.bind: `/businessunits(${businessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", userId, data1);
}

window.disassociateUserFromRoles = async function (selectedUserId, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });
  const results = (await response.json()).value;

  await Promise.all(results.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.0/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

window.disassociateUserFromTeams = async function disassociateUserFromTeams(selectedUserId, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });
  const results = (await response.json()).value;

  await Promise.all(results.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.0/systemusers(${userId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

window.associateUserToTeam = async function associateUserToTeam(selectedUserId, selectedTeamIds, clientUrl) {
  const associateTeamUrl = `${clientUrl}/api/data/v9.0/teams(${teamId})/teammembership_association/$ref`;
  const associateTeamData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${userId})`
  };
  await fetch(associateTeamUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateTeamData)
  });
}

window.associateUserToRole = async function associateUserToRole(selectedUserId, selectedRoleIds, clientUrl) {
  const associateRoleUrl = `${clientUrl}/api/data/v9.0/roles(${roleId})/systemuserroles_association/$ref`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${userId})`
  };
  await fetch(associateRoleUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateRoleData)
  });
}
