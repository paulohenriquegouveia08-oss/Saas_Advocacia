import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzdiajzkshoxygtcueoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGlhanprc2hveHlndGN1ZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxOTAwMSwiZXhwIjoyMDkyMzk1MDAxfQ.adZi2lbg6UCSgoNj4cC6HJGxlSJ5aA1ISEJZ3WzeZNI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all roles...');
  const { data: roles, error: rolesErr } = await supabase.from('Role').select('*');
  console.log('Roles in DB:', roles);
  if (rolesErr) console.error(rolesErr);
}

run();
