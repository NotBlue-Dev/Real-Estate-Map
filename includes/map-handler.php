<?php
// Register the shortcode for the map page
function real_estate_map_page_shortcode() {
    wp_enqueue_script('maplibre', 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js', [], null, true);
    wp_enqueue_script('custom-map', plugin_dir_url(__FILE__) . '../assets/map.js', ['jquery', 'maplibre'], null, true);
    wp_enqueue_style('maplibre-css', 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css');
    wp_enqueue_style('styles-css', plugin_dir_url(__FILE__) . '../assets/styles.css');

    // GET parameters, default to smwh
    $lat = isset($_GET['lat']) ? sanitize_text_field($_GET['lat']) : '43.7';
    $lng = isset($_GET['long']) ? sanitize_text_field($_GET['long']) : '7.25';

    // Pass PHP variables to JavaScript
    wp_localize_script('custom-map', 'defaultCoords', [
        'lat' => $lat,
        'lng' => $lng,
    ]);

    ob_start();
    ?>
    <div id="main">
        <div id="listing">
            <div class="listings-container"></div>
        </div>
        <div id="map"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('init_map_content', 'real_estate_map_page_shortcode');
