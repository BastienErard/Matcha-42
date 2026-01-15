-- ============================================
-- MATCHA DATABASE SCHEMA
-- ============================================

-- Drop tables if they exist (for reset)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS user_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- ============================================
-- TABLE: users
-- Authentication information
-- ============================================
CREATE TABLE users (
	id INT PRIMARY KEY AUTO_INCREMENT,
	email VARCHAR(255) NOT NULL UNIQUE,
	username VARCHAR(50) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	is_verified BOOLEAN DEFAULT FALSE,
	verification_token VARCHAR(255),
	reset_password_token VARCHAR(255),
	reset_password_expires DATETIME,
	last_login DATETIME,
	is_online BOOLEAN DEFAULT FALSE,
	preferred_language ENUM('fr', 'en') DEFAULT 'fr',
	has_completed_onboarding BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX idx_email (email),
	INDEX idx_username (username),
	INDEX idx_verification_token (verification_token),
	INDEX idx_reset_token (reset_password_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: profiles
-- Detailed profile information
-- ============================================
CREATE TABLE profiles (
	user_id INT PRIMARY KEY,
	gender ENUM('male', 'female') NOT NULL,
	sexual_preference ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both',
	biography TEXT,
	birth_date DATE NOT NULL,
	latitude DECIMAL(10, 8),
	longitude DECIMAL(11, 8),
	city VARCHAR(100),
	country VARCHAR(100),
	location_updated_at TIMESTAMP NULL,
	fame_rating INT DEFAULT 0,
	profile_picture_id INT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_gender (gender),
	INDEX idx_sexual_preference (sexual_preference),
	INDEX idx_location (latitude, longitude),
	INDEX idx_fame_rating (fame_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: photos
-- User uploaded photos (max 5)
-- ============================================
CREATE TABLE photos (
	id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
	filename VARCHAR(255) NOT NULL,
	filepath VARCHAR(500) NOT NULL,
	is_profile_picture BOOLEAN DEFAULT FALSE,
	upload_order INT DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_user_id (user_id),
	INDEX idx_profile_picture (user_id, is_profile_picture)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: tags
-- Interest tags (translations handled by frontend i18n)
-- ============================================
CREATE TABLE tags (
	id INT PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(50) NOT NULL UNIQUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: user_tags
-- Tags selected by each user
-- ============================================
CREATE TABLE user_tags (
	user_id INT NOT NULL,
	tag_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, tag_id),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
	INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: likes
-- Who liked whom
-- ============================================
CREATE TABLE likes (
	id INT PRIMARY KEY AUTO_INCREMENT,
	from_user_id INT NOT NULL,
	to_user_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY unique_like (from_user_id, to_user_id),
	FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_to_user (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: visits
-- Profile visit history (one entry per visitor per day)
-- ============================================
CREATE TABLE visits (
	id INT PRIMARY KEY AUTO_INCREMENT,
	visitor_id INT NOT NULL,
	visited_user_id INT NOT NULL,
	visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (visited_user_id) REFERENCES users(id) ON DELETE CASCADE,
	UNIQUE KEY unique_daily_visit (visitor_id, visited_user_id, visited_at),
	INDEX idx_visited (visited_user_id),
	INDEX idx_visited_at (visited_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: blocks
-- Blocked users
-- ============================================
CREATE TABLE blocks (
	id INT PRIMARY KEY AUTO_INCREMENT,
	blocker_id INT NOT NULL,
	blocked_user_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY unique_block (blocker_id, blocked_user_id),
	FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_blocker (blocker_id),
	INDEX idx_blocked (blocked_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: reports
-- Fake account reports
-- ============================================
CREATE TABLE reports (
	id INT PRIMARY KEY AUTO_INCREMENT,
	reporter_id INT,
	reported_user_id INT NOT NULL,
	reason TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_reported (reported_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: conversations
-- Conversations between matched users
-- ============================================
CREATE TABLE conversations (
	id INT PRIMARY KEY AUTO_INCREMENT,
	user1_id INT NOT NULL,
	user2_id INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY unique_conversation (user1_id, user2_id),
	FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_user1 (user1_id),
	INDEX idx_user2 (user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: messages
-- Individual messages in conversations
-- ============================================
CREATE TABLE messages (
	id INT PRIMARY KEY AUTO_INCREMENT,
	conversation_id INT NOT NULL,
	sender_id INT,
	content TEXT NOT NULL,
	is_read BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
	FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
	INDEX idx_conversation (conversation_id),
	INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: notifications
-- Real-time notifications
-- ============================================
CREATE TABLE notifications (
	id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
	type ENUM('like', 'unlike', 'visit', 'message', 'match') NOT NULL,
	from_user_id INT,
	related_id INT,
	is_read BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
	INDEX idx_user_id (user_id),
	INDEX idx_unread (user_id, is_read),
	INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
