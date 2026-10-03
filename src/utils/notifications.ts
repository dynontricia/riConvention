import * as Notifications from 'expo-notifications';
import { supabase } from '@/utils/supabase';
import { ScheduleEvent } from '@/utils/queries/schedule';

// How the notification appears when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
    }),
});

export async function requestNotificationPermission(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function scheduleEventReminders(
    favorites: number[]
): Promise<void> {
    // Cancel all existing reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (favorites.length === 0) return;

    // Fetch the favorited events
    const { data, error } = await supabase
        .from('event')
        .select('id, title, start_time, location(address_name, location_name)')
        .in('id', favorites)
        .eq('status', 'active')
        .gte('start_time', new Date().toISOString());

    if (error || !data) return;

    for (const event of data as unknown as ScheduleEvent[]) {
        const startTime = new Date(event.start_time);
        const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);

        // Only schedule if reminder is in the future
        if (reminderTime <= new Date()) continue;

        const location = event.location?.address_name ?? event.location?.location_name ?? '';

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '⭐ Starting in 15 minutes',
                body: `${event.title}${location ? ` · ${location}` : ''}`,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderTime,
            },
        });
    }
}

export async function cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminderCount(): Promise<number> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
}