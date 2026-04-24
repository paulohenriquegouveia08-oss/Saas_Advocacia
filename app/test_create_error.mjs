import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzdiajzkshoxygtcueoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFub24iLCJpYXQiOjE3NzY4MTkwMDEsImV4cCI6MjA5MjM5NTAwMX0.5VkL7QVEz3cA84eVKtv6aMPk4Y81MnYPEzWEHdU5X5Y';
const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGlhanprc2hveHlndGN1ZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxOTAwMSwiZXhwIjoyMDkyMzk1MDAxfQ.adZi2lbg6UCSgoNj4cC6HJGxlSJ5aA1ISEJZ3WzeZNI');

async function run() {
  console.log('Testing setup_first_access for teste@teste.com...');
  
  // Set teste@teste.com to firstAccess = true temporarily
  await supabaseService.from('User').update({ firstAccess: true }).eq('email', 'teste@teste.com');
  
  const { data, error } = await supabase.rpc('setup_first_access', {
    p_email: 'teste@teste.com',
    p_new_password: '123'
  });
  
  console.log('RPC setup_first_access Result:', data);
  console.log('RPC setup_first_access Error:', error);
}

run();
