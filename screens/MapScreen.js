
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native"
import MapView, { Marker, Callout } from "react-native-maps"
import { auth, firestore } from "../firebase-config"
import { doc, getDoc } from "firebase/firestore"
import * as Location from "expo-location"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const MapScreen = () => {
  const [loading, setLoading] = useState(true)
  const [reservoirData, setReservoirData] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [region, setRegion] = useState({
    latitude: 48.8566, // Default to Paris
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  useEffect(() => {
    requestLocationPermission()
    fetchReservoirData()
  }, [])

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === "granted") {
      getCurrentLocation()
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const { latitude, longitude } = location.coords
      setUserLocation({ latitude, longitude })
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  const fetchReservoirData = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      // Get reservoir data from Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid))
      const userData = userDoc.data()

      if (userData?.reservoirId) {
        const reservoirDoc = await getDoc(doc(firestore, "reservoirs", userData.reservoirId))
        const reservoir = { id: reservoirDoc.id, ...reservoirDoc.data() }

        setReservoirData(reservoir)

        // If reservoir has location, center map on it
        if (reservoir.location && !reservoir.location.manual) {
          const { latitude, longitude } = reservoir.location
          setRegion({
            latitude: Number.parseFloat(latitude),
            longitude: Number.parseFloat(longitude),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching reservoir data:", error)
      Alert.alert("Erreur", "Impossible de charger les données du réservoir")
    } finally {
      setLoading(false)
    }
  }

  const centerMapOnReservoir = () => {
    if (reservoirData && reservoirData.location && !reservoirData.location.manual) {
      const { latitude, longitude } = reservoirData.location
      setRegion({
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })
    }
  }

  const centerMapOnUser = () => {
    if (userLocation) {
      setRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      })
    } else {
      Alert.alert("Erreur", "Position de l'utilisateur non disponible")
      requestLocationPermission()
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
      ) : (
        <>
          <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
            {reservoirData && reservoirData.location && !reservoirData.location.manual && (
              <Marker
                coordinate={{
                  latitude: Number.parseFloat(reservoirData.location.latitude),
                  longitude: Number.parseFloat(reservoirData.location.longitude),
                }}
                pinColor="#3498DB"
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>Mon Réservoir</Text>
                    <Text style={styles.calloutText}>Capacité: {reservoirData.capacity} L</Text>
                    <Text style={styles.calloutText}>
                      Type:{" "}
                      {reservoirData.usageType === "domestic"
                        ? "Domestique"
                        : reservoirData.usageType === "agricultural"
                          ? "Agricole"
                          : reservoirData.usageType === "industrial"
                            ? "Industriel"
                            : reservoirData.usageType === "commercial"
                              ? "Commercial"
                              : "Autre"}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            )}

            {userLocation && (
              <Marker coordinate={userLocation} pinColor="#E74C3C">
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>Ma Position</Text>
                  </View>
                </Callout>
              </Marker>
            )}
          </MapView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.mapButton} onPress={centerMapOnReservoir}>
              <Icon name="water-outline" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapButton} onPress={centerMapOnUser}>
              <Icon name="crosshairs-gps" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  mapButton: {
    backgroundColor: "#3498DB",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  callout: {
    width: 150,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 14,
  },
})

export default MapScreen
