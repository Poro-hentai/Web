<?php
// Path to the JSON file
$file = 'anime-data.json';

// Get the POST data as JSON
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Read existing data
if (file_exists($file)) {
    $json = json_decode(file_get_contents($file), true);
    if (!$json) $json = [];
} else {
    $json = [];
}

// Add new anime to array
$json[] = $data;

// Write back to file
if (file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data']);
}
?>
