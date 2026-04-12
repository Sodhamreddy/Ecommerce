<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$WP = 'https://jerseyperfume.com/wp-json';
$CK = function_exists('getenv') ? (getenv('WC_CONSUMER_KEY') ?: '') : '';
$CS = function_exists('getenv') ? (getenv('WC_CONSUMER_SECRET') ?: '') : '';

$ALLOWED = ['paypal', 'stripe', 'woocommerce_payments', 'cod'];
$LABELS  = ['stripe' => 'Debit & Credit Cards', 'woocommerce_payments' => 'Debit & Credit Cards', 'paypal' => 'PayPal', 'cod' => 'Cash on Delivery'];
$DESCS   = ['stripe' => 'Pay with your credit card.', 'woocommerce_payments' => 'Pay with your credit card.', 'paypal' => 'Pay via PayPal.', 'cod' => 'Pay with cash upon delivery.'];

if ($CK && $CS) {
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'header' => "Authorization: Basic " . base64_encode("$CK:$CS"), 'timeout' => 8, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false]]);
    $resp = @file_get_contents("$WP/wc/v3/payment_gateways?consumer_key=$CK&consumer_secret=$CS", false, $ctx);
    if ($resp) {
        $gateways = json_decode($resp, true);
        if (is_array($gateways)) {
            $filtered = array_values(array_filter($gateways, fn($g) => !empty($g['enabled']) && in_array($g['id'], $ALLOWED)));
            usort($filtered, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
            $result = array_map(fn($g) => ['id' => $g['id'], 'title' => $LABELS[$g['id']] ?? $g['title'], 'description' => $DESCS[$g['id']] ?? $g['description'], 'order' => $g['order'] ?? 0], $filtered);
            if (!empty($result)) { echo json_encode($result); exit; }
        }
    }
}

// Fallback
echo json_encode([
    ['id' => 'stripe', 'title' => 'Debit & Credit Cards', 'description' => 'Pay with your credit card.', 'order' => 0],
    ['id' => 'paypal', 'title' => 'PayPal', 'description' => 'Pay via PayPal.', 'order' => 1],
]);
