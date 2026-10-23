select email, role
from public.profiles;
update public.profiles
set role = 'admin'
where lower(email) = lower('adminecoguard@gmail.com');