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

$method = $_SERVER['REQUEST_METHOD'];
$headers = [
    'Content-Type: application/json',
    'User-Agent: JerseyPerfume-Proxy/1.0',
];

if (isset($_SERVER['HTTP_COOKIE'])) {
    $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resp_headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Expose WP pagination headers so JS can read them for product count/pages
header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages');

foreach (explode("\r\n", $resp_headers) as $h) {
    if (stripos($h, 'Set-Cookie:') === 0) {
        header($h, false);
    } elseif (stripos($h, 'Content-Type:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WP-Total:') === 0) {
        header($h);
    } elseif (stripos($h, 'X-WP-TotalPages:') === 0) {
        header($h);
    }
}

http_response_code($status);
echo $body;
curl_close($ch);
