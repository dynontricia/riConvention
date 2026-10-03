import { supabase } from '@/utils/supabase';

export type UserProfile = {
    id: string;
    home_group: string | null;
    current_service_position: string[] | null;
    interests: string[] | null;
    conv_comm_init: boolean | null;
    conv_comm_confirmed: boolean | null;
};

export async function getProfile(): Promise<UserProfile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('user_profile')
        .select('id, home_group, current_service_position, interests, conv_comm_init, conv_comm_confirmed')
        .eq('id', session.user.id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function saveProfile(
    homeGroup: string,
    servicePositions: string[],
    interests: string[],
    convCommInit: boolean
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
        .from('user_profile')
        .upsert({
            id: session.user.id,
            home_group: homeGroup,
            current_service_position: servicePositions,
            interests: interests,
            conv_comm_init: convCommInit,
        });

    if (error) throw error;
}

export async function deleteProfile(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
        .from('user_profile')
        .delete()
        .eq('id', session.user.id);

    if (error) throw error;
}