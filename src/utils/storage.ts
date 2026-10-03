import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    firstName: 'user_first_name',
    lastInitial: 'user_last_initial',
    hasOnboarded: 'has_onboarded',
    largeText: 'large_text',
} as const;

export async function saveUserName(firstName: string, lastInitial: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.firstName, firstName);
    await AsyncStorage.setItem(KEYS.lastInitial, lastInitial);
}

export async function getUserName(): Promise<{ firstName: string; lastInitial: string }> {
    const firstName = await AsyncStorage.getItem(KEYS.firstName);
    const lastInitial = await AsyncStorage.getItem(KEYS.lastInitial);
    return {
        firstName: firstName ?? '',
        lastInitial: lastInitial ?? '',
    };
}

export async function setHasOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.hasOnboarded, 'true');
}

export async function getHasOnboarded(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.hasOnboarded);
    return value === 'true';
}

export async function clearUserData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.firstName);
    await AsyncStorage.removeItem(KEYS.lastInitial);
    await AsyncStorage.removeItem(KEYS.hasOnboarded);
}

export async function getLargeText(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.largeText);
    return value === 'true';
}

export async function setLargeText(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.largeText, enabled ? 'true' : 'false');
}