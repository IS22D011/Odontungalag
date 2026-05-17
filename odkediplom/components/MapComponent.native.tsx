import React from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import { StyleSheet } from 'react-native';

export default function MapComponent({ region, lat, lng, radius, setLat, setLng }: any) {
  return (
    <MapView 
      style={styles.map} 
      region={region}
      onPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLat(latitude.toString());
        setLng(longitude.toString());
      }}
    >
      <Marker coordinate={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }} />
      <Circle
        center={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }}
        radius={parseInt(radius) || 100}
        fillColor="rgba(79, 70, 229, 0.2)"
        strokeColor="#4F46E5"
      />
    </MapView>
  );
}
const styles = StyleSheet.create({ map: { flex: 1 } });