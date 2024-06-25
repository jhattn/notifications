CREATE TABLE push_subscriptions (
            user_id VARCHAR(255) PRIMARY KEY,
            subscription JSONB NOT NULL
        );