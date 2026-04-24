import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzdiajzkshoxygtcueoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGlhanprc2hveHlndGN1ZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxOTAwMSwiZXhwIjoyMDkyMzk1MDAxfQ.adZi2lbg6UCSgoNj4cC6HJGxlSJ5aA1ISEJZ3WzeZNI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching auth.users for juliana...');
  
  // Find Juliana's auth user
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  const juliana = authUsers.users.find(u => u.email === 'julianagouveiasantos26@gmail.com');
  
  if (!juliana) {
    console.log('User juliana not found in auth.users!');
    return;
  }
  
  console.log('Found Juliana:', juliana.id);
  
  // Try to insert into public.User
  const { error: insertError } = await supabase.from('User').insert({
    id: juliana.id,
    email: juliana.email,
    name: juliana.user_metadata?.full_name || 'Juliana Gouveia'
  });
  
  if (insertError) {
    if (insertError.code === '23505') {
      console.log('User already exists in public.User.');
    } else {
      console.error('Failed to insert into public.User:', insertError);
    }
  } else {
    console.log('Successfully inserted Juliana into public.User!');
  }
  
  // Verify
  const { data: profile } = await supabase.from('User').select('*').eq('id', juliana.id).single();
  console.log('Profile now is:', profile);
}

run();
