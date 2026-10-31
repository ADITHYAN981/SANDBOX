/**
 * Brightloop Software — Odoo Enterprise Subscription & Billing Engine
 * Unified platform running plans, quotes, subscriptions, billing day batches, and financial reporting.
 */

// =============================================================================
// ██╗      ██████╗  ██████╗ ██╗███╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
// ██║     ██╔═══██╗██╔════╝ ██║████╗  ██║    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
// ██║     ██║   ██║██║  ███╗██║██╔██╗ ██║    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
// ██║     ██║   ██║██║   ██║██║██║╚██╗██║    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
// ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
// =============================================================================

// =============================================================================
// MASTER CREDENTIALS — No database, hardcoded
// =============================================================================
// Role      | Email                    | Password
// ----------|--------------------------|------------------
// Admin     | admin@brightloop.com     | Admin@2024!
// Employee  | employee@brightloop.com  | Employee@2024!
// Users     | Register freely on the User tab
// =============================================================================

const MASTER_USERS = {
  admin: {
    email: 'admin@brightloop.com',
    password: 'Admin@2024!',
    name: 'Sarah Jenkins',
    title: 'System Administrator',
    role: 'admin',
    initials: 'SJ'
  },
  employee: {
    email: 'employee@brightloop.com',
    password: 'Employee@2024!',
    name: 'Alex Rivera',
    title: 'Sales & Billing Specialist',
    role: 'staff',
    initials: 'AR'
  }
};

// Registered users stored in localStorage
const USERS_STORAGE_KEY = 'brightloop_registered_users_v1';

let _loginRoleTab = 'admin'; // active tab: 'admin' | 'employee' | 'user'
let _sessionUser  = null;    // currently logged-in session

// =============================================================================
// HELPERS
// =============================================================================

function getRegisteredUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || []; }
  catch(e) { return []; }
}

function saveRegisteredUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatMoney(n) {
  return '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[!@#$%^&*]/.test(pw)) return 'Password must contain at least one special character (!@#$%^&*).';
  return null;
}

// =============================================================================
// TAB SWITCHING
// =============================================================================

function switchLoginRole(role) {
  _loginRoleTab = role;

  // Update tab button active states
  document.querySelectorAll('.login-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTab = document.getElementById('tab-' + role);
  if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-selected', 'true'); }

  // Show/hide panels
  ['admin', 'employee', 'user'].forEach(r => {
    const panel = document.getElementById('panel-' + r);
    if (panel) panel.classList.toggle('hidden', r !== role);
  });

  // Fill master credential hints
  if (role === 'admin') {
    const u = MASTER_USERS.admin;
    const el = document.getElementById('admin-hint-cred');
    if (el) el.innerHTML = 'Email &nbsp;&nbsp;&nbsp;: ' + u.email + '<br>Password : ' + u.password;
    const emailEl = document.getElementById('admin-email');
    const passEl  = document.getElementById('admin-password');
    if (emailEl) emailEl.value = u.email;
    if (passEl)  passEl.value  = u.password;
  } else if (role === 'employee') {
    const u = MASTER_USERS.employee;
    const el = document.getElementById('employee-hint-cred');
    if (el) el.innerHTML = 'Email &nbsp;&nbsp;&nbsp;: ' + u.email + '<br>Password : ' + u.password;
    const emailEl = document.getElementById('employee-email');
    const passEl  = document.getElementById('employee-password');
    if (emailEl) emailEl.value = u.email;
    if (passEl)  passEl.value  = u.password;
  }

  // Clear all error messages
  ['admin-error-msg','employee-error-msg','user-login-error','user-register-error','user-register-success']
    .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
}

function switchUserSubTab(sub) {
  document.querySelectorAll('.user-subtab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('subtab-' + sub);
  if (btn) btn.classList.add('active');

  const loginPanel = document.getElementById('user-login-panel');
  const regPanel   = document.getElementById('user-register-panel');
  if (loginPanel) loginPanel.classList.toggle('hidden', sub !== 'login');
  if (regPanel)   regPanel.classList.toggle('hidden', sub !== 'register');

  ['user-login-error','user-register-error','user-register-success']
    .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
}

// =============================================================================
// MASTER LOGIN  (Admin / Employee)
// =============================================================================

function handleMasterLogin(e, role) {
  e.preventDefault();
  const emailInput = document.getElementById(role + '-email').value.trim().toLowerCase();
  const passInput  = document.getElementById(role + '-password').value;
  const errEl      = document.getElementById(role + '-error-msg');
  const btnEl      = document.getElementById(role + '-submit-btn');

  errEl.textContent = '';

  const master = MASTER_USERS[role];
  if (!master || master.email.toLowerCase() !== emailInput || master.password !== passInput) {
    errEl.textContent = '✕ Incorrect master credentials. Please try again.';
    return;
  }

  // Success animation
  btnEl.textContent = '✓ Welcome, ' + master.name + '!';
  btnEl.style.background = 'linear-gradient(135deg, #10b981, #059669)';

  setTimeout(() => {
    _sessionUser = { ...master };
    revealMainApp(_sessionUser);
  }, 750);
}

// =============================================================================
// USER REGISTER
// =============================================================================

function handleUserRegister(e) {
  e.preventDefault();
  const name    = document.getElementById('reg-name').value.trim();
  const company = document.getElementById('reg-company').value.trim();
  const email   = document.getElementById('reg-email').value.trim().toLowerCase();
  const password= document.getElementById('reg-password').value;
  const errEl   = document.getElementById('user-register-error');
  const sucEl   = document.getElementById('user-register-success');
  const btnEl   = document.getElementById('user-register-btn');

  errEl.textContent = '';
  sucEl.textContent = '';

  // Validate password strength
  const pwErr = validatePassword(password);
  if (pwErr) { errEl.textContent = '✕ ' + pwErr; return; }

  // Check if email already exists
  const users = getRegisteredUsers();
  if (users.find(u => u.email === email)) {
    errEl.textContent = '✕ An account with this email already exists. Please sign in.';
    return;
  }

  // Register user
  const newUser = {
    id: 'usr_reg_' + Date.now(),
    name,
    company,
    email,
    password, // NOTE: plain-text is fine for this no-backend demo
    role: 'customer',
    initials: getInitials(name),
    registeredAt: new Date().toISOString()
  };
  users.push(newUser);
  saveRegisteredUsers(users);

  btnEl.textContent = '✓ Account created!';
  btnEl.style.background = 'linear-gradient(135deg,#10b981,#059669)';
  sucEl.textContent = '🎉 Registration successful! Redirecting to your portal...';

  setTimeout(() => {
    _sessionUser = newUser;
    revealUserPortal(newUser);
    // Reset button
    btnEl.textContent = '✨ Create Account';
    btnEl.style.background = '';
  }, 1200);
}

// =============================================================================
// USER LOGIN
// =============================================================================

function handleUserLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('user-login-email').value.trim().toLowerCase();
  const password = document.getElementById('user-login-password').value;
  const errEl    = document.getElementById('user-login-error');
  const btnEl    = document.getElementById('user-login-btn');

  errEl.textContent = '';

  const users = getRegisteredUsers();
  const found = users.find(u => u.email === email && u.password === password);

  if (!found) {
    errEl.textContent = '✕ Invalid email or password. Register if you don\'t have an account.';
    return;
  }

  btnEl.textContent = '✓ Welcome, ' + found.name + '!';
  btnEl.style.background = 'linear-gradient(135deg,#10b981,#059669)';

  setTimeout(() => {
    _sessionUser = found;
    revealUserPortal(found);
    btnEl.textContent = '🚀 Sign In to Portal';
    btnEl.style.background = '';
  }, 750);
}

// =============================================================================
// REVEAL MAIN APP  (Admin / Employee)
// =============================================================================

function revealMainApp(user) {
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.transition = 'opacity 0.4s ease';
  loginScreen.style.opacity = '0';

  setTimeout(() => {
    loginScreen.style.display = 'none';

    // Sync state.currentUser inside the IIFE
    if (window._brightloopState) {
      window._brightloopState.currentUser = {
        id:    user.role === 'admin' ? 'usr_admin' : 'usr_staff_1',
        name:  user.name,
        email: user.email,
        role:  user.role,
        title: user.title
      };
    }

    updateNavUserWidget(user);
    applyLoginRoleRestrictions(user.role);

    if (typeof window.applyRolePermissions === 'function') {
      window.applyRolePermissions();
    }
  }, 420);
}

// =============================================================================
// REVEAL USER PORTAL
// =============================================================================

function revealUserPortal(user) {
  const loginScreen = document.getElementById('login-screen');
  const portal      = document.getElementById('user-portal');

  loginScreen.style.transition = 'opacity 0.4s ease';
  loginScreen.style.opacity = '0';

  setTimeout(() => {
    loginScreen.style.display = 'none';
    portal.classList.remove('hidden');

    // Populate portal header
    const avatarEl = document.getElementById('portal-avatar');
    if (avatarEl) {
      avatarEl.textContent = user.initials || getInitials(user.name);
    }
    const nameEl = document.getElementById('portal-user-name');
    if (nameEl) nameEl.textContent = user.name;

    const compEl = document.getElementById('portal-user-company');
    if (compEl) compEl.textContent = user.company || user.email;

    const headEl = document.getElementById('portal-welcome-heading');
    if (headEl) headEl.textContent = 'Welcome back, ' + user.name.split(' ')[0] + '! 👋';

    const subEl = document.getElementById('portal-welcome-sub');
    if (subEl) subEl.textContent = (user.company ? user.company + ' · ' : '') + 'Your Brightloop customer portal.';

    // Populate portal stats from app state
    populateUserPortalData(user);
  }, 420);
}

function populateUserPortalData(user) {
  const state = window._brightloopState;
  if (!state) {
    document.getElementById('portal-sub-count').textContent    = '0';
    document.getElementById('portal-inv-count').textContent    = '0';
    document.getElementById('portal-paid-total').textContent   = '$0.00';
    document.getElementById('portal-overdue-total').textContent= '$0.00';
    return;
  }

  const email   = user.email.toLowerCase();
  const company = (user.company || '').toLowerCase();

  // Match subscriptions by customer email OR company name
  const mySubs = state.subscriptions.filter(s =>
    (s.customerEmail && s.customerEmail.toLowerCase() === email) ||
    (s.customer && s.customer.toLowerCase() === company)
  );
  const myInvs = state.invoices.filter(i =>
    (i.customerEmail && i.customerEmail.toLowerCase() === email) ||
    (i.customer && i.customer.toLowerCase() === company)
  );

  const activeSubs = mySubs.filter(s => s.stage === 'Active').length;
  let paid    = 0;
  let overdue = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  myInvs.forEach(inv => {
    if (inv.status === 'Paid') {
      paid += inv.total || 0;
    } else if (inv.status === 'Confirmed' && inv.dueDate && inv.dueDate < todayStr) {
      overdue += inv.total || 0;
    }
  });

  document.getElementById('portal-sub-count').textContent    = activeSubs;
  document.getElementById('portal-inv-count').textContent    = myInvs.length;
  document.getElementById('portal-paid-total').textContent   = formatMoney(paid);
  document.getElementById('portal-overdue-total').textContent= formatMoney(overdue);

  // Invoice table
  const tbody  = document.getElementById('portal-invoices-tbody');
  const badge  = document.getElementById('portal-inv-badge');
  if (badge) badge.textContent = myInvs.length + ' record' + (myInvs.length !== 1 ? 's' : '');

  if (tbody) {
    if (myInvs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.3);border-color:rgba(255,255,255,0.05);">No invoices found for your account.</td></tr>';
    } else {
      tbody.innerHTML = myInvs.slice(0, 10).map(inv => {
        const statusColors = {
          'Paid':      '#34d399',
          'Confirmed': '#93c5fd',
          'Draft':     '#94a3b8',
          'Cancelled': '#f87171'
        };
        const col = statusColors[inv.status] || '#94a3b8';
        return `<tr>
          <td style="color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.06);font-family:var(--font-mono);font-weight:600;">${inv.id}</td>
          <td style="color:rgba(255,255,255,0.6);border-color:rgba(255,255,255,0.06);">${inv.date || '—'}</td>
          <td style="color:rgba(255,255,255,0.6);border-color:rgba(255,255,255,0.06);">${inv.subRef || '—'}</td>
          <td style="color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.06);font-family:var(--font-mono);font-weight:700;">${formatMoney(inv.total)}</td>
          <td style="border-color:rgba(255,255,255,0.06);"><span style="background:${col}22;color:${col};padding:.2rem .65rem;border-radius:999px;font-size:.72rem;font-weight:700;text-transform:uppercase;">${inv.status}</span></td>
        </tr>`;
      }).join('');
    }
  }
}

// =============================================================================
// NAV USER WIDGET  (Admin / Employee top-nav)
// =============================================================================

function updateNavUserWidget(user) {
  const avatarEl = document.getElementById('nav-user-avatar');
  const nameEl   = document.getElementById('nav-user-name');
  const roleEl   = document.getElementById('nav-user-role');

  if (avatarEl) {
    avatarEl.textContent = user.initials || getInitials(user.name);
    avatarEl.className   = 'nav-user-avatar role-' + (user.role === 'admin' ? 'admin' : 'staff');
  }
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) {
    roleEl.textContent = user.role === 'admin' ? '👑 Administrator' : '💼 Employee';
    roleEl.className   = 'nav-user-role role-' + (user.role === 'admin' ? 'admin' : 'staff');
  }
}

