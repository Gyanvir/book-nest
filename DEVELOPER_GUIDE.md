# BookNest Technical Developer Guide

This document provides a highly detailed, low-level technical overview of the BookNest Library Management System. It outlines how each file operates, how components connect, the unified design system, and the database schema.

---

## 1. System Architecture Overview

BookNest is built on a standard **LAMP/XAMPP stack** using:
*   **Frontend**: Vanilla HTML5, CSS3, and modern JavaScript (ES6+).
*   **Backend API**: Procedural PHP returning JSON (REST-like architecture).
*   **Database**: MySQL relational database accessed via PDO (PHP Data Objects).

The application uses an API-driven approach where the frontend HTML files are essentially static views that hydrate themselves by making asynchronous `fetch()` calls to the PHP endpoints.

---

## 2. Database Layer (`database/schema.sql`)

The database is named `booknest` and uses the `utf8mb4` character set for full Unicode support.

### 2.1. `users` Table
Stores all user accounts (students and admins).
*   `id` (INT, PK): Auto-incremented primary key.
*   `user_code` (VARCHAR): Unique library card number (e.g., BN1001). Generated automatically via a MySQL trigger (`before_insert_users`) that appends the auto-increment ID to 'BN'.
*   `fullname`, `email`, `username`: Basic identity fields (email and username are unique).
*   `password_hash` (VARCHAR): BCrypt hashed password for security.
*   `role` (ENUM): 'student' or 'admin'. Defaults to 'student'.
*   `created_at` (DATETIME): Timestamp of registration.

### 2.2. `books` Table
The master catalog of library books.
*   `book_id` (INT, PK): Auto-incremented primary key.
*   `isbn` (VARCHAR): Unique International Standard Book Number.
*   `title`, `author`, `publisher`, `year`, `genre`: Book metadata.
*   `total_copies` (INT): Total physical copies owned by the library. Enforced by a `CHECK (total_copies >= 1)` constraint.
*   `available` (INT): Copies currently available for issue. Enforced by `CHECK (available >= 0 AND available <= total_copies)`.
*   `cover_url` (VARCHAR): URL to the book's cover image.
*   `description` (TEXT): Synopsis.
*   `created_at`, `updated_at`: Timestamps.

### 2.3. `circulation` Table
Tracks issue and return of books and calculates fines.
*   `issue_id` (INT, PK): Auto-incremented primary key.
*   `user_id` (INT, FK): Links to `users.id`.
*   `book_id` (INT, FK): Links to `books.book_id`.
*   `issue_date` (DATE): Date of issue.
*   `due_date` (DATE): Expected date of return.
*   `return_date` (DATE): Actual date of return (nullable).
*   `fine_amount` (DECIMAL): Fine calculated upon return.
*   `created_at`, `updated_at`: Timestamps.

---

## 3. Backend API Layer (`api/`)

The backend consists of standalone PHP files that act as API endpoints. They communicate exclusively via JSON.

### `api/db.php`
*   **Purpose**: Bootstraps the database connection.
*   **Mechanism**: Uses the Singleton pattern to return a single `PDO` instance connected to `mysql:host=localhost;dbname=booknest`. It enables exceptions for error handling (`PDO::ERRMODE_EXCEPTION`) and sets the default fetch mode to associative arrays (`PDO::FETCH_ASSOC`).

### `api/books.php`
*   **Purpose**: Handles all CRUD (Create, Read, Update, Delete) operations for the book catalog.
*   **Routing**: Uses the HTTP `$_SERVER['REQUEST_METHOD']` and the `?action=` query parameter to route requests to specific functions.
*   **Functions**:
    *   `listBooks()`: Handles `GET ?action=list`. Supports pagination (`page`, `per`), filtering (`genre`, `status`), and partial text search (`q`) across title, author, isbn, publisher, and genre. Calculates total pages for frontend pagination.
    *   `getBook()`: Handles `GET ?action=get&id=X`. Returns a single book record.
    *   `searchBooks()`: Lightweight search function without pagination.
    *   `addBook($data)`: Handles `POST ?action=add`. Validates required fields, inserts a new record, and returns the new `book_id`.
    *   `updateBook($data)`: Handles `PUT ?action=update`. Updates an existing record. Contains logic to ensure `available` copies do not exceed `total_copies`.
    *   `deleteBook($data)`: Handles `DELETE ?action=delete`. Removes a book by ID.
*   **Helpers**: `getBody()` reads `php://input` to parse JSON payloads. `validate()` ensures required keys exist. `respond()` standardizes the JSON response format (`{ "success": boolean, "message": string, ... }`).

### `api/circulation.php`
*   **Purpose**: Manages book issue and return operations, including available copy tracking and fine calculation.
*   **Routing**: Uses `POST` with `?action=issue` and `?action=return`.
*   **Functions**:
    *   `issueBook($data)`: Validates user/book, checks availability, creates a circulation record, and decrements book availability.
    *   `returnBook($data)`: Finds the active issue record, updates the return date, calculates late fines, and increments book availability.

### `api/stats.php`
*   **Purpose**: Provides library overview metrics for dashboards.
*   **Routing**: Uses `GET` without action parameters.
*   **Returns**: JSON payload containing `total_books`, `issued_books`, `available_books`, and `total_users`.

