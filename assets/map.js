const markerColor = '#3FB1CE'; // marker color
const centerPositionMarkerColor = '#EDB483'; // Default marker color
const hoverMarkerColor = 'red'; // Hover marker color

document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    const listingsContainer = document.querySelector('.listings-container');

    if (!mapContainer) return;

    // Default coordinates from PHP
    const { lat: defaultLat, lng: defaultLng } = defaultCoords;

    // Initialize the map
    const map = new maplibregl.Map({
        container: 'map',
        style: {
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': [
                        'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=APIKEY'
                    ],
                    'tileSize': 256,
                    'attribution':
                        '<a href="https://www.thunderforest.com/" target="_blank">&copy; Thunderforest</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
                }
            },
            'layers': [
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 15,
                    'maxzoom': 19
                }
            ]
        },
        center: [parseFloat(defaultLng), parseFloat(defaultLat)],
        zoom: 17,
        maxZoom: 18,
        minZoom:15
    });
    map.addControl(new maplibregl.NavigationControl());
    // place a red dot on the map at the lat lng coordinates
    new maplibregl.Marker({
        color: centerPositionMarkerColor})
        .setLngLat([parseFloat(defaultLng), parseFloat(defaultLat)])
        .addTo(map)

    let markers = [];

    // Function to fetch listings from the API
    const fetchListings = async (center) => {
        try {
            const limit = map.getZoom() > 17 ? 0 : map.getZoom() * 10;
            const apiUrl = `/wp-json/proxy/v1/dvf?lat=${center.lat}&lon=${center.lng}&dist=${map.getZoom() > 17 ? 300 : 500}&limit=${limit}`;
            const response = await fetch(apiUrl);

            if (!response.ok) throw new Error('Failed to fetch data from API');

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching listings:', error);
            return [];
        }
    };

    const swapMarkerColor = (marker, color) => {
        const markerElement = marker.getElement();
        if (!markerElement) return;

        const groups = markerElement.querySelectorAll('g');
    
        // Check if the second <g> exists
        if (groups.length >= 2) {
            groups[2].setAttribute('fill', color); // Update the fill color of the second <g>
        }
    };

    // Function to update map and listings
    const updateListings = async () => {
        const center = map.getCenter();
        const bounds = map.getBounds();
        const canvas = document.getElementById('map')
        canvas.style.filter = 'blur(5px)';
        // Fetch and clear existing data
        const listings = await fetchAndClearListings(center, bounds);
    
        listings.forEach(data => {
            const { lon, lat, valeur_fonciere, address, date } = data || {};
            const { type_local, nombre_pieces, surfaceResult } = findRelevantSubSale(data.subSales);
    
            if (!lon || !lat || !valeur_fonciere || !surfaceResult || !type_local || !nombre_pieces) return;
    
            const venteMultiple = isVenteMultiple(data.subSales);
            const venteMultipleDetails = venteMultiple ? getVenteMultipleDetails(data.subSales) : null;
    
            const marker = createMarker(
                lon,
                lat,
                address,
                isVenteMultiple(data.subSales) 
                ? venteMultipleDetails.typeString 
                : `${type_local}${nombre_pieces > 0 ? ` ${nombre_pieces} pièce${nombre_pieces > 1 ? 's' : ''}` : ''}, ${surfaceResult}m²`,
                date,
                `${Math.round(valeur_fonciere).toLocaleString('fr-FR')} €`

            );
            markers.push(marker);
    
            const {card, listingCard} = createCard(
                { type_local, nombre_pieces, surfaceResult },
                address,
                date,
                valeur_fonciere,
                venteMultipleDetails
            );
            listingsContainer.appendChild(card);
    
            addMarkerEventListeners(marker, card);
            addCardEventListeners(card, marker);
            if(isVenteMultiple(data.subSales)) appendSubSaleDetails(data.subSales, listingCard, venteMultiple);

            canvas.style.filter = '';
        });
    };
    
    // Détermine si la vente est multiple
    const isVenteMultiple = (subSales) => {
        const dates = subSales.map(sale => sale.date);
        const sameDate = dates.every(date => date === dates[0]);
        return dates.length > 1 && sameDate;
    };
    
    // Génère les détails spécifiques pour une vente multiple
    const getVenteMultipleDetails = (subSales) => {
        if (!isVenteMultiple(subSales)) return null;
    
        // Compte les occurrences de chaque type_local
        const typeCounts = subSales.reduce((acc, sale) => {
            acc[sale.type_local] = (acc[sale.type_local] || 0) + 1;
            return acc;
        }, {});
    
        // Crée une chaîne comme "2 Appartements, 1 Maison"
        const typeString = Object.entries(typeCounts)
            .map(([type, count]) => {
                const displayType = type === 'Local industriel. commercial ou assimilé' ? 'Local' : type;
                return `${count} ${displayType}${count > 1 ? 's' : ''}`;
            })
            .join(', ');
    
        // Somme de toutes les pièces
        const totalPieces = subSales.reduce((sum, sale) => sum + sale.nombre_pieces, 0);
    
        return { typeString, totalPieces };
    };
    
    // Création de la carte avec prise en compte de la vente multiple
    const createCard = (subSaleInfo, address, date, valeur_fonciere, venteMultipleDetails) => {
        const { type_local, nombre_pieces, surfaceResult } = subSaleInfo;
        const card = document.createElement('div');
        card.className = 'card';
    
        const listingCard = document.createElement('div');
        listingCard.className = 'card-body';
    
        const titremarker = document.createElement('div');
        titremarker.className = 'titremarker';
    
        if (venteMultipleDetails) {
            const { typeString, totalPieces } = venteMultipleDetails;
            titremarker.innerHTML = `Vente multiple (${typeString}) : ${totalPieces} pièces, ${surfaceResult}m²`;
        } else {
            titremarker.innerHTML = `${type_local}${nombre_pieces > 0 ? ` ${nombre_pieces} pièce${nombre_pieces > 1 ? 's' : ''}` : ''}, ${surfaceResult}m²`;
        }
        listingCard.appendChild(titremarker);
    
        const row = document.createElement('div');
        row.className = 'row';
    
        const col8 = document.createElement('div');
        col8.className = 'col-8';
        col8.innerHTML = `<div class="datemarker">le ${date}</div>${capitalizeAddress(address)}`;
        row.appendChild(col8);
    
        const col4 = document.createElement('div');
        col4.className = 'col-4';
        col4.style.textAlign = 'right';
    
        const priceButton = document.createElement('span');
        priceButton.className = 'btn prixmarker btn-secondary';
        priceButton.textContent = `${Math.round(valeur_fonciere).toLocaleString('fr-FR')} €`;
        col4.appendChild(priceButton);
        row.appendChild(col4);
    
        listingCard.appendChild(row);
        card.appendChild(listingCard);
        return {card, listingCard};
    };
    
    // Ajoute les détails des sous-ventes, en cas de vente multiple
    const appendSubSaleDetails = (subSales, card, venteMultiple) => {
        if (venteMultiple) {
            subSales.forEach((subSale, index) => {
                const subSaleRow = document.createElement('div');
                subSaleRow.className = `ligneMultiple${index === 0 ? ' first' : ''}`;
                const displayType = subSale.type_local === 'Local industriel. commercial ou assimilé' ? 'Local' : subSale.type_local;
                const surface = subSale.surface || subSale.surface_terrain;
                subSaleRow.innerHTML = `${displayType}${subSale.nombre_pieces > 0 ? ` ${subSale.nombre_pieces} pièce${subSale.nombre_pieces > 1 ? 's' : ''}` : ''}, ${surface}m²`;
                card.appendChild(subSaleRow);
            });
        }
    };
    
    
    const fetchAndClearListings = async (center, bounds) => {
        const listings = await fetchListings(center, bounds);
        markers.forEach(marker => marker.remove());
        markers = [];
        listingsContainer.innerHTML = '';
        return listings;
    };
    
    const findRelevantSubSale = (subSales) => {
        for (const subSale of subSales) {
            const { type_local, nombre_pieces, surface, surface_terrain } = subSale;
            if (type_local && nombre_pieces && (surface || surface_terrain) &&
                (surface > 0 || surface_terrain > 0)) {
                return {
                    type_local: type_local === 'Local industriel. commercial ou assimilé' ? 'Local' : type_local,
                    nombre_pieces,
                    surfaceResult: surface || surface_terrain
                };
            }
        }
        return {};
    };

    // HTML Code for the popup when you click the marker
    function markerDOM(address, content, date, price) {
        return `
            <div class="markerPopUp">
                <!-- Title -->
                <span class="popupTitle">${address}</span>
                
                <!-- Description Container -->
                <div class="descContainer">
                    <span class="descmarker">${content}</span>
                </div>
                
                <!-- Date and Price Container -->
                <div class="boxprix">
                    <span class="datemarker">le ${date}</span>
                    <span class="btn btn-primary prixmarker">${price}</span>
                </div>
            </div>
        `;
    }

    const createMarker = (lon, lat, address, content, date, price) => {
        const html= markerDOM(address,content,date,price);

        const markerPopup = new maplibregl.Popup({
            closeOnClick: true
        }).setHTML(html);

        return new maplibregl.Marker()
            .setLngLat([lon, lat])
            .setPopup(markerPopup)
            .addTo(map);
    };
    let currentSelectedCard = null; // Track the currently selected card

    const addMarkerEventListeners = (marker, card) => {
        marker.getElement().addEventListener('mouseenter', () => {
            swapMarkerColor(marker, hoverMarkerColor);
            card.style.boxShadow = '0 0 25px rgba(0, 0, 0, 0.5)';
        });

        marker.getElement().addEventListener('mouseleave', () => {
            swapMarkerColor(marker, markerColor);
            card.style.boxShadow = '';
        });

        marker.getElement().addEventListener('click', () => {
            // Reset border color of the previously selected card
            if (currentSelectedCard) {
                currentSelectedCard.style.borderColor = '';
            }
            
            // Set the border color of the current card to red
            card.style.borderColor = hoverMarkerColor;
            
            // Scroll the card into view
            card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            
            // Update the currently selected card
            currentSelectedCard = card;
        });
    };

    const addCardEventListeners = (card, marker) => {
        card.addEventListener('mouseenter', () => {
            swapMarkerColor(marker, hoverMarkerColor);
        });

        card.addEventListener('mouseleave', () => {
            swapMarkerColor(marker, markerColor);
        });
    };
    
    const capitalizeAddress = (address) => {
        return address.toLowerCase().replace(/(^\w|\s\w)/g, letter => letter.toUpperCase());
    };
    

    // Fetch initial listings
    updateListings();

    // Debounce to reduce excessive updates
    let debounceTimeout;
    const debounceUpdate = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(updateListings, 200);
    };

    // Update listings on map movement
    map.on('moveend', debounceUpdate);

    // Update listings on zoom change
    map.on('zoomend', debounceUpdate);
});
