<?php
/**
 * WashRewards SA — Waitlist / Partner Form Mailer
 */

header('Content-Type: application/json');

define('TO_EMAIL',   getenv('SMTP_TO_EMAIL')   ?: 'info@washrewards.online');
define('TO_NAME',    'WashRewards SA');
define('SMTP_HOST',  getenv('SMTP_HOST')       ?: 'mail.washrewards.online');
define('SMTP_PORT',  (int) (getenv('SMTP_PORT') ?: 587));
define('SMTP_USER',  getenv('SMTP_USER')       ?: 'info@washrewards.online');
define('SMTP_PASS',  getenv('SMTP_PASS')       ?: '');
define('SMTP_FROM',  getenv('SMTP_USER')       ?: 'info@washrewards.online');
define('SMTP_NAME',  'WashRewards SA');

function sanitize(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}
function respond(bool $ok, string $msg = ''): void {
    echo json_encode(['success' => $ok, 'message' => $msg]);
    exit;
}

// ── Debug mode: visit contact.php?debug=1 in browser to test SMTP ────────────
if (isset($_GET['debug'])) {
    $result = smtp_send(
        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_NAME,
        TO_EMAIL, TO_NAME,
        '[WashRewards] SMTP Test', "This is a test email from contact.php debug mode.\n",
        'Debug Test', TO_EMAIL
    );
    header('Content-Type: text/plain');
    echo $result['ok'] ? "SUCCESS: Email sent." : "FAILED: " . $result['error'];
    echo "\n\nSMTP log:\n" . implode("\n", $result['log']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.');
}

$mode          = sanitize($_POST['mode']          ?? 'customer');
$full_name     = sanitize($_POST['full_name']     ?? '');
$email         = filter_var(trim($_POST['email']  ?? ''), FILTER_SANITIZE_EMAIL);
$phone         = sanitize($_POST['phone']         ?? '');
$area          = sanitize($_POST['area']          ?? '');
$business_name = sanitize($_POST['business_name'] ?? '');

if (empty($full_name))                                       respond(false, 'Full name is required.');
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL))  respond(false, 'Valid email is required.');
if ($mode === 'partner' && empty($business_name))           respond(false, 'Business name is required.');

$is_partner = ($mode === 'partner');
$type       = $is_partner ? 'Partner Application' : 'Customer Waitlist';
$subject    = '[WashRewards] ' . $type . ' — ' . $full_name;

$body  = "New submission from washrewards.online\n";
$body .= str_repeat('=', 54) . "\n\n";
$body .= "Type        : {$type}\n";
$body .= "Full name   : {$full_name}\n";
$body .= "Email       : {$email}\n";
$body .= "Phone       : " . ($phone ?: '-') . "\n";
$body .= "Area        : " . ($area  ?: '-') . "\n";
if ($is_partner && $business_name) {
    $body .= "Business    : {$business_name}\n";
}
$body .= "\nSubmitted   : " . date('Y-m-d H:i:s') . " UTC\n";
$body .= "IP          : " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$sent = smtp_send(
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_NAME,
    TO_EMAIL, TO_NAME, $subject, $body, $full_name, $email
);

if ($sent['ok']) {
    respond(true);
} else {
    error_log('[WashRewards SMTP] ' . $sent['error']);
    respond(false, $sent['error']); // returns exact error to browser console
}

// ── Minimal SMTP client ───────────────────────────────────────────────────────
function smtp_send(
    string $host, int $port,
    string $user, string $pass,
    string $from, string $from_name,
    string $to,   string $to_name,
    string $subject, string $body,
    string $reply_name, string $reply_email
): array {
    $log  = [];
    $ctx  = stream_context_create(['ssl' => [
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ]]);

    $sock = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$sock) {
        return ['ok' => false, 'error' => "Cannot connect to {$host}:{$port} — {$errstr} ({$errno})", 'log' => []];
    }
    stream_set_timeout($sock, 15);

    $read = function() use ($sock, &$log) {
        $line = fgets($sock, 512);
        $log[] = '< ' . trim($line);
        return $line;
    };
    $send = function(string $cmd) use ($sock, &$log) {
        $display = (strpos($cmd, base64_encode('')) !== false) ? '(base64 credential)' : $cmd;
        $log[] = '> ' . $display;
        fwrite($sock, $cmd . "\r\n");
    };

    $read(); // banner

    $send("EHLO localhost");
    while (($line = $read()) && substr($line, 3, 1) === '-') {}

    // STARTTLS
    $send("STARTTLS");
    $tls_resp = $read();
    if (substr(trim($tls_resp), 0, 3) !== '220') {
        // STARTTLS not supported — try plain AUTH
        $log[] = 'STARTTLS not available, continuing plain';
    } else {
        $ok = stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
        if (!$ok) {
            // fallback to TLS 1.1 or 1.0
            $ok = stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        }
        if (!$ok) {
            fclose($sock);
            return ['ok' => false, 'error' => 'TLS handshake failed', 'log' => $log];
        }
        $send("EHLO localhost");
        while (($line = $read()) && substr($line, 3, 1) === '-') {}
    }

    // AUTH LOGIN
    $send("AUTH LOGIN");          $read();
    $send(base64_encode($user));  $read();
    $send(base64_encode($pass));
    $auth = $read();
    if (substr(trim($auth), 0, 3) !== '235') {
        fclose($sock);
        return ['ok' => false, 'error' => 'AUTH failed: ' . trim($auth), 'log' => $log];
    }

    $send("MAIL FROM:<{$from}>");
    $mf = $read();
    if (substr(trim($mf), 0, 3) !== '250') {
        fclose($sock);
        return ['ok' => false, 'error' => 'MAIL FROM rejected: ' . trim($mf), 'log' => $log];
    }

    $send("RCPT TO:<{$to}>");
    $rcpt = $read();
    if (substr(trim($rcpt), 0, 3) !== '250') {
        fclose($sock);
        return ['ok' => false, 'error' => 'RCPT TO rejected: ' . trim($rcpt), 'log' => $log];
    }

    $send("DATA"); $read();

    $msg_id = '<' . uniqid('wr', true) . '@' . $host . '>';
    $msg    = "Date: " . date('r') . "\r\n"
            . "From: {$from_name} <{$from}>\r\n"
            . "To: {$to_name} <{$to}>\r\n"
            . "Reply-To: {$reply_name} <{$reply_email}>\r\n"
            . "Message-ID: {$msg_id}\r\n"
            . "Subject: {$subject}\r\n"
            . "MIME-Version: 1.0\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "\r\n"
            . str_replace("\n", "\r\n", $body)
            . "\r\n.";

    $send($msg);
    $resp = $read();

    $send("QUIT"); $read();
    fclose($sock);

    if (substr(trim($resp), 0, 3) === '250') {
        return ['ok' => true, 'error' => '', 'log' => $log];
    }
    return ['ok' => false, 'error' => 'DATA rejected: ' . trim($resp), 'log' => $log];
}
