<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Nonce, Cookie');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$WC_STORE = 'https://jerseyperfume.com/wp-json/wc/store/v1';

$body = file_get_contents('php://input');
$nonce = $_SERVER['HTTP_NONCE'] ?? '';
$cookie = $_SERVER['HTTP_COOKIE'] ?? '';

$headers = ["Content-Type: application/json", "Accept: application/json"];
if ($nonce) $headers[] = "Nonce: $nonce";
if ($cookie) $headers[] = "Cookie: $cookie";

$ch = curl_init("$WC_STORE/checkout");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resp_headers = substr($response, 0, $header_size);
$resp_body = substr($response, $header_size);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

foreach (explode("\r\n", $resp_headers) as $h) {
    if (stripos($h, 'Set-Cookie:') === 0) header($h, false);
    elseif (stripos($h, 'Nonce:') === 0) header($h);
}

http_response_code($status);
echo $resp_body;
