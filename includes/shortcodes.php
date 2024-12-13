<?php
function real_estate_search_bar_shortcode($atts) {
    // Default URL for the map page if not provided
    $atts = shortcode_atts(
        array(
            'map_page_url' => '/map-page', // Default URL
        ), 
        $atts, 
        'real_estate_search_bar'
    );

    // Enqueue styles for the search bar
    wp_enqueue_style('real-estate-search-bar-style', plugins_url('../assets/styles.css', __FILE__));

    ob_start();
    ?>
    <form id="real-estate-search-form" method="GET" action="<?php echo esc_url(site_url($atts['map_page_url'])); ?>">
        <input type="text" name="address" id="search-address" placeholder="Entrez une adresse" required autocomplete="off">
        <input type="hidden" name="lat" id="search-lat">
        <input type="hidden" name="long" id="search-long">
    </form>
    <div id="suggestions-container" style="display:none;"></div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const searchAddress = document.getElementById('search-address');
            const suggestionsContainer = document.getElementById('suggestions-container');
            const searchLat = document.getElementById('search-lat');
            const searchLong = document.getElementById('search-long');
            let debounceTimeout;
            const form = document.getElementById('real-estate-search-form');

            // Function to fetch address suggestions from Geoapify API
            function fetchSuggestions(query) {
                if (!query) return;
                const apiKey = 'APIKEY';
                const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&lang=fr&limit=5&format=json&apiKey=${apiKey}`;
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        suggestionsContainer.innerHTML = '';
                        if (data.results) {
                            data.results.forEach(result => {
                                const suggestion = document.createElement('div');
                                suggestion.textContent = result.formatted;
                                suggestion.classList.add('suggestion');
                                suggestion.onclick = function () {
                                    // Set the selected address and lat/long to the form inputs
                                    searchAddress.value = result.formatted;
                                    searchLat.value = result.lat;
                                    searchLong.value = result.lon;
                                    suggestionsContainer.style.display = 'none';  // Hide suggestions after selection
                                    form.submit();
                                };
                                suggestionsContainer.appendChild(suggestion);
                            });
                            suggestionsContainer.style.display = 'block';  // Show suggestions
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching suggestions:', error);
                    });
            }

            // Add event listener for input changes with debounce
            searchAddress.addEventListener('input', function () {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(function () {
                    const query = searchAddress.value.trim();
                    fetchSuggestions(query);
                }, 500); // Adjust debounce delay as needed
            });
        });
    </script>
    <?php
    return ob_get_clean();
}

// Register the unified shortcode with 'redirect' as a parameter
add_shortcode('real_estate_search_bar', 'real_estate_search_bar_shortcode');