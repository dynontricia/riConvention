import { supabase } from '@/utils/supabase';

export type EventPerson = {
    role: string;
    person: {
        first_name: string;
        last_initial: string;
    };
};

export type ScheduleEvent = {
    id: number;
    title: string;
    description: string | null;
    event_type: string;
    start_time: string;
    end_time: string | null;
    status: string;
    interpretation: boolean;
    location: {
        location_name: string;
        address_name: string | null;
    } | null;
    event_person: EventPerson[];
};

export type DaySchedule = {
    date: string;
    label: string;
    events: ScheduleEvent[];
};

export async function fetchSchedule(): Promise<DaySchedule[]> {
    const { data, error } = await supabase
        .from('event')
        .select(`
      id,
      title,
      description,
      event_type,
      start_time,
      end_time,
      status,
      interpretation,
      location (
        location_name,
        address_name
      ),
      event_person (
        role,
        person (
          first_name,
          last_initial
        )
      )
    `)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    const grouped = new Map<string, ScheduleEvent[]>();

    for (const event of data as unknown as ScheduleEvent[]) {
        const utcDate = new Date(event.start_time);
        const estDate = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
        const date = estDate.toISOString().slice(0, 10);
        if (!grouped.has(date)) grouped.set(date, []);
        grouped.get(date)!.push(event);
    }

    const days: DaySchedule[] = [];
    for (const [date, events] of grouped) {
        const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
        });
        days.push({ date, label, events });
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
}