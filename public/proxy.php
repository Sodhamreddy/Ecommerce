<?php
/**
 * ─── Jersey Perfume PHP Proxy ───
 * Solves CORS issues and handles cart sessions (cookies) automatically.
 *
 * NOTE: Hostinger's Nginx strips custom request headers (X-WC-Store-Api-Nonce)
 * before they reach PHP. We work around this by also accepting the nonce via
 * the _nonce URL query parameter, which Nginx never strips.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, X-WC-Store-Api-Nonce, Nonce, Authorization, X-Requested-With');
header('Access-Control-Expose-Headers: X-WC-Store-Api-Nonce, Nonce, X-WP-Total, X-WP-TotalPages');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$backend_base_root = "https://jerseyperfume.com";
$path = $_GET['path'] ?? '';

if (!$path) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "online", "message" => "Proxy is active."]);
    exit;
}

// Ensure the path starts with a slash
$cleanPath = '/' . ltrim($path, '/');

// Reconstruct backend URL using ?rest_route= format.
// This is much more reliable as it bypasses local rewrite/security rules that may block "pretty" URLs (like /wp-json/wc/store/v1/checkout).
$url = "$backend_base_root/index.php?rest_route=$cleanPath";
$query = $_SERVER['QUERY_STRING'];
$query = preg_replace('/(?:^|&)(?:path|_nonce)=[^&]*/', '', $query);
$query = ltrim($query, '&');
if ($query) {
    $url .= (strpos($url, '?') !== false ? '&' : '?') . $query;
}

$headers = [
    'Content-Type: application/json',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept: application/json',
];

// Read all incoming request headers
$incomingHeaders = [];
if (function_exists('apache_request_headers')) {
    $incomingHeaders = apache_request_headers();
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) === 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($name, 5)))));
            $incomingHeaders[$headerName] = $value;
        }
    }
}

// Forward relevant headers; capture nonce from headers as fallback
foreach ($incomingHeaders as $name => $value) {
    $lowName = strtolower($name);

    if ($lowName === 'x-wc-store-api-nonce' || $lowName === 'nonce') {
        // Prefer nonce from URL query (already set above); only use header if URL had none
        if (!$nonce) $nonce = $value;
    } elseif ($lowName === 'authorization') {
        $headers[] = "Authorization: $value";
    } elseif ($lowName === 'content-type' || $lowName === 'user-agent' || $lowName === 'accept' || $lowName === 'cookie') {
        // Handled separately
    } elseif (strpos($lowName, 'wc-') === 0 || strpos($lowName, 'x-wp') === 0) {
        $headers[] = "$name: $value";
    }
}

// Add nonce header for WooCommerce (from URL query or request headers).
// Send as both variants: some server-side Nginx configs strip X-* prefixed headers
// before they reach PHP/WordPress. "Nonce" (no X- prefix) survives those rules
// and is the header WooCommerce checks first.
if ($nonce) {
    $headers[] = "Nonce: $nonce";
    $headers[] = "X-WC-Store-Api-Nonce: $nonce";
}

if (isset($_SERVER['HTTP_COOKIE'])) {
    $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POSTREDIR, 3);   // keep POST method + headers on redirects
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
} elseif ($method === 'PUT' || $method === 'PATCH' || $method === 'DELETE') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response   = curl_exec($ch);
$status     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$respHeaders = substr($response, 0, $headerSize);
$body        = substr($response, $headerSize);

header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, X-WC-Store-Api-Nonce, Nonce, x-wc-store-api-nonce, nonce');

foreach (explode("\r\n", $respHeaders) as $h) {
    if (stripos($h, 'Set-Cookie:') === 0) {
        $s = preg_replace('/;\s*Domain=[^;]*/i', '', $h);
        $s = preg_replace('/;\s*Secure/i', '', $s);
        $s = preg_replace('/;\s*SameSite=[^;]*/i', '', $s);
        header($s, false);
    } elseif (stripos($h, 'Content-Type:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WP-Total:') === 0 || stripos($h, 'X-WP-TotalPages:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WC-Store-Api-Nonce:') === 0 || stripos($h, 'Nonce:') === 0 || stripos($h, 'nonce:') === 0) {
        $parts = explode(':', $h, 2);
        header('X-WC-Store-Api-Nonce: ' . trim($parts[1]));
    }
}

http_response_code($status);
echo $body;
