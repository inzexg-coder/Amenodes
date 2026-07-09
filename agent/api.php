<?php
while (ob_get_level()) ob_end_flush();
ini_set('output_buffering', 'Off');
ini_set('zlib.output_compression', 'Off');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

// ===== КОНФИГУРАЦИЯ =====
$GC_ID     = '019f2045-57b1-767c-81af-e302dbbea420';
$GC_SECRET = 'ebecafd6-676c-40ce-83ef-abfd0e51339b';
$AUTH_URL  = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
$API_URL   = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing messages array']);
    exit;
}

$messages = $input['messages'];
$model    = $input['model']    ?? 'GigaChat';
$stream   = $input['stream']   ?? false;
$temp     = $input['temperature'] ?? 0.7;

// ===== 1. Получить access_token (Basic auth) =====
$token_cache = sys_get_temp_dir() . '/gigachat_token.json';
$token = null;

if (file_exists($token_cache)) {
    $cached = json_decode(file_get_contents($token_cache), true);
    if ($cached && isset($cached['expires']) && $cached['expires'] > time() + 60) {
        $token = $cached['access_token'];
    }
}

if (!$token) {
    $basic = base64_encode($GC_ID . ':' . $GC_SECRET);
    $auth_ch = curl_init($AUTH_URL);
    curl_setopt_array($auth_ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_POSTFIELDS     => 'scope=GIGACHAT_API_PERS',
        CURLOPT_HTTPHEADER     => [
            'Authorization: Basic ' . $basic,
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'RqUID: ' . $GC_ID,
        ],
    ]);
    $auth_resp = curl_exec($auth_ch);
    $auth_code = curl_getinfo($auth_ch, CURLINFO_HTTP_CODE);
    curl_close($auth_ch);

    $auth_data = json_decode($auth_resp, true);
    $token = $auth_data['access_token'] ?? null;

    if (!$token) {
        http_response_code(502);
        echo json_encode([
            'error'     => 'Auth failed',
            'http_code' => $auth_code,
            'detail'    => $auth_data['error_description'] ?? $auth_data['error'] ?? 'unknown',
        ]);
        exit;
    }

    file_put_contents($token_cache, json_encode([
        'access_token' => $token,
        'expires'      => time() + ($auth_data['expires_in'] ?? 1800),
    ]));
}

// ===== 2. Отправить в GigaChat =====
$payload = json_encode([
    'model'       => $model,
    'messages'    => $messages,
    'stream'      => $stream,
    'temperature' => (float)$temp,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => !$stream,
    CURLOPT_TIMEOUT        => $stream ? 30 : 60,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);

if ($stream) {
    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no');
    header('Connection: keep-alive');

    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) {
        echo $chunk;
        if (ob_get_level()) ob_flush();
        flush();
        return strlen($chunk);
    });

    curl_exec($ch);
    curl_close($ch);
} else {
    $result = curl_exec($ch);
    $code   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        http_response_code(502);
        echo json_encode([
            'error'     => 'GigaChat API error',
            'http_code' => $code,
            'detail'    => $result,
        ]);
        exit;
    }

    echo $result;
}
