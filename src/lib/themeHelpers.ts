/**
 * Theme Helper Utilities for CSE23 Elections App
 */

/**
 * Normalizes photo URLs, especially Google Drive links, to direct view URLs
 * @param url - The original photo URL (can be null/undefined)
 * @returns Normalized URL or null if invalid
 */
export function normalizePhotoUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;

  // If already a direct URL (not Google Drive), return as-is
  if (!url.includes('drive.google.com')) return url;

  // Extract file ID from various Google Drive URL formats
  // Matches patterns like:
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/uc?id=FILE_ID
  const idMatch = url.match(/[-\w]{25,}/);
  if (!idMatch) return url; // Return original if no ID found

  // Convert to direct view URL using lh3.googleusercontent.com which is more reliable for embedding
  return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
}

/**
 * Gets initials from a name for placeholder avatars
 * @param name - Full name
 * @returns Two-letter initials
 */
export function getInitials(name: string): string {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formats election date/time in a readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatElectionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Determines if an election is currently active
 * @param startTime - Election start time
 * @param endTime - Election end time
 * @returns Object with status flags
 */
export function getElectionStatus(startTime: string, endTime: string) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  return {
    isPending: now < start,
    isActive: now >= start && now <= end,
    isEnded: now > end,
  };
}
