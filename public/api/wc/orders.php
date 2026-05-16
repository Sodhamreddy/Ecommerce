<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

$customer = intval($_GET['customer'] ?? 0);
if (!$customer) { echo json_encode([]); exit; }

$WP = WP_BASE;
$CK = WC_CK;
$CS = WC_CS;

$ctx = stream_context_create(['http' => ['method' => 'GET', 'header' => "Authorization: Basic " . base64_encode("$CK:$CS"), 'timeout' => 10, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
$resp = @file_get_contents("$WP/wc/v3/orders?customer=$customer&per_page=100&orderby=date&order=desc&consumer_key=$CK&consumer_secret=$CS", false, $ctx);
$orders = $resp ? json_decode($resp, true) : [];

if (!is_array($orders)) { echo json_encode([]); exit; }

// Return simplified order data
$result = array_map(function($o) {
    return ['id' => $o['id'], 'number' => $o['number'], 'status' => $o['status'], 'total' => $o['total'], 'date_created' => $o['date_created'], 'line_items' => array_map(function($i) { return ['name' => $i['name'], 'quantity' => $i['quantity']]; }, $o['line_items'] ?? [])];
}, $orders);

echo json_encode($result);
