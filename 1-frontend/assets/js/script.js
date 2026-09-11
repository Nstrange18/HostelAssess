(() => {
  const API = window.HostelAPI;
  const pathPage = location.pathname.split('/').pop() || 'index';
  const page = pathPage.endsWith('.html') ? pathPage : `${pathPage}.html`;
  const labels = { 'water-supply': 'Water Supply', electricity: 'Electricity', sanitation: 'Sanitation', security: 'Security', maintenance: 'Maintenance', other: 'Other' };
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const formatDate = (value) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));
  const titleCase = (value = '') => value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const roleLabel = (role) => role === 'institution_admin' ? 'Institution administrator' : titleCase(role);
  const isAdminRole = (role) => ['admin', 'institution_admin'].includes(role);
  const userName = (user) => `${user.firstName} ${user.surname}`;
  const toast = (message, type = 'info') => window.Toastify
    ? Toastify({ text: message, duration: 4000, gravity: 'top', position: 'right', className: `toast-${type}`, stopOnFocus: true }).showToast()
    : console[type === 'error' ? 'error' : 'log'](message);
  const setLoading = (button, loading, label) => { button.dataset.label ||= button.textContent; button.disabled = loading; button.textContent = loading ? label : button.dataset.label; };
  const redirect = (target) => location.replace(target);

  async function currentUser(role) {
    if (!API.getToken()) { redirect('login.html'); return null; }
    try {
      const { user } = await API.request('/auth/me');
      const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];
      if (allowedRoles.length && !allowedRoles.includes(user.role)) { toast('You are not authorized to view that page.', 'error'); redirect(isAdminRole(user.role) ? 'admin-dashboard.html' : 'student-dashboard.html'); return null; }
      document.querySelectorAll('[data-user-name]').forEach((node) => { node.textContent = userName(user); });
      document.querySelectorAll('[data-user-initials]').forEach((node) => { node.textContent = `${user.firstName[0]}${user.surname[0]}`.toUpperCase(); });
      document.querySelectorAll('[data-user-role]').forEach((node) => { node.textContent = roleLabel(user.role); });
      document.querySelectorAll('[data-institution-only]').forEach((node) => { node.hidden = user.role !== 'institution_admin'; });
      return user;
    } catch (error) { API.clearToken(); toast(error.message, 'error'); redirect('login.html'); return null; }
  }

  function createLogoutDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'logout-dialog';
    dialog.setAttribute('aria-labelledby', 'logout-dialog-title');
    dialog.innerHTML = `
      <div class="logout-dialog-icon" aria-hidden="true">!</div>
      <div class="logout-dialog-copy">
        <span class="form-label">CONFIRM LOGOUT</span>
        <h2 id="logout-dialog-title">Are you sure you want to leave?</h2>
        <p>You’ll need to sign in again to access your dashboard.</p>
      </div>
      <div class="logout-dialog-actions">
        <button type="button" class="btn btn-outline" data-cancel-logout>Stay logged in</button>
        <button type="button" class="btn btn-danger" data-confirm-logout>Yes, log out</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-cancel-logout]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-confirm-logout]').addEventListener('click', () => {
      API.clearToken();
      redirect('login.html');
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  let logoutDialog;
  document.querySelectorAll('[data-logout]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    logoutDialog ||= createLogoutDialog();
    logoutDialog.showModal();
    logoutDialog.querySelector('[data-cancel-logout]').focus();
  }));

  async function initLogin() {
    const form = document.querySelector('#loginForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = form.querySelector('button'); setLoading(button, true, 'Signing in...');
      try {
        const data = await API.request('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email.value.trim(), password: form.password.value }) });
        API.setToken(data.token, form.remember.checked); toast('Signed in successfully.', 'success'); redirect(isAdminRole(data.user.role) ? 'admin-dashboard.html' : 'student-dashboard.html');
      } catch (error) { toast(error.message, 'error'); setLoading(button, false); }
    });
  }

  async function initRegister() {
    const form = document.querySelector('#registerForm');
    try { const { hostels } = await API.request('/hostels'); form.hostel.innerHTML = '<option value="">Select hostel</option>' + hostels.map((h) => `<option value="${h._id}">${escapeHtml(h.name)}</option>`).join(''); }
    catch (error) { form.hostel.innerHTML = '<option value="">Hostels unavailable</option>'; toast(error.message, 'error'); }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.confirm_password.value !== form.password.value) return toast('Passwords do not match.', 'error');
      const button = form.querySelector('button'); setLoading(button, true, 'Creating account...');
      const body = { surname: form.surname.value, firstName: form.first_name.value, matricNo: form.matric_no.value, email: form.email.value, level: form.level.value, department: form.department.value, hostel: form.hostel.value, password: form.password.value };
      try { const data = await API.request('/auth/register', { method: 'POST', body: JSON.stringify(body) }); API.setToken(data.token); toast('Account created successfully.', 'success'); redirect('student-dashboard.html'); }
      catch (error) { toast(error.message, 'error'); setLoading(button, false); }
    });
  }

  const ratingRows = (item) => ['water', 'electricity', 'sanitation', 'security', 'maintenance'].map((key) => `<div class="rating-row"><span>${titleCase(key)}</span><div class="bar"><i style="width:${item[key] * 20}%"></i></div><strong>${item[key]}</strong></div>`).join('');
  const complaintItem = (item, admin = false) => `<div class="complaint-item"><div><strong>${escapeHtml(labels[item.category] || titleCase(item.category))}</strong><small>${escapeHtml(admin ? item.hostel?.name || 'Unassigned' : item.description)}</small><small>Ref ${escapeHtml(item._id.slice(-8).toUpperCase())} · ${formatDate(item.createdAt)}</small></div><span class="status ${item.status === 'in-progress' ? 'progress' : item.status}">${titleCase(item.status)}</span></div>`;

  async function initStudentDashboard() {
    if (!(await currentUser('student'))) return; const main = document.querySelector('.dashboard-main');
    try {
      const [data, history] = await Promise.all([API.request('/dashboard/student'), API.request('/assessments/me')]); const assessment = data.currentAssessment;
      main.innerHTML = `<div class="dashboard-heading"><div><span class="form-label">STUDENT DASHBOARD · ${escapeHtml(data.academicSession)}</span><h1>Welcome back, ${escapeHtml(data.student.firstName)}</h1><p>Here’s an overview of your hostel activity.</p></div><a href="assessment.html" class="btn btn-primary">${data.canSubmitAssessment ? 'New Assessment' : 'View Assessment'}</a></div>
      <div class="stats-grid"><div class="stat-card"><span>MY HOSTEL</span><strong>${escapeHtml(data.student.hostel?.name || 'Not assigned')}</strong><small>${escapeHtml(titleCase(data.student.hostel?.category || ''))}</small></div><div class="stat-card"><span>ASSESSMENTS</span><strong>${data.stats.assessmentCount}</strong><small>All academic sessions</small></div><div class="stat-card"><span>COMPLAINTS</span><strong>${data.stats.complaintCount}</strong></div><div class="stat-card"><span>RESOLVED</span><strong>${data.stats.resolvedCount}</strong></div></div>
      <div class="dashboard-grid"><div class="dashboard-card"><div class="card-heading"><div><span>CURRENT ASSESSMENT</span><h3>${assessment ? `Rating for ${escapeHtml(assessment.academicSession)}` : 'No assessment submitted yet'}</h3></div></div>${assessment ? `<div class="rating-overview"><div class="big-rating">${assessment.overallRating}<small>/5</small></div><div class="rating-bars">${ratingRows(assessment)}</div></div>` : '<div class="empty-state">Submit one assessment for your assigned hostel this academic session.</div>'}</div><div class="dashboard-card"><div class="card-heading"><div><span>COMPLAINT STATUS</span><h3>Recent complaints</h3></div><a href="complaints.html">View all</a></div>${data.recentComplaints.length ? data.recentComplaints.map((c) => complaintItem(c)).join('') : '<div class="empty-state">No complaints submitted yet.</div>'}</div></div><section class="dashboard-card table-card"><div class="card-heading"><div><span>ASSESSMENT HISTORY</span><h3>Your previous submissions</h3></div></div><div class="table-wrapper"><table><thead><tr><th>Hostel</th><th>Session</th><th>Overall</th><th>Submitted</th></tr></thead><tbody>${history.assessments.map((item) => `<tr><td>${escapeHtml(item.hostel?.name)}</td><td>${escapeHtml(item.academicSession)}</td><td>${item.overallRating}</td><td>${formatDate(item.createdAt)}</td></tr>`).join('') || '<tr><td colspan="4">No previous assessments yet.</td></tr>'}</tbody></table></div></section>`;
    } catch (error) { main.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
  }

  async function initAssessment() {
    if (!(await currentUser('student'))) return; const container = document.querySelector('.assessment-container');
    try {
      const state = await API.request('/assessments/me/current'); document.querySelector('.dashboard-heading .form-label').textContent = `HOSTEL ASSESSMENT · ${state.academicSession}`;
      const hostelInfo = container.querySelector('.assessment-info');
      if (hostelInfo && state.hostel) hostelInfo.innerHTML = `<strong>${escapeHtml(state.hostel.name)}</strong><span>${escapeHtml(titleCase(state.hostel.category))} Hostel · ${escapeHtml(state.hostel.campus)}</span>`;
      if (!state.hostel) { container.innerHTML = '<div class="empty-state">A hostel must be assigned to your account before you can submit an assessment.</div>'; return; }
      if (state.assessment) { const a = state.assessment; container.innerHTML = `<div class="assessment-info"><strong>${escapeHtml(a.hostel.name)}</strong><span>${escapeHtml(a.academicSession)} · Submitted ${formatDate(a.createdAt)}</span></div><div class="existing-assessment"><div class="big-rating">${a.overallRating}<small>/5</small></div><div class="rating-bars">${ratingRows(a)}</div>${a.comment ? `<div class="comment-display"><strong>Comments</strong><p>${escapeHtml(a.comment)}</p></div>` : ''}</div>`; return; }
      const form = document.querySelector('#assessmentForm');
      form.addEventListener('submit', async (event) => { event.preventDefault(); const button = form.querySelector('button'); setLoading(button, true, 'Submitting...'); const body = Object.fromEntries(new FormData(form)); try { await API.request('/assessments', { method: 'POST', body: JSON.stringify(body) }); toast('Assessment submitted successfully.', 'success'); await initAssessment(); } catch (error) { toast(error.message, 'error'); if (error.code === 'ASSESSMENT_ALREADY_SUBMITTED') await initAssessment(); else setLoading(button, false); } }, { once: true });
    } catch (error) { container.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
  }

  async function initComplaints() {
    if (!(await currentUser('student'))) return; const form = document.querySelector('#complaintForm'); const history = document.querySelector('[data-complaint-history]');
    const load = async () => { try { const { complaints } = await API.request('/complaints/me'); history.innerHTML = complaints.length ? complaints.map((c) => complaintItem(c)).join('') : '<div class="empty-state">No complaints submitted yet.</div>'; } catch (error) { history.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; } };
    await load(); form.addEventListener('submit', async (event) => { event.preventDefault(); const button = form.querySelector('button'); setLoading(button, true, 'Submitting...'); try { await API.request('/complaints', { method: 'POST', body: JSON.stringify({ category: form.category.value, description: form.description.value }) }); form.reset(); toast('Complaint submitted successfully.', 'success'); await load(); } catch (error) { toast(error.message, 'error'); } finally { setLoading(button, false); } });
  }

  async function initAdmin() {
    const admin = await currentUser(['admin', 'institution_admin']);
    if (!admin) return;
    const main = document.querySelector('.dashboard-main');
    try {
      const [data, assessmentHistory, complaintHistory, studentData, hostelData] = await Promise.all([API.request('/dashboard/admin'), API.request('/assessments?limit=100'), API.request('/complaints'), API.request('/students'), API.request('/hostels/manage?all=true')]);
      const hostels = hostelData.hostels;
      const hostelOptions = `<option value="">All hostels</option>${hostels.map((hostel) => `<option value="${hostel._id}">${escapeHtml(hostel.name)}</option>`).join('')}`;
      const assignmentOptions = (selected) => `<option value="">Unassigned</option>${hostels.filter((hostel) => hostel.isActive).map((hostel) => `<option value="${hostel._id}" ${selected === hostel._id ? 'selected' : ''}>${escapeHtml(hostel.name)}</option>`).join('')}`;
      const assessmentRows = (items) => items.map((a) => `<tr><td>${escapeHtml(userName(a.student))}<small>${escapeHtml(a.student.matricNo || '')}</small></td><td>${escapeHtml(a.hostel?.name)}</td><td>${escapeHtml(a.academicSession)}</td><td>${a.overallRating}</td><td class="table-copy">${escapeHtml(a.comment || 'No comment')}</td><td>${formatDate(a.createdAt)}</td></tr>`).join('') || '<tr><td colspan="6">No assessments match these filters.</td></tr>';
      const complaintRows = (items) => items.map((c) => `<tr><td>${escapeHtml(userName(c.student))}</td><td>${escapeHtml(c.hostel?.name)}</td><td>${escapeHtml(labels[c.category] || titleCase(c.category))}</td><td class="table-copy">${escapeHtml(c.description)}</td><td><select data-complaint-status="${c._id}" aria-label="Update complaint status"><option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option><option value="in-progress" ${c.status === 'in-progress' ? 'selected' : ''}>In Progress</option><option value="resolved" ${c.status === 'resolved' ? 'selected' : ''}>Resolved</option></select></td><td>${formatDate(c.createdAt)}</td></tr>`).join('') || '<tr><td colspan="6">No complaints match these filters.</td></tr>';
      const studentRows = studentData.students.map((student) => `<tr><td>${escapeHtml(userName(student))}<small>${escapeHtml(student.email)}</small></td><td>${escapeHtml(student.matricNo)}</td><td>${escapeHtml(student.department || '—')}</td><td><select data-student-hostel="${student._id}" aria-label="Assign hostel to ${escapeHtml(userName(student))}">${assignmentOptions(student.hostel?._id)}</select></td><td>${student.isActive ? 'Active' : 'Inactive'}</td></tr>`).join('') || '<tr><td colspan="5">No students registered yet.</td></tr>';
      const hostelRows = hostels.map((hostel) => `<tr><td><strong>${escapeHtml(hostel.name)}</strong></td><td>${escapeHtml(titleCase(hostel.category))}</td><td>${escapeHtml(hostel.campus)}</td><td><span class="status ${hostel.isActive ? 'resolved' : 'pending'}">${hostel.isActive ? 'Active' : 'Inactive'}</span></td><td><button class="table-action" data-toggle-hostel="${hostel._id}" data-active="${hostel.isActive}">${hostel.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>`).join('');
      const scopeName = data.scope === 'all' ? 'All hostels' : data.scope.map((hostel) => hostel.name).join(', ');
      main.innerHTML = `<div class="dashboard-heading"><div><span class="form-label">ADMINISTRATION · ${escapeHtml(data.academicSession)}</span><h1>Hostel assessment overview</h1><p>Monitor student feedback and take action from one workspace.</p></div><a class="btn btn-outline" href="profile.html">View profile</a></div><div class="admin-scope"><div><span>MANAGED HOSTEL SCOPE</span><strong>${escapeHtml(scopeName)}</strong></div><p>Dashboard totals and records reflect this access scope.</p></div><div class="stats-grid"><div class="stat-card"><span>TOTAL STUDENTS</span><strong>${data.stats.studentCount}</strong></div><div class="stat-card"><span>ASSESSMENTS</span><strong>${data.stats.assessmentCount}</strong><small>Current session</small></div><div class="stat-card"><span>COMPLAINTS</span><strong>${data.stats.complaintCount}</strong></div><div class="stat-card"><span>PENDING</span><strong>${data.stats.pendingCount}</strong></div></div><div class="dashboard-card"><div class="card-heading"><div><span>SERVICE PERFORMANCE</span><h3>Current-session average ratings</h3></div></div><div class="rating-bars">${ratingRows(data.ratings)}</div></div>
      <section class="dashboard-card table-card" id="assessments"><div class="card-heading"><div><span>ASSESSMENT HISTORY</span><h3>All academic sessions</h3></div></div><div class="filter-bar"><select id="assessmentHostelFilter">${hostelOptions}</select><select id="assessmentSessionFilter"><option value="">All sessions</option>${[...new Set(assessmentHistory.assessments.map((a) => a.academicSession))].map((session) => `<option>${escapeHtml(session)}</option>`).join('')}</select></div><div class="table-wrapper"><table><thead><tr><th>Student</th><th>Hostel</th><th>Session</th><th>Overall</th><th>Comment</th><th>Submitted</th></tr></thead><tbody data-assessment-rows>${assessmentRows(assessmentHistory.assessments)}</tbody></table></div></section>
      <section class="dashboard-card table-card" id="complaints"><div class="card-heading"><div><span>COMPLAINT MANAGEMENT</span><h3>All complaints</h3></div></div><div class="filter-bar"><select id="complaintHostelFilter">${hostelOptions}</select><select id="complaintStatusFilter"><option value="">All statuses</option><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option></select></div><div class="table-wrapper"><table><thead><tr><th>Student</th><th>Hostel</th><th>Category</th><th>Description</th><th>Status</th><th>Reported</th></tr></thead><tbody data-complaint-rows>${complaintRows(complaintHistory.complaints)}</tbody></table></div></section>
      <section class="dashboard-card table-card" id="students"><div class="card-heading"><div><span>STUDENTS</span><h3>Student directory and hostel assignments</h3></div><input class="table-search" id="studentSearch" type="search" placeholder="Search name, matric no. or email" aria-label="Search students"></div><div class="table-wrapper"><table><thead><tr><th>Student</th><th>Matric no.</th><th>Department</th><th>Assigned hostel</th><th>Account</th></tr></thead><tbody data-student-rows>${studentRows}</tbody></table></div></section>
      <section class="dashboard-card table-card" id="hostels"><div class="card-heading"><div><span>HOSTELS</span><h3>Hostel directory</h3></div></div><form class="hostel-form" id="hostelForm"><input name="name" placeholder="Hostel name" required><select name="category" required><option value="">Category</option><option value="male">Male</option><option value="female">Female</option><option value="mixed">Mixed</option></select><input name="campus" placeholder="Campus" required><button class="btn btn-primary" type="submit">Add hostel</button></form><div class="table-wrapper"><table><thead><tr><th>Hostel</th><th>Category</th><th>Campus</th><th>Status</th><th>Action</th></tr></thead><tbody>${hostelRows}</tbody></table></div></section>`;
      const bindComplaintStatuses = () => main.querySelectorAll('[data-complaint-status]').forEach((select) => select.addEventListener('change', async () => { select.disabled = true; try { await API.request(`/complaints/${select.dataset.complaintStatus}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); const item = complaintHistory.complaints.find((complaint) => complaint._id === select.dataset.complaintStatus); if (item) item.status = select.value; toast('Complaint status updated.', 'success'); } catch (error) { toast(error.message, 'error'); } finally { select.disabled = false; } }));
      bindComplaintStatuses();
      const filterAssessments = () => { const hostel = main.querySelector('#assessmentHostelFilter').value; const session = main.querySelector('#assessmentSessionFilter').value; main.querySelector('[data-assessment-rows]').innerHTML = assessmentRows(assessmentHistory.assessments.filter((a) => (!hostel || a.hostel?._id === hostel) && (!session || a.academicSession === session))); };
      main.querySelector('#assessmentHostelFilter').addEventListener('change', filterAssessments); main.querySelector('#assessmentSessionFilter').addEventListener('change', filterAssessments);
      const filterComplaints = () => { const hostel = main.querySelector('#complaintHostelFilter').value; const status = main.querySelector('#complaintStatusFilter').value; main.querySelector('[data-complaint-rows]').innerHTML = complaintRows(complaintHistory.complaints.filter((c) => (!hostel || c.hostel?._id === hostel) && (!status || c.status === status))); bindComplaintStatuses(); };
      main.querySelector('#complaintHostelFilter').addEventListener('change', filterComplaints); main.querySelector('#complaintStatusFilter').addEventListener('change', filterComplaints);
      main.querySelector('#studentSearch').addEventListener('input', (event) => { const query = event.target.value.toLowerCase(); main.querySelectorAll('[data-student-rows] tr').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); }); });
      main.querySelectorAll('[data-student-hostel]').forEach((select) => select.addEventListener('change', async () => { select.disabled = true; try { await API.request(`/students/${select.dataset.studentHostel}/hostel`, { method: 'PATCH', body: JSON.stringify({ hostel: select.value }) }); toast('Student hostel assignment updated.', 'success'); } catch (error) { toast(error.message, 'error'); } finally { select.disabled = false; } }));
      main.querySelectorAll('[data-toggle-hostel]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await API.request(`/hostels/${button.dataset.toggleHostel}`, { method: 'PATCH', body: JSON.stringify({ isActive: button.dataset.active !== 'true' }) }); toast('Hostel status updated.', 'success'); await initAdmin(); } catch (error) { toast(error.message, 'error'); button.disabled = false; } }));
      main.querySelector('#hostelForm').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); setLoading(button, true, 'Adding...'); try { await API.request('/hostels', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); toast('Hostel added.', 'success'); await initAdmin(); } catch (error) { toast(error.message, 'error'); setLoading(button, false); } });
    } catch (error) { main.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
  }

  async function initProfile() {
    const user = await currentUser();
    if (!user) return;
    const main = document.querySelector('.profile-main');
    const isStudent = user.role === 'student';
    const scope = isStudent
      ? user.hostel?.name || 'Not assigned'
      : user.role === 'institution_admin' ? 'All hostels' : user.managedHostels?.length ? user.managedHostels.map((hostel) => hostel.name).join(', ') : 'All hostels';
    document.querySelector('[data-user-role]').textContent = roleLabel(user.role);
    document.querySelector('[data-home-link]').href = isStudent ? 'student-dashboard.html' : 'admin-dashboard.html';
    document.querySelector('[data-dashboard-link]').href = isStudent ? 'student-dashboard.html' : 'admin-dashboard.html';
    document.querySelectorAll('[data-student-only]').forEach((link) => { link.hidden = !isStudent; });
    const studentFields = isStudent ? `<div class="form-row"><div class="form-group"><label>Matriculation number</label><input value="${escapeHtml(user.matricNo)}" disabled></div><div class="form-group"><label for="profileLevel">Level</label><select id="profileLevel" name="level">${['100','200','300','400','500'].map((level) => `<option ${user.level === level ? 'selected' : ''}>${level}</option>`).join('')}</select></div></div><div class="form-group"><label for="profileDepartment">Department</label><input id="profileDepartment" name="department" value="${escapeHtml(user.department || '')}" required></div>` : '';
    main.innerHTML = `<div class="dashboard-heading"><div><span class="form-label">ACCOUNT PROFILE</span><h1>Your details</h1><p>Review your account information and keep your password secure.</p></div></div><div class="profile-hero"><div class="profile-avatar">${escapeHtml(`${user.firstName[0]}${user.surname[0]}`.toUpperCase())}</div><div><h2>${escapeHtml(userName(user))}</h2><p>${escapeHtml(titleCase(user.role))} · ${escapeHtml(scope)}</p></div></div><div class="profile-grid"><section class="dashboard-card"><div class="card-heading"><div><span>PERSONAL DETAILS</span><h3>Profile information</h3></div></div><form id="profileForm"><div class="form-row"><div class="form-group"><label for="profileFirstName">First name</label><input id="profileFirstName" name="firstName" value="${escapeHtml(user.firstName)}" required minlength="2"></div><div class="form-group"><label for="profileSurname">Surname</label><input id="profileSurname" name="surname" value="${escapeHtml(user.surname)}" required minlength="2"></div></div><div class="form-group"><label>Email</label><input value="${escapeHtml(user.email)}" disabled><small class="field-note">Email changes require administrator support.</small></div>${studentFields}<div class="profile-scope"><span>${isStudent ? 'Assigned hostel' : 'Managed hostel scope'}</span><strong>${escapeHtml(scope)}</strong><small>${isStudent ? 'Only an administrator can change this assignment.' : 'This administrator currently manages every hostel.'}</small></div><button class="btn btn-primary" type="submit">Save changes</button></form></section><section class="dashboard-card"><div class="card-heading"><div><span>SECURITY</span><h3>Change password</h3></div></div><form id="passwordForm"><div class="form-group"><label for="currentPassword">Current password</label><input type="password" id="currentPassword" name="currentPassword" autocomplete="current-password" required></div><div class="form-group"><label for="newPassword">New password</label><input type="password" id="newPassword" name="newPassword" autocomplete="new-password" minlength="8" required></div><div class="form-group"><label for="confirmNewPassword">Confirm new password</label><input type="password" id="confirmNewPassword" name="confirmNewPassword" autocomplete="new-password" minlength="8" required></div><button class="btn btn-outline" type="submit">Update password</button></form></section></div>`;
    const profileForm = document.querySelector('#profileForm');
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = profileForm.querySelector('button'); setLoading(button, true, 'Saving...');
      const body = { firstName: profileForm.firstName.value, surname: profileForm.surname.value };
      if (isStudent) { body.department = profileForm.department.value; body.level = profileForm.level.value; }
      try { await API.request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }); toast('Profile updated.', 'success'); }
      catch (error) { toast(error.message, 'error'); } finally { setLoading(button, false); }
    });
    const passwordForm = document.querySelector('#passwordForm');
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (passwordForm.newPassword.value !== passwordForm.confirmNewPassword.value) return toast('New passwords do not match.', 'error');
      const button = passwordForm.querySelector('button'); setLoading(button, true, 'Updating...');
      try { await API.request('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: passwordForm.currentPassword.value, newPassword: passwordForm.newPassword.value }) }); passwordForm.reset(); toast('Password changed successfully.', 'success'); }
      catch (error) { toast(error.message, 'error'); } finally { setLoading(button, false); }
    });
  }

  async function initAdminManagement() {
    const user = await currentUser('institution_admin'); if (!user) return;
    const main = document.querySelector('.admin-management');
    const load = async () => {
      try {
        const [{ admins, invites }, { hostels }] = await Promise.all([API.request('/admins'), API.request('/hostels/manage?all=true')]);
        const active = hostels.filter(h => h.isActive); const options = selected => active.map(h => `<option value="${h._id}" ${selected.includes(h._id) ? 'selected' : ''}>${escapeHtml(h.name)}</option>`).join('');
        const rows = admins.map(a => `<tr><td><strong>${escapeHtml(userName(a))}</strong><small>${escapeHtml(a.email)}</small></td><td><select multiple class="scope-select" data-admin-scope="${a._id}" aria-label="Assigned hostels">${options(a.managedHostels.map(h => h._id))}</select></td><td><span class="status ${a.isActive ? 'resolved' : 'pending'}">${a.isActive ? 'Active' : 'Revoked'}</span></td><td><button class="table-action" data-save-scope="${a._id}">Save assignment</button><button class="table-action danger-link" data-admin-status="${a._id}" data-active="${a.isActive}">${a.isActive ? 'Revoke' : 'Restore'}</button></td></tr>`).join('') || '<tr><td colspan="4">No hostel administrators yet.</td></tr>';
        const pending = invites.map(i => `<tr><td>${escapeHtml(`${i.firstName} ${i.surname}`)}<small>${escapeHtml(i.email)}</small></td><td>${escapeHtml(i.managedHostels.map(h => h.name).join(', '))}</td><td>${formatDate(i.expiresAt)}</td><td><button class="table-action danger-link" data-revoke-invite="${i._id}">Cancel invite</button></td></tr>`).join('') || '<tr><td colspan="4">No pending invitations.</td></tr>';
        main.innerHTML = `<div class="dashboard-heading"><div><span class="form-label">ACCESS CONTROL</span><h1>Administrators</h1><p>Invite hostel administrators and control exactly where they can work.</p></div></div><section class="dashboard-card"><div class="card-heading"><div><span>NEW ADMINISTRATOR</span><h3>Create a secure invitation</h3></div></div><form id="adminInviteForm" class="admin-invite-form"><input name="firstName" placeholder="First name" required minlength="2"><input name="surname" placeholder="Surname" required minlength="2"><input name="email" type="email" placeholder="Email address" required><select name="managedHostels" multiple required aria-label="Select managed hostels">${options([])}</select><button class="btn btn-primary">Create invite</button></form><small class="field-note">Hold Ctrl (Windows) or Command (Mac) to select multiple hostels. Invitations expire after 48 hours.</small><div class="invite-result" data-invite-result hidden></div></section><section class="dashboard-card table-card"><div class="card-heading"><div><span>ACTIVE ACCOUNTS</span><h3>Hostel administrators</h3></div></div><div class="table-wrapper"><table><thead><tr><th>Administrator</th><th>Assigned hostels</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="dashboard-card table-card"><div class="card-heading"><div><span>PENDING ACCESS</span><h3>Open invitations</h3></div></div><div class="table-wrapper"><table><thead><tr><th>Administrator</th><th>Hostels</th><th>Expires</th><th>Action</th></tr></thead><tbody>${pending}</tbody></table></div></section>`;
        const form = main.querySelector('#adminInviteForm'); form.addEventListener('submit', async e => { e.preventDefault(); const button = form.querySelector('button'); setLoading(button, true, 'Creating...'); const body = { firstName: form.firstName.value, surname: form.surname.value, email: form.email.value, managedHostels: [...form.managedHostels.selectedOptions].map(o => o.value) }; try { const data = await API.request('/admins/invites', { method: 'POST', body: JSON.stringify(body) }); const result = main.querySelector('[data-invite-result]'); result.hidden = false; result.innerHTML = `<strong>Invitation ready to send</strong><input readonly value="${escapeHtml(data.inviteUrl)}"><button type="button" class="btn btn-outline" data-copy-invite>Copy link</button>`; result.querySelector('button').onclick = async () => { await navigator.clipboard.writeText(data.inviteUrl); toast('Invitation link copied.', 'success'); }; toast('Invitation created. Copy the link and send it to the administrator.', 'success'); } catch (error) { toast(error.message, 'error'); } finally { setLoading(button, false); } });
        main.querySelectorAll('[data-save-scope]').forEach(button => button.onclick = async () => { const select = main.querySelector(`[data-admin-scope="${button.dataset.saveScope}"]`); button.disabled = true; try { await API.request(`/admins/${button.dataset.saveScope}/scope`, { method: 'PATCH', body: JSON.stringify({ managedHostels: [...select.selectedOptions].map(o => o.value) }) }); toast('Administrator assignment updated.', 'success'); } catch (e) { toast(e.message, 'error'); } finally { button.disabled = false; } });
        main.querySelectorAll('[data-admin-status]').forEach(button => button.onclick = async () => { button.disabled = true; try { await API.request(`/admins/${button.dataset.adminStatus}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: button.dataset.active !== 'true' }) }); toast(button.dataset.active === 'true' ? 'Administrator access revoked.' : 'Administrator access restored.', 'success'); await load(); } catch (e) { toast(e.message, 'error'); button.disabled = false; } });
        main.querySelectorAll('[data-revoke-invite]').forEach(button => button.onclick = async () => { button.disabled = true; try { await API.request(`/admins/invites/${button.dataset.revokeInvite}`, { method: 'DELETE' }); toast('Invitation cancelled.', 'success'); await load(); } catch (e) { toast(e.message, 'error'); button.disabled = false; } });
      } catch (error) { main.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
    }; await load();
  }

  async function initAcceptAdminInvite() {
    const root = document.querySelector('[data-invite-content]'); const token = new URLSearchParams(location.search).get('token'); if (!token) { root.className = 'error-state'; root.textContent = 'This invitation link is incomplete.'; return; }
    try { const { invite } = await API.request(`/admins/invites/${encodeURIComponent(token)}`); root.className = ''; root.innerHTML = `<span class="form-label">ADMINISTRATOR INVITATION</span><h1>Welcome, ${escapeHtml(invite.firstName)}</h1><p class="form-description">You’ve been invited to manage ${escapeHtml(invite.managedHostels.map(h => h.name).join(', '))}.</p><form id="acceptInviteForm"><div class="form-group"><label>Email</label><input value="${escapeHtml(invite.email)}" disabled></div><div class="form-group"><label for="invitePassword">Create password</label><input id="invitePassword" name="password" type="password" minlength="12" required autocomplete="new-password"></div><div class="form-group"><label for="inviteConfirm">Confirm password</label><input id="inviteConfirm" name="confirm" type="password" minlength="12" required autocomplete="new-password"></div><button class="btn btn-primary full-btn">Create administrator account</button></form>`; const form = root.querySelector('form'); form.onsubmit = async e => { e.preventDefault(); if (form.password.value !== form.confirm.value) return toast('Passwords do not match.', 'error'); const button = form.querySelector('button'); setLoading(button, true, 'Creating account...'); try { await API.request('/admins/invites/accept', { method: 'POST', body: JSON.stringify({ token, password: form.password.value }) }); toast('Administrator account created.', 'success'); setTimeout(() => redirect('login.html'), 800); } catch (error) { toast(error.message, 'error'); setLoading(button, false); } }; } catch (error) { root.className = 'error-state'; root.textContent = error.message; }
  }

  ({ 'login.html': initLogin, 'register.html': initRegister, 'student-dashboard.html': initStudentDashboard, 'assessment.html': initAssessment, 'complaints.html': initComplaints, 'admin-dashboard.html': initAdmin, 'profile.html': initProfile, 'admins.html': initAdminManagement, 'accept-admin-invite.html': initAcceptAdminInvite }[page] || (() => {}))();
})();
