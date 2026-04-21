# 📚 BookNest — Library Management System

> A full-stack college library management system built with **HTML · CSS · JavaScript · PHP · MySQL**

---

## 📌 Overview

BookNest is a web-based Library Management System developed as a group college project. It provides a student-facing portal and a dedicated admin panel for managing the book catalogue, handling issue/return records, and user authentication — all backed by a MySQL database.

---

## ✨ Features

| Area | Feature |
|------|---------|
| 🔐 Auth | Register, Login, Session Guard, Logout |
| 📖 Books | Add, Edit, Delete, Search, Filter, Paginate (Admin) |
| 🔄 Circulation | Issue & Return with auto fine calculator |
| 🔍 Search | Search books by title, author, ISBN, genre |
| 👤 Account | User profile and borrowed materials view |
| 🎨 UI | Unified warm-cream theme, responsive, animated |
| 🔒 Access | Role-based — admin/student, DSEU email-only registration |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla CSS (custom design system), JavaScript ES6+ |
| Backend | PHP 8.0+ with PDO |
| Database | MySQL 8.0+ |
| Local Server | XAMPP / WAMP |
| Fonts | Google Fonts — Poppins |

---

## 📁 Project Structure

```
book-nest/
│
├── index.html              # Home / Landing page
├── login.html              # User login
├── register.html           # User registration (@dseu.ac.in only)
├── dashboard.html          # User/Admin dashboard (role-aware)
├── search_books.html       # Search library materials
├── issue_return.html       # Issue & Return form (admin only)
├── manage_books.html       # Simple book list
├── account.html            # User account & profile
├── add_books.html          # Redirects to admin/
│
├── style.css               # ★ Unified design system (all pages)
├── script.js               # Shared JS — navbar toggle
├── README.md
│
├── admin/
│   └── index.html          # Admin Book Dashboard (Module 3)
│                           #   Full CRUD · Search · Filter · Stats
│
├── js/
│   ├── auth.js             # Core auth — login/register via PHP API
│   ├── login-handler.js    # Login page UI logic
│   ├── register-handler.js # Register page UI + live validation
│   ├── session-guard.js    # Protects pages, populates user info
│   ├── books.js            # Admin CRUD operations
│   ├── ui.js               # Modals, toasts, slide panels
│   └── validate.js         # Form field validation helpers
│
├── api/
│   ├── db.php              # ★ MySQL connection (PDO) — set credentials here
│   ├── books.php           # Books REST API (GET/POST/PUT/DELETE)
│   ├── login.php           # Login endpoint — returns JSON + session
│   ├── register.php        # Register endpoint — validates & inserts user
│   └── logout.php          # Destroys session, redirects to login
│
└── database/
    └── schema.sql          # ★ Full schema — run this once to set up DB
```

---

## ⚙️ Setup & Installation

### Prerequisites

- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL)
- PHP 8.0+
- Any modern browser

---

### Step 1 — Place the Project

Copy the `book-nest` folder into XAMPP's web root:

```
C:\xampp\htdocs\book-nest\
```

**Or** create a symbolic link (no copying needed) — run as **Administrator**:

```cmd
mklink /D "C:\xampp\htdocs\book-nest" "E:\path\to\book-nest"
```

---

### Step 2 — Start XAMPP

Open **XAMPP Control Panel** and start:
- ✅ Apache
- ✅ MySQL

---

### Step 3 — Configure Database Credentials

Open `api/db.php` and set your MySQL credentials:

```php
define('DB_USER', 'your_mysql_username');
define('DB_PASS', 'your_mysql_password');  // blank '' for XAMPP default
```

---

### Step 4 — Import the Database

**Option A — phpMyAdmin (recommended)**

1. Go to `http://localhost/phpmyadmin`
2. Click **Import** → **Choose File** → select `database/schema.sql`
3. Click **Go**

**Option B — MySQL CLI**

```bash
mysql -u root -p < database/schema.sql
```

This creates the `booknest` database with:
- `users` table (with auto user-code trigger)
- `books` table (with constraints)
- 10 sample books
- Default admin account

---

### Step 5 — Set Admin Password

Open this URL once to set the correct admin password:

```
http://localhost/book-nest/reset_admin_pw.php
```

> ⚠️ **Delete this file immediately after use** — it's a security risk.

---

### Step 6 — Open the App

```
http://localhost/book-nest/
```

---

## 🔑 Default Credentials

> ⚠️ Change the admin password after first login!

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@123` |
| Role | Admin |

---

## 🌐 Page URLs

| Page | URL |
|------|-----|
| Home | `/` |
| Login | `/login.html` |
| Register | `/register.html` |
| Dashboard | `/dashboard.html` |
| **Admin Panel** | `/admin/` |
| Issue / Return | `/issue_return.html` |
| Search | `/search_books.html` |
| Account | `/account.html` |

---

## 🔌 API Reference

All endpoints live in `api/`. Base: `http://localhost/book-nest/api/`

### Books — `api/books.php`

| Method | Params | Action |
|--------|--------|--------|
| `GET` | `?action=list&page=1&per=10` | Paginated list |
| `GET` | `?action=list&genre=Fantasy&status=available` | Filtered list |
| `GET` | `?action=get&id=5` | Single book |
| `POST` | `?action=add` + JSON body | Add book |
| `PUT` | `?action=update` + JSON body | Update book |
| `DELETE` | `?action=delete` + JSON body | Delete book |

### Circulation & Stats

| Endpoint | Method | Description |
|----------|--------|-------------|
| `api/circulation.php?action=issue` | POST | Issue a book to a student |
| `api/circulation.php?action=return` | POST | Return a book and calculate fine |
| `api/circulation.php?action=user_books&user_id={id}` | GET | Fetch a user's borrowed materials |
| `api/stats.php` | GET | Fetch dynamic dashboard statistics |

### Auth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `api/login.php` | POST | Validate credentials, start session |
| `api/register.php` | POST | Create user (`@dseu.ac.in` only) |
| `api/logout.php` | GET | Destroy session + redirect |

---

## 👥 Module Breakdown

| Module | Owner | Key Files |
|--------|-------|-----------|
| **Module 1** — UI & Layout | — | `index.html`, `style.css`, `script.js` |
| **Module 2** — Authentication | — | `login.html`, `register.html`, `js/auth.js`, `api/login.php`, `api/register.php` |
| **Module 3** — Book Management | — | `admin/index.html`, `js/books.js`, `js/ui.js`, `api/books.php` |
| **Module 4** — Circulation | — | `issue_return.html`, `search_books.html`, `account.html` |

---

## 🔒 Access Control

| Feature | Student | Admin |
|---------|---------|-------|
| View dashboard | ✅ | ✅ |
| Search books | ✅ | ✅ |
| View account | ✅ | ✅ |
| Manage books (CRUD) | ❌ | ✅ |
| Issue / Return | ❌ | ✅ |
| Admin dashboard | ❌ | ✅ |

Registration is restricted to **`@dseu.ac.in`** email addresses only — enforced on both frontend and backend.

---

*© 2026 BookNest — Delhi Skill and Entrepreneurship University*
