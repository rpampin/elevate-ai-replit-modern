import { Client, MemberProfile } from '@shared/schema';

/**
 * Determines the current client for a member based on their work history
 * Returns the client from the most recent active work period, or TalentPool if none
 */
export function getCurrentClientFromHistory(
  profile: MemberProfile | null | undefined,
  clients: Client[]
): Client {
  // Default to TalentPool - ensure we have a fallback
  if (!clients || clients.length === 0) {
    return { id: 1, name: 'Talent Pool', description: 'Internal talent pool', isActive: true };
  }
  
  const talentPool = clients.find(c => c.name === 'Talent Pool') || clients[0];
  
  if (!profile?.clientHistory || profile.clientHistory.length === 0) {
    return talentPool;
  }

  // Find the most recent work period (active or completed)
  const now = new Date();
  
  // First try to find truly active work (no end date or future end date)
  const activeWork = profile.clientHistory
    .filter(work => {
      return !work.endDate || new Date(work.endDate) > now;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

  if (activeWork && activeWork.clientId !== 1) { // Don't show Talent Pool as active work
    const client = clients.find(c => c.id === activeWork.clientId);
    if (client) return client;
  }

  // If no active work, find the most recent completed work (excluding Talent Pool gaps)
  const mostRecentWork = profile.clientHistory
    .filter(work => work.clientId !== 1) // Exclude Talent Pool entries
    .sort((a, b) => {
      const aEnd = new Date(a.endDate || a.startDate);
      const bEnd = new Date(b.endDate || b.startDate);
      return bEnd.getTime() - aEnd.getTime();
    })[0];

  if (mostRecentWork) {
    const client = clients.find(c => c.id === mostRecentWork.clientId);
    if (client) return client;
  }

  return talentPool;
}

/**
 * Gets the current client name for display purposes
 */
export function getCurrentClientName(
  profile: MemberProfile | null | undefined,
  clients: Client[]
): string {
  if (!clients || clients.length === 0) {
    return 'TalentPool';
  }
  const currentClient = getCurrentClientFromHistory(profile, clients);
  return currentClient?.name || 'TalentPool';
}

/**
 * Gets the current client ID for API operations
 */
export function getCurrentClientId(
  profile: MemberProfile | null | undefined,
  clients: Client[]
): number {
  const currentClient = getCurrentClientFromHistory(profile, clients);
  return currentClient.id;
}

// Legacy utility functions for backward compatibility
export function getClientNameFromId(clientId: number, clients: Client[]): string {
  const client = clients.find(c => c.id === clientId);
  return client?.name || 'Unknown Client';
}

export function getClientIdFromMember(member: any, clients: Client[]): number {
  if (member.profile) {
    return getCurrentClientId(member.profile, clients);
  }
  return clients.find(c => c.name === 'Talent Pool')?.id || 1;
}

export function getAllClientIdsFromMembers(members: any[]): number[] {
  const clientIds = new Set<number>();
  members.forEach(member => {
    if (member.profile?.clientHistory) {
      member.profile.clientHistory.forEach((history: any) => {
        clientIds.add(history.clientId);
      });
    }
  });
  return Array.from(clientIds);
}

export function getAllRolesFromMembers(members: any[]): string[] {
  const roles = new Set<string>();
  members.forEach(member => {
    if (member.profile?.clientHistory) {
      member.profile.clientHistory.forEach((history: any) => {
        if (history.role) {
          roles.add(history.role);
        }
      });
    }
  });
  return Array.from(roles);
}