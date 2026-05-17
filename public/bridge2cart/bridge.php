<?php
$query = $_SERVER['QUERY_STRING'] ?? '';
$target = 'https://backend.jerseyperfume.com/bridge2cart/bridge.php' . ($query ? '?' . $query : '');

header('Location: ' . $target, true, 307);
exit;
