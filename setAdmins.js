const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setAdmins() {
  const emails = ['xalm3shix@gmail.com', 'mohammed1399.tt@gmail.com'];
  
  for (const email of emails) {
    // get user by email is hard directly via profile if we don't have email in profiles, 
    // wait, we can get user by email from auth.users using admin api
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error(userError);
      continue;
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log(`User ${email} not found.`);
      continue;
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);
      
    if (updateError) {
      console.error(`Error updating ${email}:`, updateError);
    } else {
      console.log(`Successfully made ${email} an admin!`);
    }
  }
}

setAdmins();
