<?php
/**
 * ─── Jersey Perfume PHP Proxy ───
 * This script allows your Static HTML site to securely communicate with your WordPress backend.
 * It solves CORS (Cross-Origin) issues and handles cart sessions (cookies) automatically.
 */

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

// Capture any Nonce or specialized WC headers from the incoming request (Case-Insensitive)
foreach ($_SERVER as $name => $value) {
    if (substr($name, 0, 5) == 'HTTP_') {
        $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($name, 5)))));
        $lowName = strtolower($headerName);
        
        // Map to exact casing expected by WooCommerce for consistency
        if ($lowName === 'x-wc-store-api-nonce') {
            $headers[] = "X-WC-Store-Api-Nonce: $value";
        } elseif (strpos($lowName, 'nonce') !== false || strpos($lowName, 'wc-store-api') !== false) {
            $headers[] = "$headerName: $value";
        }
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
        header($h, false); // Allow multiple cookies
    } elseif (stripos($h, 'Content-Type:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WP-Total:') === 0 || stripos($h, 'X-WP-TotalPages:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WC-Store-Api-Nonce:') === 0 || stripos($h, 'Nonce:') === 0) {
        header($h);
    }
}

http_response_code($status);
echo $body;
