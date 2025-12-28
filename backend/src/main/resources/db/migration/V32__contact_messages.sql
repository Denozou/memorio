-- Contact Messages table for storing contact form submissions
-- Provides audit trail, spam detection tracking, and admin review capability

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(20) NOT NULL UNIQUE,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(254) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    spam_score INTEGER DEFAULT 0,
    spam_reasons VARCHAR(500),
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    admin_notes TEXT,
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'REVIEWED', 'REPLIED', 'ARCHIVED', 'SPAM'))
);

-- Indexes for efficient querying
CREATE INDEX idx_contact_messages_email ON contact_messages(sender_email);
CREATE INDEX idx_contact_messages_ip ON contact_messages(ip_address);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_spam ON contact_messages(is_spam) WHERE is_spam = TRUE;

-- Composite index for rate limiting queries
CREATE INDEX idx_contact_messages_email_created ON contact_messages(sender_email, created_at DESC);
CREATE INDEX idx_contact_messages_ip_created ON contact_messages(ip_address, created_at DESC);

COMMENT ON TABLE contact_messages IS 'Stores contact form submissions with spam detection and admin review tracking';
COMMENT ON COLUMN contact_messages.reference_id IS 'Human-readable reference ID (MEM-XXXXXXXX) for customer support';
COMMENT ON COLUMN contact_messages.spam_score IS 'Spam detection score 0-100, higher means more likely spam';
COMMENT ON COLUMN contact_messages.spam_reasons IS 'Semicolon-separated list of reasons for spam classification';
