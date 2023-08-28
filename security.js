window.updateUserDetails = async function(userId, businessUnitId, teamIds, roleIds) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

  try {
    await changeBusinessUnit(userId, businessUnitId);
    await disassociateUserFromRoles(userId, clientUrl);
    await disassociateUserFromTeams(userId, clientUrl);

    // Associate user with each team
    for (const teamId of teamIds) {
      await associateUserToTeam(userId, teamId, clientUrl);
    }

    // Associate user with each role
    for (const roleId of roleIds) {
      await associateUserToRole(userId, roleId, clientUrl);
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function changeBusinessUnit(userId, businessUnitId) {
  const data1 = {
    "businessunitid@odata.bind": `/businessunits(${businessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", userId, data1);
}

async function disassociateUserFromRoles(userId, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
  
  // disassociate roles
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.0/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function disassociateUserFromTeams(userId, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();

  // disassociate teams
  await Promise.all(results.value.map(async (result) => {
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

