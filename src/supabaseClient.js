import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xaqqzuvlpymqofyonave.supabase.co';
const supabaseAnonKey = 'sb_publishable_erSppLTw-fj-fsn4OBPyaQ_4FxM6Bwm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
