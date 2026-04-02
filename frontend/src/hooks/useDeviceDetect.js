import { useState, useEffect, useCallback } from 'react';

const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
};

/**
 * Custom hook for device detection based on screen width and touch capability.
 * Returns { isMobile, isTablet, isDesktop, width, isTouch }
 * Uses matchMedia for performance instead of resize listeners.
 */
export const useDeviceDetect = () => {
    const getDevice = useCallback(() => {
        const width = window.innerWidth;
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
        
        return {
            isMobile: width < BREAKPOINTS.mobile,
            isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
            isDesktop: width >= BREAKPOINTS.tablet,
            width,
            isTouch
        };
    }, []);

    const [device, setDevice] = useState(getDevice);

    useEffect(() => {
        const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
        const tabletQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
        const touchQuery = window.matchMedia('(pointer: coarse)');

        const handleChange = () => setDevice(getDevice());

        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener('change', handleChange);
            tabletQuery.addEventListener('change', handleChange);
            touchQuery.addEventListener('change', handleChange);
        } else {
            mobileQuery.addListener(handleChange);
            tabletQuery.addListener(handleChange);
            touchQuery.addListener(handleChange);
        }

        return () => {
            if (mobileQuery.removeEventListener) {
                mobileQuery.removeEventListener('change', handleChange);
                tabletQuery.removeEventListener('change', handleChange);
                touchQuery.removeEventListener('change', handleChange);
            } else {
                mobileQuery.removeListener(handleChange);
                tabletQuery.removeListener(handleChange);
                touchQuery.removeListener(handleChange);
            }
        };
    }, [getDevice]);

    return device;
};

export default useDeviceDetect;
