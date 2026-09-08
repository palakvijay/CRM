/* ==========================================================================
   CRM Platform — Shared Application Logic
   Used by: index.html, leads.html, contacts.html, analytics.html, settings.html
  Provides: LocalStorage-backed shared state (leads, contacts, activity,
  activityLog, tasks, settings), shared chrome behavior (nav highlight,
  sidebar toggle, dark mode), and per-page rendering/interaction logic.
   ========================================================================== */

(() => {
  const STORAGE_KEY = 'crm.state';
  const SIDEBAR_STATE_KEY = 'crm.sidebarCollapsed';

  const STAGE_LABELS = {
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    closedWon: 'Closed Won',
  };

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  /* ---------- Seed Data ---------- */

  function createSeedState() {
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString();
    };

    return {
      leads: [
        { id: 'lead-1', name: 'Sarah Johnson', company: 'Acme Corp', value: 15000, stage: 'contacted', createdAt: daysAgo(2), contactId: 'contact-1' },
        { id: 'lead-2', name: 'Michael Chen', company: 'Globex Inc', value: 32000, stage: 'contacted', createdAt: daysAgo(5), contactId: 'contact-2' },
        { id: 'lead-3', name: 'Laura Perez', company: 'Initech', value: 21000, stage: 'qualified', createdAt: daysAgo(8), contactId: 'contact-3' },
        { id: 'lead-4', name: 'David Kim', company: 'Umbrella LLC', value: 48000, stage: 'proposal', createdAt: daysAgo(12), contactId: 'contact-4' },
        { id: 'lead-5', name: 'Emily Davis', company: 'Stark Industries', value: 60000, stage: 'closedWon', createdAt: daysAgo(20), wonAt: daysAgo(1), contactId: 'contact-5' },
        { id: 'lead-6', name: 'James Wilson', company: 'Wayne Enterprises', value: 12000, stage: 'qualified', createdAt: daysAgo(15), contactId: 'contact-6' },
      ],
      contacts: [
        { id: 'contact-1', name: 'Sarah Johnson', company: 'Acme Corp', email: 'sarah.johnson@acmecorp.com', phone: '(555) 010-0001', status: 'lead' },
        { id: 'contact-2', name: 'Michael Chen', company: 'Globex Inc', email: 'michael.chen@globex.com', phone: '(555) 010-0002', status: 'lead' },
        { id: 'contact-3', name: 'Laura Perez', company: 'Initech', email: 'laura.perez@initech.com', phone: '(555) 010-0003', status: 'lead' },
        { id: 'contact-4', name: 'David Kim', company: 'Umbrella LLC', email: 'david.kim@umbrella.com', phone: '(555) 010-0004', status: 'lead' },
        { id: 'contact-5', name: 'Emily Davis', company: 'Stark Industries', email: 'emily.davis@stark.com', phone: '(555) 010-0005', status: 'customer' },
        { id: 'contact-6', name: 'James Wilson', company: 'Wayne Enterprises', email: 'james.wilson@wayne.com', phone: '(555) 010-0006', status: 'lead' },
      ],
      activity: [
        { id: 'act-1', message: 'Deal won: Emily Davis (Stark Industries)', timestamp: daysAgo(1) },
        { id: 'act-2', message: 'New lead added: Sarah Johnson (Acme Corp)', timestamp: daysAgo(2) },
        { id: 'act-3', message: 'New lead added: Michael Chen (Globex Inc)', timestamp: daysAgo(5) },
        { id: 'act-4', message: 'New lead added: Laura Perez (Initech)', timestamp: daysAgo(8) },
        { id: 'act-5', message: 'New lead added: David Kim (Umbrella LLC)', timestamp: daysAgo(12) },
        { id: 'act-6', message: 'New lead added: James Wilson (Wayne Enterprises)', timestamp: daysAgo(15) },
        { id: 'act-7', message: 'New lead added: Emily Davis (Stark Industries)', timestamp: daysAgo(20) },
      ],
      activityLog: [],
      tasks: [
        { id: 'task-1', leadId: 'lead-1', title: 'Schedule follow-up call', dueAt: daysAgo(-1), priority: 'high', status: 'open', createdAt: daysAgo(2), completedAt: null },
        { id: 'task-2', leadId: 'lead-3', title: 'Send qualification notes', dueAt: daysAgo(2), priority: 'medium', status: 'open', createdAt: daysAgo(4), completedAt: null },
        { id: 'task-3', leadId: 'lead-4', title: 'Review proposal feedback', dueAt: daysAgo(-3), priority: 'low', status: 'open', createdAt: daysAgo(1), completedAt: null },
      ],
      settings: {
        profileName: 'Admin',
        profileEmail: 'admin@crmplatform.com',
        emailNotifications: true,
        darkMode: false,
      },
    };
  }

  /* ---------- State Persistence ---------- */

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (!Array.isArray(state.tasks)) state.tasks = [];
        if (!Array.isArray(state.activityLog)) state.activityLog = [];
        saveState(state);
        return state;
      }
    } catch (err) {
      console.warn('Failed to read CRM state from LocalStorage, reseeding.', err);
    }
    const seeded = createSeedState();
    saveState(seeded);
    return seeded;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function logActivity(state, message) {
    state.activity.unshift({ id: uid('act'), message, timestamp: new Date().toISOString() });
    state.activity = state.activity.slice(0, 20);
  }

  /* ---------- Helpers ---------- */

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatRelativeDate(isoString) {
    const diffDays = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return new Date(isoString).toLocaleDateString();
  }

  function formatTaskDueDate(isoString) {
    if (!isoString) return 'No due date';
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* ---------- Shared Chrome (sidebar, topbar, dark mode) ---------- */

  function applyDarkMode(state) {
    document.body.classList.toggle('dark-mode', Boolean(state.settings.darkMode));
  }

  function initSharedChrome(state) {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const currentPage = document.body.dataset.page;
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const appShell = document.querySelector('.app-shell');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (appShell && localStorage.getItem(SIDEBAR_STATE_KEY) === 'true') {
      appShell.classList.add('sidebar-collapsed');
    }

    if (sidebarToggle && appShell) {
      sidebarToggle.addEventListener('click', () => {
        const collapsed = appShell.classList.toggle('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_STATE_KEY, collapsed);
      });
    }

    applyDarkMode(state);
  }

  /* ---------- Dashboard (index.html) ---------- */

  function initDashboard(state) {
    const totalRevenue = state.leads
      .filter((lead) => lead.stage === 'closedWon')
      .reduce((sum, lead) => sum + lead.value, 0);

    const activePipeline = state.leads
      .filter((lead) => lead.stage !== 'closedWon')
      .reduce((sum, lead) => sum + lead.value, 0);

    const totalLeads = state.leads.length;
    const closedWonCount = state.leads.filter((lead) => lead.stage === 'closedWon').length;
    const winRate = totalLeads === 0 ? 0 : Math.round((closedWonCount / totalLeads) * 100);

    const metricValues = {
      totalRevenue: currencyFormatter.format(totalRevenue),
      activePipeline: currencyFormatter.format(activePipeline),
      winRate: `${winRate}%`,
    };

    document.querySelectorAll('.metric-card').forEach((card) => {
      const key = card.dataset.metric;
      const valueEl = card.querySelector('.metric-value');
      if (valueEl && metricValues[key] !== undefined) {
        valueEl.textContent = metricValues[key];
      }
    });

    const activityList = document.getElementById('recentActivity');
    if (activityList) {
      activityList.innerHTML = '';
      const entries = state.activity.slice(0, 6);
      if (entries.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No recent activity yet.';
        activityList.appendChild(li);
      } else {
        entries.forEach((entry) => {
          const li = document.createElement('li');
          li.className = 'activity-item';
          const span = document.createElement('span');
          span.textContent = entry.message;
          const time = document.createElement('time');
          time.textContent = formatRelativeDate(entry.timestamp);
          li.appendChild(span);
          li.appendChild(time);
          activityList.appendChild(li);
        });
      }
    }

    const taskWidget = document.getElementById('widget-pending-tasks');
    if (taskWidget) {
      const pendingTasks = state.tasks
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''));
      const count = taskWidget.querySelector('.pending-task-count');
      const list = taskWidget.querySelector('.pending-task-list');

      if (count) count.textContent = `${pendingTasks.length} pending`;
      if (list) {
        list.innerHTML = '';
        if (pendingTasks.length === 0) {
          const empty = document.createElement('li');
          empty.className = 'task-empty';
          empty.textContent = 'No pending tasks.';
          list.appendChild(empty);
        } else {
          pendingTasks.slice(0, 5).forEach((task) => {
            const lead = state.leads.find((item) => item.id === task.leadId);
            const item = document.createElement('li');
            item.className = 'pending-task-item';

            const details = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = task.title;
            const leadName = document.createElement('span');
            leadName.textContent = lead ? lead.name : 'Unassigned lead';
            details.append(title, leadName);

            const dueDate = document.createElement('time');
            dueDate.textContent = formatTaskDueDate(task.dueAt);
            item.append(details, dueDate);
            list.appendChild(item);
          });
        }
      }
    }
  }

  /* ---------- Leads / Kanban (leads.html) ---------- */

  function initLeads(state) {
    const board = document.querySelector('.kanban-board');
    if (!board) return;
    const kanbanLists = [...board.querySelectorAll('.kanban-cards')];

    function render() {
      kanbanLists.forEach((col) => {
        col.innerHTML = '';
      });

      state.leads.forEach((lead) => {
        const list = board.querySelector(`.kanban-cards[data-stage-list="${lead.stage}"]`);
        if (!list) return;

        const card = document.createElement('article');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.leadId = lead.id;
        card.addEventListener('dragstart', (event) => {
          event.dataTransfer.setData('text/plain', lead.id);
          event.dataTransfer.effectAllowed = 'move';
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));

        const name = document.createElement('h3');
        name.textContent = lead.name;

        const company = document.createElement('p');
        company.className = 'kanban-card-company';
        company.textContent = lead.company || '—';

        const value = document.createElement('p');
        value.className = 'kanban-card-value';
        value.textContent = currencyFormatter.format(lead.value);

        const select = document.createElement('select');
        select.className = 'stage-select';
        select.setAttribute('aria-label', `Move ${lead.name} to a different stage`);
        Object.entries(STAGE_LABELS).forEach(([stageKey, label]) => {
          const option = document.createElement('option');
          option.value = stageKey;
          option.textContent = label;
          if (stageKey === lead.stage) option.selected = true;
          select.appendChild(option);
        });
        select.addEventListener('change', () => moveLeadStage(lead.id, select.value));

        const taskButton = document.createElement('button');
        taskButton.type = 'button';
        taskButton.className = 'task-card-button';
        taskButton.textContent = 'Tasks';
        taskButton.addEventListener('click', (event) => {
          event.stopPropagation();
          openTaskModal(lead);
        });

        card.append(name, company, value, select, taskButton);
        list.appendChild(card);
      });
    }

    const taskModal = document.getElementById('modal-lead-tasks');
    const taskModalTitle = document.getElementById('leadTasksTitle');
    const taskList = document.getElementById('leadTaskList');
    const taskForm = document.getElementById('addTaskForm');
    const taskLeadId = document.getElementById('taskLeadId');
    const taskTitle = document.getElementById('taskTitle');
    const taskDueAt = document.getElementById('taskDueAt');
    const taskPriority = document.getElementById('taskPriority');
    const closeTaskModalBtn = document.getElementById('closeLeadTasks');

    function renderTaskChecklist(lead) {
      if (!taskList) return;
      taskList.innerHTML = '';
      const leadTasks = state.tasks.filter((task) => task.leadId === lead.id);

      if (leadTasks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'task-empty';
        empty.textContent = 'No tasks for this lead.';
        taskList.appendChild(empty);
        return;
      }

      leadTasks.forEach((task) => {
        const item = document.createElement('li');
        item.className = `task-item${task.status === 'completed' ? ' is-complete' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'completed';
        checkbox.setAttribute('aria-label', `Complete ${task.title}`);
        checkbox.addEventListener('change', () => {
          task.status = checkbox.checked ? 'completed' : 'open';
          task.completedAt = checkbox.checked ? new Date().toISOString() : null;
          saveState(state);
          renderTaskChecklist(lead);
        });

        const details = document.createElement('div');
        const title = document.createElement('span');
        title.textContent = task.title;
        const meta = document.createElement('small');
        meta.textContent = `${task.priority} priority · Due ${formatTaskDueDate(task.dueAt)}`;
        details.append(title, meta);
        item.append(checkbox, details);
        taskList.appendChild(item);
      });
    }

    function openTaskModal(lead) {
      if (!taskModal) return;
      taskModalTitle.textContent = `Tasks for ${lead.name}`;
      taskLeadId.value = lead.id;
      renderTaskChecklist(lead);
      taskModal.hidden = false;
      taskTitle.focus();
    }

    function closeTaskModal() {
      if (!taskModal) return;
      taskModal.hidden = true;
      taskForm.reset();
    }

    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (taskModal) {
      taskModal.addEventListener('click', (event) => {
        if (event.target === taskModal) closeTaskModal();
      });
    }
    if (taskForm) {
      taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = taskTitle.value.trim();
        if (!title) return;

        const dueAt = taskDueAt.value ? new Date(`${taskDueAt.value}T12:00:00`).toISOString() : '';
        state.tasks.push({
          id: uid('task'),
          leadId: taskLeadId.value,
          title,
          dueAt,
          priority: taskPriority.value,
          status: 'open',
          createdAt: new Date().toISOString(),
          completedAt: null,
        });
        saveState(state);
        const lead = state.leads.find((item) => item.id === taskLeadId.value);
        if (lead) renderTaskChecklist(lead);
        taskForm.reset();
      });
    }

    function moveLeadStage(leadId, newStage) {
      const lead = state.leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === newStage) return;

      lead.stage = newStage;
      if (newStage === 'closedWon') {
        lead.wonAt = new Date().toISOString();
      } else {
        delete lead.wonAt;
      }

      const contact = state.contacts.find((c) => c.id === lead.contactId);
      if (contact) {
        contact.status = newStage === 'closedWon' ? 'customer' : 'lead';
      }

      logActivity(state, `Moved ${lead.name} to ${STAGE_LABELS[newStage]}`);
      saveState(state);
      render();
    }

    // Drag-and-drop between columns (columns are static in the DOM; only
    // their card contents are re-rendered, so listeners attach once here).
    kanbanLists.forEach((column) => {
      column.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
      });
      column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
      column.addEventListener('drop', (event) => {
        event.preventDefault();
        column.classList.remove('drag-over');
        const leadId = event.dataTransfer.getData('text/plain');
        moveLeadStage(leadId, column.dataset.stageList);
      });
    });

    const addLeadBtn = document.getElementById('addLeadBtn');
    const modal = document.getElementById('addLeadModal');
    const form = document.getElementById('addLeadForm');
    const cancelBtn = document.getElementById('cancelAddLead');
    const leadNameInput = document.getElementById('leadName');
    const leadCompanyInput = document.getElementById('leadCompany');
    const leadValueInput = document.getElementById('leadValue');

    function openModal() {
      modal.hidden = false;
      leadNameInput.focus();
    }

    function closeModal() {
      modal.hidden = true;
      form.reset();
    }

    if (addLeadBtn) addLeadBtn.addEventListener('click', openModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = leadNameInput.value.trim();
        const company = leadCompanyInput.value.trim();
        const value = leadValueInput ? Number(leadValueInput.value) || 0 : 0;
        if (!name) return;

        const contactId = uid('contact');
        state.contacts.push({ id: contactId, name, company, email: '', phone: '', status: 'lead' });
        state.leads.push({
          id: uid('lead'),
          name,
          company,
          value,
          stage: 'contacted',
          createdAt: new Date().toISOString(),
          contactId,
        });

        logActivity(state, `New lead added: ${name}${company ? ` (${company})` : ''}`);
        saveState(state);
        render();
        closeModal();
      });
    }

    render();
  }

  /* ---------- Contacts (contacts.html) ---------- */

  function initContacts(state) {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('contactSearch');
    const filterSelect = document.getElementById('contactFilter');
    const exportContactsBtn = document.getElementById('exportContactsBtn');
    const editModal = document.getElementById('editContactModal');
    const editForm = document.getElementById('editContactForm');
    const cancelEditBtn = document.getElementById('cancelEditContact');
    const activityDrawer = document.getElementById('contact-activity-drawer');
    const activityDrawerTitle = document.getElementById('contactActivityTitle');
    const activityTimeline = document.getElementById('contactActivityTimeline');
    const activityForm = document.getElementById('contactActivityForm');
    const activityContactId = document.getElementById('activityContactId');
    const activityType = document.getElementById('activityType');
    const activityNotes = document.getElementById('activityNotes');
    const activityTimestamp = document.getElementById('activityTimestamp');
    const closeActivityDrawerBtn = document.getElementById('closeContactActivity');
    const editContactIdInput = document.getElementById('editContactId');
    const editContactNameInput = document.getElementById('editContactName');
    const editContactCompanyInput = document.getElementById('editContactCompany');
    const editContactEmailInput = document.getElementById('editContactEmail');
    const editContactPhoneInput = document.getElementById('editContactPhone');

    function renderActivityTimeline(contact) {
      if (!activityTimeline) return;
      activityTimeline.innerHTML = '';
      const entries = state.activityLog
        .filter((entry) => entry.contactId === contact.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (entries.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'activity-empty';
        empty.textContent = 'No interactions logged yet.';
        activityTimeline.appendChild(empty);
        return;
      }

      entries.forEach((entry) => {
        const item = document.createElement('article');
        item.className = 'contact-activity-entry';
        const heading = document.createElement('h3');
        heading.textContent = entry.type;
        const time = document.createElement('time');
        time.dateTime = entry.timestamp;
        time.textContent = new Date(entry.timestamp).toLocaleString();
        const notes = document.createElement('p');
        notes.textContent = entry.notes;
        item.append(heading, time, notes);
        activityTimeline.appendChild(item);
      });
    }

    function openActivityDrawer(contact) {
      if (!activityDrawer) return;
      activityDrawerTitle.textContent = `Interaction History: ${contact.name}`;
      activityContactId.value = contact.id;
      renderActivityTimeline(contact);
      activityDrawer.hidden = false;
    }

    function closeActivityDrawer() {
      if (!activityDrawer) return;
      activityDrawer.hidden = true;
      activityForm.reset();
    }

    function getFilteredContacts() {
      const term = (searchInput?.value || '').toLowerCase().trim();
      const filter = filterSelect?.value || 'all';

      return state.contacts.filter((contact) => {
        const matchesTerm = !term || [contact.name, contact.company, contact.email]
          .some((field) => (field || '').toLowerCase().includes(term));
        const matchesFilter = filter === 'all' || contact.status === filter;
        return matchesTerm && matchesFilter;
      });
    }

    function escapeCsvValue(value) {
      const text = String(value ?? '');
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    }

    function exportContacts() {
      const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Status'];
      const rows = getFilteredContacts().map((contact) => [
        contact.id,
        contact.name,
        contact.company,
        contact.email,
        contact.phone,
        contact.status,
      ]);
      const csv = `\uFEFF${[headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crm-contacts.csv';
      link.click();
      URL.revokeObjectURL(url);
    }

    function render() {
      const filtered = getFilteredContacts();

      tbody.innerHTML = '';

      if (filtered.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'table-empty';
        cell.textContent = 'No contacts match your search.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
      }

      filtered.forEach((contact) => {
        const row = document.createElement('tr');
        row.className = 'contact-row';
        row.tabIndex = 0;

        const nameCell = document.createElement('td');
        nameCell.textContent = contact.name;
        const companyCell = document.createElement('td');
        companyCell.textContent = contact.company || '—';
        const emailCell = document.createElement('td');
        emailCell.textContent = contact.email || '—';
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge status-${contact.status}`;
        badge.textContent = contact.status === 'customer' ? 'Customer' : 'Lead';
        statusCell.appendChild(badge);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'icon-btn';
        viewBtn.setAttribute('aria-label', `View details for ${contact.name}`);
        viewBtn.innerHTML = '<i data-lucide="eye"></i>';
        viewBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          openActivityDrawer(contact);
        });

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'icon-btn';
        editBtn.setAttribute('aria-label', `Edit ${contact.name}`);
        editBtn.innerHTML = '<i data-lucide="pencil"></i>';
        editBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          openEditModal(contact);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'icon-btn';
        deleteBtn.setAttribute('aria-label', `Delete ${contact.name}`);
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          deleteContact(contact.id);
        });

        actionsCell.append(viewBtn, editBtn, deleteBtn);
        row.append(nameCell, companyCell, emailCell, statusCell, actionsCell);

        const detailRow = document.createElement('tr');
        detailRow.className = 'contact-detail-row';
        detailRow.hidden = true;
        const detailCell = document.createElement('td');
        detailCell.colSpan = 5;
        detailCell.textContent = `Phone: ${contact.phone || 'Not provided'}`;
        detailRow.appendChild(detailCell);

        row.addEventListener('click', () => {
          openActivityDrawer(contact);
        });

        tbody.append(row, detailRow);
      });

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    if (closeActivityDrawerBtn) closeActivityDrawerBtn.addEventListener('click', closeActivityDrawer);
    if (activityDrawer) {
      activityDrawer.addEventListener('click', (event) => {
        if (event.target === activityDrawer) closeActivityDrawer();
      });
    }
    if (activityForm) {
      activityForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const notes = activityNotes.value.trim();
        if (!notes || !activityContactId.value) return;

        const timestamp = activityTimestamp.value
          ? new Date(activityTimestamp.value).toISOString()
          : new Date().toISOString();
        state.activityLog.push({
          id: uid('interaction'),
          contactId: activityContactId.value,
          type: activityType.value,
          notes,
          timestamp,
        });
        saveState(state);
        const contact = state.contacts.find((item) => item.id === activityContactId.value);
        if (contact) renderActivityTimeline(contact);
        activityNotes.value = '';
        activityTimestamp.value = '';
      });
    }

    function openEditModal(contact) {
      if (!editModal || !editForm) return;
      editContactIdInput.value = contact.id;
      editContactNameInput.value = contact.name || '';
      editContactCompanyInput.value = contact.company || '';
      editContactEmailInput.value = contact.email || '';
      editContactPhoneInput.value = contact.phone || '';
      editModal.hidden = false;
      editContactNameInput.focus();
    }

    function closeEditModal() {
      if (!editModal || !editForm) return;
      editModal.hidden = true;
      editForm.reset();
    }

    function deleteContact(contactId) {
      const contact = state.contacts.find((c) => c.id === contactId);
      if (!contact) return;
      if (!window.confirm(`Delete contact "${contact.name}"? This also removes any linked lead.`)) return;

      state.contacts = state.contacts.filter((c) => c.id !== contactId);
      state.leads = state.leads.filter((lead) => lead.contactId !== contactId);
      logActivity(state, `Deleted contact: ${contact.name}`);
      saveState(state);
      render();
    }

    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) {
      editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeEditModal();
      });
    }
    if (editForm) {
      editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const contactId = editContactIdInput.value;
        const contact = state.contacts.find((c) => c.id === contactId);
        if (!contact) return;

        const name = editContactNameInput.value.trim();
        if (!name) return;

        contact.name = name;
        contact.company = editContactCompanyInput.value.trim();
        contact.email = editContactEmailInput.value.trim();
        contact.phone = editContactPhoneInput.value.trim();

        const linkedLead = state.leads.find((lead) => lead.contactId === contactId);
        if (linkedLead) {
          linkedLead.name = contact.name;
          linkedLead.company = contact.company;
        }

        logActivity(state, `Updated contact: ${contact.name}`);
        saveState(state);
        render();
        closeEditModal();
      });
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (filterSelect) filterSelect.addEventListener('change', render);
    if (exportContactsBtn) exportContactsBtn.addEventListener('click', exportContacts);

    render();
  }


  /* ---------- Analytics (analytics.html) ---------- */

  function initAnalytics(state) {
    const revenueCanvas = document.getElementById('revenueTrendChart');
    const pipelineCanvas = document.getElementById('pipelineDistributionChart');
    if (!window.Chart) return;

    if (revenueCanvas) {
      const months = [];
      const totals = [];
      const now = new Date();

      for (let i = 5; i >= 0; i -= 1) {
        const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(bucketDate.toLocaleString('default', { month: 'short' }));
        const monthTotal = state.leads
          .filter((lead) => lead.stage === 'closedWon' && lead.wonAt)
          .filter((lead) => {
            const wonDate = new Date(lead.wonAt);
            return wonDate.getMonth() === bucketDate.getMonth() && wonDate.getFullYear() === bucketDate.getFullYear();
          })
          .reduce((sum, lead) => sum + lead.value, 0);
        totals.push(monthTotal);
      }

      new window.Chart(revenueCanvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Revenue Won',
            data: totals,
            borderColor: '#117ACA',
            backgroundColor: 'rgba(17, 122, 202, 0.12)',
            tension: 0.35,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    if (pipelineCanvas) {
      const stageOrder = ['contacted', 'qualified', 'proposal', 'closedWon'];
      const counts = stageOrder.map((stage) => state.leads.filter((lead) => lead.stage === stage).length);

      new window.Chart(pipelineCanvas, {
        type: 'doughnut',
        data: {
          labels: stageOrder.map((stage) => STAGE_LABELS[stage]),
          datasets: [{
            data: counts,
            backgroundColor: ['#117ACA', '#B86B00', '#426B8A', '#008A8A'],
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }
  }

  /* ---------- Settings (settings.html) ---------- */

  function initSettings(state) {
    const profileForm = document.getElementById('profileForm');
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const emailNotifCheckbox = document.getElementById('emailNotifications');
    const darkModeCheckbox = document.getElementById('darkModeToggle');
    const saveStatus = document.getElementById('profileSaveStatus');

    if (nameInput) nameInput.value = state.settings.profileName || '';
    if (emailInput) emailInput.value = state.settings.profileEmail || '';
    if (emailNotifCheckbox) emailNotifCheckbox.checked = Boolean(state.settings.emailNotifications);
    if (darkModeCheckbox) darkModeCheckbox.checked = Boolean(state.settings.darkMode);

    if (profileForm) {
      profileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        state.settings.profileName = nameInput.value.trim();
        state.settings.profileEmail = emailInput.value.trim();
        logActivity(state, 'Profile updated');
        saveState(state);
        if (saveStatus) {
          saveStatus.textContent = 'Profile saved.';
          setTimeout(() => {
            saveStatus.textContent = '';
          }, 2500);
        }
      });
    }

    if (emailNotifCheckbox) {
      emailNotifCheckbox.addEventListener('change', () => {
        state.settings.emailNotifications = emailNotifCheckbox.checked;
        saveState(state);
      });
    }

    if (darkModeCheckbox) {
      darkModeCheckbox.addEventListener('change', () => {
        state.settings.darkMode = darkModeCheckbox.checked;
        saveState(state);
        applyDarkMode(state);
      });
    }
  }

  /* ---------- Entry Point ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    const state = loadState();
    initSharedChrome(state);

    switch (document.body.dataset.page) {
      case 'dashboard':
        initDashboard(state);
        break;
      case 'leads':
        initLeads(state);
        break;
      case 'contacts':
        initContacts(state);
        break;
      case 'analytics':
        initAnalytics(state);
        break;
      case 'settings':
        initSettings(state);
        break;
      default:
        break;
    }
  });
})();
