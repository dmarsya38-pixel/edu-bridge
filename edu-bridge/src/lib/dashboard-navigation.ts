import { useRouter } from 'next/navigation';

/**
 * Navigation utilities for dashboard deep linking
 */

export interface NotificationNavigationParams {
  programmeId: string;
  subjectCode: string;
  materialId: string;
  showComments?: boolean;
}

export interface SearchNavigationParams {
  programmeId?: string;
  subjectCode?: string;
  materialId?: string;
  searchQuery: string;
  highlight?: string;
  commentId?: string;
  showComments?: boolean;
}

/**
 * Navigate to a specific material from a notification
 * This function constructs the proper URL for deep linking
 */
export function navigateToMaterialFromNotification(
  router: ReturnType<typeof useRouter>,
  params: NotificationNavigationParams
): void {
  const { programmeId, subjectCode, materialId, showComments = true } = params;
  
  // Construct URL with parameters for StudentDashboard to parse
  const url = `/dashboard?programme=${encodeURIComponent(programmeId)}&subject=${encodeURIComponent(subjectCode)}&material=${encodeURIComponent(materialId)}&showComments=${showComments}`;
  
  router.push(url);
}

/**
 * Navigate to a specific material from search results
 * This function constructs the proper URL for deep linking with search context
 */
export function navigateToMaterialFromSearch(
  router: ReturnType<typeof useRouter>,
  params: SearchNavigationParams
): void {
  const {
    programmeId,
    subjectCode,
    materialId,
    searchQuery,
    highlight,
    commentId,
    showComments = false
  } = params;

  // Build URL parameters dynamically
  const urlParams = new URLSearchParams();

  if (programmeId) urlParams.set('programme', encodeURIComponent(programmeId));
  if (subjectCode) urlParams.set('subject', encodeURIComponent(subjectCode));
  if (materialId) urlParams.set('material', encodeURIComponent(materialId));
  if (searchQuery) urlParams.set('searchQuery', encodeURIComponent(searchQuery));
  if (highlight) urlParams.set('highlight', encodeURIComponent(highlight));
  if (commentId) urlParams.set('commentId', encodeURIComponent(commentId));
  if (showComments) urlParams.set('showComments', 'true');

  const url = `/dashboard?${urlParams.toString()}`;
  router.push(url);
}

/**
 * Navigate to search results view
 */
export function navigateToSearch(
  router: ReturnType<typeof useRouter>,
  searchQuery: string,
  options?: {
    programmeId?: string;
    subjectCode?: string;
    materialType?: string;
  }
): void {
  const urlParams = new URLSearchParams();
  urlParams.set('searchQuery', encodeURIComponent(searchQuery));

  if (options?.programmeId) urlParams.set('programme', encodeURIComponent(options.programmeId));
  if (options?.subjectCode) urlParams.set('subject', encodeURIComponent(options.subjectCode));
  if (options?.materialType) urlParams.set('materialType', encodeURIComponent(options.materialType));

  const url = `/dashboard?${urlParams.toString()}`;
  router.push(url);
}

/**
 * Generate a shareable URL for a specific material
 */
export function generateMaterialShareUrl(params: NotificationNavigationParams): string {
  const { programmeId, subjectCode, materialId, showComments = true } = params;

  return `/dashboard?programme=${encodeURIComponent(programmeId)}&subject=${encodeURIComponent(subjectCode)}&material=${encodeURIComponent(materialId)}&showComments=${showComments}`;
}

/**
 * Generate a shareable URL for search results
 */
export function generateSearchShareUrl(params: SearchNavigationParams): string {
  const {
    programmeId,
    subjectCode,
    materialId,
    searchQuery,
    highlight,
    commentId,
    showComments = false
  } = params;

  const urlParams = new URLSearchParams();

  if (programmeId) urlParams.set('programme', encodeURIComponent(programmeId));
  if (subjectCode) urlParams.set('subject', encodeURIComponent(subjectCode));
  if (materialId) urlParams.set('material', encodeURIComponent(materialId));
  if (searchQuery) urlParams.set('searchQuery', encodeURIComponent(searchQuery));
  if (highlight) urlParams.set('highlight', encodeURIComponent(highlight));
  if (commentId) urlParams.set('commentId', encodeURIComponent(commentId));
  if (showComments) urlParams.set('showComments', 'true');

  return `/dashboard?${urlParams.toString()}`;
}