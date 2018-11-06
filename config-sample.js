// basic server-specific configuration for API
exports.SERVER_PORT = 8080;
exports.SLACK_WEBHOOK_URL = "https://hooks.slack.com/..."
exports.EMAIL_RECIPIENTS = {
	"email@example.com"
}
// email config as used by emailjs
exports.EMAIL_CONFIG = {
  user: "myuser",
  password:"mypass",
  host: "smtp.gmail.com",
  ssl: true
};
exports.FROM_ADDRESS = "myuser@gmail.com";
