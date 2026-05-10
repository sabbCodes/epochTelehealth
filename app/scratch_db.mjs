import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: schedules } = await supabase.from('schedules').select('*').limit(5);
  console.log('Schedules:', schedules);

  const { data: doctors } = await supabase.from('doctor_profiles').select('id, consultation_fee').limit(5);
  console.log('Doctors:', doctors);

  const { data: users } = await supabase.from('user_profiles').select('id, user_type').limit(5);
  console.log('Users:', users);
}

main().catch(console.error);
