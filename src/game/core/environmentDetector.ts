// Environment detection utilities
export function isDesktop(): boolean {
  // Check if running on desktop (not mobile/tablet)
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  
  // Also check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Desktop if not mobile/tablet and no touch (or minimal touch)
  return !isMobile && !isTablet && (!hasTouch || navigator.maxTouchPoints <= 1);
}

export function isMobile(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function shouldUsePlayroom(): boolean {
  // Use Playroom only on mobile/touch devices
  const mobile = isMobile();
  const touch = isTouchDevice();
  const desktop = isDesktop();
  const result = mobile || (touch && !desktop);
  
  console.log('shouldUsePlayroom check:', {
    mobile,
    touch,
    desktop,
    result,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints
  });
  
  return result;
}

export function getEnvironmentInfo() {
  return {
    isDesktop: isDesktop(),
    isMobile: isMobile(),
    isTouchDevice: isTouchDevice(),
    shouldUsePlayroom: shouldUsePlayroom(),
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints
  };
}
