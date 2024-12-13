<?php
/**
 * Plugin Name: Real Estate Search Plugin
 * Description: Barre de recherche et carte interactive pour les logements.
 * Version: 1.0
 * Author: notblue
 */

if (!defined('ABSPATH')) exit; // Sécurité pour empêcher l'accès direct

// Inclure les fichiers nécessaires
require_once plugin_dir_path(__FILE__) . 'includes/shortcodes.php';
require_once plugin_dir_path(__FILE__) . 'includes/map-handler.php';
require_once plugin_dir_path(__FILE__) . 'includes/proxy-endpoint.php';