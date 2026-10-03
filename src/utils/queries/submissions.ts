import { supabase } from '@/utils/supabase';

export async function submitAskItBasket(content: string): Promise<void> {
    const { error } = await supabase
        .from('submission')
        .insert({ type: 'ask_it_basket', content });

    if (error) throw error;
}

export async function submitFeedback(feedback: {
    overall_rating: number | null;
    panels_rating: number | null;
    roundtables_rating: number | null;
    venue_rating: number | null;
    would_return: boolean | null;
    what_worked: string;
    what_improve: string;
    future_topics: string;
}): Promise<void> {
    const { error } = await supabase
        .from('feedback')
        .insert(feedback);

    if (error) throw error;
}