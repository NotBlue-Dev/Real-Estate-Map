# Real Estate Search Plugin

## Overview

The Real Estate Search Plugin is a WordPress plugin that provides an interactive map and search bar for real estate listings. It allows users to search for properties using an address and view listings on a map with detailed information.

## Features

- Interactive map with property markers
- Search bar with address autocomplete
- Display of property details including type, size, and price
- Responsive design for various screen sizes
- Integration with external APIs for data fetching

## Installation

1. **Download the Plugin:**
   - Clone or download the plugin files to your local machine.

2. **Upload to WordPress:**
   - Go to your WordPress admin dashboard.
   - Navigate to `Plugins > Add New`.
   - Click on `Upload Plugin` and select the plugin zip file.
   - Click `Install Now` and then `Activate` the plugin.

3. **Configure API Keys:**
   - Ensure you have the necessary API keys for Geoapify and Thunderforest.
   - Update the API keys in the relevant files if needed.

(Already done in our case)
## Usage

### Shortcodes

- **Search Bar:** Use the `[real_estate_search_bar]` shortcode to display the search bar on any page or post. You can specify a custom map page URL using the `map_page_url` attribute.

  ```php
  [real_estate_search_bar map_page_url="/custom-map-page"]
  ```

- **Map Display:** Use the `[init_map_content]` shortcode to display the map on a page.

  ```php
  [init_map_content]
  ```

## Customization

The Real Estate Search Plugin is designed to be flexible and customizable. Below are the key areas where you can make changes to tailor the plugin to your needs.

### Styles

- **File:** `assets/styles.css`

  This file contains all the CSS styles for the plugin. You can modify this file to change the appearance of the map, listings, and search bar.

  - **Map Styling:** Adjust the size and appearance of the map container by modifying the `#map` selector.
  - **Listing Styling:** Customize the look of the property listings using the `.card`, `.card-body`, and related classes.
  - **Search Bar Styling:** Modify the appearance of the search bar and suggestions dropdown using the `#suggestions-container` and `.suggestion` classes.

### JavaScript

- **File:** `assets/map.js`

  This file contains the JavaScript logic for the interactive map. You can modify this file to change how the map behaves and interacts with users.

  - **Map Initialization:** Customize the map's initial view, style, and controls in the `maplibregl.Map` initialization section.
  - **Marker Customization:** Change marker colors and behavior by modifying the `markerColor`, `centerPositionMarkerColor`, and `hoverMarkerColor` variables.
  - **Event Listeners:** Adjust how markers and listings respond to user interactions by editing the `addMarkerEventListeners` and `addCardEventListeners` functions.

### PHP Shortcodes

- **File:** `includes/shortcodes.php`

  This file defines the shortcodes used to display the search bar and map. You can modify these functions to change the default behavior or add new attributes.

  - **Search Bar Shortcode:** Customize the form action URL and input fields in the `real_estate_search_bar_shortcode` function.
  - **Map Shortcode:** Adjust the map's default coordinates and scripts in the `real_estate_map_page_shortcode` function.

### API Integration

- **File:** `includes/proxy-endpoint.php`

  This file handles the proxy endpoint for fetching real estate data. You can modify this file to change how data is fetched and processed.

  - **API URL:** Update the external API URL in the `fetch_dvf_data` function to point to a different data source if needed.
  - **Data Processing:** Customize how the data is filtered and enhanced before being returned to the client.

### HTML Templates

- **File:** `templates/map-page.php`

  This file contains the HTML structure for the map page. You can modify this file to change the layout or add additional elements.

  - **Map and Listing Containers:** Adjust the structure and styling of the map and listing containers to fit your design needs.

By customizing these files, you can significantly alter the functionality and appearance of the Real Estate Search Plugin to better suit your project's requirements.

## API Endpoints

- **Proxy Endpoint:** The plugin uses a proxy endpoint to fetch real estate data. Ensure the endpoint is correctly configured in `includes/proxy-endpoint.php`.

## Development

### File Structure

- `real-estate-plugin.php`: Main plugin file.
- `includes/`: Contains PHP files for shortcodes, map handling, and proxy endpoint.
- `assets/`: Contains JavaScript and CSS files.
- `templates/`: Contains HTML templates for the map page.

### Dependencies

- **MapLibre GL JS:** Used for rendering the interactive map.
- **Geoapify API:** Used for address autocomplete in the search bar.
- **Thunderforest Tiles:** Used for map tiles.
