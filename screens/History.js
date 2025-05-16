
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { auth } from "../firebase-config"
import { Picker } from "@react-native-picker/picker"

const { width } = Dimensions.get("window")

const History = () => {
  const [loading, setLoading] = useState(true)
  const [selectedParameter, setSelectedParameter] = useState("waterLevel")
  const [timeRange, setTimeRange] = useState("day")
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  })

  useEffect(() => {
    fetchHistoricalData()
  }, [selectedParameter, timeRange])

  const fetchHistoricalData = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return

      // In a real app, you would fetch historical data from your database
      // For this example, we'll generate mock data
      const mockData = generateMockData(selectedParameter, timeRange)
      setChartData(mockData)
    } catch (error) {
      console.error("Error fetching historical data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (parameter, range) => {
    let labels = []
    const data = []
    let count = 0

    switch (range) {
      case "day":
        count = 24
        for (let i = 0; i < count; i++) {
          const hour = i.toString().padStart(2, "0") + ":00"
          labels.push(hour)
          data.push(generateRandomValue(parameter))
        }
        break
      case "week":
        count = 7
        const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
        labels = days
        for (let i = 0; i < count; i++) {
          data.push(generateRandomValue(parameter))
        }
        break
      case "month":
        count = 30
        for (let i = 1; i <= count; i += 5) {
          labels.push(i.toString())
          data.push(generateRandomValue(parameter))
        }
        break
    }

    return {
      labels,
      datasets: [{ data }],
    }
  }

  const generateRandomValue = (parameter) => {
    switch (parameter) {
      case "waterLevel":
        return Math.floor(Math.random() * 100)
      case "ph":
        return 6 + Math.random() * 3
      case "temperature":
        return 15 + Math.random() * 15
      case "turbidity":
        return Math.random() * 10
      default:
        return Math.random() * 100
    }
  }

  const getChartConfig = () => {
    return {
      backgroundColor: "#fff",
      backgroundGradientFrom: "#fff",
      backgroundGradientTo: "#fff",
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#3498DB",
      },
    }
  }

  const getYAxisSuffix = () => {
    switch (selectedParameter) {
      case "waterLevel":
        return "%"
      case "ph":
        return ""
      case "temperature":
        return "°C"
      case "turbidity":
        return " NTU"
      default:
        return ""
    }
  }

  const getParameterName = () => {
    switch (selectedParameter) {
      case "waterLevel":
        return "Niveau d'eau"
      case "ph":
        return "pH"
      case "temperature":
        return "Température"
      case "turbidity":
        return "Turbidité"
      default:
        return ""
    }
  }

  const getTimeRangeName = () => {
    switch (timeRange) {
      case "day":
        return "Jour"
      case "week":
        return "Semaine"
      case "month":
        return "Mois"
      default:
        return ""
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique & Analyse</Text>
        <Text style={styles.subtitle}>Suivez l'évolution des paramètres de votre réservoir</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Paramètre</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedParameter}
              onValueChange={(itemValue) => setSelectedParameter(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Niveau d'eau" value="waterLevel" />
              <Picker.Item label="pH" value="ph" />
              <Picker.Item label="Température" value="temperature" />
              <Picker.Item label="Turbidité" value="turbidity" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Période</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={timeRange}
              onValueChange={(itemValue) => setTimeRange(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Jour" value="day" />
              <Picker.Item label="Semaine" value="week" />
              <Picker.Item label="Mois" value="month" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {getParameterName()} - {getTimeRangeName()}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
        ) : (
          <LineChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={getChartConfig()}
            bezier
            style={styles.chart}
            yAxisSuffix={getYAxisSuffix()}
          />
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Statistiques</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Moyenne</Text>
            <Text style={styles.statsValue}>
              {loading
                ? "..."
                : (chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length).toFixed(
                    1,
                  )}
              {getYAxisSuffix()}
            </Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Maximum</Text>
            <Text style={styles.statsValue}>
              {loading ? "..." : Math.max(...chartData.datasets[0].data).toFixed(1)}
              {getYAxisSuffix()}
            </Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Minimum</Text>
            <Text style={styles.statsValue}>
              {loading ? "..." : Math.min(...chartData.datasets[0].data).toFixed(1)}
              {getYAxisSuffix()}
            </Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Écart type</Text>
            <Text style={styles.statsValue}>
              {loading ? "..." : calculateStandardDeviation(chartData.datasets[0].data).toFixed(1)}
              {getYAxisSuffix()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values) => {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
  return Math.sqrt(avgSquareDiff)
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterItem: {
    width: "48%",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
  },
  picker: {
    height: 40,
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loader: {
    marginVertical: 50,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsCard: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  statsLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 5,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
})

export default History
