import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzdiajzkshoxygtcueoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGlhanprc2hveHlndGN1ZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgxOTAwMSwiZXhwIjoyMDkyMzk1MDAxfQ.adZi2lbg6UCSgoNj4cC6HJGxlSJ5aA1ISEJZ3WzeZNI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching roles...');
  const { data: roles, error: rolesErr } = await supabase.from('Role').select('*');
  console.log('Roles:', roles, rolesErr);

  console.log('Fetching users...');
  const { data: users, error: usersErr } = await supabase.from('User').select('*');
  console.log('Users:', users, usersErr);

  if (users && users.length > 0 && (!roles || roles.length === 0)) {
    console.log('Creating Admin role and assigning to user...');
    const user = users[0];
    
    const { data: newRole, error: roleCreateErr } = await supabase.from('Role').insert([{
      name: 'Administrador Global',
      isAdmin: true,
      permissions: {},
      organizationId: user.organizationId
    }]).select().single();

    console.log('Role creation result:', newRole, roleCreateErr);

    if (newRole) {
      const { error: updateErr } = await supabase.from('User').update({ roleId: newRole.id }).eq('id', user.id);
      console.log('User update result:', updateErr);
    }
  }
}

run();
