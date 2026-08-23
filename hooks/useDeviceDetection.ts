import { useState, useEffect } from 'react';

interface DeviceInfo {
    isMobile: boolean;
    isAndroid: boolean;
    isIOS: boolean;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
}

export const useDeviceDetection = (): DeviceInfo => {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        isMobile: false,
        isAndroid: false,
        isIOS: false,
        deviceType: 'desktop',
        os: 'unknown',
    });

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        // Detect OS
        let os: DeviceInfo['os'] = 'unknown';
        if (/android/i.test(userAgent)) {
            os = 'android';
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            os = 'ios';
        } else if (/Win/i.test(userAgent)) {
            os = 'windows';
        } else if (/Mac/i.test(userAgent)) {
            os = 'macos';
        } else if (/Linux/i.test(userAgent)) {
            os = 'linux';
        }

        // Detect Device Type
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent); // Basic tablet check

        let deviceType: DeviceInfo['deviceType'] = 'desktop';
        if (isTablet) {
            deviceType = 'tablet';
        } else if (isMobile) {
            deviceType = 'mobile';
        }

        setDeviceInfo({
            isMobile,
            isAndroid: os === 'android',
            isIOS: os === 'ios',
            deviceType,
            os,
        });
    }, []);

    return deviceInfo;
};
