process.env.NODE_ENV = "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/findit-test-placeholder";
process.env.FRONTEND_ORIGIN ??= "http://localhost:3000";
process.env.SESSION_COOKIE_NAME ??= "findit_session";
process.env.BCRYPT_ROUNDS ??= "4";
process.env.UPLOAD_DIR ??= "uploads-test";
process.env.PUBLIC_API_PREFIX ??= "/backend";
process.env.MATCH_MIN_SCORE ??= "0.35";
