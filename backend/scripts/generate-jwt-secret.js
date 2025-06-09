const crypto = require('crypto');

// Generate a secure 32-byte random string
const secret = crypto.randomBytes(32).toString('base64');

console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nAdd this to your environment variables as JWT_SECRET');
console.log(`JWT_SECRET=${secret}`); 