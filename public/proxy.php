<?php
/**
 * ─── Jersey Perfume PHP Proxy ───
 * This script allows your Static HTML site to securely communicate with your WordPress backend.
 * It solves CORS (Cross-Origin) issues and handles cart sessions (cookies) automatically.
 */

// Allow CORS and custom headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, X-WC-Store-Api-Nonce, Nonce, Authorization, X-Requested-With');
header('Access-Control-Expose-Headers: X-WC-Store-Api-Nonce, Nonce, X-WP-Total, X-WP-TotalPages');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$backend_base = "https://jerseyperfume.com/wp-json";
$path = $_GET['path'] ?? '';

if (!$path) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "online", "message" => "Proxy is active."]);
    exit;
}

// Reconstruct the full URL
$url = "$backend_base/$path";
$query = $_SERVER['QUERY_STRING'];
// Remove 'path' from query
$query = preg_replace('/path=[^&]*&?/', '', $query);
if ($query) {
    $url .= (strpos($url, '?') !== false ? '&' : '?') . $query;
}

$headers = [
    'Content-Type: application/json',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept: application/json',
];

// Capture ALL incoming request headers
$incomingHeaders = [];
if (function_exists('apache_request_headers')) {
    $incomingHeaders = apache_request_headers();
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($name, 5)))));
            $incomingHeaders[$headerName] = $value;
        }
    }
}

// Map and normalize headers for the backend request
foreach ($incomingHeaders as $name => $value) {
    $lowName = strtolower($name);
    
    // Explicitly normalize any variation of the security nonce
    if ($lowName === 'x-wc-store-api-nonce' || $lowName === 'nonce') {
        $headers[] = "X-WC-Store-Api-Nonce: $value";
    } elseif ($lowName === 'content-type') {
        // Skip - already in $headers
    } elseif ($lowName === 'user-agent' || $lowName === 'accept' || $lowName === 'cookie') {
        // Skip - handled separately or already in $headers
    } elseif (strpos($lowName, 'wc-') === 0 || strpos($lowName, 'x-wp') === 0) {
        // Forward official WC and WP headers
        $headers[] = "$name: $value";
    }
}

if (isset($_SERVER['HTTP_COOKIE'])) {
    $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true); // We need headers to capture Nonce from response
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$respHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);


// Expose headers for browser visibility
header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, X-WC-Store-Api-Nonce, Nonce, x-wc-store-api-nonce, nonce');

// Forward specific headers back to client
$lines = explode("\r\n", $respHeaders);
foreach ($lines as $h) {
    if (stripos($h, 'Set-Cookie:') === 0) {
        // Sanitize cookies: remove Domain, Secure, and SameSite restrictions 
        // so the browser accepts them on the current domain (Hostinger).
        $sanitized = preg_replace('/;\s*Domain=[^;]*/i', '', $h);
        $sanitized = preg_replace('/;\s*Secure/i', '', $sanitized);
        $sanitized = preg_replace('/;\s*SameSite=[^;]*/i', '', $sanitized);
        header($sanitized, false); 
    } elseif (stripos($h, 'Content-Type:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WP-Total:') === 0 || stripos($h, 'X-WP-TotalPages:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WC-Store-Api-Nonce:') === 0 || stripos($h, 'Nonce:') === 0 || stripos($h, 'nonce:') === 0) {
        // Forward any nonce variation back to client as the standard X-WC-Store-Api-Nonce
        $parts = explode(':', $h, 2);
        header('X-WC-Store-Api-Nonce: ' . trim($parts[1]));
    }
}

// dgg
http_response_code($status);
echo $body;
