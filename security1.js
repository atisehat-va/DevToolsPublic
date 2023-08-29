window.updateUserDetails = async function(selectedUserId2, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

  try {
    await changeBusinessUnit(selectedUserId2, selectedBusinessUnitId);
    await disassociateUserFromRoles(selectedUserId2, clientUrl);
    await disassociateUserFromTeams(selectedUserId2, clientUrl);

    for (const roleId of selectedRoleIds) {
      await associateUserToRole(selectedUserId2, selectedRoleIds, clientUrl);
    }
    
    for (const teamId of selectedTeamIds) {
      await associateUserToTeam(selectedUserId2, selectedTeamIds, clientUrl);
    } 

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function changeBusinessUnit(selectedUserId2, selectedBusinessUnitId) {
  const data1 = {
    "businessunitid@odata.bind": `/businessunits(${selectedBusinessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", selectedUserId2, data1);
}

async function disassociateUserFromRoles(selectedUserId2, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
    
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.0/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function disassociateUserFromTeams(selectedUserId2, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
  
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function associateUserToTeam(selectedUserId2, selectedTeamIds, clientUrl) {
  const associateTeamUrl = `${clientUrl}/api/data/v9.0/teams(${selectedTeamIds})/teammembership_association/$ref`;
  const associateTeamData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})`
  };
  await fetch(associateTeamUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateTeamData)
  });
}

async function associateUserToRole(selectedUserId2, selectedRoleIds, clientUrl) {
  const associateRoleUrl = `${clientUrl}/api/data/v9.0/roles(${selectedRoleIds})/systemuserroles_association/$ref`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${selectedUserId2})`
  };
  await fetch(associateRoleUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateRoleData)
  });
}

