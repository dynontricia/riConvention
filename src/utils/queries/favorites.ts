import { supabase } from '@/utils/supabase';

export async function fetchFavorites(): Promise<number[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
        .from('user_favorite')
        .select('event_id')
        .eq('user_id', session.user.id);

    if (error) throw error;
    return data?.map((row) => row.event_id) ?? [];
}

export async function addFavorite(eventId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
        .from('user_favorite')
        .insert({ user_id: session.user.id, event_id: eventId });

    if (error) throw error;
}

export async function removeFavorite(eventId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('session:', session?.user.id);

    if (!session) {
        console.log('no session — bailing');
        return;
    }

    const { error } = await supabase
        .from('user_favorite')
        .delete()
        .eq('user_id', session.user.id)
        .eq('event_id', eventId);

    if (error) throw error;
}