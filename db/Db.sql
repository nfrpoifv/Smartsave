
CREATE DATABASE IF NOT EXISTS finanzas_personales;
USE finanzas_personales;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);


CREATE TABLE monthly_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month_year CHAR(7) NOT NULL,
    total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
    available_for_savings DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_month (user_id, month_year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE savings_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    target_date DATE NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE savings_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login);

CREATE INDEX idx_monthly_budgets_user_month ON monthly_budgets(user_id, month_year);

CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON savings_goals(status);
CREATE INDEX idx_savings_goals_target_date ON savings_goals(target_date);
CREATE INDEX idx_savings_goals_category ON savings_goals(category);
CREATE INDEX idx_savings_goals_user_status ON savings_goals(user_id, status);

CREATE INDEX idx_savings_entries_goal_id ON savings_entries(goal_id);
CREATE INDEX idx_savings_entries_user_id ON savings_entries(user_id);
CREATE INDEX idx_savings_entries_entry_date ON savings_entries(entry_date);
CREATE INDEX idx_savings_entries_goal_date ON savings_entries(goal_id, entry_date);

CREATE VIEW savings_goals_summary AS
SELECT 
    sg.id,
    sg.user_id,
    sg.title,
    sg.target_amount,
    sg.current_amount,
    sg.currency,
    sg.target_date,
    sg.category,
    sg.status,
    ROUND((sg.current_amount / sg.target_amount) * 100, 2) AS progress_percentage,
    DATEDIFF(sg.target_date, CURRENT_DATE) AS days_remaining,
    sg.created_at,
    sg.updated_at,
    sg.completed_at
FROM savings_goals sg;

CREATE VIEW user_monthly_stats AS
    SELECT 
        u.id AS user_id,
        u.name,
        mb.month_year,
        mb.total_income,
        mb.total_expenses,
        mb.available_for_savings,
        IFNULL(ms.total_saved, 0) AS actual_savings
    FROM
        users u
            LEFT JOIN
        monthly_budgets mb ON u.id = mb.user_id
            LEFT JOIN
        (SELECT 
            user_id,
                DATE_FORMAT(entry_date, '%Y-%m') AS month_year,
                SUM(amount) AS total_saved
        FROM
            savings_entries
        GROUP BY user_id , DATE_FORMAT(entry_date, '%Y-%m')) ms ON u.id = ms.user_id
            AND mb.month_year = ms.month_year;
