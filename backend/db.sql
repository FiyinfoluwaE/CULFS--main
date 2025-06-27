

CREATE DATABASE IF NOT EXISTS culfs_database;
USE culfs_database;

-- Users table - stores all system users (students, staff, admin)
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL,
    university_credentials VARCHAR(50),
    email_address VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Offices table - different university offices handling lost items
CREATE TABLE offices (
    office_id VARCHAR(10) PRIMARY KEY,
    office_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    responsible_person VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table - additional student information
CREATE TABLE students (
    matric_no VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    department VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Staff table - additional staff information
CREATE TABLE staff (
    staff_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    office_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (office_id) REFERENCES offices(office_id)
);

-- Lost Items table - stores all lost item reports
CREATE TABLE lost_items (
    case_number VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_color VARCHAR(50),
    brand VARCHAR(50),
    description TEXT NOT NULL,
    last_seen_location VARCHAR(100) NOT NULL,
    last_seen_date DATE NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Reported', 'Found', 'Matched', 'Claimed', 'Unclaimed', 'Archived') DEFAULT 'Reported',
    image_path VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_submission_date (submission_date)
);

-- Found Items table - stores all items found by staff/admin
CREATE TABLE found_items (
    found_item_id VARCHAR(20) PRIMARY KEY,
    office_id VARCHAR(10) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_color VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    found_date DATE NOT NULL,
    found_location VARCHAR(100) NOT NULL,
    status ENUM('Found', 'Matched', 'Claimed', 'Archived') DEFAULT 'Found',
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (office_id) REFERENCES offices(office_id),
    INDEX idx_status (status),
    INDEX idx_found_date (found_date)
);

-- Matches table - links found items with lost item reports
CREATE TABLE matches (
    match_id VARCHAR(36) PRIMARY KEY,
    found_item_id VARCHAR(20) NOT NULL,
    case_number VARCHAR(20) NOT NULL,
    confirmation BOOLEAN DEFAULT FALSE,
    match_status ENUM('Pending', 'Confirmed', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (found_item_id) REFERENCES found_items(found_item_id) ON DELETE CASCADE,
    FOREIGN KEY (case_number) REFERENCES lost_items(case_number) ON DELETE CASCADE,
    INDEX idx_match_status (match_status)
);

-- Notifications table - tracks all system notifications
CREATE TABLE notifications (
    notification_id VARCHAR(36) PRIMARY KEY,
    case_number VARCHAR(20),
    user_id VARCHAR(36) NOT NULL,
    notification_type ENUM('Report_Confirmed', 'Item_Found', 'Match_Found', 'Claim_Reminder') NOT NULL,
    notification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Sent', 'Pending', 'Failed') DEFAULT 'Pending',
    message TEXT NOT NULL,
    FOREIGN KEY (case_number) REFERENCES lost_items(case_number) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notification_date (notification_date),
    INDEX idx_status (status)
);

-- Archives table - stores information about archived items
CREATE TABLE archives (
    archive_id VARCHAR(36) PRIMARY KEY,
    case_number VARCHAR(20) NOT NULL,
    archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disposition ENUM('Donated', 'Disposed', 'Returned_to_Owner') NOT NULL,
    notes TEXT,
    FOREIGN KEY (case_number) REFERENCES lost_items(case_number) ON DELETE CASCADE,
    INDEX idx_archive_date (archive_date)
);

-- Insert default office data
INSERT INTO offices (office_id, office_name, contact_email, responsible_person) VALUES
('SECURITY', 'Security Office', 'security@covenantuniversity.edu.ng', 'Chief Security Officer'),
('ADMIN', 'Administrative Office', 'admin@covenantuniversity.edu.ng', 'Administrative Officer'),
('STUDENT', 'Student Affairs', 'studentaffairs@covenantuniversity.edu.ng', 'Student Affairs Officer'),
('ICT', 'ICT Services', 'ict@covenantuniversity.edu.ng', 'ICT Manager'),
('LIBRARY', 'Library Office', 'library@covenantuniversity.edu.ng', 'Chief Librarian');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_lost_items_user ON lost_items(user_id);
CREATE INDEX idx_found_items_office ON found_items(office_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_staff_user ON staff(user_id);

-- Create views for common queries
-- View for active lost items with user information
CREATE VIEW v_active_lost_items AS
SELECT 
    li.case_number,
    li.item_name,
    li.item_type,
    li.item_color,
    li.brand,
    li.description,
    li.last_seen_location,
    li.last_seen_date,
    li.submission_date,
    li.status,
    u.name as reporter_name,
    u.email_address as reporter_email,
    u.role as reporter_role
FROM lost_items li
JOIN users u ON li.user_id = u.user_id
WHERE li.status NOT IN ('Archived');

-- View for found items with office information
CREATE VIEW v_found_items_with_office AS
SELECT 
    fi.found_item_id,
    fi.item_name,
    fi.item_color,
    fi.description,
    fi.found_date,
    fi.found_location,
    fi.status,
    o.office_name,
    o.contact_email,
    o.responsible_person
FROM found_items fi
JOIN offices o ON fi.office_id = o.office_id
WHERE fi.status NOT IN ('Archived');

-- View for matches with complete information
CREATE VIEW v_matches_complete AS
SELECT 
    m.match_id,
    m.match_status,
    m.confirmation,
    m.created_at as match_date,
    li.case_number,
    li.item_name as lost_item_name,
    li.description as lost_description,
    u.name as owner_name,
    u.email_address as owner_email,
    fi.found_item_id,
    fi.item_name as found_item_name,
    fi.description as found_description,
    o.office_name
FROM matches m
JOIN lost_items li ON m.case_number = li.case_number
JOIN users u ON li.user_id = u.user_id
JOIN found_items fi ON m.found_item_id = fi.found_item_id
JOIN offices o ON fi.office_id = o.office_id;

-- Stored procedure to automatically archive unclaimed items after 30 days
DELIMITER //
CREATE PROCEDURE ArchiveUnclaimedItems()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE case_num VARCHAR(20);
    DECLARE cur CURSOR FOR 
        SELECT case_number 
        FROM lost_items 
        WHERE status = 'Unclaimed' 
        AND submission_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO case_num;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Update status to Archived
        UPDATE lost_items 
        SET status = 'Archived' 
        WHERE case_number = case_num;
        
        -- Insert into archives
        INSERT INTO archives (archive_id, case_number, disposition, notes)
        VALUES (UUID(), case_num, 'Disposed', 'Auto-archived after 30 days unclaimed');
        
    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

-- Event to automatically run archiving procedure daily
CREATE EVENT IF NOT EXISTS auto_archive_unclaimed
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL ArchiveUnclaimedItems();

-- Enable event scheduler (run this manually if needed)
-- SET GLOBAL event_scheduler = ON;

COMMIT;
