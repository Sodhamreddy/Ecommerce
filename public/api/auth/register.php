<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$first_name = trim($data['first_name'] ?? '');
$last_name = trim($data['last_name'] ?? '');

if (!$email || !$password) { http_response_code(400); echo json_encode(['error' => 'Email and password are required.']); exit; }

$WP = 'https://jerseyperfume.com/wp-json';
$CK = function_exists('getenv') ? (getenv('WC_CONSUMER_KEY') ?: '') : '';
$CS = function_exists('getenv') ? (getenv('WC_CONSUMER_SECRET') ?: '') : '';

if (!$CK || !$CS) { http_response_code(500); echo json_encode(['error' => 'Registration is currently unavailable. Please contact support.']); exit; }

$body = json_encode(['email' => $email, 'password' => $password, 'first_name' => $first_name, 'last_name' => $last_name, 'username' => $email]);
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\nAuthorization: Basic " . base64_encode("$CK:$CS"), 'content' => $body, 'timeout' => 10, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
$resp = @file_get_contents("$WP/wc/v2/customers", false, $ctx);
$d = $resp ? json_decode($resp, true) : null;

if (!empty($d['id'])) {
    echo json_encode(['success' => true, 'message' => 'Account created successfully.']);
} else {
    $msg = $d['message'] ?? ($d['error'] ?? 'Registration failed. The email may already be in use.');
    http_response_code(400);
    echo json_encode(['error' => $msg]);
}
