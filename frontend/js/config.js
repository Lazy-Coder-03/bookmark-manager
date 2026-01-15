// ============================================
// FRONTEND CONFIGURATION
// ============================================
// Since browsers can't read .env files directly,
// we use this config file for frontend settings.
//
// INSTRUCTIONS:
// 1. Replace the values below with your Supabase credentials
// 2. Get them from: Supabase Dashboard > Settings > API
// ============================================

const CONFIG = {
    // Your Supabase project URL
    SUPABASE_URL: 'https://abogrpupwcrztsemspxo.supabase.co',

    // Your Supabase anon/public key (safe to use in frontend)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFib2dycHVwd2NyenRzZW1zcHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA2NjEsImV4cCI6MjA4NDA1NjY2MX0.tGBSMPiHtFDplEypNfI-RRRAJL8coYagRmUUBcdL9Fw'
};

// ============================================
// DO NOT EDIT BELOW THIS LINE
// ============================================

// Validate configuration
if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || CONFIG.SUPABASE_URL === '') {
    console.error('Please configure your Supabase URL in frontend/js/config.js');
}

// Make config available globally
window.CONFIG = CONFIG;
