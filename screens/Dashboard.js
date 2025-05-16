
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { auth, firestore, database } from "../firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"

const Dashboard = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reservoirData, setReservoirData] = useState(null)
  const [sensorData, setSensorData] = useState({
    waterLevel: { value: 0, status: "normal" },
    ph: { value: 7, status: "normal" },
    temperature: { value: 25, status: "normal" },
    turbidity: { value: 5, status: "normal" },
  })
  const mockDataInterval = useRef(null)

  // For demonstration purposes, generate mock data
  const useMockData = () => {
    // Simulate real-time data changes
    mockDataInterval.current = setInterval(() => {
      setSensorData({
        waterLevel: processWaterLevel(Math.random() * 100),
        ph: processPh(Math.random() * 14),
        temperature: processTemperature(15 + Math.random() * 25),
        turbidity: processTurbidity(Math.random() * 10),
      })
    }, 5000)
  }

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToRealtimeUpdates()
    useMockData() // Call useMockData here, unconditionally
    return () => {
      unsubscribe()
      clearInterval(mockDataInterval.current)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const user = auth.currentUser
      if (!user) return

      // Try to get data from local storage first (for offline mode)
      const localData = await AsyncStorage.getItem(`reservoirData_${user.uid}`)
      if (localData) {
        setReservoirData(JSON.parse(localData))
      }

      // Get reservoir data from Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid))
      const userData = userDoc.data()

      if (userData?.reservoirId) {
        const reservoirDoc = await getDoc(doc(firestore, "reservoirs", userData.reservoirId))
        const reservoir = { id: reservoirDoc.id, ...reservoirDoc.data() }

        setReservoirData(reservoir)

        // Save to local storage for offline access
        await AsyncStorage.setItem(`reservoirData_${user.uid}`, JSON.stringify(reservoir))
      }
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Erreur", "Impossible de charger les données du réservoir")
    } finally {
      setLoading(false)
    }
  }

  const subscribeToRealtimeUpdates = () => {
    const user = auth.currentUser
    if (!user) return () => {}

    // This would be the path to your sensor data in Firebase Realtime Database
    const sensorRef = ref(database, `sensors/${user.uid}`)

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Process and update sensor data
        const processedData = {
          waterLevel: processWaterLevel(data.waterLevel),
          ph: processPh(data.ph),
          temperature: processTemperature(data.temperature),
          turbidity: processTurbidity(data.turbidity),
        }
        setSensorData(processedData)
      }
    })

    return unsubscribe
  }

  const processWaterLevel = (value) => {
    let status = "normal"
    if (value < 20) status = "danger"
    else if (value < 40) status = "warning"
    return { value: Math.round(value), status }
  }

  const processPh = (value) => {
    let status = "normal"
    if (value < 6.5 || value > 8.5) status = "danger"
    else if (value < 7 || value > 8) status = "warning"
    return { value: value.toFixed(1), status }
  }

  const processTemperature = (value) => {
    let status = "normal"
    if (value < 10 || value > 30) status = "danger"
    else if (value < 15 || value > 25) status = "warning"
    return { value: value.toFixed(1), status }
  }

  const processTurbidity = (value) => {
    let status = "normal"
    if (value > 5) status = "danger"
    else if (value > 3) status = "warning"
    return { value: value.toFixed(1), status }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "danger":
        return "#E74C3C"
      case "warning":
        return "#F39C12"
      default:
        return "#2ECC71"
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>
          {reservoirData
            ? `Réservoir ${
                reservoirData.usageType === "domestic"
                  ? "domestique"
                  : reservoirData.usageType === "agricultural"
                    ? "agricole"
                    : reservoirData.usageType === "industrial"
                      ? "industriel"
                      : reservoirData.usageType === "commercial"
                        ? "commercial"
                        : "autre"
              } - ${reservoirData.capacity} L`
            : "Chargement des données..."}
        </Text>
      </View>

      <View style={styles.dashboardGrid}>
        <View style={styles.dashboardRow}>
          <View style={[styles.dashboardCard, { borderTopColor: getStatusColor(sensorData.waterLevel.status) }]}>
            <View style={styles.cardHeader}>
              <Icon name="water-percent" size={24} color="#3498DB" />
              <Text style={styles.cardTitle}>Niveau d'eau</Text>
            </View>
            <Text style={styles.cardValue}>{sensorData.waterLevel.value}%</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(sensorData.waterLevel.status) }]}>
              <Text style={styles.statusText}>
                {sensorData.waterLevel.status === "danger"
                  ? "Critique"
                  : sensorData.waterLevel.status === "warning"
                    ? "Attention"
                    : "Normal"}
              </Text>
            </View>
          </View>

          <View style={[styles.dashboardCard, { borderTopColor: getStatusColor(sensorData.ph.status) }]}>
            <View style={styles.cardHeader}>
              <Icon name="flask-outline" size={24} color="#3498DB" />
              <Text style={styles.cardTitle}>pH</Text>
            </View>
            <Text style={styles.cardValue}>{sensorData.ph.value}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(sensorData.ph.status) }]}>
              <Text style={styles.statusText}>
                {sensorData.ph.status === "danger"
                  ? "Critique"
                  : sensorData.ph.status === "warning"
                    ? "Attention"
                    : "Normal"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dashboardRow}>
          <View style={[styles.dashboardCard, { borderTopColor: getStatusColor(sensorData.temperature.status) }]}>
            <View style={styles.cardHeader}>
              <Icon name="thermometer" size={24} color="#3498DB" />
              <Text style={styles.cardTitle}>Température</Text>
            </View>
            <Text style={styles.cardValue}>{sensorData.temperature.value}°C</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(sensorData.temperature.status) }]}>
              <Text style={styles.statusText}>
                {sensorData.temperature.status === "danger"
                  ? "Critique"
                  : sensorData.temperature.status === "warning"
                    ? "Attention"
                    : "Normal"}
              </Text>
            </View>
          </View>

          <View style={[styles.dashboardCard, { borderTopColor: getStatusColor(sensorData.turbidity.status) }]}>
            <View style={styles.cardHeader}>
              <Icon name="water" size={24} color="#3498DB" />
              <Text style={styles.cardTitle}>Turbidité</Text>
            </View>
            <Text style={styles.cardValue}>{sensorData.turbidity.value} NTU</Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(sensorData.turbidity.status) }]}>
              <Text style={styles.statusText}>
                {sensorData.turbidity.status === "danger"
                  ? "Critique"
                  : sensorData.turbidity.status === "warning"
                    ? "Attention"
                    : "Normal"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickAccessContainer}>
        <Text style={styles.quickAccessTitle}>Accès rapide</Text>
        <View style={styles.quickAccessButtons}>
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate("History")}>
            <Icon name="chart-line" size={24} color="#3498DB" />
            <Text style={styles.quickAccessButtonText}>Historique</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate("Alerts")}>
            <Icon name="bell" size={24} color="#3498DB" />
            <Text style={styles.quickAccessButtonText}>Alertes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate("Map")}>
            <Icon name="map" size={24} color="#3498DB" />
            <Text style={styles.quickAccessButtonText}>Carte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  dashboardGrid: {
    marginBottom: 20,
  },
  dashboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dashboardCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderTopWidth: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginLeft: 5,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    textAlign: "center",
  },
  statusIndicator: {
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  quickAccessContainer: {
    marginBottom: 20,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  quickAccessButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAccessButton: {
    width: "30%",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  quickAccessButtonText: {
    color: "#2C3E50",
    marginTop: 5,
    fontSize: 14,
  },
})

export default Dashboard
