<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$first_name = trim($data['first_name'] ?? '');
$last_name = trim($data['last_name'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$id) { http_response_code(400); echo json_encode(['error' => 'User ID is required.']); exit; }

$WP = 'https://backend.jerseyperfume.com/wp-json';
$CK = function_exists('getenv') ? (getenv('WC_CONSUMER_KEY') ?: '') : '';
$CS = function_exists('getenv') ? (getenv('WC_CONSUMER_SECRET') ?: '') : '';

if (!$CK || !$CS) { http_response_code(500); echo json_encode(['error' => 'Account update is currently unavailable.']); exit; }

$payload = ['first_name' => $first_name, 'last_name' => $last_name, 'email' => $email];
if ($password) $payload['password'] = $password;

$ctx = stream_context_create(['http' => ['method' => 'PUT', 'header' => "Content-Type: application/json\r\nAuthorization: Basic " . base64_encode("$CK:$CS"), 'content' => json_encode($payload), 'timeout' => 10, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
$resp = @file_get_contents("$WP/wc/v2/customers/$id", false, $ctx);
$d = $resp ? json_decode($resp, true) : null;

if (!empty($d['id'])) {
    echo json_encode(['success' => true, 'name' => trim(($d['first_name'] ?? '') . ' ' . ($d['last_name'] ?? '')), 'user_email' => $d['email'] ?? $email]);
} else {
    http_response_code(400);
    echo json_encode(['error' => $d['message'] ?? 'Failed to update account.']);
}
