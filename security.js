async function updateUserDetails(userId, businessUnitId, teamId, roleId) {
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

async function changeBusinessUnit(userId, businessUnitId) {
  const data1 = {
    businessunitid@odata.bind: `/businessunits(${businessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", userId, data1);
}

async function disassociateUserFromRoles(userId, clientUrl) {
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

async function disassociateUserFromTeams(userId, clientUrl) {
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

async function associateUserToTeam(userId, teamId, clientUrl) {
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

async function associateUserToRole(userId, roleId, clientUrl) {
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

// Usage
updateUserDetails("635bc20a-eb00-ec11-94ef-001dd8028e8d", "18ae5e07-8c9d-ed11-aad0-001dd8072538", "2b54d4f6-d3a3-ed11-aad0-001dd80721cf", "FBEE97CB-901D-4A84-9F22-26C035FA5BD2");
