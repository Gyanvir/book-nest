// ============================================================
//  BookNest — Books CRUD Logic
//  Module 3: js/books.js
//  Depends on: ui.js, validate.js
// ============================================================

const API_BASE = '../api/books.php';

// ── State ────────────────────────────────────────────────────
const state = {
  books:       [],      // current page data
  allBooks:    [],      // all books for client-side search
  meta:        { page: 1, per_page: 10, total: 0, total_pages: 1 },
  filters:     { q: '', genre: '', status: '' },
  editingId:   null,    // book_id being edited (null = add)
  deletingId:  null,    // book_id being deleted
  viewingBook: null,    // book being viewed in panel
  sortCol:     '',
  sortDir:     'asc',
};

// ── DOM Refs ─────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadBooks();
  loadStats();
});

function initUI() {
  // Search (debounced)
  $('#searchInput').addEventListener('input', debounce((e) => {
    state.filters.q = e.target.value.trim();
    state.meta.page = 1;
    if (state.filters.q === '') {
      renderTable(state.books);
    } else {
      clientSearch();
    }
  }, 250));

  // Genre filter
  $('#genreFilter').addEventListener('change', (e) => {
    state.filters.genre = e.target.value;
    state.meta.page = 1;
    loadBooks();
  });

  // Status filter
  $('#statusFilter').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.meta.page = 1;
    loadBooks();
  });

  // Add Book button
  $('#btnAddBook').addEventListener('click', openAddModal);

  // Modal close buttons
  $$('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.closeModal || btn.closest('.modal-overlay')?.id;
      if (target) Modal.close(target);
    });
  });

  // View panel close
  $('#btnClosePanel').addEventListener('click', () => Panel.close('viewPanel'));
  $('#viewPanelOverlay').addEventListener('click', () => Panel.close('viewPanel'));

  // Form submit — Add / Edit
  $('#bookForm').addEventListener('submit', handleFormSubmit);

  // Cover URL live preview
  $('#fieldCover_url').addEventListener('input', debounce((e) => {
    updateCoverPreview(e.target.value, 'formCoverPreview');
  }, 400));

  // Confirm delete
  $('#btnConfirmDelete').addEventListener('click', confirmDelete);

  // Sort headers
  $$('[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const sorted = TableSort.sortData(state.books, col);
      TableSort.updateHeaders($$('[data-col]'), col);
      state.books = sorted;
      renderTable(state.books);
    });
  });

  // Modal backdrop close
  Modal.initBackdropClose();

  // Mobile hamburger
  $('#hamburger')?.addEventListener('click', () => {
    $('#sidebar').classList.toggle('mobile-open');
  });

  // Attach live validation to form
  Validate.attachLiveValidation($('#bookForm'));
}

// ── API Calls ─────────────────────────────────────────────────

