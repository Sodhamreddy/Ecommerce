<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
if (!$username || !$password) { http_response_code(400); echo json_encode(['error' => 'Username and password are required.']); exit; }

require_once __DIR__ . '/../config.php';
$WP   = WP_BASE;
$SITE = SITE_URL;
$CK   = WC_CK;
$CS   = WC_CS;

function wp_http($method, $url, $body = null, $headers = []) {
    $opts = ['method' => $method, 'header' => implode("\r\n", $headers), 'timeout' => 10, 'ignore_errors' => true];
    if ($body !== null) { $opts['content'] = is_array($body) ? json_encode($body) : $body; $opts['header'] .= "\r\nContent-Type: application/json"; }
    $ctx = stream_context_create(['http' => $opts, 'ssl' => ['verify_peer' => false]]);
    $resp = @file_get_contents($url, false, $ctx);
    return [$resp, $http_response_header ?? []];
}

function get_wc_customer($WP, $userId, $CK, $CS) {
    if (!$userId || !$CK) return null;
    [$r] = wp_http('GET', "$WP/wc/v3/customers/$userId?consumer_key=$CK&consumer_secret=$CS");
    return $r ? json_decode($r, true) : null;
}

function is_email_login($value) {
    return (bool) filter_var($value, FILTER_VALIDATE_EMAIL);
}

function find_wc_customer_by_login($WP, $login, $CK, $CS) {
    if (!$CK || !$CS) return null;
    $param = is_email_login($login) ? 'email' : 'search';
    $url = "$WP/wc/v3/customers?per_page=10&$param=" . urlencode($login) . "&consumer_key=$CK&consumer_secret=$CS";
    [$r] = wp_http('GET', $url);
    $customers = $r ? json_decode($r, true) : [];
    if (!is_array($customers) || empty($customers)) return null;

    $normalized = strtolower($login);
    foreach ($customers as $customer) {
        if (strtolower($customer['email'] ?? '') === $normalized || strtolower($customer['username'] ?? '') === $normalized) {
            return $customer;
        }
    }
    return $customers[0] ?? null;
}

function unique_identifiers($values) {
    $out = [];
    $seen = [];
    foreach ($values as $value) {
        $value = trim((string) $value);
        if (!$value) continue;
        $key = strtolower($value);
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $out[] = $value;
    }
    return $out;
}

function send_login_response($requestedLogin, $authLogin, $wpUser, $wc, $extra = []) {
    $name = $wc ? trim(($wc['first_name'] ?? '') . ' ' . ($wc['last_name'] ?? '')) : '';
    if (!$name) $name = $wpUser['name'] ?? $authLogin;
    echo json_encode(array_merge([
        'id' => $wc['id'] ?? ($wpUser['id'] ?? null),
        'name' => $name,
        'user_email' => $wc['email'] ?? ($wpUser['email'] ?? $requestedLogin),
        'billing' => $wc['billing'] ?? null,
        'shipping' => $wc['shipping'] ?? null,
    ], $extra));
    exit;
}

$existingCustomer = find_wc_customer_by_login($WP, $username, $CK, $CS);
$identifiers = unique_identifiers([
    $username,
    $existingCustomer['username'] ?? '',
    $existingCustomer['email'] ?? '',
]);

// Method 1: JWT. Try entered login, backend username, and backend email.
foreach ($identifiers as $authLogin) {
    foreach (["$WP/jwt-auth/v1/token", "$WP/simple-jwt-login/v1/auth"] as $url) {
        [$r] = wp_http('POST', $url, ['username' => $authLogin, 'password' => $password]);
        if ($r) {
            $d = json_decode($r, true);
            if (!empty($d['token'])) {
                $token = $d['token'];
                [$u] = wp_http('GET', "$WP/wp/v2/users/me?context=edit", null, ["Authorization: Bearer $token"]);
                $wpUser = $u ? json_decode($u, true) : [];
                $userId = $d['user_id'] ?? ($wpUser['id'] ?? null);
                $wc = $existingCustomer ?: get_wc_customer($WP, $userId, $CK, $CS);
                send_login_response($username, $authLogin, $wpUser ?: [], $wc ?: [], ['token' => $token]);
            }
        }
    }
}

// Method 2: Basic Auth / application password.
foreach ($identifiers as $authLogin) {
    $creds = base64_encode("$authLogin:$password");
    [$u] = wp_http('GET', "$WP/wp/v2/users/me?context=edit", null, ["Authorization: Basic $creds"]);
    $wpUser = $u ? json_decode($u, true) : null;
    if (!empty($wpUser['id'])) {
        $wc = $existingCustomer ?: get_wc_customer($WP, $wpUser['id'], $CK, $CS);
        send_login_response($username, $authLogin, $wpUser, $wc ?: []);
    }
}

// Method 3: Cookie login via wp-login.php.
foreach ($identifiers as $authLogin) {
    $body = http_build_query(['log' => $authLogin, 'pwd' => $password, 'wp-submit' => 'Log In', 'redirect_to' => "$SITE/wp-admin/", 'testcookie' => '1']);
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\nCookie: wordpress_test_cookie=WP+Cookie+check\r\nReferer: $SITE/wp-login.php", 'content' => $body, 'timeout' => 10, 'follow_location' => 0, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
    @file_get_contents("$SITE/wp-login.php", false, $ctx);
    $cookieParts = [];
    foreach (($http_response_header ?? []) as $h) {
        if (stripos($h, 'set-cookie:') === 0) {
            $c = trim(substr($h, 11));
            $cookieParts[] = explode(';', $c)[0];
        }
    }
    $cookieStr = implode('; ', $cookieParts);
    if ($cookieStr && strpos($cookieStr, 'wordpress_logged_in_') !== false) {
        [$u] = wp_http('GET', "$WP/wp/v2/users/me?context=edit", null, ["Cookie: $cookieStr"]);
        $wpUser = $u ? json_decode($u, true) : [];
        $wc = $existingCustomer ?: get_wc_customer($WP, $wpUser['id'] ?? null, $CK, $CS);
        send_login_response($username, $authLogin, $wpUser, $wc ?: [], ['sessionCookie' => $cookieStr]);
    }
}

if ($existingCustomer) {
    http_response_code(401);
    echo json_encode(['error' => 'Password is incorrect. Please try again or reset your password.']);
    exit;
}

http_response_code(401);
echo json_encode(['error' => 'Invalid username or password.']);
