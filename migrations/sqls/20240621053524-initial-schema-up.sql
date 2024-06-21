CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    sender_id INT,
    receiver_user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
