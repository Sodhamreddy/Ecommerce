<?php
/**
 * Returns the WooCommerce Store API nonce in the JSON body.
 * Header-based nonce delivery can be stripped by some hosts/CDNs;
 * putting it in the body makes it reliably accessible to the browser.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cookie');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$WC_STORE = 'https://jerseyperfume.com/wp-json/wc/store/v1';
$cookie   = $_SERVER['HTTP_COOKIE'] ?? '';

$ch = curl_init("$WC_STORE/cart");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
if ($cookie) curl_setopt($ch, CURLOPT_COOKIE, $cookie);

$response    = curl_exec($ch);
$headerSize  = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$respHeaders = substr($response, 0, $headerSize);

$nonce = '';
foreach (explode("\r\n", $respHeaders) as $h) {
    // WooCommerce returns either X-WC-Store-Api-Nonce or Nonce depending on version
    if (stripos($h, 'X-WC-Store-Api-Nonce:') === 0 || stripos($h, 'Nonce:') === 0) {
        $parts = explode(':', $h, 2);
        $nonce = trim($parts[1]);
    }
    // Forward session cookies so the nonce stays tied to the right cart
    if (stripos($h, 'Set-Cookie:') === 0) {
        $s = preg_replace('/;\s*Domain=[^;]*/i', '', $h);
        $s = preg_replace('/;\s*Secure/i', '', $s);
        $s = preg_replace('/;\s*SameSite=[^;]*/i', '', $s);
        header($s, false);
    }
}

echo json_encode(['nonce' => $nonce]);
