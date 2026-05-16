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

require_once __DIR__ . '/../config.php';
$WP = WP_BASE;
$CK = WC_CK;
$CS = WC_CS;

if (!$CK || !$CS) { http_response_code(500); echo json_encode(['error' => 'Registration is currently unavailable. Please contact support.']); exit; }

$body = json_encode([
    'email' => $email,
    'username' => $email,
    'password' => $password,
    'first_name' => $first_name,
    'last_name' => $last_name,
]);
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\nAuthorization: Basic " . base64_encode("$CK:$CS"), 'content' => $body, 'timeout' => 10, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
$resp = @file_get_contents("$WP/wc/v3/customers", false, $ctx);
$d = $resp ? json_decode($resp, true) : null;

if (!empty($d['id'])) {
    echo json_encode(['success' => true, 'user_id' => $d['id'], 'message' => 'Account created successfully.']);
} else {
    $msg = $d['message'] ?? ($d['error'] ?? 'Registration failed. The email may already be in use.');
    http_response_code(400);
    echo json_encode(['error' => $msg]);
}