### `api/login.php`, `api/register.php`, `api/logout.php`
*   **Purpose**: Handle authentication and session management.
*   **Mechanism**:
    *   `register.php`: Hashes the password using `password_hash($pw, PASSWORD_DEFAULT)` and inserts the user.
    *   `login.php`: Fetches the user by username, verifies the password using `password_verify()`, and starts a PHP session (`$_SESSION['user_id']`). Returns the user data (excluding the hash) to the frontend.
    *   `logout.php`: Destroys the PHP session using `session_destroy()`.

---

## 4. Frontend Design System (`style.css`)

`style.css` is a monolithic, highly structured stylesheet that applies a unified aesthetic across the entire application.

### 4.1. CSS Variables (Design Tokens)
Defined in the `:root` pseudo-class.
*   **Colors**: Uses a warm palette based on creams, browns, and terracotta (`--bn-bg`, `--bn-surface`, `--bn-brown-dark`, `--bn-primary`).
*   **Semantic Colors**: Defined for states like success (`--bn-success`), danger, warning, and info.
*   **Radii & Shadows**: Standardizes border radii (`--r-md`, `--r-pill`) and box shadows (`--shadow-sm`, `--shadow-md`) for a modern, soft aesthetic.

### 4.2. Layout & Typography
*   **Font**: Uses Google Fonts 'Poppins' for a clean, geometric sans-serif look.
*   **Reset**: Strips default margins/padding and sets `box-sizing: border-box`.
*   **Containers**: Uses `.container` and `.card` classes to center content and wrap forms in elevated white boxes.

### 4.3. UI Components
*   **Buttons**: `.btn`, `.primary-btn`, `.secondary-btn` utilize flexbox, hover states with subtle Y-axis translation (`transform: translateY(-1px)`), and box-shadow glows.
*   **Forms**: Standardized `input` and `select` styling with focus states that trigger a primary color border and an outer glow (`box-shadow: 0 0 0 3px var(--bn-primary-glow)`).
*   **Tables**: `.books-table` class provides clean, padded data tables with alternating hover states (`tr:hover`).

---

## 5. Frontend Logic (`js/` and Inline Scripts)

JavaScript is modularized into different files based on responsibility.

### 5.1. Core Logic (`js/books.js`)
*   **Purpose**: The powerhouse behind the book management and display interfaces.
*   **State Management**: Uses a global `state` object (`books`, `meta`, `filters`) to track the current UI state.
*   **Functions**:
    *   `loadBooks()`: Constructs a query string based on the `state.filters` and `state.meta`, fetches data from `api/books.php`, and updates the UI via `renderTable()`.
    *   `renderTable()`: Generates dynamic HTML strings based on the book data. It calculates availability percentages to render a visual availability bar (green/orange/red).
    *   `clientSearch()`: Provides instant, client-side filtering without hitting the API for small datasets.
    *   **Modal Management**: Triggers add/edit/delete modals, populating forms with existing data when editing.

### 5.2. Validation & UI Helpers (`js/validate.js`, `js/ui.js`)
*   **`validate.js`**: Contains logic to ensure forms are filled out correctly before submission. It toggles error classes and messages adjacent to form inputs.
*   **`ui.js`**: Handles repetitive UI tasks like toast notifications (success/error popups), modal opening/closing logic (backdrop clicks, escape key), and pagination rendering.

### 5.3. Authentication Scripts (`js/auth.js`, `js/session-guard.js`)
*   **`auth.js` / `login-handler.js`**: Captures form submits, sends credentials to `api/login.php`. Upon success, it stores session data in the browser's `sessionStorage` (`booknest_session`) and redirects the user based on their role (`admin` goes to the manage books dashboard, `student` goes to the student dashboard).
*   **`session-guard.js`**: An IIFE (Immediately Invoked Function Expression) included at the top of protected pages. It checks `sessionStorage`. If no valid session exists, it immediately redirects the user to `login.html`, preventing unauthorized access.

### 5.4. `script.js`
*   Contains legacy or highly specific DOM manipulation, such as mobile hamburger menu toggling and basic frontend-only fine calculation for the issue/return views.

---

## 6. Frontend Views (HTML Files)

*   **`index.html`**: The public landing page. Contains an inline script to check for active sessions and modify the navbar (hiding login/register, showing dashboard/logout). It renders a public catalog grid using `api/books.php?action=list`.
*   **`dashboard.html` / `account.html`**: Protected student views showing borrowing statistics, recent activity, and profile data.
*   **`manage_books.html`**: The primary admin interface. Includes the full data table rendered by `books.js`, filter dropdowns, and hidden modal overlays for adding/editing/deleting records.
*   **`admin/index.html`**: The admin module shell.

---

## 7. Data Flow Example: Adding a Book
1. Admin clicks "Add Book" on `manage_books.html`. `books.js` triggers `openAddModal()`, clearing the form and showing the modal.
2. Admin fills the form and submits. `books.js` captures the `submit` event.
3. `Validate.validateForm()` checks inputs. If valid, an object payload is created.
4. `fetch()` sends a `POST` request to `api/books.php?action=add` with the JSON payload.
5. `books.php` decodes the payload, validates required fields, and executes a PDO `INSERT` statement.
6. The database generates a new `book_id`. The API responds with HTTP 200 and `{ "success": true, "book_id": X }`.
7. `books.js` receives the success response, closes the modal, shows a success Toast notification via `ui.js`, and calls `loadBooks()` to refresh the table.