async function loadBooks() {
  showTableState('loading');

  const params = new URLSearchParams({
    action: 'list',
    page:   state.meta.page,
    per:    state.meta.per_page,
    ...(state.filters.genre  ? { genre:  state.filters.genre }  : {}),
    ...(state.filters.status ? { status: state.filters.status } : {}),
  });

  try {
    const res  = await fetch(`${API_BASE}?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    state.books    = data.data;
    state.allBooks = data.data;
    state.meta     = data.meta;

    renderTable(state.books);
    Pagination.render('paginationBar', state.meta, (page) => {
      state.meta.page = page;
      loadBooks();
    });
    updateStats(state.meta.total);
  } catch (err) {
    showTableState('error', err.message);
    Toast.show('error', 'Failed to load books', err.message);
  }
}

async function loadStats() {
  try {
    const res  = await fetch(`${API_BASE}?action=list&per=1`);
    const data = await res.json();
    if (data.success) {
      $('#statTotalBooks').textContent = data.meta.total;
    }
    // fetch available count
    const res2  = await fetch(`${API_BASE}?action=list&per=1&status=available`);
    const data2 = await res2.json();
    if (data2.success) $('#statAvailable').textContent = data2.meta.total;

    const res3  = await fetch(`${API_BASE}?action=list&per=1&status=unavailable`);
    const data3 = await res3.json();
    if (data3.success) $('#statUnavailable').textContent = data3.meta.total;
  } catch { /* stats are non-critical */ }
}

function updateStats(total) {
  $('#statTotalBooks').textContent = total;
}

async function saveBook(payload) {
  const isEdit = !!payload.book_id;
  const method = isEdit ? 'PUT' : 'POST';
  const action = isEdit ? 'update' : 'add';

  const res  = await fetch(`${API_BASE}?action=${action}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function deleteBookById(id) {
  const res = await fetch(`${API_BASE}?action=delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: id }),
  });
  return res.json();
}

// ── Table Render ─────────────────────────────────────────────

function renderTable(books) {
  const tbody = $('#booksTableBody');
  if (!tbody) return;

  if (!books || books.length === 0) {
    showTableState('empty');
    return;
  }

  hideTableState();
  tbody.innerHTML = books.map(book => buildRow(book)).join('');

  // Attach row action listeners
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteConfirm(parseInt(btn.dataset.id), btn.dataset.title));
  });
  tbody.querySelectorAll('.book-title-link').forEach(link => {
    link.addEventListener('click', () => openViewPanel(parseInt(link.dataset.id)));
  });
}

function buildRow(book) {
  const avail   = parseInt(book.available);
  const total   = parseInt(book.total_copies);
  const pct     = total > 0 ? (avail / total) * 100 : 0;
  const fillCls = pct === 0 ? 'none' : pct <= 25 ? 'low' : '';

  const coverHtml = book.cover_url
    ? `<img src="${escHtml(book.cover_url)}" alt="Cover" class="book-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`
    : '';
  const placeholderHtml = `<div class="book-cover-placeholder" ${book.cover_url ? 'style="display:none"' : ''}>📚</div>`;

  return `
  <tr data-id="${book.book_id}">
    <td>
      <div class="book-cell">
        ${coverHtml}
        ${placeholderHtml}
        <div class="book-details">
          <div class="book-title book-title-link" data-id="${book.book_id}" style="cursor:pointer">${escHtml(book.title)}</div>
          <div class="book-isbn">${escHtml(book.isbn)}</div>
        </div>
      </div>
    </td>
    <td>${escHtml(book.author)}</td>
    <td>${book.genre ? `<span class="badge-genre">${escHtml(book.genre)}</span>` : '—'}</td>
    <td>${book.year ?? '—'}</td>
    <td>
      <div class="availability">
        <div class="avail-bar"><div class="avail-fill ${fillCls}" style="width:${pct}%"></div></div>
        <div class="avail-text">${avail} / ${total}</div>
      </div>
    </td>
    <td>
      <div class="actions-cell">
        <button class="btn btn-icon btn-edit" data-id="${book.book_id}" title="Edit book" aria-label="Edit ${escHtml(book.title)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-icon btn-delete" data-id="${book.book_id}" data-title="${escHtml(book.title)}" title="Delete book" aria-label="Delete ${escHtml(book.title)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </td>
  </tr>`.trim();
}

// ── Table States ─────────────────────────────────────────────

function showTableState(type, msg) {
  const tbody = $('#booksTableBody');
  const msgs = {
    loading: `<tr><td colspan="6"><div class="table-loading"><div class="spinner"></div><p>Loading books…</p></div></td></tr>`,
    empty:   `<tr><td colspan="6"><div class="table-empty"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><p>No books found. Add your first book!</p></div></td></tr>`,
    error:   `<tr><td colspan="6"><div class="table-empty"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>${escHtml(msg ?? 'Something went wrong')}</p></div></td></tr>`,
  };
  if (tbody) tbody.innerHTML = msgs[type] ?? '';
}

function hideTableState() { /* rows are already replaced */ }

// ── Client-side Search ───────────────────────────────────────

function clientSearch() {
  const q = state.filters.q.toLowerCase();
  const filtered = state.allBooks.filter(b =>
    b.title?.toLowerCase().includes(q) ||
    b.author?.toLowerCase().includes(q) ||
    b.isbn?.toLowerCase().includes(q) ||
    b.publisher?.toLowerCase().includes(q) ||
    b.genre?.toLowerCase().includes(q)
  );
  renderTable(filtered);
  // Update pagination info for filtered count
  const fakeMeta = { ...state.meta, total: filtered.length, total_pages: 1, page: 1 };
  Pagination.render('paginationBar', fakeMeta, () => {});
}

// ── Add / Edit Modal ─────────────────────────────────────────

function openAddModal() {
  state.editingId = null;
  const form = $('#bookForm');
  Validate.clearForm(form);
  $('#modalTitle').textContent = 'Add New Book';
  $('#modalSubtitle').textContent = 'Fill in the details below to add a book to the catalogue';
  $('#fieldAvailable').closest('.form-group').style.display = 'none';
  updateCoverPreview('', 'formCoverPreview');
  Modal.open('bookModal');
  form.querySelector('[data-validate="isbn"]')?.focus();
}

function openEditModal(id) {
  const book = state.books.find(b => parseInt(b.book_id) === id);
  if (!book) { Toast.show('error', 'Book not found'); return; }

  state.editingId = id;
  const form = $('#bookForm');
  Validate.clearForm(form);

  $('#modalTitle').textContent = 'Edit Book';
  $('#modalSubtitle').textContent = 'Update the book details below';
  $('#fieldAvailable').closest('.form-group').style.display = '';

  // Pre-fill fields
  const map = {
    isbn: 'isbn', title: 'title', author: 'author',
    publisher: 'publisher', year: 'year', genre: 'genre',
    total_copies: 'total_copies', available: 'available',
    cover_url: 'cover_url', description: 'description',
  };
  for (const [field, key] of Object.entries(map)) {
    const el = $(`#field${capitalize(field)}`);
    if (el) el.value = book[key] ?? '';
  }
  updateCoverPreview(book.cover_url, 'formCoverPreview');
  Modal.open('bookModal');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const { valid, errors } = Validate.validateForm(form);

  if (!valid) {
    Validate.showAllErrors(form, errors);
    Toast.show('error', 'Please fix the errors', 'Check all required fields');
    return;
  }

  const payload = {
    isbn:         $('#fieldIsbn').value.trim(),
    title:        $('#fieldTitle').value.trim(),
    author:       $('#fieldAuthor').value.trim(),
    publisher:    $('#fieldPublisher').value.trim(),
    year:         $('#fieldYear').value || null,
    genre:        $('#fieldGenre').value.trim(),
    total_copies: parseInt($('#fieldTotal_copies').value),
    available:    state.editingId ? parseInt($('#fieldAvailable').value) : undefined,
    cover_url:    $('#fieldCover_url').value.trim(),
    description:  $('#fieldDescription').value.trim(),
  };

  if (state.editingId) payload.book_id = state.editingId;

  const submitBtn = $('#btnSaveBook');
  submitBtn.disabled = true;
  submitBtn.textContent = state.editingId ? 'Saving…' : 'Adding…';

  try {
    const data = await saveBook(payload);
    if (!data.success) throw new Error(data.message);

    Toast.show('success',
      state.editingId ? 'Book updated!' : 'Book added!',
      `"${payload.title}" saved to the catalogue`
    );
    Modal.close('bookModal');
    Validate.clearForm(form);
    await loadBooks();
    await loadStats();
  } catch (err) {
    Toast.show('error', 'Save failed', err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = state.editingId ? 'Save Changes' : 'Add Book';
  }
}

// ── Delete Confirm ────────────────────────────────────────────

function openDeleteConfirm(id, title) {
  state.deletingId = id;
  $('#deleteBookTitle').textContent = title;
  Modal.open('deleteModal');
}

async function confirmDelete() {
  if (!state.deletingId) return;
  const btn = $('#btnConfirmDelete');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    const data = await deleteBookById(state.deletingId);
    if (!data.success) throw new Error(data.message);

    Toast.show('success', 'Book deleted', 'The book record has been removed');
    Modal.close('deleteModal');
    state.deletingId = null;
    await loadBooks();
    await loadStats();
  } catch (err) {
    Toast.show('error', 'Delete failed', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
  }
}

// ── View Panel ────────────────────────────────────────────────

function openViewPanel(id) {
  const book = state.books.find(b => parseInt(b.book_id) === id);
  if (!book) return;
  state.viewingBook = book;

  // Populate panel
  $('#viewTitle').textContent    = book.title;
  $('#viewIsbn').textContent     = book.isbn;
  $('#viewAuthor').textContent   = book.author;
  $('#viewPublisher').textContent = book.publisher || '—';
  $('#viewYear').textContent     = book.year || '—';
  $('#viewGenre').textContent    = book.genre || '—';
  $('#viewCopies').textContent   = `${book.available} / ${book.total_copies} available`;
  $('#viewDesc').textContent     = book.description || 'No description available.';
  $('#viewAdded').textContent    = fmtDate(book.created_at);

  const coverEl = $('#viewCover');
  if (book.cover_url) {
    coverEl.innerHTML = `<img src="${escHtml(book.cover_url)}" alt="Book Cover" onerror="this.parentElement.innerHTML='📚'">`;
  } else {
    coverEl.innerHTML = '📚';
  }

  Panel.open('viewPanel');
}

// ── Cover Preview ─────────────────────────────────────────────

function updateCoverPreview(url, previewId) {
  const el = $(`#${previewId}`);
  if (!el) return;
  if (url && url.startsWith('http')) {
    el.innerHTML = `<img src="${escHtml(url)}" alt="Preview" onerror="this.parentElement.innerHTML='📚'">`;
  } else {
    el.innerHTML = '📚';
  }
}

// ── Utility ───────────────────────────────────────────────────

function capitalize(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
            .replace(/^./, c => c.toUpperCase());
}