// =============================================================================
// ROLE RESTRICTIONS  (Admin vs Employee for main app)
// =============================================================================

function applyLoginRoleRestrictions(role) {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (role === 'admin') ? '' : 'none';
  });
  document.querySelectorAll('.employee-only').forEach(el => {
    el.style.display = (role === 'staff') ? '' : 'none';
  });
}

// =============================================================================
// LOGOUT
// =============================================================================

function handleLogout() {
  _sessionUser = null;

  // Hide portal if visible
  const portal = document.getElementById('user-portal');
  if (portal) portal.classList.add('hidden');

  // Reset main app nav widget
  ['nav-user-avatar','nav-user-name','nav-user-role'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = id === 'nav-user-avatar' ? '?' : '—'; el.className = id; }
  });

  // Show login screen with fade-in
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.display  = 'flex';
  loginScreen.style.opacity  = '0';
  loginScreen.style.transition = 'opacity 0.35s ease';
  requestAnimationFrame(() => requestAnimationFrame(() => { loginScreen.style.opacity = '1'; }));

  // Reset all forms and errors
  ['admin-login-form','employee-login-form','user-login-form','user-register-form']
    .forEach(id => { const f = document.getElementById(id); if (f) f.reset(); });
  ['admin-error-msg','employee-error-msg','user-login-error','user-register-error','user-register-success']
    .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });

  // Reset submit buttons
  const btns = [
    { id: 'admin-submit-btn',    text: '🔐 Sign In as Admin' },
    { id: 'employee-submit-btn', text: '🔐 Sign In as Employee' },
    { id: 'user-login-btn',      text: '🚀 Sign In to Portal' },
    { id: 'user-register-btn',   text: '✨ Create Account' }
  ];
  btns.forEach(b => {
    const el = document.getElementById(b.id);
    if (el) { el.textContent = b.text; el.style.background = ''; }
  });

  // Default to admin tab
  switchLoginRole('admin');
}

// =============================================================================
// BOOT
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
  switchLoginRole('admin');
  switchUserSubTab('login');
});


