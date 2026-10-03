import { supabase } from '@/utils/supabase';
import { ScheduleEvent } from '@/utils/queries/schedule';

export async function fetchUpcomingFavorites(): Promise<ScheduleEvent[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Get user's favorited event IDs
    const { data: favorites, error: favError } = await supabase
        .from('user_favorite')
        .select('event_id')
        .eq('user_id', session.user.id);

    if (favError) throw favError;
    if (!favorites || favorites.length === 0) return [];

    const eventIds = favorites.map((f) => f.event_id);
    const now = new Date().toISOString();

    // Fetch those events that are upcoming and active
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
        .in('id', eventIds)
        .eq('status', 'active')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(5);

    if (error) throw error;
    return (data as unknown as ScheduleEvent[]) ?? [];
}