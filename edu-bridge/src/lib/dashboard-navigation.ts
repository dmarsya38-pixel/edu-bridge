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
 * Generate a shareable URL for a specific material
 */
export function generateMaterialShareUrl(params: NotificationNavigationParams): string {
  const { programmeId, subjectCode, materialId, showComments = true } = params;
  
  return `/dashboard?programme=${encodeURIComponent(programmeId)}&subject=${encodeURIComponent(subjectCode)}&material=${encodeURIComponent(materialId)}&showComments=${showComments}`;
}