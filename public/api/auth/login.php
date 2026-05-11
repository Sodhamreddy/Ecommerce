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

$WP = 'https://jerseyperfume.com/wp-json';
$SITE = 'https://jerseyperfume.com';
$CK = ''; $CS = ''; // WC consumer keys — set via env if available
if (function_exists('getenv')) { $CK = getenv('WC_CONSUMER_KEY') ?: ''; $CS = getenv('WC_CONSUMER_SECRET') ?: ''; }

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

// Method 1: JWT
foreach (["$WP/jwt-auth/v1/token", "$WP/simple-jwt-login/v1/auth"] as $url) {
    [$r] = wp_http('POST', $url, ['username' => $username, 'password' => $password]);
    if ($r) {
        $d = json_decode($r, true);
        if (!empty($d['token'])) {
            $token = $d['token'];
            [$u] = wp_http('GET', "$WP/wp/v2/users/me?context=edit", null, ["Authorization: Bearer $token"]);
            $wpUser = $u ? json_decode($u, true) : [];
            $userId = $wpUser['id'] ?? null;
            $wc = get_wc_customer($WP, $userId, $CK, $CS);
            echo json_encode(['id' => $userId, 'name' => $wc ? trim(($wc['first_name'] ?? '') . ' ' . ($wc['last_name'] ?? '')) : ($wpUser['name'] ?? $username), 'user_email' => $wc['email'] ?? ($wpUser['email'] ?? $username), 'billing' => $wc['billing'] ?? null, 'shipping' => $wc['shipping'] ?? null, 'token' => $token]);
            exit;
        }
    }
}

// Method 2: Basic Auth
$creds = base64_encode("$username:$password");
[$u] = wp_http('GET', "$WP/wp/v2/users/me?context=edit", null, ["Authorization: Basic $creds"]);
$wpUser = $u ? json_decode($u, true) : null;
if (!empty($wpUser['id'])) {
    $wc = get_wc_customer($WP, $wpUser['id'], $CK, $CS);
    echo json_encode(['id' => $wpUser['id'], 'name' => $wc ? trim(($wc['first_name'] ?? '') . ' ' . ($wc['last_name'] ?? '')) : ($wpUser['name'] ?? $username), 'user_email' => $wc['email'] ?? ($wpUser['email'] ?? $username), 'billing' => $wc['billing'] ?? null, 'shipping' => $wc['shipping'] ?? null]);
    exit;
}

// Method 3: Cookie login
$body = http_build_query(['log' => $username, 'pwd' => $password, 'wp-submit' => 'Log In', 'redirect_to' => "$SITE/wp-admin/", 'testcookie' => '1']);
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
    $wc = get_wc_customer($WP, $wpUser['id'] ?? null, $CK, $CS);
    echo json_encode(['id' => $wpUser['id'] ?? null, 'name' => $wc ? trim(($wc['first_name'] ?? '') . ' ' . ($wc['last_name'] ?? '')) : ($wpUser['name'] ?? $username), 'user_email' => $wc['email'] ?? ($wpUser['email'] ?? $username), 'billing' => $wc['billing'] ?? null, 'shipping' => $wc['shipping'] ?? null]);
    exit;
}

http_response_code(401);
echo json_encode(['error' => 'Invalid username or password.']);
