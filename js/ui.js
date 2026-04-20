const Toast = (() => {
  let container;

  function init() {
    container = document.getElementById('toastContainer');
  }

  function show(type, title, description = '', duration = 3500) {
    if (!container) init();

    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] ?? icons.info}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${description ? `<div class="toast-desc">${description}</div>` : ''}
      </div>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  return { show };
})();

const Modal = (() => {
  function open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  }

  function initBackdropClose() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });
  }

  return { open, close, closeAll, initBackdropClose };
})();

const Panel = (() => {
  function open(id) {
    const overlay = document.getElementById(id + 'Overlay');
    const panel   = document.getElementById(id);
    if (overlay) overlay.classList.add('open');
    if (panel)   panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close(id) {
    const overlay = document.getElementById(id + 'Overlay');
    const panel   = document.getElementById(id);
    if (overlay) overlay.classList.remove('open');
    if (panel)   panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  return { open, close };
})();

const Pagination = (() => {
  function render(containerId, meta, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { page, total_pages, total, per_page } = meta;
    const start = Math.min((page - 1) * per_page + 1, total);
    const end   = Math.min(page * per_page, total);

    const info = container.querySelector('.pagination-info');
    const ctrl = container.querySelector('.pagination-controls');

    if (info) info.textContent = total === 0 ? 'No books found' : `Showing ${start}–${end} of ${total} books`;

    if (!ctrl) return;
    ctrl.innerHTML = '';

    const prev = makeBtn('‹', page <= 1, () => onPageChange(page - 1));
    ctrl.appendChild(prev);

    const pages = getPageNumbers(page, total_pages);
    pages.forEach((p) => {
      if (p === '...') {
        const span = document.createElement('span');
        span.textContent = '…';
        span.style.cssText = 'display:grid;place-items:center;width:32px;height:32px;color:var(--clr-text-faint)';
        ctrl.appendChild(span);
      } else {
        const btn = makeBtn(p, false, () => onPageChange(p));
        if (p === page) btn.classList.add('active');
        ctrl.appendChild(btn);
      }
    });

    const next = makeBtn('›', page >= total_pages, () => onPageChange(page + 1));
    ctrl.appendChild(next);
  }

  function makeBtn(label, disabled, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = label;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener('click', onClick);
    return btn;
  }

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total-4, total-3, total-2, total-1, total);
    } else {
      pages.push(1, '...', current-1, current, current+1, '...', total);
    }
    return pages;
  }

  return { render };
})();

const TableSort = (() => {
  let currentCol = '', currentDir = 'asc';

  function sortData(data, col) {
    if (currentCol === col) {
      currentDir = currentDir === 'asc' ? 'desc' : 'asc';
    } else {
      currentCol = col;
      currentDir = 'asc';
    }

    return [...data].sort((a, b) => {
      let valA = a[col] ?? '', valB = b[col] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return currentDir === 'asc' ? -1 : 1;
      if (valA > valB) return currentDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function updateHeaders(headers, activeCol) {
    headers.forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.col === activeCol) {
        th.classList.add(currentDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  function getState() { return { col: currentCol, dir: currentDir }; }

  return { sortData, updateHeaders, getState };
})();

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
