<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$data = json_decode(file_get_contents('php://input'), true);
$user_login = trim($data['user_login'] ?? '');
if (!$user_login) { http_response_code(400); echo json_encode(['error' => 'Email is required.']); exit; }

$SITE = 'https://jerseyperfume.com';
$WP = "$SITE/wp-json";

// Try WordPress native lost-password endpoint
$body = http_build_query(['user_login' => $user_login, 'redirect_to' => '', 'wp-submit' => 'Get New Password']);
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\nReferer: $SITE/wp-login.php?action=lostpassword", 'content' => $body, 'timeout' => 10, 'follow_location' => 0, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
@file_get_contents("$SITE/wp-login.php?action=lostpassword", false, $ctx);

// Always return success to avoid user enumeration
echo json_encode(['success' => true, 'message' => 'If an account exists with that email, a reset link has been sent.']);