(function () {
  'use strict';

  // =========================================================================
  // 1. DATA STORE INITIALIZATION
  // =========================================================================

  const STORAGE_KEY = 'brightloop_platform_state_v1';

  // Seed Data: Users & Roles
  const INITIAL_USERS = [
    {
      id: 'usr_admin',
      name: 'Sarah Jenkins',
      email: 'sarah@brightloop.com',
      role: 'admin',
      title: 'System Administrator'
    },
    {
      id: 'usr_staff_1',
      name: 'Alex Rivera',
      email: 'alex@brightloop.com',
      role: 'staff',
      title: 'Sales & Billing Specialist'
    },
    {
      id: 'usr_cust_apex',
      name: 'Apex Digital LLC',
      email: 'contact@apexdigital.com',
      role: 'customer',
      company: 'Apex Digital LLC'
    },
    {
      id: 'usr_cust_nova',
      name: 'Nova Retail Corp',
      email: 'billing@novaretail.com',
      role: 'customer',
      company: 'Nova Retail Corp'
    },
    {
      id: 'usr_cust_zenith',
      name: 'Zenith Logistics',
      email: 'finance@zenithlog.com',
      role: 'customer',
      company: 'Zenith Logistics'
    }
  ];

  // Seed Products with Variants (including Odoo Brand +$560 surcharge as specified!)
  const INITIAL_PRODUCTS = [
    {
      id: 'prod_erp',
      name: 'Brightloop Business ERP Suite',
      type: 'Software',
      salesPrice: 120.00,
      costPrice: 35.00,
      variants: [
        { name: 'Standard Edition', addPrice: 0.00 },
        { name: 'Odoo Brand Edition', addPrice: 560.00 }, // Specific PDF requirement!
        { name: 'Multi-Company Edition', addPrice: 280.00 }
      ],
      notes: 'Core business management, sales, and automated accounting'
    },
    {
      id: 'prod_crm',
      name: 'Automated CRM & Pipeline Add-on',
      type: 'Software',
      salesPrice: 45.00,
      costPrice: 12.00,
      variants: [
        { name: 'Default', addPrice: 0.00 },
        { name: 'With VoIP Dialer', addPrice: 35.00 }
      ],
      notes: 'Customer relationship tracking and deal pipeline automation'
    },
    {
      id: 'prod_storage',
      name: 'Cloud Storage 1TB Expansion',
      type: 'Service',
      salesPrice: 25.00,
      costPrice: 5.00,
      variants: [
        { name: '1TB Tier', addPrice: 0.00 },
        { name: '5TB Tier', addPrice: 75.00 }
      ],
      notes: 'High-speed encrypted document and database storage'
    },
    {
      id: 'prod_support',
      name: 'Priority 24/7 SLA Support',
      type: 'Service',
      salesPrice: 150.00,
      costPrice: 40.00,
      variants: [
        { name: 'Standard SLA', addPrice: 0.00 },
        { name: 'Dedicated Engineer SLA', addPrice: 200.00 }
      ],
      notes: '15-minute guaranteed response time and hotline'
    }
  ];

  // Seed Billing Frequency Plans
  const INITIAL_PLANS = [
    {
      id: 'plan_monthly',
      name: 'Standard Monthly Plan',
      frequency: 'Monthly',
      multiplierMonths: 1,
      minQty: 1,
      autoClose: false,
      allowPauseRenew: true
    },
    {
      id: 'plan_yearly',
      name: 'Annual Enterprise Contract',
      frequency: 'Yearly',
      multiplierMonths: 12,
      minQty: 1,
      autoClose: false,
      allowPauseRenew: true
    },
    {
      id: 'plan_quarterly',
      name: 'Quarterly Growth Plan',
      frequency: 'Quarterly',
      multiplierMonths: 3,
      minQty: 1,
      autoClose: false,
      allowPauseRenew: true
    },
    {
      id: 'plan_weekly',
      name: 'Weekly High-Compute Burst',
      frequency: 'Weekly',
      multiplierMonths: 0.25,
      minQty: 1,
      autoClose: true,
      allowPauseRenew: true
    }
  ];

  // Seed Tax Rules
  const INITIAL_TAXES = [
    { id: 'tax_std', name: 'Standard Sales Tax (10%)', rate: 0.10, desc: 'Domestic business services' },
    { id: 'tax_vat', name: 'EU VAT (20%)', rate: 0.20, desc: 'European digital software service VAT' },
    { id: 'tax_zero', name: 'Zero-Rated / Export (0%)', rate: 0.00, desc: 'International tax exempt contracts' }
  ];

  // Seed Discount Rules (Admin created per Scenario 5)
  const INITIAL_DISCOUNTS = [
    {
      id: 'disc_vol15',
      name: 'Volume Seat Discount 15%',
      type: 'percent',
      value: 15,
      minSpend: 150.00,
      usageLimit: 20,
      usedCount: 3,
      status: 'active'
    },
    {
      id: 'disc_annual50',
      name: 'Annual Switch $50 Credit',
      type: 'fixed',
      value: 50.00,
      minSpend: 500.00,
      usageLimit: 10,
      usedCount: 2,
      status: 'active'
    }
  ];

  // Pre-configured Quotation Templates (per Scenario 3)
  const INITIAL_TEMPLATES = [
    {
      id: 'tmpl_starter',
      name: 'Small Shop Starter Bundle',
      planId: 'plan_monthly',
      validDays: 15,
      lines: [
        { productId: 'prod_erp', variantName: 'Standard Edition', qty: 2, unitPrice: 120.00, taxId: 'tax_std' },
        { productId: 'prod_storage', variantName: '1TB Tier', qty: 1, unitPrice: 25.00, taxId: 'tax_std' }
      ]
    },
    {
      id: 'tmpl_odoo_ent',
      name: 'Enterprise Odoo Edition Suite',
      planId: 'plan_yearly',
      validDays: 30,
      lines: [
        { productId: 'prod_erp', variantName: 'Odoo Brand Edition', qty: 5, unitPrice: 680.00, taxId: 'tax_std' }, // $120 + $560
        { productId: 'prod_support', variantName: 'Standard SLA', qty: 1, unitPrice: 150.00, taxId: 'tax_std' }
      ]
    }
  ];

  function getDaysFromToday(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // Initial Pre-loaded Subscriptions
  const INITIAL_SUBSCRIPTIONS = [
    {
      id: 'SUB-00101',
      customer: 'Apex Digital LLC',
      customerEmail: 'contact@apexdigital.com',
      planId: 'plan_monthly',
      startDate: getDaysFromToday(-60),
      nextBillingDate: getDaysFromToday(-1), // Due for billing day!
      expiryDate: getDaysFromToday(305),
      paymentTerms: 'Immediate Payment',
      discountId: 'disc_vol15',
      stage: 'Active', // Draft | Quotation | Confirmed | Active | Paused | Closed
      lines: [
        {
          productName: 'Brightloop Business ERP Suite',
          variantName: 'Odoo Brand Edition',
          qty: 2,
          unitPrice: 680.00, // $120 base + $560 Odoo brand variant
          taxRate: 0.10
        },
        {
          productName: 'Automated CRM & Pipeline Add-on',
          variantName: 'Default',
          qty: 2,
          unitPrice: 45.00,
          taxRate: 0.10
        }
      ]
    },
    {
      id: 'SUB-00102',
      customer: 'Nova Retail Corp',
      customerEmail: 'billing@novaretail.com',
      planId: 'plan_yearly',
      startDate: getDaysFromToday(-30),
      nextBillingDate: getDaysFromToday(335),
      expiryDate: getDaysFromToday(335),
      paymentTerms: 'Net 30 Days',
      discountId: 'disc_annual50',
      stage: 'Active',
      lines: [
        {
          productName: 'Brightloop Business ERP Suite',
          variantName: 'Standard Edition',
          qty: 10,
          unitPrice: 120.00,
          taxRate: 0.10
        },
        {
          productName: 'Priority 24/7 SLA Support',
          variantName: 'Standard SLA',
          qty: 1,
          unitPrice: 150.00,
          taxRate: 0.10
        }
      ]
    },
    {
      id: 'SUB-00103',
      customer: 'Zenith Logistics',
      customerEmail: 'finance@zenithlog.com',
      planId: 'plan_monthly',
      startDate: getDaysFromToday(-5),
      nextBillingDate: getDaysFromToday(25),
      expiryDate: getDaysFromToday(10),
      paymentTerms: 'Net 15 Days',
      discountId: '',
      stage: 'Quotation', // Quote stage
      lines: [
        {
          productName: 'Brightloop Business ERP Suite',
          variantName: 'Multi-Company Edition',
          qty: 4,
          unitPrice: 400.00,
          taxRate: 0.10
        }
      ]
    }
  ];

  // Initial Invoices
  const INITIAL_INVOICES = [
    {
      id: 'INV-2026-001',
      subId: 'SUB-00101',
      customer: 'Apex Digital LLC',
      customerEmail: 'contact@apexdigital.com',
      date: getDaysFromToday(-31),
      dueDate: getDaysFromToday(-15),
      subtotal: 1450.00,
      tax: 145.00,
      discountVal: 217.50,
      total: 1377.50,
      status: 'Paid', // Draft | Confirmed | Paid | Cancelled
      lines: [
        { desc: 'Brightloop Business ERP Suite (Odoo Brand Edition) x 2', amount: 1360.00 },
        { desc: 'Automated CRM & Pipeline Add-on x 2', amount: 90.00 }
      ]
    },
    {
      id: 'INV-2026-002',
      subId: 'SUB-00102',
      customer: 'Nova Retail Corp',
      customerEmail: 'billing@novaretail.com',
      date: getDaysFromToday(-10),
      dueDate: getDaysFromToday(-2), // Overdue!
      subtotal: 1350.00,
      tax: 135.00,
      discountVal: 50.00,
      total: 1435.00,
      status: 'Confirmed', // Awaiting payment / Overdue
      lines: [
        { desc: 'Brightloop Business ERP Suite (Standard Edition) x 10', amount: 1200.00 },
        { desc: 'Priority 24/7 SLA Support x 1', amount: 150.00 }
      ]
    }
  ];

  // Initial Payments
  const INITIAL_PAYMENTS = [
    {
      id: 'PAY-89101',
      invoiceId: 'INV-2026-001',
      customer: 'Apex Digital LLC',
      method: 'Bank Wire',
      date: getDaysFromToday(-20),
      amount: 1377.50,
      note: 'Wire confirmation #TX-98442'
    }
  ];

  // Platform State Container
  let state = {
    currentUser: INITIAL_USERS[0], // default: admin (will be overridden by login)
    users: INITIAL_USERS,
    products: INITIAL_PRODUCTS,
    plans: INITIAL_PLANS,
    taxes: INITIAL_TAXES,
    discounts: INITIAL_DISCOUNTS,
    templates: INITIAL_TEMPLATES,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    invoices: INITIAL_INVOICES,
    payments: INITIAL_PAYMENTS,
    activeTab: 'dashboard',
    activeSubDetailId: null,
    activeInvoiceDetailId: null
  };

  // Expose state to the global login system so it can switch currentUser
  window._brightloopState = state;

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      } catch (e) {
        console.warn('Error loading stored state, using defaults');
      }
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // =========================================================================
  // 2. REVENUE & FINANCIAL CALCULATION ENGINE
  // =========================================================================

  function calculateSubTotals(sub) {
    let subtotal = 0;
    let taxTotal = 0;

    sub.lines.forEach(l => {
      const lineSub = (parseFloat(l.unitPrice) || 0) * (parseInt(l.qty) || 1);
      subtotal += lineSub;
      taxTotal += lineSub * (parseFloat(l.taxRate) || 0);
    });

    let discountVal = 0;
    if (sub.discountId) {
      const disc = state.discounts.find(d => d.id === sub.discountId);
      if (disc && disc.status === 'active') {
        if (!disc.minSpend || subtotal >= disc.minSpend) {
          if (disc.type === 'percent') {
            discountVal = subtotal * (disc.value / 100);
          } else {
            discountVal = Math.min(subtotal, disc.value);
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discountVal + taxTotal);
    return { subtotal, discountVal, taxTotal, total };
  }

  function calculateMonthlyNormalized(sub) {
    if (sub.stage !== 'Active') return 0;
    const { total } = calculateSubTotals(sub);
    const plan = state.plans.find(p => p.id === sub.planId);
    if (!plan) return total;

    switch (plan.frequency) {
      case 'Yearly':
        return total / 12;
      case 'Quarterly':
        return total / 3;
      case 'Weekly':
        return total * 4.33;
      case 'Daily':
        return total * 30;
      case 'Monthly':
      default:
        return total;
    }
  }

  function formatMoney(amount) {
    return '$' + (amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // =========================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC)
  // =========================================================================

  function applyRolePermissions() {
    const role = state.currentUser.role;
    const staffTab = document.getElementById('staff-nav-tab');
    const discountsAdminActions = document.getElementById('discounts-admin-actions');
    const productsAdminActions = document.getElementById('products-admin-actions');
    const runBillingBtn = document.getElementById('run-billing-day-btn');
    const openNewSubBtn = document.getElementById('open-new-sub-modal-btn');

    if (role === 'customer') {
      // Customer Portal: strictly isolate view
      if (staffTab) staffTab.style.display = 'none';
      if (discountsAdminActions) discountsAdminActions.style.display = 'none';
      if (productsAdminActions) productsAdminActions.style.display = 'none';
      if (runBillingBtn) runBillingBtn.style.display = 'none';
      if (openNewSubBtn) openNewSubBtn.style.display = 'none';
    } else if (role === 'staff') {
      // Internal Staff: can manage subs and quotes, but cannot add staff members or master discounts
      if (staffTab) staffTab.style.display = 'none';
      if (discountsAdminActions) discountsAdminActions.style.display = 'none';
      if (productsAdminActions) productsAdminActions.style.display = 'none';
      if (runBillingBtn) runBillingBtn.style.display = 'inline-flex';
      if (openNewSubBtn) openNewSubBtn.style.display = 'inline-flex';
    } else {
      // Admin: full control
      if (staffTab) staffTab.style.display = 'inline-flex';
      if (discountsAdminActions) discountsAdminActions.style.display = 'inline-flex';
      if (productsAdminActions) productsAdminActions.style.display = 'inline-flex';
      if (runBillingBtn) runBillingBtn.style.display = 'inline-flex';
      if (openNewSubBtn) openNewSubBtn.style.display = 'inline-flex';
    }

    refreshAllViews();
  }

  // =========================================================================
  // 4. VIEW RENDERERS
  // =========================================================================

  function refreshAllViews() {
    renderDashboard();
    renderSubscriptionsTable();
    renderInvoicesTable();
    renderPaymentsTable();
    renderProductsAndPlans();
    renderDiscountsAndTaxes();
    renderStaffTable();
  }

  // --- View 1: Finance Lead Dashboard ---
  function renderDashboard() {
    let mrr = 0;
    let activeCount = 0;
    let quoteDraftCount = 0;

    const role = state.currentUser.role;
    const userEmail = state.currentUser.email;

    // Filter by customer if in customer portal role
    const filteredSubs = role === 'customer'
      ? state.subscriptions.filter(s => s.customerEmail === userEmail)
      : state.subscriptions;

    filteredSubs.forEach(s => {
      if (s.stage === 'Active') {
        activeCount++;
        mrr += calculateMonthlyNormalized(s);
      } else if (s.stage === 'Draft' || s.stage === 'Quotation' || s.stage === 'Confirmed') {
        quoteDraftCount++;
      }
    });

    const arr = mrr * 12;

    const filteredInvoices = role === 'customer'
      ? state.invoices.filter(i => i.customerEmail === userEmail)
      : state.invoices;

    let totalCollected = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    const overdueList = [];

    const todayStr = new Date().toISOString().split('T')[0];

    filteredInvoices.forEach(inv => {
      if (inv.status === 'Paid') {
        totalCollected += inv.total;
        paidCount++;
      } else if (inv.status === 'Confirmed') {
        if (inv.dueDate && inv.dueDate < todayStr) {
          totalOverdue += inv.total;
          overdueCount++;
          overdueList.push(inv);
        }
      }
    });

    document.getElementById('kpi-mrr').textContent = formatMoney(mrr);
    document.getElementById('kpi-arr').textContent = `Annual Run-rate: ${formatMoney(arr)}`;
    document.getElementById('kpi-active-subs').textContent = activeCount;
    document.getElementById('kpi-subs-ratio').textContent = `${quoteDraftCount} in quotation / draft`;
    document.getElementById('kpi-collected').textContent = formatMoney(totalCollected);
    document.getElementById('kpi-invoices-paid').textContent = `${paidCount} invoices settled`;
    document.getElementById('kpi-overdue').textContent = formatMoney(totalOverdue);
    document.getElementById('kpi-overdue-count').textContent = `${overdueCount} awaiting settlement`;
    document.getElementById('overdue-total-sum').textContent = formatMoney(totalOverdue);

    // Lifecycle breakdown counts
    const stages = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
    stages.forEach(st => {
      const match = filteredSubs.filter(s => s.stage === st);
      const countEl = document.getElementById(`stage-${st.toLowerCase()}-count`);
      const valEl = document.getElementById(`stage-${st.toLowerCase()}-val`);
      if (countEl) countEl.textContent = match.length;
      if (valEl) {
        let sum = 0;
        match.forEach(s => sum += calculateSubTotals(s).total);
        valEl.textContent = formatMoney(sum);
      }
    });
    document.getElementById('pipeline-total-badge').textContent = `${filteredSubs.length} Contracts Tracked`;

    // Overdue Table on Dashboard
    const overdueTbody = document.getElementById('dashboard-overdue-tbody');
    if (overdueTbody) {
      if (overdueList.length === 0) {
        overdueTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">✨ No overdue invoices! All payments are current.</td></tr>`;
      } else {
        overdueTbody.innerHTML = overdueList.map(inv => `
          <tr>
            <td class="font-mono"><strong>${inv.id}</strong></td>
            <td>${inv.customer}</td>
            <td class="text-danger font-mono">${inv.dueDate}</td>
            <td class="font-mono">${formatMoney(inv.total)}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="window.brightloopApp.openRecordPaymentFor('${inv.id}')">
                Collect Payment
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  // --- View 2: Subscriptions Table ---
  function renderSubscriptionsTable() {
    const tbody = document.getElementById('subscriptions-tbody');
    if (!tbody) return;

    const role = state.currentUser.role;
    const userEmail = state.currentUser.email;
    const stageFilter = document.getElementById('sub-filter-stage').value;
    const searchFilter = document.getElementById('sub-filter-search').value.toLowerCase().trim();

    let list = state.subscriptions;

    // Role filtering (Customer sees only their own subscriptions)
    if (role === 'customer') {
      list = list.filter(s => s.customerEmail === userEmail);
    }

    if (stageFilter !== 'all') {
      list = list.filter(s => s.stage === stageFilter);
    }

    if (searchFilter) {
      list = list.filter(s =>
        s.id.toLowerCase().includes(searchFilter) ||
        s.customer.toLowerCase().includes(searchFilter)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">No subscriptions found matching the selected criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(sub => {
      const plan = state.plans.find(p => p.id === sub.planId);
      const { total } = calculateSubTotals(sub);

      let stageClass = sub.stage.toLowerCase();
      if (sub.stage === 'Active') stageClass = 'active';

      return `
        <tr>
          <td class="font-mono"><strong>${sub.id}</strong></td>
          <td>${escapeHtml(sub.customer)}</td>
          <td>${plan ? plan.name : 'Custom Plan'} <span class="text-muted">(${plan ? plan.frequency : 'Monthly'})</span></td>
          <td class="font-mono">${sub.startDate || 'N/A'}</td>
          <td class="font-mono">${sub.nextBillingDate || 'N/A'}</td>
          <td>${sub.paymentTerms || 'Immediate'}</td>
          <td class="font-mono"><strong>${formatMoney(total)}</strong></td>
          <td><span class="status-tag ${stageClass}">${sub.stage}</span></td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="window.brightloopApp.viewSubscriptionDetail('${sub.id}')">
              View & Manage
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- View 3: Invoices Table ---
  function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;

    const role = state.currentUser.role;
    const userEmail = state.currentUser.email;
    const statusFilter = document.getElementById('inv-filter-status').value;
    const searchFilter = document.getElementById('inv-filter-search').value.toLowerCase().trim();

    let list = state.invoices;

    if (role === 'customer') {
      list = list.filter(i => i.customerEmail === userEmail);
    }

    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter);
    }

    if (searchFilter) {
      list = list.filter(i =>
        i.id.toLowerCase().includes(searchFilter) ||
        i.customer.toLowerCase().includes(searchFilter) ||
        (i.subId && i.subId.toLowerCase().includes(searchFilter))
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem; color:var(--text-muted);">No invoices found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(inv => {
      let statusClass = inv.status.toLowerCase();

      return `
        <tr>
          <td class="font-mono"><strong>${inv.id}</strong></td>
          <td class="font-mono">${inv.date}</td>
          <td>${escapeHtml(inv.customer)}</td>
          <td class="font-mono"><a href="javascript:void(0)" onclick="window.brightloopApp.viewSubscriptionDetail('${inv.subId}')">${inv.subId || 'N/A'}</a></td>
          <td class="font-mono">${inv.dueDate}</td>
          <td class="font-mono">${formatMoney(inv.subtotal)}</td>
          <td class="font-mono">${formatMoney(inv.tax)}</td>
          <td class="font-mono"><strong>${formatMoney(inv.total)}</strong></td>
          <td><span class="status-tag ${statusClass}">${inv.status}</span></td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="window.brightloopApp.viewInvoiceModal('${inv.id}')">
              View Invoice
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- View 4: Payments Table ---
  function renderPaymentsTable() {
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;

    const role = state.currentUser.role;
    const userEmail = state.currentUser.email;

    let list = state.payments;
    if (role === 'customer') {
      const myInvoices = state.invoices.filter(i => i.customerEmail === userEmail).map(i => i.id);
      list = list.filter(p => myInvoices.includes(p.invoiceId));
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No payments recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(pay => `
      <tr>
        <td class="font-mono"><strong>${pay.id}</strong></td>
        <td class="font-mono">${pay.invoiceId}</td>
        <td>${escapeHtml(pay.customer)}</td>
        <td>${pay.method}</td>
        <td class="font-mono">${pay.date}</td>
        <td class="font-mono text-success"><strong>${formatMoney(pay.amount)}</strong></td>
        <td class="text-muted">${escapeHtml(pay.note || '-')}</td>
      </tr>
    `).join('');
  }

  // --- View 5: Products & Plans Table ---
  function renderProductsAndPlans() {
    const prodTbody = document.getElementById('products-tbody');
    const plansTbody = document.getElementById('plans-tbody');

    if (prodTbody) {
      prodTbody.innerHTML = state.products.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span class="badge">${p.type}</span></td>
          <td class="font-mono">${formatMoney(p.salesPrice)}</td>
          <td class="font-mono text-muted">${formatMoney(p.costPrice)}</td>
          <td>
            ${p.variants && p.variants.length > 0
              ? p.variants.map(v => `<span class="badge" style="margin-right:4px;">${escapeHtml(v.name)} (+${formatMoney(v.addPrice)})</span>`).join('')
              : '<span class="text-muted">None</span>'}
          </td>
        </tr>
      `).join('');
    }

    if (plansTbody) {
      plansTbody.innerHTML = state.plans.map(pl => `
        <tr>
          <td><strong>${escapeHtml(pl.name)}</strong></td>
          <td><span class="status-tag quotation">${pl.frequency}</span></td>
          <td>${pl.minQty}</td>
          <td>${pl.autoClose ? 'Yes (Automatic)' : 'No (Manual / Open)'}</td>
          <td>${pl.allowPauseRenew ? 'Allowed' : 'Locked'}</td>
        </tr>
      `).join('');
    }
  }

  // --- View 6: Discounts & Taxes ---
  function renderDiscountsAndTaxes() {
    const discTbody = document.getElementById('discounts-tbody');
    const taxTbody = document.getElementById('taxes-tbody');

    if (discTbody) {
      discTbody.innerHTML = state.discounts.map(d => `
        <tr>
          <td><strong>${escapeHtml(d.name)}</strong></td>
          <td class="font-mono font-bold">${d.type === 'percent' ? d.value + '%' : formatMoney(d.value)}</td>
          <td>Whole Subscription</td>
          <td class="font-mono">${formatMoney(d.minSpend)}</td>
          <td>${d.usageLimit - d.usedCount} of ${d.usageLimit} remaining</td>
          <td><span class="status-tag active">${d.status}</span></td>
        </tr>
      `).join('');
    }

    if (taxTbody) {
      taxTbody.innerHTML = state.taxes.map(t => `
        <tr>
          <td><strong>${escapeHtml(t.name)}</strong></td>
          <td class="font-mono">${(t.rate * 100).toFixed(0)}%</td>
          <td class="text-muted">${escapeHtml(t.desc)}</td>
        </tr>
      `).join('');
    }
  }

  // --- View 7: Staff Management (Admin Only) ---
  function renderStaffTable() {
    const tbody = document.getElementById('staff-tbody');
    if (!tbody) return;

    const staffMembers = state.users.filter(u => u.role === 'admin' || u.role === 'staff');
    tbody.innerHTML = staffMembers.map(u => `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="status-tag ${u.role === 'admin' ? 'confirmed' : 'quotation'}">${u.role.toUpperCase()}</span></td>
        <td>${u.role === 'admin' ? 'Full Control + Staff Management + Pricing Master' : 'Day-to-day operations, Quotations, Invoicing & Payments'}</td>
        <td class="font-mono text-muted">2026-01-15</td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // 5. SCENARIO 4: BILLING DAY BATCH ENGINE
  // =========================================================================

  function runBillingDayBatch() {
    const today = new Date().toISOString().split('T')[0];
    let createdCount = 0;
    let skippedCount = 0;

    state.subscriptions.forEach(sub => {
      // Must be Active
      if (sub.stage !== 'Active') return;

      // Check if due on or before today
      if (sub.nextBillingDate && sub.nextBillingDate <= today) {
        // Idempotency: Prevent double billing for the same billing date!
        const existingInvoice = state.invoices.find(i => i.subId === sub.id && i.date === today);
        if (existingInvoice) {
          skippedCount++;
          return;
        }

        const { subtotal, discountVal, taxTotal, total } = calculateSubTotals(sub);

        const newInvoice = {
          id: `INV-2026-${String(state.invoices.length + 1).padStart(3, '0')}`,
          subId: sub.id,
          customer: sub.customer,
          customerEmail: sub.customerEmail,
          date: today,
          dueDate: getDaysFromToday(sub.paymentTerms === 'Net 30 Days' ? 30 : sub.paymentTerms === 'Net 15 Days' ? 15 : 7),
          subtotal,
          tax: taxTotal,
          discountVal,
          total,
          status: 'Confirmed', // Automatically confirmed and ready to be sent
          lines: sub.lines.map(l => ({
            desc: `${l.productName} (${l.variantName || 'Standard'}) x ${l.qty}`,
            amount: l.unitPrice * l.qty
          }))
        };

        state.invoices.unshift(newInvoice);
        createdCount++;

        // Advance next billing date based on plan interval
        const plan = state.plans.find(p => p.id === sub.planId);
        const nextDate = new Date();
        if (plan) {
          if (plan.frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else if (plan.frequency === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
          else if (plan.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
          else nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        sub.nextBillingDate = nextDate.toISOString().split('T')[0];
      }
    });

    saveState();
    refreshAllViews();

    if (createdCount > 0) {
      showToast(`Billing Day Success: ${createdCount} new recurring invoice(s) generated without error!`, 'success');
    } else {
      showToast(`Billing Day Complete: All active subscriptions are currently up to date. (Skipped: ${skippedCount})`, 'info');
    }
  }

  // =========================================================================
  // 6. SCENARIO 3: QUOTES & SUBSCRIPTION LIFECYCLE MANAGEMENT
  // =========================================================================

  function viewSubscriptionDetail(subId) {
    const sub = state.subscriptions.find(s => s.id === subId);
    if (!sub) return;

    state.activeSubDetailId = subId;
    const modal = document.getElementById('sub-detail-modal');

    document.getElementById('detail-sub-number').textContent = sub.id;
    document.getElementById('detail-sub-customer').textContent = `${sub.customer} (${sub.customerEmail})`;

    // Breadcrumb updates
    const stages = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
    stages.forEach(st => {
      const el = document.getElementById(`step-${st}`);
      if (el) {
        el.className = 'pipeline-step';
        if (st === sub.stage) el.classList.add('active');
        else if (stages.indexOf(st) < stages.indexOf(sub.stage)) el.classList.add('completed');
      }
    });

    const plan = state.plans.find(p => p.id === sub.planId);
    const { subtotal, discountVal, taxTotal, total } = calculateSubTotals(sub);

    // Contract info block
    const infoGrid = document.getElementById('detail-contract-info');
    infoGrid.innerHTML = `
      <div class="contract-info-item">
        <label>Billing Frequency</label>
        <span>${plan ? plan.name : 'Monthly'}</span>
      </div>
      <div class="contract-info-item">
        <label>Start Date</label>
        <span>${sub.startDate}</span>
      </div>
      <div class="contract-info-item">
        <label>Next Billing Date</label>
        <span>${sub.nextBillingDate || 'N/A'}</span>
      </div>
      <div class="contract-info-item">
        <label>Payment Terms</label>
        <span>${sub.paymentTerms || 'Immediate'}</span>
      </div>
      <div class="contract-info-item">
        <label>Subtotal / Tax</label>
        <span>${formatMoney(subtotal)} + ${formatMoney(taxTotal)} Tax</span>
      </div>
      <div class="contract-info-item">
        <label>Recurring Total</label>
        <span class="font-mono font-bold" style="color:var(--brand-primary); font-size:1.1rem;">${formatMoney(total)}</span>
      </div>
    `;

    // Lines Table
    const linesTbody = document.getElementById('detail-lines-tbody');
    linesTbody.innerHTML = sub.lines.map(l => `
      <tr>
        <td><strong>${escapeHtml(l.productName)}</strong></td>
        <td>${escapeHtml(l.variantName || 'Standard')}</td>
        <td>${l.qty}</td>
        <td class="font-mono">${formatMoney(l.unitPrice)}</td>
        <td class="font-mono">${(l.taxRate * 100).toFixed(0)}%</td>
        <td class="font-mono font-bold">${formatMoney(l.unitPrice * l.qty)}</td>
      </tr>
    `).join('');

    // Actions based on state machine
    const actionsFooter = document.getElementById('detail-action-buttons');
    let buttonsHtml = '';

    if (sub.stage === 'Draft') {
      buttonsHtml = `
        <button class="btn btn-primary" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Quotation')">Send as Quotation</button>
      `;
    } else if (sub.stage === 'Quotation') {
      buttonsHtml = `
        <button class="btn btn-secondary" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Draft')">Back to Draft</button>
        <button class="btn btn-primary" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Confirmed')">Confirm Quotation</button>
      `;
    } else if (sub.stage === 'Confirmed') {
      buttonsHtml = `
        <button class="btn btn-success" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Active')">Activate Subscription (Start Recurring)</button>
      `;
    } else if (sub.stage === 'Active') {
      buttonsHtml = `
        <button class="btn btn-warning" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Paused')">Pause Subscription</button>
        <button class="btn btn-danger" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Closed')">Close Contract</button>
      `;
    } else if (sub.stage === 'Paused') {
      buttonsHtml = `
        <button class="btn btn-success" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Active')">Resume Active</button>
        <button class="btn btn-danger" onclick="window.brightloopApp.transitionSub('${sub.id}', 'Closed')">Close Contract</button>
      `;
    } else {
      buttonsHtml = `<span class="text-muted">Contract is Closed.</span>`;
    }

    actionsFooter.innerHTML = buttonsHtml;
    modal.classList.remove('hidden');
  }

  function transitionSub(subId, newStage) {
    const sub = state.subscriptions.find(s => s.id === subId);
    if (!sub) return;

    sub.stage = newStage;
    if (newStage === 'Active' && !sub.nextBillingDate) {
      sub.nextBillingDate = getDaysFromToday(30);
    }

    saveState();
    showToast(`Subscription ${sub.id} transitioned to stage "${newStage}"`, 'success');
    viewSubscriptionDetail(subId);
    refreshAllViews();
  }

  // =========================================================================
  // 7. SCENARIO 4: PRINTABLE INVOICE & SEND ENGINE
  // =========================================================================

  function viewInvoiceModal(invoiceId) {
    const inv = state.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    state.activeInvoiceDetailId = invoiceId;
    const modal = document.getElementById('invoice-view-modal');
    document.getElementById('inv-modal-number').textContent = inv.id;

    const printableContent = document.getElementById('printable-invoice-content');
    printableContent.innerHTML = `
      <div class="invoice-doc-header">
        <div class="invoice-doc-title">
          <h2>Brightloop Software</h2>
          <p class="text-muted">300 Tech Park Blvd, Suite 400<br>Billing Support: billing@brightloop.com</p>
        </div>
        <div style="text-align:right;">
          <h3 class="font-mono" style="font-size:1.3rem;">TAX INVOICE</h3>
          <p><strong>Invoice #:</strong> ${inv.id}</p>
          <p><strong>Date:</strong> ${inv.date}</p>
          <p><strong>Payment Due:</strong> ${inv.dueDate}</p>
          <p><strong>Status:</strong> <span class="status-tag ${inv.status.toLowerCase()}">${inv.status}</span></p>
        </div>
      </div>

      <div style="margin-bottom:1.5rem;">
        <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700;">Billed To:</span>
        <h4 style="font-size:1.1rem; margin-top:0.2rem;">${escapeHtml(inv.customer)}</h4>
        <p class="text-muted">${escapeHtml(inv.customerEmail)}</p>
        <p class="text-muted">Subscription Reference: ${inv.subId || 'Direct Contract'}</p>
      </div>

      <table class="data-table" style="margin-top:1rem;">
        <thead>
          <tr>
            <th>Description & Recurring Lines</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${inv.lines.map(l => `
            <tr>
              <td>${escapeHtml(l.desc)}</td>
              <td class="text-right font-mono">${formatMoney(l.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-summary-box">
        <table class="invoice-summary-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right font-mono">${formatMoney(inv.subtotal)}</td>
          </tr>
          ${inv.discountVal > 0 ? `
          <tr style="color:var(--color-danger);">
            <td>Applied Discount:</td>
            <td class="text-right font-mono">-${formatMoney(inv.discountVal)}</td>
          </tr>` : ''}
          <tr>
            <td>Calculated Taxes:</td>
            <td class="text-right font-mono">${formatMoney(inv.tax)}</td>
          </tr>
          <tr class="total-row">
            <td>Total Due:</td>
            <td class="text-right font-mono" style="color:var(--brand-primary);">${formatMoney(inv.total)}</td>
          </tr>
        </table>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  // =========================================================================
  // 8. SCENARIO 6: PAYMENT RECORDING & RECONCILIATION
  // =========================================================================

  function openRecordPaymentFor(invoiceId) {
    const modal = document.getElementById('record-payment-modal');
    const select = document.getElementById('pay-invoice-select');
    select.innerHTML = state.invoices
      .filter(i => i.status !== 'Paid')
      .map(i => `<option value="${i.id}" ${i.id === invoiceId ? 'selected' : ''}>${i.id} - ${i.customer} (${formatMoney(i.total)})</option>`)
      .join('');

    const targetInv = state.invoices.find(i => i.id === invoiceId);
    if (targetInv) {
      document.getElementById('pay-amount').value = targetInv.total;
    }
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
  }

  function handlePaymentSubmit(e) {
    e.preventDefault();
    const invoiceId = document.getElementById('pay-invoice-select').value;
    const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
    const date = document.getElementById('pay-date').value;
    const method = document.getElementById('pay-method').value;
    const note = document.getElementById('pay-note').value;

    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const newPayment = {
      id: `PAY-${Date.now().toString().slice(-5)}`,
      invoiceId,
      customer: invoice.customer,
      method,
      date,
      amount,
      note
    };

    state.payments.unshift(newPayment);
    invoice.status = 'Paid'; // Mark settled

    saveState();
    showToast(`Payment of ${formatMoney(amount)} recorded against ${invoiceId}. Invoice settled!`, 'success');
    document.getElementById('record-payment-modal').classList.add('hidden');
    refreshAllViews();
  }

  // =========================================================================
  // 9. SCENARIO 1: CUSTOMER SIGN UP & PASSWORD VALIDATION
  // =========================================================================

  function handleCustomerRegister(e) {
    e.preventDefault();
    const company = document.getElementById('reg-company').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    const errEmail = document.getElementById('reg-email-error');
    const errPass = document.getElementById('reg-password-error');
    errEmail.textContent = '';
    errPass.textContent = '';

    // 1. Email Uniqueness constraint
    const existing = state.users.find(u => u.email === email);
    if (existing) {
      errEmail.textContent = 'This email is already registered to an account. Each email can belong to only one account.';
      return;
    }

    // 2. Strict Password Validation: > 8 chars, 1 uppercase, 1 lowercase, 1 special character
    const isLongEnough = password.length > 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isLongEnough || !hasUpper || !hasLower || !hasSpecial) {
      errPass.textContent = 'Password must be more than 8 characters, with at least one uppercase letter, one lowercase letter, and one special character.';
      return;
    }

    // Create user
    const newUser = {
      id: `usr_${Date.now()}`,
      name: company,
      email,
      role: 'customer',
      company
    };

    state.users.push(newUser);
    state.currentUser = newUser;

    // Add to dropdown
    const select = document.getElementById('role-switcher-select');
    const opt = document.createElement('option');
    opt.value = newUser.id;
    opt.textContent = `🏢 Customer Portal (${company})`;
    opt.selected = true;
    select.appendChild(opt);

    saveState();
    document.getElementById('auth-modal').classList.add('hidden');
    showToast(`Account created for "${company}". Welcome to Brightloop!`, 'success');
    applyRolePermissions();
  }

  function handleForgotPassword() {
    const email = document.getElementById('reg-email').value.trim();
    if (!email) {
      showToast('Please type your registered email address first.', 'warning');
      return;
    }
    showToast(`Password reset link sent to registered email: ${email}`, 'info');
  }

  // =========================================================================
  // 10. SUBSCRIPTION CREATION FORM HELPERS
  // =========================================================================

  function populateSubFormOptions() {
    // Template dropdown
    const tmplSelect = document.getElementById('sub-form-template');
    tmplSelect.innerHTML = `<option value="">-- Start from scratch --</option>` +
      state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

    // Customer dropdown
    const custSelect = document.getElementById('sub-form-customer');
    const customers = state.users.filter(u => u.role === 'customer');
    custSelect.innerHTML = customers.map(c => `<option value="${c.email}">${escapeHtml(c.name)} (${c.email})</option>`).join('');

    // Plan dropdown
    const planSelect = document.getElementById('sub-form-plan');
    planSelect.innerHTML = state.plans.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.frequency})</option>`).join('');

    // Discount dropdown
    const discSelect = document.getElementById('sub-form-discount');
    discSelect.innerHTML = `<option value="">-- No Discount --</option>` +
      state.discounts.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  }

  function addSubProductLineRow(product = null, variantName = '', qty = 1, unitPrice = null) {
    const tbody = document.getElementById('sub-lines-tbody');
    const row = document.createElement('tr');

    const defaultProd = product || state.products[0];
    const initialPrice = unitPrice !== null ? unitPrice : defaultProd.salesPrice;

    row.innerHTML = `
      <td>
        <select class="line-product-select">
          ${state.products.map(p => `<option value="${p.id}" ${p.id === defaultProd.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="line-variant-select">
          ${(defaultProd.variants || []).map(v => `<option value="${v.name}" data-add="${v.addPrice}" ${v.name === variantName ? 'selected' : ''}>${escapeHtml(v.name)} (+${formatMoney(v.addPrice)})</option>`).join('')}
        </select>
      </td>
      <td><input type="number" class="line-qty" value="${qty}" min="1" style="width:65px;"></td>
      <td><input type="number" class="line-price" value="${initialPrice}" step="0.01" style="width:90px;"></td>
      <td>
        <select class="line-tax-select">
          ${state.taxes.map(t => `<option value="${t.rate}">${(t.rate * 100).toFixed(0)}%</option>`).join('')}
        </select>
      </td>
      <td class="line-total font-mono">${formatMoney(initialPrice * qty)}</td>
      <td><button type="button" class="btn btn-sm btn-secondary" onclick="this.closest('tr').remove()">✕</button></td>
    `;

    tbody.appendChild(row);

    // Dynamic price recalculation on variant switch (e.g. Odoo brand +$560)
    const prodSelect = row.querySelector('.line-product-select');
    const varSelect = row.querySelector('.line-variant-select');
    const priceInput = row.querySelector('.line-price');
    const qtyInput = row.querySelector('.line-qty');
    const totalCell = row.querySelector('.line-total');

    function updateLineCalc() {
      const selectedProd = state.products.find(p => p.id === prodSelect.value);
      const selectedVar = selectedProd?.variants?.find(v => v.name === varSelect.value);
      const add = selectedVar ? selectedVar.addPrice : 0;
      const base = selectedProd ? selectedProd.salesPrice : 0;

      priceInput.value = (base + add).toFixed(2);
      const q = parseInt(qtyInput.value) || 1;
      totalCell.textContent = formatMoney((base + add) * q);
    }

    prodSelect.addEventListener('change', () => {
      const p = state.products.find(prod => prod.id === prodSelect.value);
      varSelect.innerHTML = (p?.variants || []).map(v => `<option value="${v.name}" data-add="${v.addPrice}">${escapeHtml(v.name)} (+${formatMoney(v.addPrice)})</option>`).join('');
      updateLineCalc();
    });

    varSelect.addEventListener('change', updateLineCalc);
    qtyInput.addEventListener('input', updateLineCalc);
    priceInput.addEventListener('input', () => {
      const p = parseFloat(priceInput.value) || 0;
      const q = parseInt(qtyInput.value) || 1;
      totalCell.textContent = formatMoney(p * q);
    });
  }

  function handleTemplateSelection(tmplId) {
    const tmpl = state.templates.find(t => t.id === tmplId);
    if (!tmpl) return;

    document.getElementById('sub-form-plan').value = tmpl.planId;
    document.getElementById('sub-form-expiry-date').value = getDaysFromToday(tmpl.validDays || 15);

    const tbody = document.getElementById('sub-lines-tbody');
    tbody.innerHTML = '';

    tmpl.lines.forEach(l => {
      const prod = state.products.find(p => p.id === l.productId);
      addSubProductLineRow(prod, l.variantName, l.qty, l.unitPrice);
    });
  }

  function handleSubscriptionCreate(e) {
    e.preventDefault();

    const customerEmail = document.getElementById('sub-form-customer').value;
    const customerObj = state.users.find(u => u.email === customerEmail);
    const planId = document.getElementById('sub-form-plan').value;
    const startDate = document.getElementById('sub-form-start-date').value;
    const expiryDate = document.getElementById('sub-form-expiry-date').value;
    const paymentTerms = document.getElementById('sub-form-payment-terms').value;
    const discountId = document.getElementById('sub-form-discount').value;

    const rows = document.querySelectorAll('#sub-lines-tbody tr');
    if (rows.length === 0) {
      showToast('Please add at least one product line to the subscription.', 'warning');
      return;
    }

    const lines = [];
    rows.forEach(r => {
      const prodId = r.querySelector('.line-product-select').value;
      const prod = state.products.find(p => p.id === prodId);
      const variantName = r.querySelector('.line-variant-select').value;
      const qty = parseInt(r.querySelector('.line-qty').value) || 1;
      const unitPrice = parseFloat(r.querySelector('.line-price').value) || 0;
      const taxRate = parseFloat(r.querySelector('.line-tax-select').value) || 0;

      lines.push({
        productName: prod ? prod.name : 'Custom Item',
        variantName,
        qty,
        unitPrice,
        taxRate
      });
    });

    const newSub = {
      id: `SUB-00${String(state.subscriptions.length + 101).padStart(3, '0')}`,
      customer: customerObj ? customerObj.name : customerEmail,
      customerEmail,
      planId,
      startDate,
      nextBillingDate: startDate,
      expiryDate,
      paymentTerms,
      discountId,
      stage: 'Quotation', // Starts in Quotation stage per Scenario 3
      lines
    };

    state.subscriptions.unshift(newSub);
    saveState();
    showToast(`Quotation ${newSub.id} created successfully!`, 'success');
    document.getElementById('sub-modal').classList.add('hidden');
    refreshAllViews();
  }

  // =========================================================================
  // 11. TOAST NOTIFICATIONS
  // =========================================================================

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 12. EVENT LISTENERS SETUP
  // =========================================================================

  function setupEvents() {
    // Nav Tabs switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.workspace-view').forEach(v => v.classList.remove('active'));

        tab.classList.add('active');
        const tabKey = tab.getAttribute('data-tab');
        const targetView = document.getElementById(`view-${tabKey}`);
        if (targetView) targetView.classList.add('active');
        state.activeTab = tabKey;
      });
    });

    // Role switcher
    const roleSelect = document.getElementById('role-switcher-select');
    if (roleSelect) {
      roleSelect.addEventListener('change', e => {
        const val = e.target.value;
        if (val === 'admin') state.currentUser = state.users.find(u => u.role === 'admin');
        else if (val === 'staff') state.currentUser = state.users.find(u => u.role === 'staff');
        else if (val === 'customer_apex') state.currentUser = state.users.find(u => u.email === 'contact@apexdigital.com');
        else if (val === 'customer_nova') state.currentUser = state.users.find(u => u.email === 'billing@novaretail.com');
        else {
          const u = state.users.find(user => user.id === val);
          if (u) state.currentUser = u;
        }

        showToast(`Switched active view to: ${state.currentUser.name} (${state.currentUser.role.toUpperCase()})`, 'info');
        applyRolePermissions();
      });
    }

    // Billing Day Buttons
    document.getElementById('run-billing-day-btn')?.addEventListener('click', runBillingDayBatch);
    document.getElementById('invoices-run-billing-btn')?.addEventListener('click', runBillingDayBatch);
    document.getElementById('refresh-dashboard-btn')?.addEventListener('click', () => {
      refreshAllViews();
      showToast('Dashboard metrics refreshed.', 'info');
    });

    // Subscription Modal Triggers
    document.getElementById('open-new-sub-modal-btn')?.addEventListener('click', () => {
      populateSubFormOptions();
      document.getElementById('sub-form-start-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('sub-form-expiry-date').value = getDaysFromToday(30);
      document.getElementById('sub-lines-tbody').innerHTML = '';
      addSubProductLineRow(); // Add 1 initial row
      document.getElementById('sub-modal').classList.remove('hidden');
    });

    document.getElementById('add-product-line-btn')?.addEventListener('click', () => addSubProductLineRow());
    document.getElementById('sub-form-template')?.addEventListener('change', e => handleTemplateSelection(e.target.value));
    document.getElementById('subscription-form')?.addEventListener('submit', handleSubscriptionCreate);

    // Payment Form Triggers
    document.getElementById('open-record-payment-modal-btn')?.addEventListener('click', () => openRecordPaymentFor(null));
    document.getElementById('record-payment-form')?.addEventListener('submit', handlePaymentSubmit);

    // Admin Creation Modals
    document.getElementById('open-new-product-modal-btn')?.addEventListener('click', () => {
      document.getElementById('product-modal').classList.remove('hidden');
    });

    document.getElementById('new-product-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('prod-name').value.trim();
      const type = document.getElementById('prod-type').value;
      const salesPrice = parseFloat(document.getElementById('prod-sales-price').value) || 0;
      const costPrice = parseFloat(document.getElementById('prod-cost-price').value) || 0;
      const variantName = document.getElementById('prod-variant-name').value.trim();
      const variantAdd = parseFloat(document.getElementById('prod-variant-add').value) || 0;
      const notes = document.getElementById('prod-notes').value.trim();

      const variants = [{ name: 'Standard', addPrice: 0.00 }];
      if (variantName) {
        variants.push({ name: variantName, addPrice: variantAdd });
      }

      const newProd = {
        id: `prod_${Date.now()}`,
        name,
        type,
        salesPrice,
        costPrice,
        variants,
        notes
      };

      state.products.push(newProd);
      saveState();
      showToast(`Product "${name}" added to catalog!`, 'success');
      document.getElementById('product-modal').classList.add('hidden');
      renderProductsAndPlans();
    });

    document.getElementById('open-new-plan-modal-btn')?.addEventListener('click', () => {
      document.getElementById('plan-modal').classList.remove('hidden');
    });

    document.getElementById('new-plan-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('plan-name').value.trim();
      const frequency = document.getElementById('plan-frequency').value;
      const minQty = parseInt(document.getElementById('plan-min-qty').value) || 1;
      const autoClose = document.getElementById('plan-auto-close').checked;
      const allowPauseRenew = document.getElementById('plan-allow-pause').checked;

      const newPlan = {
        id: `plan_${Date.now()}`,
        name,
        frequency,
        minQty,
        autoClose,
        allowPauseRenew
      };

      state.plans.push(newPlan);
      saveState();
      showToast(`Billing plan "${name}" configured!`, 'success');
      document.getElementById('plan-modal').classList.add('hidden');
      renderProductsAndPlans();
    });

    document.getElementById('open-new-discount-modal-btn')?.addEventListener('click', () => {
      document.getElementById('discount-modal').classList.remove('hidden');
    });

    document.getElementById('new-discount-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('disc-name').value.trim();
      const type = document.getElementById('disc-type').value;
      const value = parseFloat(document.getElementById('disc-value').value) || 0;
      const minSpend = parseFloat(document.getElementById('disc-min-spend').value) || 0;
      const usageLimit = parseInt(document.getElementById('disc-usage-limit').value) || 10;

      const newDisc = {
        id: `disc_${Date.now()}`,
        name,
        type,
        value,
        minSpend,
        usageLimit,
        usedCount: 0,
        status: 'active'
      };

      state.discounts.push(newDisc);
      saveState();
      showToast(`Discount rule "${name}" created!`, 'success');
      document.getElementById('discount-modal').classList.add('hidden');
      renderDiscountsAndTaxes();
    });

    document.getElementById('open-new-staff-modal-btn')?.addEventListener('click', () => {
      document.getElementById('staff-modal').classList.remove('hidden');
    });

    document.getElementById('new-staff-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('staff-name').value.trim();
      const email = document.getElementById('staff-email').value.trim().toLowerCase();
      const role = document.getElementById('staff-role').value;

      state.users.push({ id: `usr_${Date.now()}`, name, email, role });
      saveState();
      showToast(`Added internal staff member "${name}" (${role})`, 'success');
      document.getElementById('staff-modal').classList.add('hidden');
      renderStaffTable();
    });

    // Customer Auth / Sign In Modal
    document.getElementById('auth-modal-trigger-btn')?.addEventListener('click', () => {
      document.getElementById('auth-modal').classList.remove('hidden');
    });
    document.getElementById('customer-register-form')?.addEventListener('submit', handleCustomerRegister);
    document.getElementById('forgot-password-btn')?.addEventListener('click', handleForgotPassword);

    // Invoice View Actions
    document.getElementById('print-invoice-btn')?.addEventListener('click', () => window.print());
    document.getElementById('send-invoice-btn')?.addEventListener('click', () => {
      showToast(`Invoice ${state.activeInvoiceDetailId} sent to customer via email.`, 'success');
    });
    document.getElementById('inv-confirm-btn')?.addEventListener('click', () => {
      const inv = state.invoices.find(i => i.id === state.activeInvoiceDetailId);
      if (inv) {
        inv.status = 'Confirmed';
        saveState();
        showToast(`Invoice ${inv.id} Confirmed!`, 'success');
        viewInvoiceModal(inv.id);
        refreshAllViews();
      }
    });

    // Search and filter inputs
    document.getElementById('sub-filter-search')?.addEventListener('input', renderSubscriptionsTable);
    document.getElementById('sub-filter-stage')?.addEventListener('change', renderSubscriptionsTable);
    document.getElementById('inv-filter-search')?.addEventListener('input', renderInvoicesTable);
    document.getElementById('inv-filter-status')?.addEventListener('change', renderInvoicesTable);

    // Close Modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId)?.classList.add('hidden');
      });
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      }
    });
  }

  // =========================================================================
  // 13. GLOBAL DISPATCHER & INIT
  // =========================================================================

  window.brightloopApp = {
    viewSubscriptionDetail,
    transitionSub,
    viewInvoiceModal,
    openRecordPaymentFor
  };

  // Expose applyRolePermissions globally so the login system can call it after login
  window.applyRolePermissions = applyRolePermissions;

  function init() {
    loadState();
    setupEvents();
    // NOTE: applyRolePermissions() is intentionally NOT called here on boot.
    // The login screen gates the app; applyRolePermissions() is called by
    // revealApp() after successful authentication.
    refreshAllViews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
