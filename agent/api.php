<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
// Вставь свой ключ сюда: https://developer.sber.ru/
$CONFIG = [
    'gigachat' => [
        'client_secret' => '',  // ← ВСТАВЬ СЮДА СВОЙ КЛЮЧ
        'auth_url'   => 'https://oauth.ngs.sberbank.ru/prod/tokens',
        'api_url'    => 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
    ],
];

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

// Проверка ключа
$client_secret = $CONFIG['gigachat']['client_secret'];
if (empty($client_secret)) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'API key not configured',
        'message' => 'Добавь client_secret в agent/api.php'
    ]);
    exit;
}

// ===== 1. Получить access_token =====
$token_cache = sys_get_temp_dir() . '/gigachat_token.json';
$token = null;

if (file_exists($token_cache)) {
    $cached = json_decode(file_get_contents($token_cache), true);
    if ($cached && $cached['expires'] > time() + 60) {
        $token = $cached['access_token'];
    }
}

if (!$token) {
    $auth_ch = curl_init($CONFIG['gigachat']['auth_url']);
    curl_setopt_array($auth_ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type'    => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'client_secret' => $client_secret,
        ]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    ]);
    $auth_resp = json_decode(curl_exec($auth_ch), true);
    $auth_code = curl_getinfo($auth_ch, CURLINFO_HTTP_CODE);
    curl_close($auth_ch);

    if ($auth_code !== 200 || !isset($auth_resp['access_token'])) {
        http_response_code(502);
        echo json_encode([
            'error'     => 'Auth failed',
            'http_code' => $auth_code,
            'detail'    => $auth_resp['error'] ?? 'unknown',
        ]);
        exit;
    }

    $token = $auth_resp['access_token'];
    file_put_contents($token_cache, json_encode([
        'access_token' => $token,
        'expires'      => time() + ($auth_resp['expires_in'] ?? 1800),
    ]));
}

// ===== 2. Отправить в GigaChat =====
$payload = json_encode([
    'model'       => $model,
    'messages'    => $messages,
    'stream'      => $stream,
    'temperature' => (float)$temp,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init($CONFIG['gigachat']['api_url']);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => !$stream,
    CURLOPT_TIMEOUT        => $stream ? 30 : 60,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
    ],
]);

if ($stream) {
    // Стриминг: читаем по частям
    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no');

    $buffer = '';
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) use (&$buffer) {
        echo $chunk;
        ob_flush();
        flush();
        return strlen($chunk);
    });

    $result = curl_exec($ch);
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
