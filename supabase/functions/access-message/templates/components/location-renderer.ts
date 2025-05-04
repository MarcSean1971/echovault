
/**
 * Helper function to render location if available
 */
export function renderLocation(message: any): string {
  if (!message.share_location || message.location_latitude == null || message.location_longitude == null) {
    return '';
  }
  
  return `
    <div class="message-location">
      <h3>Location</h3>
      <div class="location-details">
        <p>${message.location_name || 'Location attached'}</p>
        <div class="map-container">
          <img 
            src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${message.location_longitude},${message.location_latitude})/${message.location_longitude},${message.location_latitude},13,0/500x300" 
            alt="Message location map"
            style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #ddd;"
          />
        </div>
      </div>
    </div>
  `;
}
