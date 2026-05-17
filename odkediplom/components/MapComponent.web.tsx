import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MapProps {
  lat: string;
  lng: string;
  radius?: string;
}

export default function MapComponent({ lat, lng }: MapProps) {
  const latitude = parseFloat(lat) || 47.9185;
  const longitude = parseFloat(lng) || 106.9177;

  // Google Maps Embed URL -Marker гаргахын тулд q= ашиглав
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <View style={styles.container}>
      <iframe
        key={`${latitude}-${longitude}`} // Энэ key маш чухал: Координат солигдоход газрын зургийг шинэчилнэ
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: 12 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, height: 250, width: '100%' }
});