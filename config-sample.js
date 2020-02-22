// basic server-specific configuration for API
exports.SERVER_PORT = 3000;
exports.SLACK_WEBHOOK_URL = "https://hooks.slack.com/..."
exports.EMAIL_RECIPIENTS = {
	// "email@example.com": "full"
}
// email config as used by emailjs
exports.EMAIL_CONFIG = {
  user: "myuser",
  password:"mypass",
  host: "smtp.gmail.com",
  ssl: true
};
exports.FROM_ADDRESS = "myuser@gmail.com";
exports.TWIT_CONFIG = {
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            false,    // optional - requires SSL certificates to be valid.
};
