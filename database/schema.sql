-- ================================================================
--  BookNest Library Management System
--  Complete Database Schema
--  Run this file once to set up the entire database.
--
--  Usage:
--    mysql -u root -p < database/schema.sql
--  OR import via phpMyAdmin.
-- ================================================================

CREATE DATABASE IF NOT EXISTS booknest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE booknest;

-- ──────────────────────────────────────────────────────────────
--  TABLE: users
--  Stores registered students and admin accounts.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_code     VARCHAR(10)  UNIQUE NOT NULL,        -- auto-generated e.g. BN1001
    fullname      VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student', 'admin') DEFAULT 'student',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auto-generate user_code like BN1001, BN1002 ...
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SELECT AUTO_INCREMENT INTO next_id
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';
    SET NEW.user_code = CONCAT('BN', 1000 + next_id);
END$$
DELIMITER ;

-- ──────────────────────────────────────────────────────────────
--  TABLE: books
--  Master catalogue of all library books.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  book_id       INT            AUTO_INCREMENT PRIMARY KEY,
  isbn          VARCHAR(20)    UNIQUE NOT NULL,
  title         VARCHAR(255)   NOT NULL,
  author        VARCHAR(255)   NOT NULL,
  publisher     VARCHAR(255)   DEFAULT NULL,
  year          YEAR           DEFAULT NULL,
  genre         VARCHAR(100)   DEFAULT NULL,
  total_copies  INT            NOT NULL DEFAULT 1,
  available     INT            NOT NULL DEFAULT 1,
  cover_url     VARCHAR(500)   DEFAULT NULL,
  description   TEXT           DEFAULT NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_copies    CHECK (total_copies >= 1),
  CONSTRAINT chk_available CHECK (available >= 0 AND available <= total_copies)
);

-- ──────────────────────────────────────────────────────────────
--  SEED DATA — 10 sample books to get started
-- ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO books (isbn, title, author, publisher, year, genre, total_copies, available, description) VALUES
('978-0-06-112008-4', 'To Kill a Mockingbird',           'Harper Lee',          'HarperCollins',    1960, 'Fiction',              5, 3, 'A story of racial injustice and moral growth in the American South.'),
('978-0-7432-7356-5', '1984',                             'George Orwell',       'Secker & Warburg', 1949, 'Dystopian Fiction',    4, 4, 'A totalitarian society ruled by Big Brother under constant surveillance.'),
('978-0-14-028329-7', 'The Great Gatsby',                 'F. Scott Fitzgerald', 'Scribner',         1925, 'Classic Fiction',      3, 2, 'The glittering and tragic story of Jay Gatsby during the Jazz Age.'),
('978-0-316-76948-0', 'The Catcher in the Rye',          'J.D. Salinger',       'Little, Brown',    1951, 'Classic Fiction',      6, 6, 'Holden Caulfield''s journey through New York after being expelled.'),
('978-0-7432-7357-2', 'Brave New World',                  'Aldous Huxley',       'Chatto & Windus',  1932, 'Dystopian Fiction',    3, 3, 'A futuristic society where humans are engineered and conditioned.'),
('978-0-06-093546-9', 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 'Scholastic',       1997, 'Fantasy',              8, 5, 'A young boy discovers he is a wizard and begins his journey at Hogwarts.'),
('978-0-7434-1779-7', 'The Lord of the Rings',           'J.R.R. Tolkien',      'Allen & Unwin',    1954, 'Fantasy',              4, 2, 'An epic quest to destroy the One Ring and defeat the Dark Lord Sauron.'),
('978-0-385-33348-1', 'The Da Vinci Code',                'Dan Brown',           'Doubleday',        2003, 'Mystery/Thriller',     5, 5, 'A religious mystery unraveled through symbols and art history.'),
('978-0-14-303943-3', 'The Alchemist',                    'Paulo Coelho',        'HarperOne',        1988, 'Philosophical Fiction',6, 4, 'A shepherd boy''s journey to fulfill his personal legend.'),
('978-0-19-280551-1', 'A Brief History of Time',          'Stephen Hawking',     'Bantam Books',     1988, 'Science',              3, 3, 'Concepts of cosmology, space, time, and the universe explained simply.');

-- ──────────────────────────────────────────────────────────────
--  SEED ADMIN USER  (change password after first login!)
--  Password: Admin@123  (bcrypt hash below)
-- ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO users (user_code, fullname, email, username, password_hash, role) VALUES
('BN1000', 'Library Admin', 'admin@booknest.edu', 'admin',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- ──────────────────────────────────────────────────────────────
--  TABLE: circulation
--  Links users to books and tracks borrowing history and late fees.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circulation (
    issue_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    book_id     INT NOT NULL,
    issue_date  DATE NOT NULL,
    due_date    DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_circ_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_circ_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);