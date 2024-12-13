<?php
add_action('rest_api_init', function () {
    register_rest_route('proxy/v1', '/dvf', [
        'methods' => 'GET',
        'callback' => 'fetch_dvf_data',
        'permission_callback' => '__return_true', // Make it public (adjust for security as needed)
    ]);
});

// The callback function for the proxy
function fetch_dvf_data(WP_REST_Request $request) {
    $lat = sanitize_text_field($request->get_param('lat'));
    $long = sanitize_text_field($request->get_param('lon'));
    $dist = sanitize_text_field($request->get_param('dist'));
    $limit = sanitize_text_field($request->get_param('limit'));

    if (!$lat || !$long || !$dist) {
        return new WP_Error('missing_params', 'Latitude, longitude, and distance are required.', ['status' => 400]);
    }

    // Construct the external API URL
    $api_url = "http://serverip/dvf?lat={$lat}&lon={$long}&dist={$dist}";

    $response = wp_remote_get($api_url);

    // Check for cURL or connection errors
    if (is_wp_error($response)) {
        $error_message = $response->get_error_message();
        return new WP_Error('api_error', $error_message, ['status' => 500]);
    }

    $data = wp_remote_retrieve_body($response);

    // Convert the response to JSON
    $decoded_data = json_decode($data, true);

    // Filter the data to only include the required fields
    $filtered_data = array_map(function ($item) {
        return [
            'lat' => $item['properties']['lat'] ?? null,
            'lon' => $item['properties']['lon'] ?? null,
            'type_local' => $item['properties']['type_local'] ?? null,
            'surface_relle_bati' => $item['properties']['surface_relle_bati'] ?? null,
            'nombre_pieces_principales' => $item['properties']['nombre_pieces_principales'] ?? null,
            'surface_terrain' => $item['properties']['surface_terrain'] ?? null,
            'valeur_fonciere' => $item['properties']['valeur_fonciere'] ?? null,
            'numero_voie' => $item['properties']['numero_voie'] ?? null,
            'type_voie' => $item['properties']['type_voie'] ?? null,
            'nom_voie' => $item['properties']['voie'] ?? null,
            'code_postal' => $item['properties']['code_postal'] ?? null,
            'commune' => $item['properties']['commune'] ?? null,
            'date_mutation' => $item['properties']['date_mutation'] ?? null,
        ];
    }, $decoded_data['features']);

    usort($filtered_data, function ($a, $b) {
        $dateA = strtotime($a['date_mutation']);
        $dateB = strtotime($b['date_mutation']);
        return $dateB <=> $dateA; // Ascending order, change to $dateB <=> $dateA for descending
    });

    // Apply limit to the filtered data if provided and not 0

    // Enhance the data with sub-sales
    $enhanced_data = [];

    foreach ($filtered_data as $item) {
        if(!$item['lat'] || !$item['lon'] || $item['type_local'] == 'Dépendance' | $item['valeur_fonciere'] < 1000) {
            continue;
        }

        $found = false;
        foreach($enhanced_data as $key => $clean) {
            if($clean['lat'] == $item['lat'] && $clean['lon'] == $item['lon']) {
                $found = true;
                if(!isset($clean['subSales'])) {
                    $enhanced_data[$key]['subSales'][] = [];
                }
                $enhanced_data[$key]['subSales'][] = [
                    'type_local' => $item['type_local'],
                    'surface' => $item['surface_relle_bati'],
                    'nombre_pieces' => $item['nombre_pieces_principales'],
                    'surface_terrain' => $item['surface_terrain'],
                    'valeur_fonciere' => $item['valeur_fonciere'],
                    'date' => $item['date_mutation'],
                ];
                $enhanced_data[$key]['valeur_fonciere'] = $item['valeur_fonciere'];
            }
        }

        if(!$found) {
            $enhanced_data[] = [
                'lat' => $item['lat'],
                'lon' => $item['lon'],
                'date' => $item['date_mutation'],
                'valeur_fonciere' => $item['valeur_fonciere'],
                'address' => $item['numero_voie'] . " " . $item['type_voie'] . " " . $item['nom_voie'] . " " . $item['code_postal'] . " " . $item['commune'],
                'subSales' => [
                    [
                        'type_local' => $item['type_local'],
                        'surface' => $item['surface_relle_bati'],
                        'nombre_pieces' => $item['nombre_pieces_principales'],
                        'surface_terrain' => $item['surface_terrain'],
                        'date' => $item['date_mutation'],
                        'valeur_fonciere' => $item['valeur_fonciere'],
                    ]
                ]
            ];
        }
    }
    
    if ($limit !== '0' && $limit !== '') {
        shuffle($enhanced_data);
        $enhanced_data = array_slice($enhanced_data, 0, $limit); 
    }

    // Return the filtered API data as JSON
    return rest_ensure_response($enhanced_data);
}
?>

