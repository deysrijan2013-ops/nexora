/* Bizora auth reliability layer */
(() => {
  const form = document.querySelector('#authForm');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const nameInput = document.querySelector('#name');
  const nameRow = document.querySelector('#nameRow');
  const submit = document.querySelector('#authSubmit');
  const switchBtn = document.querySelector('#switchAuth');
  const msgBox = document.querySelector('#authMsg');
  if (!form || !window.supabase) return;

  const client = window.__bizoraSupabase || null;
  // app.js exposes its client only in this replacement layer when available.
  // Fall back to the same public project configuration used by Bizora.
  const sb = client || window.supabase.createClient(
    'https://jppjmebhbslyivzjhezy.supabase.co',
    'sb_publishable_Ts9c4GRcwl6DDc0xflH8wg_ck_jK_ad'
  );

  const setMsg = (text, ok = false) => {
    msgBox.textContent = text || '';
    msgBox.dataset.ok = ok ? '1' : '0';
    msgBox.style.color = ok ? 'var(--good)' : '';
  };

  const normalizeEmail = () => (emailInput.value || '').trim().toLowerCase();
  const redirectUrl = () => `${location.origin}${location.pathname}`;

  let signupMode = false;

  const syncMode = () => {
    signupMode = !nameRow.classList.contains('hidden');
    form.dataset.mode = signupMode ? 'signup' : 'signin';
    submit.textContent = signupMode ? 'Create account' : 'Sign in';
    switchBtn.textContent = signupMode ? 'Already have an account? Sign in' : 'Create a new account';
  };

  switchBtn.onclick = () => {
    nameRow.classList.toggle('hidden');
    document.querySelector('#authTitle').textContent = nameRow.classList.contains('hidden') ? 'Welcome back' : 'Create your workspace';
    document.querySelector('#authSub').textContent = nameRow.classList.contains('hidden') ? 'Sign in to your workspace.' : 'Start managing your business.';
    syncMode();
    setMsg('');
  };

  const showRecovery = () => {
    const email = normalizeEmail();
    if (!email) {
      setMsg('Enter your email address first, then use password recovery.');
      emailInput.focus();
      return;
    }
    setMsg('Sending a password reset email...');
    sb.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() }).then(({ error }) => {
      if (error) return setMsg(error.message);
      setMsg('Password reset email sent. Check your inbox and set a new password.', true);
    });
  };

  let recoveryBtn = document.querySelector('#forgotPassword');
  if (!recoveryBtn) {
    recoveryBtn = document.createElement('button');
    recoveryBtn.type = 'button';
    recoveryBtn.id = 'forgotPassword';
    recoveryBtn.className = 'link';
    recoveryBtn.textContent = 'Forgot password / Set password';
    submit.insertAdjacentElement('afterend', recoveryBtn);
  }
  recoveryBtn.onclick = showRecovery;

  form.onsubmit = async (event) => {
    event.preventDefault();
    setMsg('');
    const email = normalizeEmail();
    const password = passwordInput.value;
    if (!email || !password) {
      setMsg('Enter your email and password.');
      return;
    }

    submit.disabled = true;
    submit.textContent = signupMode ? 'Creating account…' : 'Signing in…';
    try {
      if (signupMode) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: (nameInput.value || '').trim() },
            emailRedirectTo: redirectUrl()
          }
        });
        if (error) throw error;
        if (data.session) {
          setMsg('Account created. Signing you in…', true);
          return;
        }
        setMsg('Account created. Check your email to confirm your account, then sign in.', true);
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error('Sign-in succeeded but no session was returned. Please try again.');
        setMsg('Signed in. Loading your workspace…', true);
        location.reload();
      }
    } catch (error) {
      const code = error?.code || error?.error_code || '';
      const message = error?.message || 'Unable to sign in.';
      if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
        setMsg('Invalid email/password. If this account was created with Google, click Google instead. To use email/password for that same account, use “Forgot password / Set password” first.');
      } else if (code === 'email_not_confirmed' || /email.*not confirmed/i.test(message)) {
        setMsg('Your email is not verified yet. Open the confirmation email from Supabase, verify it, then sign in again.');
      } else {
        setMsg(message);
      }
    } finally {
      submit.disabled = false;
      syncMode();
    }
  };

  document.querySelectorAll('[data-oauth]').forEach(button => {
    button.onclick = async () => {
      setMsg('Opening Google/GitHub sign-in…');
      const provider = button.dataset.oauth;
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl() } });
      if (error) setMsg(error.message);
    };
  });

  syncMode();
})();
