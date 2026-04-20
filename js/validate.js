const Validate = (() => {

  const RULES = {
    isbn: {
      required: true,
      pattern: /^[0-9]{3}-[0-9]{1,5}-[0-9]{1,7}-[0-9]{1,7}-[0-9]$|^[0-9]{9}[0-9X]$|^\d{13}$|^\d{10}$/,
      label: 'ISBN',
      hint: 'Use ISBN-10 or ISBN-13 format (e.g. 978-0-06-112008-4)',
    },
    title: {
      required: true,
      minLength: 1,
      maxLength: 255,
      label: 'Title',
    },
    author: {
      required: true,
      minLength: 2,
      maxLength: 255,
      label: 'Author',
    },
    publisher: {
      required: false,
      maxLength: 255,
      label: 'Publisher',
    },
    year: {
      required: false,
      custom: (v) => {
        if (!v) return null;
        const y = parseInt(v);
        if (isNaN(y) || y < 1000 || y > new Date().getFullYear() + 1)
          return `Year must be between 1000 and ${new Date().getFullYear() + 1}`;
        return null;
      },
      label: 'Year',
    },
    genre: {
      required: false,
      label: 'Genre',
    },
    total_copies: {
      required: true,
      custom: (v) => {
        const n = parseInt(v);
        if (isNaN(n) || n < 1 || n > 9999) return 'Total copies must be between 1 and 9999';
        return null;
      },
      label: 'Total Copies',
    },
    available: {
      required: false,
      label: 'Available',
    },
    cover_url: {
      required: false,
      custom: (v) => {
        if (!v) return null;
        try { new URL(v); return null; }
        catch { return 'Cover URL must be a valid URL (or leave empty)'; }
      },
      label: 'Cover URL',
    },
    description: {
      required: false,
      maxLength: 2000,
      label: 'Description',
    },
  };

  function validateField(name, value) {
    const rule = RULES[name];
    if (!rule) return null;

    const val = String(value ?? '').trim();

    if (rule.required && val === '') return `${rule.label} is required`;
    if (val === '' && !rule.required) return null;

    if (rule.minLength && val.length < rule.minLength)
      return `${rule.label} must be at least ${rule.minLength} character(s)`;

    if (rule.maxLength && val.length > rule.maxLength)
      return `${rule.label} must not exceed ${rule.maxLength} characters`;

    if (rule.pattern && !rule.pattern.test(val))
      return rule.hint ?? `${rule.label} format is invalid`;

    if (rule.custom) return rule.custom(val);

    return null;
  }

  function validateForm(form) {
    const errors = {};
    const inputs = form.querySelectorAll('[data-validate]');

    inputs.forEach((el) => {
      const name = el.dataset.validate;
      const err = validateField(name, el.value);
      if (err) errors[name] = err;
    });

    const tc = form.querySelector('[data-validate="total_copies"]');
    const av = form.querySelector('[data-validate="available"]');
    if (tc && av && av.value !== '') {
      const tcVal = parseInt(tc.value);
      const avVal = parseInt(av.value);
      if (!isNaN(tcVal) && !isNaN(avVal) && avVal > tcVal) {
        errors['available'] = 'Available copies cannot exceed total copies';
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  function attachLiveValidation(form) {
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach((el) => {
      el.addEventListener('input', () => {
        const name = el.dataset.validate;
        const err = validateField(name, el.value);
        showFieldError(form, name, err);

        if (name === 'total_copies' || name === 'available') {
          runCrossFieldCheck(form);
        }
      });
      el.addEventListener('blur', () => {
        const name = el.dataset.validate;
        const err = validateField(name, el.value);
        showFieldError(form, name, err);

        if (name === 'total_copies' || name === 'available') {
          runCrossFieldCheck(form);
        }
      });
    });
  }

  function runCrossFieldCheck(form) {
    const tc = form.querySelector('[data-validate="total_copies"]');
    const av = form.querySelector('[data-validate="available"]');
    if (!tc || !av || av.value === '') {
      showFieldError(form, 'available', null);
      return;
    }
    const tcVal = parseInt(tc.value);
    const avVal = parseInt(av.value);
    if (!isNaN(tcVal) && !isNaN(avVal) && avVal > tcVal) {
      showFieldError(form, 'available', 'Available copies cannot exceed total copies');
    } else {
      showFieldError(form, 'available', null);
    }
  }

  function showFieldError(form, name, error) {
    const input = form.querySelector(`[data-validate="${name}"]`);
    const errorEl = form.querySelector(`[data-error="${name}"]`);
    if (!input) return;

    if (error) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = error;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }
  }

  function showAllErrors(form, errors) {
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach((el) => {
      const name = el.dataset.validate;
      showFieldError(form, name, errors[name] ?? null);
    });
  }

  function clearForm(form) {
    form.reset();
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach((el) => {
      el.classList.remove('error');
      const name = el.dataset.validate;
      const errorEl = form.querySelector(`[data-error="${name}"]`);
      if (errorEl) errorEl.textContent = '';
    });
  }

  return { validateField, validateForm, attachLiveValidation, showAllErrors, clearForm, runCrossFieldCheck };
})();
